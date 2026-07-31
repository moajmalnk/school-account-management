<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    $stmt = db()->prepare('SELECT * FROM departments WHERE tenant_id = ? ORDER BY name');
    $stmt->execute([$tenantId]);
    json_ok(array_map('map_department', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $body = read_json_body();
    $name = trim((string) ($body['name'] ?? ''));
    $code = trim((string) ($body['code'] ?? ''));
    if ($name === '' || $code === '') {
        json_error('name and code are required', 422);
    }
    $publicId = trim((string) ($body['id'] ?? '')) ?: generate_public_id('DEP');
    db()->prepare('INSERT INTO departments (tenant_id, public_id, name, code) VALUES (?,?,?,?)')
        ->execute([$tenantId, $publicId, $name, $code]);
    json_ok(map_department(require_row_for_tenant('departments', $tenantId, $publicId)), 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $body = read_json_body();
    $id = trim((string) ($body['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    $row = require_row_for_tenant('departments', $tenantId, $id);
    db()->prepare('UPDATE departments SET name=?, code=? WHERE tenant_id = ? AND public_id = ?')
        ->execute([$body['name'] ?? $row['name'], $body['code'] ?? $row['code'], $tenantId, $id]);
    json_ok(map_department(require_row_for_tenant('departments', $tenantId, $id)));
}

if ($method === 'DELETE') {
    $id = trim((string) ($_GET['id'] ?? read_json_body()['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    require_row_for_tenant('departments', $tenantId, $id);
    db()->prepare('DELETE FROM departments WHERE tenant_id = ? AND public_id = ?')->execute([$tenantId, $id]);
    json_ok(['id' => $id, 'deleted' => true]);
}

json_error('Method not allowed', 405);
