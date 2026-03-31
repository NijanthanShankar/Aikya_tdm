<?php
// ─────────────────────────────────────────────────────────────
//  AgencyHub — Entries API
//  GET    /api/entries.php?store=X          → get entries
//  POST   /api/entries.php                  → add entry
//  DELETE /api/entries.php?id=X             → delete entry
// ─────────────────────────────────────────────────────────────

require_once 'config.php';
require_once 'helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

$VALID_STORES = [
    'websiteEntries', 'gmbEntries', 'adsEntries', 'seoEntries',
    'telecallerEntries', 'videoEntries', 'socialEntries',
];

// ── GET — fetch entries ───────────────────────────────────────
if ($method === 'GET') {
    $user  = requireAuth();
    $store = $_GET['store'] ?? '';

    if ($store && !in_array($store, $VALID_STORES, true)) {
        respondError('Invalid store name.');
    }

    if ($user['role'] === 'admin') {
        // Admin gets all entries, optionally filtered by store
        if ($store) {
            $stmt = $db->prepare('SELECT * FROM entries WHERE store = ? ORDER BY created_at DESC');
            $stmt->execute([$store]);
        } else {
            $stmt = $db->query('SELECT * FROM entries ORDER BY created_at DESC');
        }
    } else {
        // Non-admin gets only their own entries
        if ($store) {
            $stmt = $db->prepare('SELECT * FROM entries WHERE store = ? AND user_id = ? ORDER BY created_at DESC');
            $stmt->execute([$store, $user['id']]);
        } else {
            $stmt = $db->prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY created_at DESC');
            $stmt->execute([$user['id']]);
        }
    }

    $rows = $stmt->fetchAll();

    // Decode JSON data and merge fields at top level
    $entries = array_map(function ($row) {
        $data = json_decode($row['data'], true) ?? [];
        return array_merge($data, [
            'id'         => $row['id'],
            'userId'     => $row['user_id'],
            'store'      => $row['store'],
            'createdAt'  => $row['created_at'],
        ]);
    }, $rows);

    respond(['entries' => $entries]);
}

// ── POST — add entry ──────────────────────────────────────────
if ($method === 'POST') {
    $user  = requireAuth();
    $body  = getBody();
    $store = $body['store'] ?? '';

    if (!$store || !in_array($store, $VALID_STORES, true)) {
        respondError('Invalid or missing store name.');
    }

    // Remove meta fields before storing in data JSON
    $data = $body;
    unset($data['store'], $data['userId'], $data['id'], $data['createdAt']);

    $id   = generateId();
    $json = json_encode($data);

    $stmt = $db->prepare('INSERT INTO entries (id, user_id, store, data) VALUES (?, ?, ?, ?)');
    $stmt->execute([$id, $user['id'], $store, $json]);

    $entry = array_merge($data, [
        'id'        => $id,
        'userId'    => $user['id'],
        'store'     => $store,
        'createdAt' => date('Y-m-d H:i:s'),
    ]);

    respond(['entry' => $entry], 201);
}

// ── DELETE — remove entry ─────────────────────────────────────
if ($method === 'DELETE') {
    $user = requireAuth();
    $id   = $_GET['id'] ?? '';
    if (!$id) respondError('Entry ID required.');

    // Check ownership
    $check = $db->prepare('SELECT user_id FROM entries WHERE id = ?');
    $check->execute([$id]);
    $entry = $check->fetch();

    if (!$entry) respondError('Entry not found.', 404);
    if ($user['role'] !== 'admin' && $entry['user_id'] !== $user['id']) {
        respondError('Not allowed to delete this entry.', 403);
    }

    $stmt = $db->prepare('DELETE FROM entries WHERE id = ?');
    $stmt->execute([$id]);
    respond(['success' => true]);
}

respondError('Method not allowed.', 405);
