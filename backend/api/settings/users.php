<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

function list_users(int $tenantId): array
{
    $stmt = db()->prepare(
        'SELECT u.*, r.public_id AS org_role_public_id
         FROM users u
         LEFT JOIN org_roles r ON r.id = u.org_role_id AND r.tenant_id = u.tenant_id
         WHERE u.tenant_id = ?
         ORDER BY u.display_name'
    );
    $stmt->execute([$tenantId]);
    return array_map('map_tenant_user', $stmt->fetchAll());
}

if ($method === 'GET') {
    json_ok(list_users($tenantId));
}

if ($method === 'POST') {
    $body = read_json_body();
    $email = strtolower(trim((string) ($body['email'] ?? '')));
    $password = (string) ($body['password'] ?? '');
    $displayName = trim((string) ($body['displayName'] ?? ''));
    if ($email === '' || $password === '' || $displayName === '') {
        json_error('email, password, and displayName are required', 422);
    }
    $publicId = trim((string) ($body['id'] ?? '')) ?: generate_public_id('USR');
    $permissions = $body['permissions'] ?? [];
    $orgRoleId = null;
    if (!empty($body['roleId'])) {
        $role = require_row_for_tenant('org_roles', $tenantId, (string) $body['roleId']);
        $orgRoleId = (int) $role['id'];
    }
    db()->prepare(
        'INSERT INTO users (tenant_id, public_id, email, password_hash, display_name, role, permissions, org_role_id, staff_public_id, active)
         VALUES (?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $tenantId,
        $publicId,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        $displayName,
        $body['role'] ?? 'tenant_user',
        json_encode($permissions),
        $orgRoleId,
        $body['staffId'] ?? null,
        bool_int($body['active'] ?? true, 1),
    ]);
    json_ok(list_users($tenantId), 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $body = read_json_body();
    $id = trim((string) ($body['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    $row = require_row_for_tenant('users', $tenantId, $id);
    $orgRoleId = $row['org_role_id'];
    if (array_key_exists('roleId', $body)) {
        if ($body['roleId']) {
            $role = require_row_for_tenant('org_roles', $tenantId, (string) $body['roleId']);
            $orgRoleId = (int) $role['id'];
        } else {
            $orgRoleId = null;
        }
    }
    $hash = $row['password_hash'];
    if (!empty($body['password'])) {
        $hash = password_hash((string) $body['password'], PASSWORD_DEFAULT);
    }
    db()->prepare(
        'UPDATE users SET email=?, password_hash=?, display_name=?, permissions=?, org_role_id=?, staff_public_id=?, active=?
         WHERE tenant_id = ? AND public_id = ?'
    )->execute([
        array_key_exists('email', $body) ? strtolower(trim((string) $body['email'])) : $row['email'],
        $hash,
        $body['displayName'] ?? $row['display_name'],
        array_key_exists('permissions', $body) ? json_encode($body['permissions']) : $row['permissions'],
        $orgRoleId,
        array_key_exists('staffId', $body) ? $body['staffId'] : $row['staff_public_id'],
        array_key_exists('active', $body) ? bool_int($body['active'], 1) : (int) $row['active'],
        $tenantId,
        $id,
    ]);
    json_ok(list_users($tenantId));
}

if ($method === 'DELETE') {
    $id = trim((string) ($_GET['id'] ?? read_json_body()['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    require_row_for_tenant('users', $tenantId, $id);
    db()->prepare('DELETE FROM users WHERE tenant_id = ? AND public_id = ?')->execute([$tenantId, $id]);
    json_ok(['id' => $id, 'deleted' => true]);
}

json_error('Method not allowed', 405);
