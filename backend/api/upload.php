<?php
/**
 * Upload image/document for the authenticated tenant.
 * POST multipart: file + kind (logo|letterhead|document|photo)
 * OR JSON: { dataUrl, kind, fileName? }
 * Returns: { url, path, kind, size }
 */
require_once dirname(__DIR__) . '/lib/bootstrap.php';

require_method('POST');
$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);

$cfg = app_config()['uploads'] ?? [];
$baseDir = $cfg['dir'] ?? (dirname(__DIR__) . '/uploads');
$maxBytes = (int) ($cfg['max_bytes'] ?? (5 * 1024 * 1024));
$publicBase = rtrim((string) ($cfg['public_base'] ?? '/uploads'), '/');

$kind = 'document';
$binary = null;
$mime = 'application/octet-stream';
$originalName = 'upload.bin';

if (!empty($_FILES['file']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
    $kind = preg_replace('/[^a-z]/', '', strtolower((string) ($_POST['kind'] ?? 'document'))) ?: 'document';
    $tmp = $_FILES['file']['tmp_name'];
    $size = (int) ($_FILES['file']['size'] ?? 0);
    if ($size < 1 || $size > $maxBytes) {
        json_error('File exceeds size limit', 422);
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($tmp) ?: 'application/octet-stream';
    $originalName = (string) ($_FILES['file']['name'] ?? 'upload.bin');
    $binary = file_get_contents($tmp);
} else {
    $body = read_json_body();
    $kind = preg_replace('/[^a-z]/', '', strtolower((string) ($body['kind'] ?? 'document'))) ?: 'document';
    $dataUrl = (string) ($body['dataUrl'] ?? '');
    if (!preg_match('#^data:([^;]+);base64,(.+)$#s', $dataUrl, $m)) {
        json_error('Provide multipart file or a dataUrl', 422);
    }
    $mime = trim($m[1]);
    $binary = base64_decode($m[2], true);
    if ($binary === false) {
        json_error('Invalid base64 dataUrl', 422);
    }
    if (strlen($binary) > $maxBytes) {
        json_error('File exceeds size limit', 422);
    }
    $originalName = (string) ($body['fileName'] ?? 'upload');
}

$allowedMimes = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
    'application/pdf' => 'pdf',
];
if (!isset($allowedMimes[$mime])) {
    json_error('Unsupported file type. Use JPG, PNG, WEBP, GIF, or PDF.', 422);
}
$ext = $allowedMimes[$mime];

$tenantDir = $baseDir . DIRECTORY_SEPARATOR . $tenantId;
if (!is_dir($tenantDir) && !mkdir($tenantDir, 0755, true) && !is_dir($tenantDir)) {
    json_error('Could not create upload directory', 500);
}

$filename = sprintf('%s_%s.%s', $kind, bin2hex(random_bytes(8)), $ext);
$absPath = $tenantDir . DIRECTORY_SEPARATOR . $filename;
if (file_put_contents($absPath, $binary) === false) {
    json_error('Could not write upload', 500);
}

$relative = $publicBase . '/' . $tenantId . '/' . $filename;
$host = $_SERVER['HTTP_HOST'] ?? 'spi.macadz.com';
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
$absolute = ($https ? 'https' : 'http') . '://' . $host . $relative;

json_ok([
    'url' => $absolute,
    'path' => $relative,
    'kind' => $kind,
    'mimeType' => $mime,
    'size' => strlen($binary),
    'fileName' => $originalName,
], 201);
