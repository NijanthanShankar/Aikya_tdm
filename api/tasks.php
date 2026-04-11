<?php
// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — Tasks API
//  GET    /api/tasks.php              → list tasks
//  GET    /api/tasks.php?id=X         → single task
//  POST   /api/tasks.php              → create task (admin)
//  PUT    /api/tasks.php?id=X         → update task (admin: all; member: status only)
//  DELETE /api/tasks.php?id=X         → delete task (admin)
// ─────────────────────────────────────────────────────────────

require_once 'config.php';
require_once 'helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── GET — list or single ───────────────────────────────────────
if ($method === 'GET') {
    $user = requireMember();
    $id   = $_GET['id'] ?? '';

    if ($id) {
        // Single task detail
        $stmt = $db->prepare("
            SELECT t.*,
                   ua.name      AS assignee_name,
                   ua.avatar    AS assignee_avatar,
                   ua.color     AS assignee_color,
                   ua.email     AS assignee_email,
                   uc.name      AS creator_name,
                   (SELECT COUNT(*) FROM notes n WHERE n.task_id = t.id) AS notes_count
            FROM tasks t
            LEFT JOIN users ua ON t.assigned_to = ua.id
            LEFT JOIN users uc ON t.created_by  = uc.id
            WHERE t.id = ?
        ");
        $stmt->execute([$id]);
        $task = $stmt->fetch();

        if (!$task) respondError('Task not found.', 404);

        // Member can only see their own tasks
        if ($user['role'] !== 'admin' && $task['assigned_to'] !== $user['id']) {
            respondError('Access denied.', 403);
        }

        respond(['task' => formatTask($task)]);
    }

    // Task list
    if ($user['role'] === 'admin') {
        // Managers see all tasks with optional filters
        $where  = ['1=1'];
        $params = [];

        if (!empty($_GET['status'])) {
            $where[]  = 't.status = ?';
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['priority'])) {
            $where[]  = 't.priority = ?';
            $params[] = $_GET['priority'];
        }
        if (!empty($_GET['assigned_to'])) {
            $where[]  = 't.assigned_to = ?';
            $params[] = $_GET['assigned_to'];
        }
        if (!empty($_GET['search'])) {
            $where[]  = '(t.title LIKE ? OR t.description LIKE ?)';
            $s        = '%' . $_GET['search'] . '%';
            $params[] = $s;
            $params[] = $s;
        }

        $sql = "
            SELECT t.*,
                   ua.name   AS assignee_name,
                   ua.avatar AS assignee_avatar,
                   ua.color  AS assignee_color,
                   uc.name   AS creator_name,
                   (SELECT COUNT(*) FROM notes n WHERE n.task_id = t.id) AS notes_count
            FROM tasks t
            LEFT JOIN users ua ON t.assigned_to = ua.id
            LEFT JOIN users uc ON t.created_by  = uc.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY t.created_at DESC
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    } else {
        // Members only see assigned tasks
        $stmt = $db->prepare("
            SELECT t.*,
                   ua.name   AS assignee_name,
                   ua.avatar AS assignee_avatar,
                   ua.color  AS assignee_color,
                   uc.name   AS creator_name,
                   (SELECT COUNT(*) FROM notes n WHERE n.task_id = t.id) AS notes_count
            FROM tasks t
            LEFT JOIN users ua ON t.assigned_to = ua.id
            LEFT JOIN users uc ON t.created_by  = uc.id
            WHERE t.assigned_to = ?
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$user['id']]);
    }

    $rows  = $stmt->fetchAll();
    $tasks = array_map('formatTask', $rows);
    respond(['tasks' => $tasks]);
}

