<?php
// ─────────────────────────────────────────────────────────────
//  AgencyHub — Users API  (Admin only)
//  GET    /api/users.php         → list all users
//  POST   /api/users.php         → create user
//  PUT    /api/users.php?id=X    → update user
//  DELETE /api/users.php?id=X    → delete user
// ─────────────────────────────────────────────────────────────

require_once 'config.php';
require_once 'helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── GET — list all users ──────────────────────────────────────
if ($method === 'GET') {
    requireAdmin();
    $rows = $db->query('SELECT id, name, email, role, color, avatar, created_at FROM users ORDER BY created_at ASC')->fetchAll();
    respond(['users' => $rows]);
}

// ── POST — create user ────────────────────────────────────────
if ($method === 'POST') {
    requireAdmin();
    $body = getBody();

    $name     = trim($body['name'] ?? '');
    $email    = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';
    $role     = $body['role'] ?? 'webmanager';

    if (!$name || !$email || !$password) {
        respondError('Name, email and password are required.');
    }
    if (strlen($password) < 6) {
        respondError('Password must be at least 6 characters.');
    }

    // Check duplicate
    $check = $db->prepare('SELECT id FROM users WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) {
        respondError('Email already exists.');
    }

    $roleColors = [
        'admin'         => '#7c3aed',
        'webmanager'    => '#059669',
        'telecaller'    => '#ea580c',
        'videoeditor'   => '#db2777',
        'socialmanager' => '#0891b2',
    ];

    $words  = explode(' ', $name);
    $avatar = strtoupper(substr($words[0], 0, 1) . (isset($words[1]) ? substr($words[1], 0, 1) : ''));

    $id    = generateId();
    $hash  = password_hash($password, PASSWORD_DEFAULT);
    $color = $roleColors[$role] ?? '#6b7280';

    $stmt = $db->prepare('INSERT INTO users (id, name, email, password, role, color, avatar) VALUES (?,?,?,?,?,?,?)');
    $stmt->execute([$id, $name, $email, $hash, $role, $color, $avatar]);

    respond(['user' => ['id' => $id, 'name' => $name, 'email' => $email, 'role' => $role, 'color' => $color, 'avatar' => $avatar]], 201);
}

// ── PUT — update user ─────────────────────────────────────────
if ($method === 'PUT') {
    requireAdmin();
    $id   = $_GET['id'] ?? '';
    $body = getBody();

    if (!$id) respondError('User ID required.');

    // Check user exists
    $check = $db->prepare('SELECT * FROM users WHERE id = ?');
    $check->execute([$id]);
    $existing = $check->fetch();
    if (!$existing) respondError('User not found.', 404);

    $name     = trim($body['name'] ?? $existing['name']);
    $email    = strtolower(trim($body['email'] ?? $existing['email']));
    $role     = $body['role'] ?? $existing['role'];
    $password = $body['password'] ?? '';

    // Check email conflict
    if ($email !== $existing['email']) {
        $dup = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
        $dup->execute([$email, $id]);
        if ($dup->fetch()) respondError('Email already in use.');
    }

    $roleColors = [
        'admin'         => '#7c3aed',
        'webmanager'    => '#059669',
        'telecaller'    => '#ea580c',
        'videoeditor'   => '#db2777',
        'socialmanager' => '#0891b2',
    ];

    $words  = explode(' ', $name);
    $avatar = strtoupper(substr($words[0], 0, 1) . (isset($words[1]) ? substr($words[1], 0, 1) : ''));
    $color  = $roleColors[$role] ?? '#6b7280';

    if ($password) {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare('UPDATE users SET name=?, email=?, role=?, color=?, avatar=?, password=? WHERE id=?');
        $stmt->execute([$name, $email, $role, $color, $avatar, $hash, $id]);
    } else {
        $stmt = $db->prepare('UPDATE users SET name=?, email=?, role=?, color=?, avatar=? WHERE id=?');
        $stmt->execute([$name, $email, $role, $color, $avatar, $id]);
    }

    // Refresh session if editing self
    if (!empty($_SESSION['user']) && $_SESSION['user']['id'] === $id) {
        $_SESSION['user'] = array_merge($_SESSION['user'], ['name' => $name, 'email' => $email, 'role' => $role, 'color' => $color, 'avatar' => $avatar]);
    }

    respond(['success' => true, 'user' => ['id' => $id, 'name' => $name, 'email' => $email, 'role' => $role, 'color' => $color, 'avatar' => $avatar]]);
}

// ── DELETE — remove user ──────────────────────────────────────
if ($method === 'DELETE') {
    requireAdmin();
    $id = $_GET['id'] ?? '';
    if (!$id) respondError('User ID required.');

    // Prevent deleting the only admin
    $adminCount = $db->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
    $target     = $db->prepare('SELECT role FROM users WHERE id = ?');
    $target->execute([$id]);
    $targetUser = $target->fetch();

    if (!$targetUser) respondError('User not found.', 404);
    if ($targetUser['role'] === 'admin' && (int)$adminCount <= 1) {
        respondError('Cannot delete the only admin account.');
    }

    $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$id]);
    respond(['success' => true]);
}

respondError('Method not allowed.', 405);
