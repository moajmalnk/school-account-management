<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

require_method('POST', 'PUT', 'PATCH');
$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$body = read_json_body();

$all = !empty($body['all']);
$id = trim((string) ($body['id'] ?? $_GET['id'] ?? ''));

if ($all) {
    db()->prepare('UPDATE notifications SET is_read = 1 WHERE tenant_id = ?')->execute([$tenantId]);
    json_ok(['markedAll' => true]);
}

if ($id === '') {
    json_error('id is required (or pass all=true)', 422);
}

require_row_for_tenant('notifications', $tenantId, $id);
db()->prepare('UPDATE notifications SET is_read = 1 WHERE tenant_id = ? AND public_id = ?')
    ->execute([$tenantId, $id]);

json_ok(map_notification(require_row_for_tenant('notifications', $tenantId, $id)));
