<?php
// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — Leave Management API
//  GET    /api/leave.php                    → list own leaves (member)
//  GET    /api/leave.php?action=all         → list all leaves (admin)
//  GET    /api/leave.php?action=balance     → leave balance for user
//  POST   /api/leave.php                    → apply for leave
//  PUT    /api/leave.php?id=X              → approve/reject (admin) or cancel (member)
//  DELETE /api/leave.php?id=X              → delete leave (admin)
// ─────────────────────────────────────────────────────────────

require_once 'config.php';
require_once 'helpers.php';
require_once 'notify.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
$action = $_GET['action'] ?? '';

// ── IST time constants ────────────────────────────────────────
$IST_DATE = date('Y-m-d');
$IST_NOW  = date('Y-m-d H:i:s');

// ── Leave type definitions ────────────────────────────────────
$VALID_TYPES   = ['casual', 'sick', 'earned', 'half_day', 'wfh', 'compensatory', 'other'];
$VALID_STATUS  = ['pending', 'approved', 'rejected', 'cancelled'];

// Annual leave quotas (can be adjusted)
$LEAVE_QUOTAS = [
    'casual'       => 12,
    'sick'         => 12,
    'earned'       => 15,
    'half_day'     => 24,
    'wfh'          => 24,
    'compensatory' => 6,
    'other'        => 6,
];

