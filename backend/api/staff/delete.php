<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';
require_once __DIR__ . '/_helpers.php';

require_method('DELETE', 'POST');
$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$body = read_json_body();

$id = trim((string) ($body['id'] ?? $_GET['id'] ?? ''));
$hard = !empty($body['hard']) || (isset($_GET['hard']) && $_GET['hard'] === '1');
$restore = !empty($body['restore']) || (isset($_GET['restore']) && $_GET['restore'] === '1');

if ($id === '') {
    json_error('id is required', 422);
}

require_row_for_tenant('staff', $tenantId, $id);

if ($restore) {
    db()->prepare('UPDATE staff SET deleted_at = NULL WHERE tenant_id = ? AND public_id = ?')
        ->execute([$tenantId, $id]);
    json_ok(map_staff_full(require_row_for_tenant('staff', $tenantId, $id), $tenantId));
}

if ($hard) {
    db()->prepare('DELETE FROM staff WHERE tenant_id = ? AND public_id = ?')->execute([$tenantId, $id]);
    json_ok(['id' => $id, 'deleted' => true]);
}

db()->prepare('UPDATE staff SET deleted_at = NOW() WHERE tenant_id = ? AND public_id = ?')
    ->execute([$tenantId, $id]);
json_ok(map_staff_full(require_row_for_tenant('staff', $tenantId, $id), $tenantId));
