<?php
// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — Users API
//  GET    /api/users.php                → list all users (admin)
//  POST   /api/users.php                → create user (admin)
//  PUT    /api/users.php?id=X           → update user (admin)
//  DELETE /api/users.php?id=X           → delete user (admin)
//  PUT    /api/users.php?action=self    → update own profile (any)
//  PUT    /api/users.php?action=password→ change own password (any)
// ─────────────────────────────────────────────────────────────

require_once 'config.php';
require_once 'helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
$action = $_GET['action'] ?? '';

// ── PUT /self — update own profile ────────────────────────────
if ($method === 'PUT' && $action === 'self') {
    $user = requireMember();
    $body = getBody();
    $id   = $user['id'];

    $existing = $db->prepare('SELECT * FROM users WHERE id = ?');
    $existing->execute([$id]);
    $current = $existing->fetch();
    if (!$current) respondError('User not found.', 404);

    $name       = trim($body['name']       ?? $current['name']);
    $email      = strtolower(trim($body['email']      ?? $current['email']));
    $phone      = trim($body['phone']      ?? ($current['phone']      ?? ''));
    $department = trim($body['department'] ?? ($current['department'] ?? ''));
    $avatarUrl  = trim($body['avatarUrl']  ?? ($current['avatar_url'] ?? ''));

    if (!$name || !$email) respondError('Name and email are required.');

    // Check email conflict
    if ($email !== $current['email']) {
        $dup = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
        $dup->execute([$email, $id]);
        if ($dup->fetch()) respondError('Email already in use by another account.');
    }

    // Recompute avatar initials
    $words  = explode(' ', $name);
    $avatar = strtoupper(substr($words[0], 0, 1) . (isset($words[1]) ? substr($words[1], 0, 1) : ''));

    $stmt = $db->prepare("
        UPDATE users SET name=?, email=?, phone=?, department=?, avatar_url=?, avatar=? WHERE id=?
    ");
    $stmt->execute([$name, $email, $phone, $department, $avatarUrl, $avatar, $id]);

    // Refresh session
    $updated = [
        'name' => $name, 'email' => $email, 'avatar' => $avatar,
        'phone' => $phone, 'department' => $department, 'avatarUrl' => $avatarUrl,
    ];
    $_SESSION['user'] = array_merge($_SESSION['user'], $updated);

    respond(['success' => true, 'user' => $_SESSION['user']]);
}

// ── PUT /password — change own password ───────────────────────
if ($method === 'PUT' && $action === 'password') {
    $user = requireMember();
    $body = getBody();
    $id   = $user['id'];

    $currentPassword = $body['currentPassword'] ?? '';
    $newPassword     = $body['newPassword']     ?? '';

    if (!$currentPassword || !$newPassword) respondError('Current and new password are required.');
    if (strlen($newPassword) < 6) respondError('New password must be at least 6 characters.');

    $fetch = $db->prepare('SELECT password FROM users WHERE id = ?');
    $fetch->execute([$id]);
    $row = $fetch->fetch();
    if (!$row) respondError('User not found.', 404);

    if (!password_verify($currentPassword, $row['password'])) {
        respondError('Current password is incorrect.');
    }

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $db->prepare('UPDATE users SET password=? WHERE id=?')->execute([$hash, $id]);
    respond(['success' => true]);
}

// ── GET — list users (admin) ──────────────────────────────────
if ($method === 'GET') {
    requireAdmin();
    $rows = $db->query("
        SELECT id, name, email, role, color, avatar, phone, department, avatar_url, created_at
        FROM users ORDER BY created_at ASC
    ")->fetchAll();

    $users = array_map(function ($r) {
        $r['avatarUrl'] = $r['avatar_url'] ?? '';
        unset($r['avatar_url']);
        return $r;
    }, $rows);

    respond(['users' => $users]);
}

// ── POST — create user (admin) ────────────────────────────────
if ($method === 'POST') {
    requireAdmin();
    $body = getBody();

    $name       = trim($body['name']       ?? '');
    $email      = strtolower(trim($body['email']      ?? ''));
    $password   = $body['password']   ?? '';
    $role       = $body['role']       ?? 'member';
    $department = trim($body['department'] ?? '');
    $phone      = trim($body['phone']      ?? '');

    if (!$name || !$email || !$password) respondError('Name, email and password are required.');
    if (strlen($password) < 6) respondError('Password must be at least 6 characters.');
    if (!in_array($role, ['admin', 'member'], true)) respondError('Invalid role.');

    $check = $db->prepare('SELECT id FROM users WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) respondError('Email already exists.');

    $roleColors = ['admin' => '#7c3aed', 'member' => '#059669'];
    $words     = explode(' ', $name);
    $avatar    = strtoupper(substr($words[0], 0, 1) . (isset($words[1]) ? substr($words[1], 0, 1) : ''));
    $color     = $roleColors[$role] ?? '#7c3aed';
    $id        = generateId();
    $hash      = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $db->prepare("
        INSERT INTO users (id, name, email, password, role, color, avatar, phone, department)
        VALUES (?,?,?,?,?,?,?,?,?)
    ");
    $stmt->execute([$id, $name, $email, $hash, $role, $color, $avatar, $phone, $department]);

    respond(['user' => [
        'id' => $id, 'name' => $name, 'email' => $email, 'role' => $role,
        'color' => $color, 'avatar' => $avatar, 'phone' => $phone,
        'department' => $department, 'avatarUrl' => '',
    ]], 201);
}

// ── PUT — update user (admin) ─────────────────────────────────
if ($method === 'PUT') {
    requireAdmin();
    $id   = $_GET['id'] ?? '';
    $body = getBody();
    if (!$id) respondError('User ID required.');

    $fetch = $db->prepare('SELECT * FROM users WHERE id = ?');
    $fetch->execute([$id]);
    $existing = $fetch->fetch();
    if (!$existing) respondError('User not found.', 404);

    $name       = trim($body['name']       ?? $existing['name']);
    $email      = strtolower(trim($body['email']      ?? $existing['email']));
    $role       = $body['role']       ?? $existing['role'];
    $department = trim($body['department'] ?? ($existing['department'] ?? ''));
    $phone      = trim($body['phone']      ?? ($existing['phone']      ?? ''));
    $password   = $body['password']   ?? '';

    if (!in_array($role, ['admin', 'member'], true)) respondError('Invalid role.');

    // Email uniqueness
    if ($email !== $existing['email']) {
        $dup = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
        $dup->execute([$email, $id]);
        if ($dup->fetch()) respondError('Email already in use.');
    }

    $roleColors = ['admin' => '#7c3aed', 'member' => '#059669'];
    $words  = explode(' ', $name);
    $avatar = strtoupper(substr($words[0], 0, 1) . (isset($words[1]) ? substr($words[1], 0, 1) : ''));
    $color  = $roleColors[$role] ?? '#7c3aed';

    if ($password) {
        if (strlen($password) < 6) respondError('Password must be at least 6 characters.');
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare("UPDATE users SET name=?,email=?,role=?,color=?,avatar=?,phone=?,department=?,password=? WHERE id=?");
        $stmt->execute([$name, $email, $role, $color, $avatar, $phone, $department, $hash, $id]);
    } else {
        $stmt = $db->prepare("UPDATE users SET name=?,email=?,role=?,color=?,avatar=?,phone=?,department=? WHERE id=?");
        $stmt->execute([$name, $email, $role, $color, $avatar, $phone, $department, $id]);
    }

    // Refresh session if editing self
    if (!empty($_SESSION['user']) && $_SESSION['user']['id'] === $id) {
        $_SESSION['user'] = array_merge($_SESSION['user'], [
            'name' => $name, 'email' => $email, 'role' => $role,
            'color' => $color, 'avatar' => $avatar,
            'phone' => $phone, 'department' => $department,
        ]);
    }

    respond(['success' => true, 'user' => [
        'id' => $id, 'name' => $name, 'email' => $email, 'role' => $role,
        'color' => $color, 'avatar' => $avatar, 'phone' => $phone,
        'department' => $department, 'avatarUrl' => $existing['avatar_url'] ?? '',
    ]]);
}

// ── DELETE — remove user (admin) ──────────────────────────────
if ($method === 'DELETE') {
    requireAdmin();
    $id = $_GET['id'] ?? '';
    if (!$id) respondError('User ID required.');

    $adminCount = (int)$db->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
    $target     = $db->prepare('SELECT role FROM users WHERE id = ?');
    $target->execute([$id]);
    $targetUser = $target->fetch();

    if (!$targetUser) respondError('User not found.', 404);
    if ($targetUser['role'] === 'admin' && $adminCount <= 1) {
        respondError('Cannot delete the only manager account.');
    }

    $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$id]);
    respond(['success' => true]);
}

respondError('Method not allowed.', 405);
