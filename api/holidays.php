<?php
// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — Holidays API
//  GET    /api/holidays.php              → list all holidays
//  POST   /api/holidays.php              → add holiday (admin)
//  DELETE /api/holidays.php?id=X         → remove holiday (admin)
// ─────────────────────────────────────────────────────────────

require_once 'config.php';
require_once 'helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── GET — list holidays ───────────────────────────────────────
if ($method === 'GET') {
    requireMember();
    $year  = $_GET['year'] ?? date('Y');
    $stmt  = $db->prepare("
        SELECT * FROM holidays
        WHERE YEAR(holiday_date) = ?
        ORDER BY holiday_date ASC
    ");
    $stmt->execute([$year]);
    $rows = $stmt->fetchAll();
    respond(['holidays' => array_map(fn($r) => [
        'id'   => $r['id'],
        'date' => $r['holiday_date'],
        'name' => $r['name'],
        'createdAt' => $r['created_at'],
    ], $rows)]);
}

// ── POST — add holiday (admin only) ──────────────────────────
if ($method === 'POST') {
    $admin = requireAdmin();
    $body  = getBody();

    $date = trim($body['date'] ?? '');
    $name = trim($body['name'] ?? '');

    if (!$date || !$name) respondError('Date and name are required.');

    // Validate date format
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        respondError('Invalid date format. Use YYYY-MM-DD.');
    }

    // Cannot add Sunday (auto-holiday)
    $dow = date('N', strtotime($date));
    if ($dow == 7) respondError('Sunday is already a holiday — no need to add it separately.');

    // Check duplicate
    $check = $db->prepare('SELECT id FROM holidays WHERE holiday_date = ?');
    $check->execute([$date]);
    if ($check->fetch()) respondError('A holiday already exists on this date.');

    $id   = generateId();
    $stmt = $db->prepare('INSERT INTO holidays (id, holiday_date, name, created_by) VALUES (?,?,?,?)');
    $stmt->execute([$id, $date, $name, $admin['id']]);

    respond(['holiday' => ['id' => $id, 'date' => $date, 'name' => $name]], 201);
}

// ── DELETE — remove holiday (admin only) ─────────────────────
if ($method === 'DELETE') {
    requireAdmin();
    $id = $_GET['id'] ?? '';
    if (!$id) respondError('Holiday ID required.');

    $check = $db->prepare('SELECT id FROM holidays WHERE id = ?');
    $check->execute([$id]);
    if (!$check->fetch()) respondError('Holiday not found.', 404);

    $db->prepare('DELETE FROM holidays WHERE id = ?')->execute([$id]);
    respond(['success' => true]);
}

respondError('Method not allowed.', 405);
