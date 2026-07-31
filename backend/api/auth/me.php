<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

require_method('GET');
$auth = require_auth();

$stmt = db()->prepare(
    'SELECT u.*, t.name AS tenant_name, t.public_id AS tenant_public_id
     FROM users u
     INNER JOIN tenants t ON t.id = u.tenant_id
     WHERE u.id = ? AND u.tenant_id = ?
     LIMIT 1'
);
$stmt->execute([$auth['userId'], $auth['tenantId']]);
$user = $stmt->fetch();
if (!$user) {
    json_error('User not found', 404);
}

json_ok([
    'role' => $user['role'],
    'email' => $user['email'],
    'displayName' => $user['display_name'],
    'tenantName' => $user['tenant_name'],
    'tenantId' => $user['tenant_public_id'],
    'issuedAt' => date('c'),
    'userId' => $user['public_id'],
    'staffId' => $user['staff_public_id'] ?: null,
    'permissions' => $auth['permissions'],
]);
