<?php
// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — Notes API
//  GET    /api/notes.php?task_id=X    → get notes for a task
//  POST   /api/notes.php              → add note (any member)
//  DELETE /api/notes.php?id=X         → delete note (admin or author)
// ─────────────────────────────────────────────────────────────

require_once 'config.php';
require_once 'helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── GET — fetch notes for a task ──────────────────────────────
if ($method === 'GET') {
    $user   = requireMember();
    $taskId = $_GET['task_id'] ?? '';

    if (!$taskId) respondError('task_id is required.');

    // Verify the task exists and user has access
    $taskCheck = $db->prepare('SELECT assigned_to FROM tasks WHERE id = ?');
    $taskCheck->execute([$taskId]);
    $task = $taskCheck->fetch();

    if (!$task) respondError('Task not found.', 404);
    if ($user['role'] !== 'admin' && $task['assigned_to'] !== $user['id']) {
        respondError('Access denied.', 403);
    }

    $stmt = $db->prepare("
        SELECT n.*, u.name AS user_name, u.avatar AS user_avatar, u.color AS user_color, u.role AS user_role
        FROM notes n
        JOIN users u ON n.user_id = u.id
        WHERE n.task_id = ?
        ORDER BY n.created_at ASC
    ");
    $stmt->execute([$taskId]);
    $rows = $stmt->fetchAll();

    $notes = array_map('formatNote', $rows);
    respond(['notes' => $notes]);
}

// ── POST — add note ────────────────────────────────────────────
if ($method === 'POST') {
    $user = requireMember();
    $body = getBody();

    $taskId   = trim($body['taskId'] ?? '');
    $noteText = trim($body['text']   ?? '');
    $attachments = $body['attachments'] ?? [];

    if (!$taskId) respondError('taskId is required.');
    if (!$noteText && empty($attachments)) respondError('Note must have text or attachments.');

    // Verify task access
    $taskCheck = $db->prepare('SELECT assigned_to FROM tasks WHERE id = ?');
    $taskCheck->execute([$taskId]);
    $task = $taskCheck->fetch();

    if (!$task) respondError('Task not found.', 404);
    if ($user['role'] !== 'admin' && $task['assigned_to'] !== $user['id']) {
        respondError('Access denied — you can only add notes to your own tasks.', 403);
    }

    // Validate attachments structure
    $cleanAttachments = [];
    if (!empty($attachments) && is_array($attachments)) {
        foreach ($attachments as $att) {
            if (isset($att['name'], $att['url'], $att['type'])) {
                $cleanAttachments[] = [
                    'name' => substr(trim($att['name']), 0, 255),
                    'url'  => $att['url'],
                    'type' => $att['type'],
                    'size' => $att['size'] ?? 0,
                ];
            }
        }
    }

    $id   = generateId();
    $stmt = $db->prepare("
        INSERT INTO notes (id, task_id, user_id, note_text, attachments)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $id, $taskId, $user['id'],
        $noteText ?: null,
        json_encode($cleanAttachments),
    ]);

    // Update task's updated_at
    $db->prepare('UPDATE tasks SET updated_at = NOW() WHERE id = ?')->execute([$taskId]);

    // Fetch back
    $fetch = $db->prepare("
        SELECT n.*, u.name AS user_name, u.avatar AS user_avatar, u.color AS user_color, u.role AS user_role
        FROM notes n
        JOIN users u ON n.user_id = u.id
        WHERE n.id = ?
    ");
    $fetch->execute([$id]);
    $note = $fetch->fetch();

    respond(['note' => formatNote($note)], 201);
}

// ── DELETE — remove note ──────────────────────────────────────
if ($method === 'DELETE') {
    $user = requireMember();
    $id   = $_GET['id'] ?? '';
    if (!$id) respondError('Note ID required.');

    $check = $db->prepare('SELECT user_id, attachments FROM notes WHERE id = ?');
    $check->execute([$id]);
    $note = $check->fetch();

    if (!$note) respondError('Note not found.', 404);
    if ($user['role'] !== 'admin' && $note['user_id'] !== $user['id']) {
        respondError('Not allowed to delete this note.', 403);
    }

    // Delete attachment files from disk
    $attachments = json_decode($note['attachments'] ?? '[]', true) ?: [];
    foreach ($attachments as $att) {
        $filePath = dirname(__DIR__) . $att['url'];
        if (file_exists($filePath)) @unlink($filePath);
    }

    $stmt = $db->prepare('DELETE FROM notes WHERE id = ?');
    $stmt->execute([$id]);
    respond(['success' => true]);
}

respondError('Method not allowed.', 405);

// ── Format helper ──────────────────────────────────────────────
function formatNote(array $row): array {
    $attachments = json_decode($row['attachments'] ?? '[]', true) ?: [];
    return [
        'id'          => $row['id'],
        'taskId'      => $row['task_id'],
        'userId'      => $row['user_id'],
        'userName'    => $row['user_name']   ?? 'Unknown',
        'userAvatar'  => $row['user_avatar'] ?? '??',
        'userColor'   => $row['user_color']  ?? '#7c3aed',
        'userRole'    => $row['user_role']   ?? 'member',
        'text'        => $row['note_text']   ?? '',
        'attachments' => $attachments,
        'createdAt'   => $row['created_at'],
    ];
}
