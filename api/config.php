<?php
date_default_timezone_set('Asia/Kolkata');
// ─────────────────────────────────────────────────────────────
//  AgencyHub — Database Configuration
//  Fill in your Hostinger MySQL credentials below.
//  Find these in: Hostinger hPanel → Databases → MySQL Databases
// ─────────────────────────────────────────────────────────────

define('DB_HOST', 'localhost');          // Always localhost on Hostinger
define('DB_NAME', 'u845629443_aikkk'); // e.g. u123456789_agencyhub
define('DB_USER', 'u845629443_tdm');   // e.g. u123456789_admin
define('DB_PASS', '&Fw8I#06qvu8');   // The password you set in hPanel
define('DB_CHARSET', 'utf8mb4');

// ─────────────────────────────────────────────────────────────
//  Create connection
// ─────────────────────────────────────────────────────────────
function getDB(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dsn = 'mysql:host=' . DB_HOST
         . ';dbname=' . DB_NAME
         . ';charset=' . DB_CHARSET;

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
    }

    return $pdo;
}
