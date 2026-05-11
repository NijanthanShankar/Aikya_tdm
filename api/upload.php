<?php
// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — File Upload API
//  POST /api/upload.php  (multipart/form-data, field: "file")
//  Returns: { url, name, type, size }
// ─────────────────────────────────────────────────────────────

require_once 'config.php';
require_once 'helpers.php';

// Override Content-Type for multipart response
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respondError('Method not allowed.', 405);
}

requireMember(); // must be logged in

if (empty($_FILES['file'])) {
    respondError('No file received. Send a multipart form with field "file".');
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    $errors = [
        UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit.',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds form upload limit.',
        UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded.',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder.',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
        UPLOAD_ERR_EXTENSION  => 'Upload blocked by server extension.',
    ];
    respondError($errors[$file['error']] ?? 'Upload error ' . $file['error']);
}

// ── Validate size (max 10 MB) ──────────────────────────────────
$maxSize = 10 * 1024 * 1024; // 10 MB
if ($file['size'] > $maxSize) {
    respondError('File too large. Maximum allowed size is 10 MB.');
}

// ── Validate MIME type ────────────────────────────────────────
$allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
];

$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!in_array($mimeType, $allowedMimes, true)) {
    respondError("File type '$mimeType' is not allowed. Allowed: images, PDF, Word, Excel, text.");
}

// ── Validate extension ────────────────────────────────────────
$allowedExts = ['jpg','jpeg','png','gif','webp','pdf','doc','docx','xls','xlsx','txt','zip'];
$origName    = $file['name'];
$ext         = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
if (!in_array($ext, $allowedExts, true)) {
    respondError("File extension '.$ext' is not allowed.");
}

// ── Generate unique filename ───────────────────────────────────
$safeBase   = preg_replace('/[^a-zA-Z0-9_\-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
$safeBase   = substr($safeBase, 0, 60);
$uniqueName = $safeBase . '_' . bin2hex(random_bytes(6)) . '.' . $ext;

// ── Ensure uploads directory exists ──────────────────────────
$uploadsDir = dirname(__DIR__) . '/uploads';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

$destPath = $uploadsDir . '/' . $uniqueName;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    respondError('Failed to save the uploaded file. Check server permissions.');
}

// ── Return file info ──────────────────────────────────────────
respond([
    'url'  => '/uploads/' . $uniqueName,
    'name' => $origName,
    'type' => $mimeType,
    'size' => $file['size'],
]);
