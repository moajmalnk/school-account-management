<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

require_method('DELETE', 'POST');
$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$body = read_json_body();

$id = trim((string) ($body['id'] ?? $_GET['id'] ?? ''));
$hard = isset($body['hard']) ? (bool) $body['hard'] : (isset($_GET['hard']) && $_GET['hard'] === '1');
$restore = isset($body['restore']) ? (bool) $body['restore'] : (isset($_GET['restore']) && $_GET['restore'] === '1');

if ($id === '') {
    json_error('id is required', 422);
}

$row = require_row_for_tenant('students', $tenantId, $id);

if ($restore) {
    $stmt = db()->prepare('UPDATE students SET deleted_at = NULL WHERE tenant_id = ? AND public_id = ?');
    $stmt->execute([$tenantId, $id]);
    json_ok(map_student(require_row_for_tenant('students', $tenantId, $id)));
}

if ($hard) {
    $stmt = db()->prepare('DELETE FROM students WHERE tenant_id = ? AND public_id = ?');
    $stmt->execute([$tenantId, $id]);
    json_ok(['id' => $id, 'deleted' => true]);
}

$stmt = db()->prepare('UPDATE students SET deleted_at = NOW() WHERE tenant_id = ? AND public_id = ?');
$stmt->execute([$tenantId, $id]);
json_ok(map_student(require_row_for_tenant('students', $tenantId, $id)));
