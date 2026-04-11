<?php
// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — CORS + Session + Shared Helpers
// ─────────────────────────────────────────────────────────────

// Secure session settings — must precede session_start()
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Lax');
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    ini_set('session.cookie_secure', 1);
}

session_start();

// ── CORS ───────────────────────────────────────────────────────
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Response helpers ───────────────────────────────────────────

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

// ── Auth guards ────────────────────────────────────────────────

/** Returns current session user or responds 401. */
function requireAuth(): array {
    if (empty($_SESSION['user'])) {
        respondError('Not logged in. Please sign in first.', 401);
    }
    return $_SESSION['user'];
}

/** Requires admin (Manager) role. */
function requireAdmin(): array {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        respondError('Manager access required.', 403);
    }
    return $user;
}

/** Any authenticated user (member or admin). */
function requireMember(): array {
    return requireAuth();
}

// ── Utility ────────────────────────────────────────────────────

function generateId(): string {
    return bin2hex(random_bytes(8));
}
