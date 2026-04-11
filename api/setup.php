<?php
// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — Database Setup & Migration
//  Visit once: https://yourdomain.com/api/setup.php
//  DELETE this file immediately after running!
// ─────────────────────────────────────────────────────────────

require_once 'config.php';
header('Content-Type: text/plain; charset=utf-8');
$db = getDB();

echo "═══════════════════════════════════════\n";
echo "  Aikya Task Portal — DB Setup\n";
echo "═══════════════════════════════════════\n\n";

// ── Step 1: Add new columns to users table (safe ALTER) ───────
$newCols = [
    'phone'      => "ALTER TABLE users ADD COLUMN phone      VARCHAR(20)  DEFAULT '' AFTER avatar",
    'department' => "ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT '' AFTER phone",
    'avatar_url' => "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) DEFAULT '' AFTER department",
];

foreach ($newCols as $col => $sql) {
    try {
        $db->exec($sql);
        echo "✅ Column '$col' added.\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "ℹ️  Column '$col' already exists — skipped.\n";
        } else {
            echo "❌ Column '$col' error: " . $e->getMessage() . "\n";
        }
    }
}

// ── Step 2: Migrate old marketing roles → admin/member ────────
echo "\n";
$oldAdminRoles  = ['admin_web', 'admin_gmb', 'admin_ads', 'manager', 'superadmin'];
$placeholders   = implode(',', array_fill(0, count($oldAdminRoles), '?'));

$stmt = $db->prepare("UPDATE users SET role='admin' WHERE role IN ($placeholders)");
$stmt->execute($oldAdminRoles);
$adminMigrated = $stmt->rowCount();

$stmt2 = $db->prepare("UPDATE users SET role='member' WHERE role NOT IN ('admin','member')");
$stmt2->execute();
$memberMigrated = $stmt2->rowCount();

echo "✅ Migrated $adminMigrated users → 'admin' role.\n";
echo "✅ Migrated $memberMigrated users → 'member' role.\n";

// ── Step 3: Fix role colors ────────────────────────────────────
$db->exec("UPDATE users SET color='#7c3aed' WHERE role='admin'");
$db->exec("UPDATE users SET color='#059669' WHERE role='member'");
echo "✅ Role colors updated.\n";

// ── Step 4: Re-hash passwords for any plaintext passwords ─────
// (Only needed if old system stored plaintext — safe to run either way)
$allUsers = $db->query("SELECT id, password FROM users")->fetchAll(PDO::FETCH_ASSOC);
$rehashed = 0;
foreach ($allUsers as $u) {
    // If not a bcrypt hash (doesn't start with $2y$), re-hash it
    if (strpos($u['password'], '$2y$') !== 0) {
        $hash = password_hash($u['password'], PASSWORD_DEFAULT);
        $db->prepare("UPDATE users SET password=? WHERE id=?")->execute([$hash, $u['id']]);
        $rehashed++;
    }
}
if ($rehashed > 0) echo "✅ Re-hashed $rehashed plaintext password(s).\n";

// ── Step 5: Create tasks table ────────────────────────────────
echo "\n";
$db->exec("
    CREATE TABLE IF NOT EXISTS tasks (
        id          VARCHAR(32)  PRIMARY KEY,
        title       VARCHAR(255) NOT NULL,
        description TEXT         DEFAULT NULL,
        assigned_to VARCHAR(32)  DEFAULT NULL,
        created_by  VARCHAR(32)  DEFAULT NULL,
        due_date    DATE         DEFAULT NULL,
        priority    VARCHAR(10)  NOT NULL DEFAULT 'medium',
        status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
        created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_assigned (assigned_to),
        INDEX idx_status   (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");
echo "✅ Table 'tasks' ready.\n";

// ── Step 6: Create notes table ────────────────────────────────
$db->exec("
    CREATE TABLE IF NOT EXISTS notes (
        id          VARCHAR(32)  PRIMARY KEY,
        task_id     VARCHAR(32)  NOT NULL,
        user_id     VARCHAR(32)  NOT NULL,
        note_text   TEXT         DEFAULT NULL,
        attachments JSON         DEFAULT NULL,
        created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_task (task_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");
echo "✅ Table 'notes' ready.\n";

// ── Step 7: Create attendance table ──────────────────────────
$db->exec("
    CREATE TABLE IF NOT EXISTS attendance (
        id                VARCHAR(32)   PRIMARY KEY,
        user_id           VARCHAR(32)   NOT NULL,
        date              DATE          NOT NULL,
        checkin_time      DATETIME      NOT NULL,
        checkout_time     DATETIME      DEFAULT NULL,
        checkin_lat       VARCHAR(20)   DEFAULT NULL,
        checkin_lng       VARCHAR(20)   DEFAULT NULL,
        checkout_lat      VARCHAR(20)   DEFAULT NULL,
        checkout_lng      VARCHAR(20)   DEFAULT NULL,
        checkin_location  VARCHAR(300)  DEFAULT '',
        checkout_location VARCHAR(300)  DEFAULT '',
        work_hours        DECIMAL(5,2)  DEFAULT NULL,
        status            VARCHAR(20)   NOT NULL DEFAULT 'present',
        notes             TEXT          DEFAULT NULL,
        UNIQUE KEY uq_user_date (user_id, date),
        INDEX idx_user_id (user_id),
        INDEX idx_date    (date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");
echo "✅ Table 'attendance' ready.\n";

// ── Step 8: Create holidays table ─────────────────────────────
$db->exec("
    CREATE TABLE IF NOT EXISTS holidays (
        id           VARCHAR(32)   PRIMARY KEY,
        holiday_date DATE          NOT NULL,
        name         VARCHAR(255)  NOT NULL,
        created_by   VARCHAR(32)   DEFAULT NULL,
        created_at   DATETIME      DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_date (holiday_date),
        INDEX idx_year (holiday_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");
echo "✅ Table 'holidays' ready.\n";

// ── Step 9: Show current users ─────────────────────────────────
echo "\n── Current Users ──────────────────────────────\n";
$users = $db->query("SELECT id, name, email, role, color FROM users ORDER BY role, name")->fetchAll(PDO::FETCH_ASSOC);
if (empty($users)) {
    echo "⚠️  No users found in database!\n";
} else {
    foreach ($users as $u) {
        echo "  [{$u['role']}] {$u['name']} <{$u['email']}>\n";
    }
}

// ── Step 10: Ensure at least one admin exists ───────────────────
echo "\n";
$adminCount = (int)$db->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn();

if ($adminCount === 0) {
    // Create default admin
    $id     = bin2hex(random_bytes(8));
    $hash   = password_hash('Admin@123', PASSWORD_DEFAULT);
    $db->prepare("
        INSERT INTO users (id, name, email, password, role, color, avatar)
        VALUES (?, 'Admin Manager', 'admin@aikyatdm.com', ?, 'admin', '#7c3aed', 'AM')
    ")->execute([$id, $hash]);

    echo "✅ Default admin created:\n";
    echo "   Email:    admin\@aikyatdm.com\n";
    echo "   Password: Admin\@123\n";
    echo "   ⚠️  Change this password immediately after login!\n";
} else {
    echo "ℹ️  $adminCount admin account(s) already exist — skipped default creation.\n";
    
    // Show admin login details
    $admins = $db->query("SELECT name, email FROM users WHERE role='admin'")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($admins as $a) {
        echo "   Admin: {$a['name']} <{$a['email']}>\n";
    }
}

echo "\n═══════════════════════════════════════\n";
echo "  🚀 Setup complete!\n";
echo "  ⚠️  DELETE this file now for security.\n";
echo "═══════════════════════════════════════\n";
