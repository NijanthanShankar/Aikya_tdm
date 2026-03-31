<?php
// ─────────────────────────────────────────────────────────────
//  AgencyHub — CORS + Session + Shared helpers
// ─────────────────────────────────────────────────────────────

// Secure session cookie settings — must be set BEFORE session_start()
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Lax');

// If the site uses HTTPS (it should on Hostinger), secure the cookie
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    ini_set('session.cookie_secure', 1);
}

session_start();

// ── CORS ──────────────────────────────────────────────────────
// Since React and PHP are on the same domain on Hostinger,
// we just need to allow credentials and set content type.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Helpers ───────────────────────────────────────────────────

function respond(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function respondError(string $message, int $code = 400): void {
    respond(['error' => $message], $code);
}

function getBody(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function requireAuth(): array {
    if (empty($_SESSION['user'])) {
        respondError('Not logged in. Please sign in first.', 401);
    }
    return $_SESSION['user'];
}

function requireAdmin(): array {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        respondError('Admin access required.', 403);
    }
    return $user;
}

function generateId(): string {
    return bin2hex(random_bytes(8));
}
