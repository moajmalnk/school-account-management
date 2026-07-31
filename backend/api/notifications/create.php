<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

require_method('POST');
$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$body = read_json_body();

$title = trim((string) ($body['title'] ?? ''));
$bodyText = trim((string) ($body['body'] ?? ''));
if ($title === '' || $bodyText === '') {
    json_error('title and body are required', 422);
}

$publicId = trim((string) ($body['id'] ?? '')) ?: generate_public_id('NTF');
db()->prepare(
    'INSERT INTO notifications (tenant_id, public_id, title, body, category, is_read, time_label, href)
     VALUES (?,?,?,?,?,0,?,?)'
)->execute([
    $tenantId,
    $publicId,
    $title,
    $bodyText,
    $body['category'] ?? 'system',
    $body['timeLabel'] ?? 'Just now',
    $body['href'] ?? null,
]);

json_ok(map_notification(require_row_for_tenant('notifications', $tenantId, $publicId)), 201);