// ── POST — create task (admin only) ───────────────────────────
if ($method === 'POST') {
    requireAdmin();
    $user = $_SESSION['user'];
    $body = getBody();

    $title       = trim($body['title'] ?? '');
    $description = trim($body['description'] ?? '');
    $assignedTo  = $body['assignedTo'] ?? null;
    $dueDate     = $body['dueDate'] ?? null;
    $priority    = $body['priority'] ?? 'medium';
    $status      = $body['status'] ?? 'pending';

    if (!$title) respondError('Task title is required.');

    $validPriorities = ['low', 'medium', 'high'];
    $validStatuses   = ['pending', 'in_progress', 'completed'];
    if (!in_array($priority, $validPriorities, true)) $priority = 'medium';
    if (!in_array($status,   $validStatuses,   true)) $status   = 'pending';

    // Validate assignee exists
    if ($assignedTo) {
        $check = $db->prepare('SELECT id FROM users WHERE id = ?');
        $check->execute([$assignedTo]);
        if (!$check->fetch()) respondError('Assigned user not found.', 404);
    }

    $id   = generateId();
    $stmt = $db->prepare("
        INSERT INTO tasks (id, title, description, assigned_to, due_date, priority, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $id, $title, $description ?: null,
        $assignedTo ?: null,
        $dueDate    ?: null,
        $priority, $status,
        $user['id'],
    ]);

    // Fetch back with joins
    $fetch = $db->prepare("
        SELECT t.*, ua.name AS assignee_name, ua.avatar AS assignee_avatar,
               ua.color AS assignee_color, uc.name AS creator_name,
               0 AS notes_count
        FROM tasks t
        LEFT JOIN users ua ON t.assigned_to = ua.id
        LEFT JOIN users uc ON t.created_by  = uc.id
        WHERE t.id = ?
    ");
    $fetch->execute([$id]);
    $task = $fetch->fetch();

    respond(['task' => formatTask($task)], 201);
}

// ── PUT — update task ──────────────────────────────────────────
if ($method === 'PUT') {
    $user = requireMember();
    $id   = $_GET['id'] ?? '';
    $body = getBody();

    if (!$id) respondError('Task ID required.');

    // Fetch existing task
    $check = $db->prepare('SELECT * FROM tasks WHERE id = ?');
    $check->execute([$id]);
    $existing = $check->fetch();
    if (!$existing) respondError('Task not found.', 404);

    if ($user['role'] === 'admin') {
        // Manager can update any field
        $title       = trim($body['title']       ?? $existing['title']);
        $description = trim($body['description'] ?? ($existing['description'] ?? ''));
        $assignedTo  = array_key_exists('assignedTo',  $body) ? ($body['assignedTo']  ?: null) : $existing['assigned_to'];
        $dueDate     = array_key_exists('dueDate',     $body) ? ($body['dueDate']     ?: null) : $existing['due_date'];
        $priority    = $body['priority'] ?? $existing['priority'];
        $status      = $body['status']   ?? $existing['status'];

        if (!$title) respondError('Task title is required.');

        $stmt = $db->prepare("
            UPDATE tasks SET title=?, description=?, assigned_to=?, due_date=?, priority=?, status=?
            WHERE id=?
        ");
        $stmt->execute([$title, $description ?: null, $assignedTo, $dueDate, $priority, $status, $id]);

    } else {
        // Member can only update status (mark complete)
        if ($existing['assigned_to'] !== $user['id']) respondError('Access denied.', 403);

        $status = $body['status'] ?? $existing['status'];
        $validStatuses = ['pending', 'in_progress', 'completed'];
        if (!in_array($status, $validStatuses, true)) respondError('Invalid status.');

        $stmt = $db->prepare('UPDATE tasks SET status=? WHERE id=?');
        $stmt->execute([$status, $id]);
    }

    // Fetch updated task
    $fetch = $db->prepare("
        SELECT t.*, ua.name AS assignee_name, ua.avatar AS assignee_avatar,
               ua.color AS assignee_color, uc.name AS creator_name,
               (SELECT COUNT(*) FROM notes n WHERE n.task_id = t.id) AS notes_count
        FROM tasks t
        LEFT JOIN users ua ON t.assigned_to = ua.id
        LEFT JOIN users uc ON t.created_by  = uc.id
        WHERE t.id = ?
    ");
    $fetch->execute([$id]);
    respond(['task' => formatTask($fetch->fetch())]);
}

// ── DELETE — remove task (admin only) ────────────────────────
if ($method === 'DELETE') {
    requireAdmin();
    $id = $_GET['id'] ?? '';
    if (!$id) respondError('Task ID required.');

    $check = $db->prepare('SELECT id FROM tasks WHERE id = ?');
    $check->execute([$id]);
    if (!$check->fetch()) respondError('Task not found.', 404);

    $stmt = $db->prepare('DELETE FROM tasks WHERE id = ?');
    $stmt->execute([$id]);
    respond(['success' => true]);
}

respondError('Method not allowed.', 405);

// ── Format helper ──────────────────────────────────────────────
function formatTask(array $row): array {
    return [
        'id'             => $row['id'],
        'title'          => $row['title'],
        'description'    => $row['description'] ?? '',
        'assignedTo'     => $row['assigned_to'],
        'assigneeName'   => $row['assignee_name']   ?? null,
        'assigneeAvatar' => $row['assignee_avatar'] ?? null,
        'assigneeColor'  => $row['assignee_color']  ?? '#7c3aed',
        'dueDate'        => $row['due_date'],
        'priority'       => $row['priority'],
        'status'         => $row['status'],
        'createdBy'      => $row['created_by'],
        'creatorName'    => $row['creator_name'] ?? null,
        'notesCount'     => (int)($row['notes_count'] ?? 0),
        'createdAt'      => $row['created_at'],
        'updatedAt'      => $row['updated_at'] ?? $row['created_at'],
    ];
}
