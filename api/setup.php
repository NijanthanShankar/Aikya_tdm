<?php
// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — Database Setup
//  Run ONE TIME: https://yourdomain.com/api/setup.php
//  Then DELETE this file immediately for security.
// ─────────────────────────────────────────────────────────────

require_once 'config.php';
header('Content-Type: text/plain; charset=utf-8');

$db = getDB();

echo "═══════════════════════════════════════\n";
echo "  Aikya Task Portal — DB Setup\n";
echo "═══════════════════════════════════════\n\n";

// ── Step 1: Add new columns to users table ─────────────────────
$newCols = [
    'phone'      => "ALTER TABLE users ADD COLUMN phone      VARCHAR(20)  DEFAULT '' AFTER avatar",
    'department' => "ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT '' AFTER phone",
    'avatar_url' => "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) DEFAULT '' AFTER department",
];
foreach ($newCols as $col => $sql) {
    try {
        $db->exec($sql);
        echo "✅ Column '$col' added to users.\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "ℹ️  Column '$col' already exists.\n";
        } else {
            echo "⚠️  Column '$col': " . $e->getMessage() . "\n";
        }
    }
}

// ── Step 2: Migrate old marketing roles → 'member' ────────────
try {
    $migrated = $db->exec("UPDATE users SET role = 'member' WHERE role NOT IN ('admin', 'member')");
    echo "✅ Migrated $migrated user(s) from old roles to 'member'.\n";
} catch (PDOException $e) {
    echo "⚠️  Role migration: " . $e->getMessage() . "\n";
}

// ── Step 3: Update ENUM on role column ────────────────────────
try {
    $db->exec("ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'member'");
    echo "✅ Role column updated to VARCHAR (admin / member).\n";
} catch (PDOException $e) {
    echo "ℹ️  Role column: " . $e->getMessage() . "\n";
}

// ── Step 4: Create tasks table ─────────────────────────────────
$db->exec("
    CREATE TABLE IF NOT EXISTS tasks (
        id           VARCHAR(32)   PRIMARY KEY,
        title        VARCHAR(255)  NOT NULL,
        description  TEXT,
        assigned_to  VARCHAR(32)   DEFAULT NULL,
        due_date     DATE          DEFAULT NULL,
        priority     VARCHAR(10)   NOT NULL DEFAULT 'medium',
        status       VARCHAR(20)   NOT NULL DEFAULT 'pending',
        created_by   VARCHAR(32)   DEFAULT NULL,
        created_at   DATETIME      DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_assigned_to (assigned_to),
        INDEX idx_status      (status),
        INDEX idx_created_at  (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");
echo "✅ Table 'tasks' ready.\n";

// ── Step 5: Create notes table ─────────────────────────────────
$db->exec("
    CREATE TABLE IF NOT EXISTS notes (
        id           VARCHAR(32)   PRIMARY KEY,
        task_id      VARCHAR(32)   NOT NULL,
        user_id      VARCHAR(32)   NOT NULL,
        note_text    TEXT,
        attachments  JSON,
        created_at   DATETIME      DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_task_id (task_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");
echo "✅ Table 'notes' ready.\n";

// ── Step 6: Create uploads directory ──────────────────────────
$uploadsDir = dirname(__DIR__) . '/uploads';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
    echo "✅ /uploads/ directory created.\n";
} else {
    echo "ℹ️  /uploads/ directory already exists.\n";
}

// Prevent PHP execution inside uploads
$htaccessPath = $uploadsDir . '/.htaccess';
if (!file_exists($htaccessPath)) {
    file_put_contents($htaccessPath, "php_flag engine off\nOptions -Indexes\n");
    echo "✅ Security .htaccess added to /uploads/.\n";
}

// ── Step 7: Seed default admin ────────────────────────────────
$adminCount = (int)$db->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
if ($adminCount === 0) {
    $id   = bin2hex(random_bytes(8));
    $hash = password_hash('Admin@123', PASSWORD_DEFAULT);
    $stmt = $db->prepare("
        INSERT INTO users (id, name, email, password, role, color, avatar, department)
        VALUES (?, 'Manager Admin', 'admin@aikyatdm.com', ?, 'admin', '#7c3aed', 'MA', 'Management')
    ");
    $stmt->execute([$id, $hash]);
    echo "✅ Default admin created.\n";
    echo "   Email:    admin@aikyatdm.com\n";
    echo "   Password: Admin@123\n";
    echo "\n⚠️  Change this password immediately after first login!\n";
} else {
    echo "ℹ️  Admin user already exists — skipped.\n";
}


// ── Step 8: Create attendance table ────────────────────────────
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

// ── Step 9: Create holidays table ──────────────────────────────
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

echo "\n🚀 Setup complete! DELETE this file now for security.\n";


