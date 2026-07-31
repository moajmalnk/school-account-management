<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

function roles_with_dept(int $tenantId): array
{
    $stmt = db()->prepare(
        'SELECT r.*, d.public_id AS department_public_id
         FROM org_roles r
         INNER JOIN departments d ON d.id = r.department_id AND d.tenant_id = r.tenant_id
         WHERE r.tenant_id = ?
         ORDER BY r.title'
    );
    $stmt->execute([$tenantId]);
    return array_map('map_org_role', $stmt->fetchAll());
}

if ($method === 'GET') {
    json_ok(roles_with_dept($tenantId));
}

if ($method === 'POST') {
    $body = read_json_body();
    $title = trim((string) ($body['title'] ?? ''));
    $departmentId = trim((string) ($body['departmentId'] ?? ''));
    if ($title === '' || $departmentId === '') {
        json_error('title and departmentId are required', 422);
    }
    $dept = require_row_for_tenant('departments', $tenantId, $departmentId);
    $publicId = trim((string) ($body['id'] ?? '')) ?: generate_public_id('ROL');
    db()->prepare('INSERT INTO org_roles (tenant_id, public_id, title, department_id) VALUES (?,?,?,?)')
        ->execute([$tenantId, $publicId, $title, (int) $dept['id']]);
    json_ok(roles_with_dept($tenantId));
}

if ($method === 'PUT' || $method === 'PATCH') {
    $body = read_json_body();
    $id = trim((string) ($body['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    $row = require_row_for_tenant('org_roles', $tenantId, $id);
    $deptPk = (int) $row['department_id'];
    if (!empty($body['departmentId'])) {
        $dept = require_row_for_tenant('departments', $tenantId, (string) $body['departmentId']);
        $deptPk = (int) $dept['id'];
    }
    db()->prepare('UPDATE org_roles SET title=?, department_id=? WHERE tenant_id = ? AND public_id = ?')
        ->execute([$body['title'] ?? $row['title'], $deptPk, $tenantId, $id]);
    json_ok(roles_with_dept($tenantId));
}

if ($method === 'DELETE') {
    $id = trim((string) ($_GET['id'] ?? read_json_body()['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    require_row_for_tenant('org_roles', $tenantId, $id);
    db()->prepare('DELETE FROM org_roles WHERE tenant_id = ? AND public_id = ?')->execute([$tenantId, $id]);
    json_ok(['id' => $id, 'deleted' => true]);
}

json_error('Method not allowed', 405);
