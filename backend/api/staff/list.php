<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';
require_once __DIR__ . '/_helpers.php';

require_method('GET');
$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);

$includeDeleted = isset($_GET['includeDeleted']) && $_GET['includeDeleted'] === '1';
$onlyDeleted = isset($_GET['deleted']) && $_GET['deleted'] === '1';

$sql = 'SELECT * FROM staff WHERE tenant_id = ?';
if ($onlyDeleted) {
    $sql .= ' AND deleted_at IS NOT NULL';
} elseif (!$includeDeleted) {
    $sql .= ' AND deleted_at IS NULL';
}
$sql .= ' ORDER BY name ASC';

$stmt = db()->prepare($sql);
$stmt->execute([$tenantId]);
$rows = $stmt->fetchAll();

json_ok(array_map(static fn($r) => map_staff_full($r, $tenantId), $rows));
