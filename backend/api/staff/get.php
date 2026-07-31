<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';
require_once __DIR__ . '/_helpers.php';

require_method('GET');
$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);

$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '') {
    json_error('id is required', 422);
}

$row = require_row_for_tenant('staff', $tenantId, $id);
json_ok(map_staff_full($row, $tenantId));
