<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

require_method('GET');
$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);

$unreadOnly = isset($_GET['unread']) && $_GET['unread'] === '1';
$sql = 'SELECT * FROM notifications WHERE tenant_id = ?';
$params = [$tenantId];
if ($unreadOnly) {
    $sql .= ' AND is_read = 0';
}
$sql .= ' ORDER BY created_at DESC LIMIT 200';

$stmt = db()->prepare($sql);
$stmt->execute($params);
json_ok(array_map('map_notification', $stmt->fetchAll()));
