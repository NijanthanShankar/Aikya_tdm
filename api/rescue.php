<?php
// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — Admin Rescue Script
//  ⚠️  DELETE THIS FILE IMMEDIATELY AFTER USE!
//  Visit: https://yourdomain.com/api/rescue.php
// ─────────────────────────────────────────────────────────────

require_once 'config.php';
header('Content-Type: text/plain; charset=utf-8');
$db = getDB();

$NEW_EMAIL    = 'admin@aikyatdm.com';
$NEW_PASSWORD = 'Admin@123';

echo "═══════════════════════════════════════\n";
echo "  Aikya Task Portal — Admin Rescue\n";
echo "═══════════════════════════════════════\n\n";

// ── Show all existing users ────────────────────────────────────
echo "── All Users in Database ──────────────────\n";
$users = $db->query("SELECT id, name, email, role FROM users ORDER BY role, name")->fetchAll(PDO::FETCH_ASSOC);

if (empty($users)) {
    echo "⚠️  NO USERS FOUND in database!\n\n";
} else {
    foreach ($users as $u) {
        echo "  [{$u['role']}] {$u['name']} <{$u['email']}>\n";
    }
    echo "\n";
}

// ── Check if target admin email exists ────────────────────────
$stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([strtolower($NEW_EMAIL)]);
$existing = $stmt->fetch();

if ($existing) {
    // Update existing user's role to admin and reset password
    $hash = password_hash($NEW_PASSWORD, PASSWORD_DEFAULT);
    $db->prepare("UPDATE users SET role='admin', password=?, color='#7c3aed' WHERE email=?")
       ->execute([$hash, strtolower($NEW_EMAIL)]);
    echo "✅ Existing account updated:\n";
} else {
    // Create brand new admin account
    $id   = bin2hex(random_bytes(8));
    $hash = password_hash($NEW_PASSWORD, PASSWORD_DEFAULT);
    $db->prepare("INSERT INTO users (id, name, email, password, role, color, avatar) VALUES (?, 'Admin', ?, ?, 'admin', '#7c3aed', 'AD')")
       ->execute([$id, strtolower($NEW_EMAIL), $hash]);
    echo "✅ New admin account created:\n";
}

echo "   Email:    {$NEW_EMAIL}\n";
echo "   Password: {$NEW_PASSWORD}\n";
echo "   Role:     admin\n";

echo "\n═══════════════════════════════════════\n";
echo "  ✅ Done! You can now log in.\n";
echo "  ⚠️  DELETE rescue.php NOW for security!\n";
echo "═══════════════════════════════════════\n";
