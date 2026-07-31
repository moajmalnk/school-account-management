<?php
require_once dirname(__DIR__, 2) . '/cors.php';
require_once dirname(__DIR__, 2) . '/lib/db.php';
require_once dirname(__DIR__, 2) . '/lib/response.php';
require_once dirname(__DIR__, 2) . '/lib/auth.php';
require_once dirname(__DIR__, 2) . '/lib/mappers.php';

require_method('POST');
$body = read_json_body();

$email = strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');

if ($email === '' || $password === '') {
    json_error('Email and password are required', 422);
}

$stmt = db()->prepare(
    'SELECT u.*, t.name AS tenant_name, t.status AS tenant_status, t.public_id AS tenant_public_id
     FROM users u
     INNER JOIN tenants t ON t.id = u.tenant_id
     WHERE u.email = ?
     LIMIT 1'
);
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !(int) $user['active'] || !password_verify($password, $user['password_hash'])) {
    json_error('Invalid credentials', 401);
}
if (($user['tenant_status'] ?? '') === 'Suspended') {
    json_error('Tenant suspended', 403);
}

$permissions = json_decode($user['permissions'] ?? '[]', true);
if (!is_array($permissions)) {
    $permissions = [];
}

$token = jwt_encode([
    'userId' => (int) $user['id'],
    'tenantId' => (int) $user['tenant_id'],
    'role' => $user['role'],
    'email' => $user['email'],
    'permissions' => $permissions,
]);

$session = [
    'role' => $user['role'],
    'email' => $user['email'],
    'displayName' => $user['display_name'],
    'tenantName' => $user['tenant_name'],
    'tenantId' => $user['tenant_public_id'],
    'issuedAt' => date('c'),
    'userId' => $user['public_id'],
    'staffId' => $user['staff_public_id'] ?: null,
    'permissions' => $permissions,
];

json_ok([
    'token' => $token,
    'session' => $session,
]);
