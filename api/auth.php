<?php
// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — Auth API
//  POST /api/auth.php?action=login   { email, password }
//  POST /api/auth.php?action=logout
//  GET  /api/auth.php?action=me
// ─────────────────────────────────────────────────────────────

require_once 'config.php';
require_once 'helpers.php';

$action = $_GET['action'] ?? '';

// ── GET /me ────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'me') {
    if (empty($_SESSION['user'])) {
        respond(['user' => null]);
    }
    respond(['user' => $_SESSION['user']]);
}

// ── POST /login ────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $body     = getBody();
    $email    = trim($body['email']    ?? '');
    $password = $body['password'] ?? '';

    if (!$email || !$password) respondError('Email and password are required.');

    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([strtolower($email)]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        respondError('Invalid email or password.', 401);
    }

    $session = buildSession($user);
    $_SESSION['user'] = $session;
    respond(['user' => $session]);
}

// ── POST /logout ───────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'logout') {
    session_destroy();
    respond(['success' => true]);
}

respondError('Invalid action.', 404);

// ── Helper ─────────────────────────────────────────────────────
function buildSession(array $user): array {
    return [
        'id'         => $user['id'],
        'name'       => $user['name'],
        'email'      => $user['email'],
        'role'       => $user['role'],
        'color'      => $user['color']      ?? '#7c3aed',
        'avatar'     => $user['avatar']     ?? '??',
        'phone'      => $user['phone']      ?? '',
        'department' => $user['department'] ?? '',
        'avatarUrl'  => $user['avatar_url'] ?? '',
    ];
}
