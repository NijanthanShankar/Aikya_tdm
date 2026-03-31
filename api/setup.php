<?php
// ─────────────────────────────────────────────────────────────
//  AgencyHub — Database Setup
//  Run this ONE TIME by visiting: https://yourdomain.com/api/setup.php
//  Then DELETE this file immediately after for security.
// ─────────────────────────────────────────────────────────────

require_once 'config.php';

header('Content-Type: text/plain; charset=utf-8');

$db = getDB();

// ── Create tables ─────────────────────────────────────────────

$db->exec("
    CREATE TABLE IF NOT EXISTS users (
        id          VARCHAR(32)  PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255) NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        role        ENUM('admin','webmanager','telecaller','videoeditor','socialmanager') NOT NULL DEFAULT 'webmanager',
        color       VARCHAR(20)  DEFAULT '#7c3aed',
        avatar      VARCHAR(10)  DEFAULT '',
        created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");
echo "✅ Table 'users' created.\n";

$db->exec("
    CREATE TABLE IF NOT EXISTS entries (
        id          VARCHAR(32)  PRIMARY KEY,
        user_id     VARCHAR(32)  NOT NULL,
        store       VARCHAR(50)  NOT NULL,
        data        JSON         NOT NULL,
        created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_store   (store),
        INDEX idx_user    (user_id),
        INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");
echo "✅ Table 'entries' created.\n";

// ── Seed default admin ────────────────────────────────────────

$existing = $db->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn();

if ((int)$existing === 0) {
    $id       = bin2hex(random_bytes(8));
    $name     = 'Admin';
    $email    = 'admin@agencyhub.com';
    $password = password_hash('Admin@123', PASSWORD_DEFAULT);
    $role     = 'admin';
    $color    = '#7c3aed';
    $avatar   = 'AD';

    $stmt = $db->prepare("
        INSERT INTO users (id, name, email, password, role, color, avatar)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$id, $name, $email, $password, $role, $color, $avatar]);
    echo "✅ Default admin created.\n";
    echo "   Email:    admin@agencyhub.com\n";
    echo "   Password: Admin@123\n";
    echo "\n⚠️  IMPORTANT: Log in and change this password immediately!\n";
} else {
    echo "ℹ️  Admin user already exists, skipped seeding.\n";
}

echo "\n🚀 Setup complete! DELETE this file now for security.\n";
