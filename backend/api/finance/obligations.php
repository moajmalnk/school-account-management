<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    $id = trim((string) ($_GET['id'] ?? ''));
    if ($id !== '') {
        json_ok(map_obligation(require_row_for_tenant('obligations', $tenantId, $id)));
    }
    $stmt = db()->prepare('SELECT * FROM obligations WHERE tenant_id = ? ORDER BY due_date ASC');
    $stmt->execute([$tenantId]);
    json_ok(array_map('map_obligation', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $body = read_json_body();
    $payee = trim((string) ($body['payee'] ?? ''));
    $amount = (int) ($body['amount'] ?? 0);
    $due = $body['due'] ?? $body['dueDate'] ?? null;
    if ($payee === '' || $amount < 1 || !$due) {
        json_error('payee, amount, and due are required', 422);
    }
    $publicId = trim((string) ($body['id'] ?? '')) ?: generate_public_id('OBL');
    db()->prepare(
        'INSERT INTO obligations (tenant_id, public_id, payee, description, amount, due_date, payee_type)
         VALUES (?,?,?,?,?,?,?)'
    )->execute([
        $tenantId,
        $publicId,
        $payee,
        $body['desc'] ?? ($body['description'] ?? ''),
        $amount,
        $due,
        $body['payeeType'] ?? 'Vendor',
    ]);
    json_ok(map_obligation(require_row_for_tenant('obligations', $tenantId, $publicId)), 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $body = read_json_body();
    $id = trim((string) ($body['id'] ?? $_GET['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    $row = require_row_for_tenant('obligations', $tenantId, $id);
    db()->prepare(
        'UPDATE obligations SET payee=?, description=?, amount=?, due_date=?, payee_type=?
         WHERE tenant_id = ? AND public_id = ?'
    )->execute([
        $body['payee'] ?? $row['payee'],
        $body['desc'] ?? ($body['description'] ?? $row['description']),
        array_key_exists('amount', $body) ? (int) $body['amount'] : (int) $row['amount'],
        $body['due'] ?? ($body['dueDate'] ?? $row['due_date']),
        $body['payeeType'] ?? $row['payee_type'],
        $tenantId,
        $id,
    ]);
    json_ok(map_obligation(require_row_for_tenant('obligations', $tenantId, $id)));
}

if ($method === 'DELETE') {
    $id = trim((string) ($_GET['id'] ?? read_json_body()['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    require_row_for_tenant('obligations', $tenantId, $id);
    db()->prepare('DELETE FROM obligations WHERE tenant_id = ? AND public_id = ?')->execute([$tenantId, $id]);
    json_ok(['id' => $id, 'deleted' => true]);
}

json_error('Method not allowed', 405);
