<?php
// ─────────────────────────────────────────────────────────────
//  AgencyHub — Connection Debugger
//  Visit: https://yourdomain.com/api/debug.php
//  DELETE this file after fixing everything.
// ─────────────────────────────────────────────────────────────
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
<title>AgencyHub — Debug</title>
<style>
  body { font-family: monospace; background:#0f0f1a; color:#e2e8f0; padding:32px; max-width:720px; margin:0 auto; }
  h1   { color:#a78bfa; font-size:20px; margin-bottom:24px; }
  .card{ background:#1e1b2e; border:1px solid #2d2a45; border-radius:12px; padding:20px; margin-bottom:16px; }
  .ok  { color:#34d399; } .fail{ color:#f87171; } .warn{ color:#fbbf24; }
  .label{ color:#94a3b8; font-size:12px; margin-bottom:4px; }
  .val  { font-size:15px; font-weight:bold; margin-bottom:12px; }
  pre   { background:#0d0d1a; padding:12px; border-radius:8px; overflow-x:auto; font-size:12px; color:#c4b5fd; }
  .sep  { border:none; border-top:1px solid #2d2a45; margin:12px 0; }
</style>
</head>
<body>
<h1>🔍 AgencyHub — Connection Diagnostics</h1>

<?php

// ── 1. PHP Version ────────────────────────────────────────────
echo '<div class="card">';
echo '<div class="label">PHP Version</div>';
$ver = phpversion();
$ok  = version_compare($ver, '7.4', '>=');
echo '<div class="val ' . ($ok ? 'ok' : 'fail') . '">' . ($ok ? '✅' : '❌') . ' PHP ' . $ver . '</div>';
if (!$ok) echo '<div class="fail">PHP 7.4+ required. Contact Hostinger support to upgrade.</div>';
echo '</div>';

// ── 2. PDO MySQL Extension ────────────────────────────────────
echo '<div class="card">';
echo '<div class="label">PDO MySQL Extension</div>';
$pdoOk = extension_loaded('pdo_mysql');
echo '<div class="val ' . ($pdoOk ? 'ok' : 'fail') . '">' . ($pdoOk ? '✅ Loaded' : '❌ Not loaded — contact Hostinger support') . '</div>';
echo '</div>';

// ── 3. Config File ────────────────────────────────────────────
echo '<div class="card">';
echo '<div class="label">Config File (api/config.php)</div>';
$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    echo '<div class="val fail">❌ config.php not found in ' . __DIR__ . '</div>';
} else {
    require_once $configPath;
    echo '<div class="val ok">✅ config.php found</div>';
    echo '<hr class="sep">';
    echo '<div class="label">Configured values:</div>';
    echo '<pre>';
    echo 'DB_HOST: ' . (defined('DB_HOST') ? DB_HOST : '⚠️ not defined') . "\n";
    echo 'DB_NAME: ' . (defined('DB_NAME') ? (DB_NAME === 'your_database_name' ? '❌ STILL PLACEHOLDER — change this!' : DB_NAME) : '⚠️ not defined') . "\n";
    echo 'DB_USER: ' . (defined('DB_USER') ? (DB_USER === 'your_db_username' ? '❌ STILL PLACEHOLDER — change this!' : DB_USER) : '⚠️ not defined') . "\n";
    echo 'DB_PASS: ' . (defined('DB_PASS') ? (DB_PASS === 'your_db_password' ? '❌ STILL PLACEHOLDER — change this!' : str_repeat('*', strlen(DB_PASS))) : '⚠️ not defined') . "\n";
    echo '</pre>';
}
echo '</div>';

// ── 4. DB Connection ──────────────────────────────────────────
echo '<div class="card">';
echo '<div class="label">MySQL Connection</div>';

if (!defined('DB_HOST') || DB_NAME === 'your_database_name') {
    echo '<div class="val warn">⚠️ Skipped — fill in config.php first</div>';
} else {
    try {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        echo '<div class="val ok">✅ Connected to MySQL successfully</div>';

        // ── 5. Tables ──────────────────────────────────────────
        echo '<hr class="sep">';
        echo '<div class="label">Tables</div>';
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

        $needUsers   = in_array('users', $tables);
        $needEntries = in_array('entries', $tables);

        echo '<pre>';
        echo ($needUsers   ? '✅' : '❌') . " users table\n";
        echo ($needEntries ? '✅' : '❌') . " entries table\n";
        echo '</pre>';

        if (!$needUsers || !$needEntries) {
            echo '<div class="fail">❌ Tables missing — visit <a href="setup.php" style="color:#a78bfa">setup.php</a> to create them.</div>';
        } else {
            // ── 6. Admin account ───────────────────────────────
            echo '<hr class="sep">';
            echo '<div class="label">Admin Account</div>';
            $count = $pdo->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn();
            if ((int)$count === 0) {
                echo '<div class="fail">❌ No admin account found — visit <a href="setup.php" style="color:#a78bfa">setup.php</a> to seed it.</div>';
            } else {
                $admin = $pdo->query("SELECT name, email, role FROM users WHERE role='admin' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
                echo '<pre>';
                echo '✅ Admin found: ' . htmlspecialchars($admin['email']) . "\n";
                echo 'Name: ' . htmlspecialchars($admin['name']) . "\n";
                echo 'Total users: ' . $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn() . "\n";
                echo 'Total entries: ' . $pdo->query("SELECT COUNT(*) FROM entries")->fetchColumn() . "\n";
                echo '</pre>';
            }
        }

    } catch (PDOException $e) {
        echo '<div class="val fail">❌ Connection failed</div>';
        echo '<pre class="fail">' . htmlspecialchars($e->getMessage()) . '</pre>';
        echo '<div class="warn">Common causes:<br>';
        echo '• Wrong DB_NAME / DB_USER / DB_PASS in config.php<br>';
        echo '• User not assigned to the database in hPanel<br>';
        echo '• Database not created yet in hPanel</div>';
    }
}
echo '</div>';

// ── 7. Session ────────────────────────────────────────────────
echo '<div class="card">';
echo '<div class="label">PHP Sessions</div>';
@session_start();
$_SESSION['test'] = 'ok';
$sessionOk = isset($_SESSION['test']);
echo '<div class="val ' . ($sessionOk ? 'ok' : 'fail') . '">' . ($sessionOk ? '✅ Sessions working' : '❌ Sessions not working') . '</div>';
echo '</div>';

// ── 8. File Paths ─────────────────────────────────────────────
echo '<div class="card">';
echo '<div class="label">File Paths</div>';
$files = ['config.php','helpers.php','auth.php','users.php','entries.php'];
echo '<pre>';
foreach ($files as $file) {
    $path = __DIR__ . '/' . $file;
    echo (file_exists($path) ? '✅' : '❌') . ' api/' . $file . "\n";
}
echo '</pre>';
echo '<div class="label">API directory:</div>';
echo '<pre>' . __DIR__ . '</pre>';
echo '</div>';

?>

<div class="card warn" style="border-color:#78350f;background:#1c1209">
  ⚠️ <strong>Security:</strong> Delete <code>api/debug.php</code> from your server after fixing the issue.
</div>

</body>
</html>
