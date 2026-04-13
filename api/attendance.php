<?php
// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — Attendance API
//  GET  /api/attendance.php?action=today              → today's record (own)
//  GET  /api/attendance.php?month=2026-04&user_id=X   → monthly records
//  GET  /api/attendance.php?action=all_today           → admin: all today
//  POST /api/attendance.php?action=checkin            → { lat, lng, location }
//  POST /api/attendance.php?action=checkout           → { lat, lng, location }
//  PUT  /api/attendance.php?id=X                      → admin adjust record
// ─────────────────────────────────────────────────────────────

require_once 'config.php';
require_once 'helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();
$action = $_GET['action'] ?? '';

// ── GET ───────────────────────────────────────────────────────
if ($method === 'GET') {
    $user = requireMember();

    // Today's record for current user
    if ($action === 'today') {
        $stmt = $db->prepare("
            SELECT a.*, u.name AS user_name, u.avatar AS user_avatar, u.color AS user_color
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            WHERE a.user_id = ? AND a.date = CURDATE()
        ");
        $stmt->execute([$user['id']]);
        $row = $stmt->fetch();
        respond(['record' => $row ? formatRecord($row) : null]);
    }

    // Admin: all employees' check-in status for today
    if ($action === 'all_today') {
        requireAdmin();
        $stmt = $db->prepare("
            SELECT a.*, u.name AS user_name, u.avatar AS user_avatar, u.color AS user_color, u.department
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            WHERE a.date = CURDATE()
            ORDER BY a.checkin_time ASC
        ");
        $stmt->execute();
        $rows = $stmt->fetchAll();
        respond(['records' => array_map('formatRecord', $rows)]);
    }

    // Monthly records
    $month = $_GET['month'] ?? date('Y-m');
    $userId = $_GET['user_id'] ?? $user['id'];

    // Members can only see own records
    if ($user['role'] !== 'admin')
        $userId = $user['id'];

    [$year, $mon] = explode('-', $month . '-01');
    $startDate = "$year-$mon-01";
    $endDate = date('Y-m-t', strtotime($startDate));

    $stmt = $db->prepare("
        SELECT a.*, u.name AS user_name, u.avatar AS user_avatar, u.color AS user_color
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE a.user_id = ? AND a.date BETWEEN ? AND ?
        ORDER BY a.date ASC
    ");
    $stmt->execute([$userId, $startDate, $endDate]);
    $rows = $stmt->fetchAll();
    respond(['records' => array_map('formatRecord', $rows), 'month' => $month]);
}

// ── POST: Check In ────────────────────────────────────────────
if ($method === 'POST' && $action === 'checkin') {
    $user = requireMember();
    $body = getBody();
    $today = date('Y-m-d');

    // Check if already checked in today
    $existing = $db->prepare('SELECT id, checkout_time FROM attendance WHERE user_id = ? AND date = ?');
    $existing->execute([$user['id'], $today]);
    $rec = $existing->fetch();

    if ($rec) {
        if (!$rec['checkout_time']) {
            respondError('You are already checked in. Please check out first.');
        } else {
            respondError('You have already completed attendance for today.');
        }
    }

    // Validate not Sunday
    if (date('N') == 7) {
        respondError('Today is Sunday (Holiday). No attendance required.');
    }

    $lat = trim($body['lat'] ?? '');
    $lng = trim($body['lng'] ?? '');
    $location = trim($body['location'] ?? 'Unknown location');

    if (empty($lat) || empty($lng)) {
        respondError('Location permission and GPS data are required to check in. Please allow location access.');
    }

    $id = generateId();
    $stmt = $db->prepare("
        INSERT INTO attendance (id, user_id, date, checkin_time, checkin_lat, checkin_lng, checkin_location, status)
        VALUES (?, ?, ?, NOW(), ?, ?, ?, 'present')
    ");
    $stmt->execute([$id, $user['id'], $today, $lat ?: null, $lng ?: null, $location]);

    // Fetch back
    $fetch = $db->prepare("
        SELECT a.*, u.name AS user_name, u.avatar AS user_avatar, u.color AS user_color
        FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.id = ?
    ");
    $fetch->execute([$id]);
    respond(['record' => formatRecord($fetch->fetch())]);
}

// ── POST: Check Out ────────────────────────────────────────────
if ($method === 'POST' && $action === 'checkout') {
    $user = requireMember();
    $body = getBody();
    $today = date('Y-m-d');

    $existing = $db->prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?');
    $existing->execute([$user['id'], $today]);
    $rec = $existing->fetch();

    if (!$rec)
        respondError('No check-in record found for today. Please check in first.');
    if ($rec['checkout_time'])
        respondError('You have already checked out for today.');

    $lat = trim($body['lat'] ?? '');
    $lng = trim($body['lng'] ?? '');
    $location = trim($body['location'] ?? 'Unknown location');

    if (empty($lat) || empty($lng)) {
        respondError('Location permission and GPS data are required to check out. Please allow location access.');
    }

    // Calculate work hours
    $stmt = $db->prepare("
        UPDATE attendance
        SET checkout_time     = NOW(),
            checkout_lat      = ?,
            checkout_lng      = ?,
            checkout_location = ?,
            work_hours        = ROUND(TIMESTAMPDIFF(SECOND, checkin_time, NOW()) / 3600, 2)
        WHERE id = ?
    ");
    $stmt->execute([$lat ?: null, $lng ?: null, $location, $rec['id']]);

    $fetch = $db->prepare("
        SELECT a.*, u.name AS user_name, u.avatar AS user_avatar, u.color AS user_color
        FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.id = ?
    ");
    $fetch->execute([$rec['id']]);
    respond(['record' => formatRecord($fetch->fetch())]);
}

// ── PUT: Admin manual adjustment ──────────────────────────────
if ($method === 'PUT') {
    requireAdmin();
    $id = $_GET['id'] ?? '';
    $body = getBody();
    if (!$id)
        respondError('Record ID required.');

    $check = $db->prepare('SELECT * FROM attendance WHERE id = ?');
    $check->execute([$id]);
    $rec = $check->fetch();
    if (!$rec)
        respondError('Record not found.', 404);

    $checkinTime = $body['checkinTime'] ?? $rec['checkin_time'];
    $checkoutTime = $body['checkoutTime'] ?? $rec['checkout_time'];
    $status = $body['status'] ?? $rec['status'];
    $notes = $body['notes'] ?? ($rec['notes'] ?? '');

    // Recalculate hours if both times set
    $workHours = null;
    if ($checkinTime && $checkoutTime) {
        $diff = strtotime($checkoutTime) - strtotime($checkinTime);
        $workHours = round($diff / 3600, 2);
        if ($workHours < 0)
            respondError('Checkout time cannot be before check-in time.');
    }

    $stmt = $db->prepare("
        UPDATE attendance SET checkin_time=?, checkout_time=?, status=?, work_hours=?, notes=? WHERE id=?
    ");
    $stmt->execute([$checkinTime, $checkoutTime ?: null, $status, $workHours, $notes, $id]);

    $fetch = $db->prepare("
        SELECT a.*, u.name AS user_name, u.avatar AS user_avatar, u.color AS user_color
        FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.id = ?
    ");
    $fetch->execute([$id]);
    respond(['record' => formatRecord($fetch->fetch())]);
}

respondError('Method not allowed.', 405);

// ── Format helper ─────────────────────────────────────────────
function formatRecord(array $row): array
{
    return [
        'id' => $row['id'],
        'userId' => $row['user_id'],
        'userName' => $row['user_name'] ?? 'Unknown',
        'userAvatar' => $row['user_avatar'] ?? '??',
        'userColor' => $row['user_color'] ?? '#7c3aed',
        'department' => $row['department'] ?? '',
        'date' => $row['date'],
        'checkinTime' => $row['checkin_time'],
        'checkoutTime' => $row['checkout_time'],
        'checkinLat' => $row['checkin_lat'],
        'checkinLng' => $row['checkin_lng'],
        'checkoutLat' => $row['checkout_lat'],
        'checkoutLng' => $row['checkout_lng'],
        'checkinLocation' => $row['checkin_location'] ?? '',
        'checkoutLocation' => $row['checkout_location'] ?? '',
        'workHours' => $row['work_hours'] !== null ? (float) $row['work_hours'] : null,
        'status' => $row['status'],
        'notes' => $row['notes'] ?? '',
    ];
}