// ── GET — list leaves ─────────────────────────────────────────
if ($method === 'GET') {
    $user = requireMember();

    // Leave balance
    if ($action === 'balance') {
        $targetUser = $_GET['user_id'] ?? $user['id'];
        // Members can only see own balance
        if ($user['role'] !== 'admin') $targetUser = $user['id'];

        $year = $_GET['year'] ?? date('Y');

        $stmt = $db->prepare("
            SELECT leave_type, COUNT(*) as used
            FROM leaves
            WHERE user_id = ? AND status = 'approved'
              AND YEAR(from_date) = ?
            GROUP BY leave_type
        ");
        $stmt->execute([$targetUser, $year]);
        $usedMap = [];
        foreach ($stmt->fetchAll() as $row) {
            $usedMap[$row['leave_type']] = (int)$row['used'];
        }

        $balance = [];
        foreach ($LEAVE_QUOTAS as $type => $total) {
            $used = $usedMap[$type] ?? 0;
            $balance[] = [
                'type'      => $type,
                'total'     => $total,
                'used'      => $used,
                'remaining' => max(0, $total - $used),
            ];
        }

        respond(['balance' => $balance, 'year' => $year]);
    }

    // Admin: all leaves
    if ($action === 'all') {
        requireAdmin();

        $where  = ['1=1'];
        $params = [];

        if (!empty($_GET['status'])) {
            $where[]  = 'l.status = ?';
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['user_id'])) {
            $where[]  = 'l.user_id = ?';
            $params[] = $_GET['user_id'];
        }
        if (!empty($_GET['month'])) {
            $where[]  = "(DATE_FORMAT(l.from_date, '%Y-%m') = ? OR DATE_FORMAT(l.to_date, '%Y-%m') = ?)";
            $params[] = $_GET['month'];
            $params[] = $_GET['month'];
        }

        $sql = "
            SELECT l.*, u.name AS user_name, u.avatar AS user_avatar, u.color AS user_color,
                   u.department, ua.name AS approved_by_name
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            LEFT JOIN users ua ON l.approved_by = ua.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY l.created_at DESC
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        respond(['leaves' => array_map('formatLeave', $stmt->fetchAll())]);
    }

    // Member: own leaves
    $year = $_GET['year'] ?? date('Y');
    $stmt = $db->prepare("
        SELECT l.*, u.name AS user_name, u.avatar AS user_avatar, u.color AS user_color,
               u.department, ua.name AS approved_by_name
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN users ua ON l.approved_by = ua.id
        WHERE l.user_id = ? AND YEAR(l.from_date) = ?
        ORDER BY l.created_at DESC
    ");
    $stmt->execute([$user['id'], $year]);
    respond(['leaves' => array_map('formatLeave', $stmt->fetchAll())]);
}

// ── POST — apply for leave ────────────────────────────────────
if ($method === 'POST') {
    $user = requireMember();
    $body = getBody();

    $leaveType = trim($body['leaveType'] ?? '');
    $fromDate  = trim($body['fromDate']  ?? '');
    $toDate    = trim($body['toDate']    ?? '');
    $reason    = trim($body['reason']    ?? '');

    // Validate required
    if (!$leaveType) respondError('Leave type is required.');
    if (!$fromDate)  respondError('Start date is required.');
    if (!$toDate)    respondError('End date is required.');
    if (!$reason)    respondError('Reason is required.');

    // Validate type
    if (!in_array($leaveType, $VALID_TYPES, true)) {
        respondError('Invalid leave type.');
    }

    // Validate dates
    if ($toDate < $fromDate) {
        respondError('End date cannot be before start date.');
    }

    // Calculate number of days
    $start = new DateTime($fromDate);
    $end   = new DateTime($toDate);
    $diff  = $start->diff($end);
    $numDays = $diff->days + 1;

    // For half-day, it's always 0.5
    if ($leaveType === 'half_day') {
        $numDays = 0.5;
        $toDate  = $fromDate; // half day is single day
    }

    // Check for overlapping leave requests
    $overlap = $db->prepare("
        SELECT id FROM leaves
        WHERE user_id = ? AND status IN ('pending', 'approved')
          AND from_date <= ? AND to_date >= ?
    ");
    $overlap->execute([$user['id'], $toDate, $fromDate]);
    if ($overlap->fetch()) {
        respondError('You already have a leave request for the selected dates.');
    }

    $id = generateId();
    $stmt = $db->prepare("
        INSERT INTO leaves (id, user_id, leave_type, from_date, to_date, num_days, reason, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    ");
    $stmt->execute([$id, $user['id'], $leaveType, $fromDate, $toDate, $numDays, $reason, $IST_NOW]);

    // Fetch back
    $fetch = $db->prepare("
        SELECT l.*, u.name AS user_name, u.avatar AS user_avatar, u.color AS user_color,
               u.department, NULL AS approved_by_name
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        WHERE l.id = ?
    ");
    $fetch->execute([$id]);
    $row = $fetch->fetch();
    $leave = $row ? formatLeave($row) : null;

    // Try notifications (silently — never block the response)
    try {
        $typeLabels = [
            'casual' => 'Casual Leave', 'sick' => 'Sick Leave', 'earned' => 'Earned Leave',
            'half_day' => 'Half Day', 'wfh' => 'Work From Home',
            'compensatory' => 'Compensatory Off', 'other' => 'Other Leave',
        ];
        $typeLabel = $typeLabels[$leaveType] ?? $leaveType;

        $msg = "📋 *Aikya Task Portal*\n\n"
             . "🏖️ *New Leave Request*\n"
             . "By: *{$user['name']}*\n"
             . "Type: $typeLabel\n"
             . "From: $fromDate\n"
             . "To: $toDate\n"
             . "Days: $numDays\n"
             . "Reason: $reason";

        if (MANAGER_WHATSAPP) sendWhatsApp(MANAGER_WHATSAPP, $msg);

        // Email managers
        $managers = $db->query("SELECT name, email FROM users WHERE role = 'admin'")->fetchAll();
        foreach ($managers as $mgr) {
            if (!$mgr['email']) continue;
            $html = emailTemplate("New Leave Request", "
                <p><strong>{$user['name']}</strong> has applied for leave.</p>
                <table>
                    <tr><td>🏷️ Type</td><td><strong>$typeLabel</strong></td></tr>
                    <tr><td>📅 From</td><td>$fromDate</td></tr>
                    <tr><td>📅 To</td><td>$toDate</td></tr>
                    <tr><td>📊 Days</td><td>$numDays</td></tr>
                    <tr><td>📝 Reason</td><td>$reason</td></tr>
                </table>
            ");
            sendEmail($mgr['email'], $mgr['name'], "🏖️ Leave Request: {$user['name']} — Aikya Portal", $html);
        }
    } catch (\Throwable $e) { /* silent fail — don't block leave creation */ }

    respond(['leave' => $leave], 201);
}

// ── PUT — approve/reject/cancel ────────────────────────────────
if ($method === 'PUT') {
    $user = requireMember();
    $id   = $_GET['id'] ?? '';
    $body = getBody();

    if (!$id) respondError('Leave ID required.');

    $check = $db->prepare('SELECT * FROM leaves WHERE id = ?');
    $check->execute([$id]);
    $existing = $check->fetch();
    if (!$existing) respondError('Leave request not found.', 404);

    $newStatus = trim($body['status'] ?? '');
    $adminNote = '';

    // Member can only cancel their own pending requests
    if ($user['role'] !== 'admin') {
        if ($existing['user_id'] !== $user['id']) {
            respondError('Access denied.', 403);
        }
        if ($newStatus !== 'cancelled') {
            respondError('You can only cancel your leave request.');
        }
        if ($existing['status'] !== 'pending') {
            respondError('Only pending requests can be cancelled.');
        }

        $db->prepare("UPDATE leaves SET status = 'cancelled', updated_at = ? WHERE id = ?")
           ->execute([$IST_NOW, $id]);
    } else {
        // Admin can approve or reject
        if (!in_array($newStatus, ['approved', 'rejected'], true)) {
            respondError('Status must be approved or rejected.');
        }
        if ($existing['status'] !== 'pending') {
            respondError('Only pending requests can be approved/rejected.');
        }

        $adminNote = trim($body['adminNote'] ?? '');

        $db->prepare("UPDATE leaves SET status = ?, approved_by = ?, admin_note = ?, updated_at = ? WHERE id = ?")
           ->execute([$newStatus, $user['id'], $adminNote ?: null, $IST_NOW, $id]);
    }

    // Fetch updated
    $fetch = $db->prepare("
        SELECT l.*, u.name AS user_name, u.avatar AS user_avatar, u.color AS user_color,
               u.department, ua.name AS approved_by_name
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN users ua ON l.approved_by = ua.id
        WHERE l.id = ?
    ");
    $fetch->execute([$id]);
    $updatedRow = $fetch->fetch();
    $updatedLeave = $updatedRow ? formatLeave($updatedRow) : null;

    // Notify the member (silently — never block the response)
    if ($user['role'] === 'admin') {
        try {
            $memberRow = $db->prepare('SELECT name, email, phone FROM users WHERE id = ?');
            $memberRow->execute([$existing['user_id']]);
            $member = $memberRow->fetch();

            if ($member) {
                $emoji = $newStatus === 'approved' ? '✅' : '❌';
                $statusLabel = ucfirst($newStatus);

                $msg = "$emoji *Aikya Task Portal*\n\n"
                     . "🏖️ *Leave Request $statusLabel*\n"
                     . "Your leave from {$existing['from_date']} to {$existing['to_date']} has been *$statusLabel*."
                     . ($adminNote ? "\n📝 Note: $adminNote" : '');

                if ($member['phone']) sendWhatsApp($member['phone'], $msg);

                $html = emailTemplate("Leave Request $statusLabel", "
                    <p>Your leave request has been <strong>$statusLabel</strong> by {$user['name']}.</p>
                    <table>
                        <tr><td>📅 From</td><td>{$existing['from_date']}</td></tr>
                        <tr><td>📅 To</td><td>{$existing['to_date']}</td></tr>
                        <tr><td>📊 Status</td><td><strong>$emoji $statusLabel</strong></td></tr>"
                    . ($adminNote ? "<tr><td>📝 Note</td><td>$adminNote</td></tr>" : '') . "
                    </table>
                ");
                sendEmail($member['email'], $member['name'], "$emoji Leave $statusLabel — Aikya Portal", $html);
            }
        } catch (\Throwable $e) { /* silent fail — don't block status update */ }
    }

    respond(['leave' => $updatedLeave]);
}

// ── DELETE — remove leave (admin only) ───────────────────────
if ($method === 'DELETE') {
    requireAdmin();
    $id = $_GET['id'] ?? '';
    if (!$id) respondError('Leave ID required.');

    $check = $db->prepare('SELECT id FROM leaves WHERE id = ?');
    $check->execute([$id]);
    if (!$check->fetch()) respondError('Leave request not found.', 404);

    $db->prepare('DELETE FROM leaves WHERE id = ?')->execute([$id]);
    respond(['success' => true]);
}

respondError('Method not allowed.', 405);

// ── Format helper ─────────────────────────────────────────────
function formatLeave(array $row): array {
    return [
        'id'             => $row['id'],
        'userId'         => $row['user_id'],
        'userName'       => $row['user_name'] ?? 'Unknown',
        'userAvatar'     => $row['user_avatar'] ?? '??',
        'userColor'      => $row['user_color'] ?? '#7c3aed',
        'department'     => $row['department'] ?? '',
        'leaveType'      => $row['leave_type'],
        'fromDate'       => $row['from_date'],
        'toDate'         => $row['to_date'],
        'numDays'        => (float)$row['num_days'],
        'reason'         => $row['reason'],
        'status'         => $row['status'],
        'approvedBy'     => $row['approved_by'],
        'approvedByName' => $row['approved_by_name'] ?? null,
        'adminNote'      => $row['admin_note'] ?? '',
        'createdAt'      => $row['created_at'],
        'updatedAt'      => $row['updated_at'],
    ];
}
