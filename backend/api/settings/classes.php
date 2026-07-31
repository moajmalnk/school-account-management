<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    $stmt = db()->prepare('SELECT * FROM classes WHERE tenant_id = ? ORDER BY grade, section');
    $stmt->execute([$tenantId]);
    json_ok(array_map('map_class', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $body = read_json_body();
    $publicId = trim((string) ($body['id'] ?? '')) ?: generate_public_id('CLS');
    $grade = trim((string) ($body['grade'] ?? ''));
    $section = trim((string) ($body['section'] ?? ''));
    $className = trim((string) ($body['className'] ?? ''));
    if ($className === '') {
        $className = trim($grade . ($section !== '' ? ' - ' . $section : ''));
    }
    if ($className === '') {
        json_error('className or grade is required', 422);
    }
    db()->prepare(
        'INSERT INTO classes (tenant_id, public_id, class_name, grade, section, tuition_fee_amount, vehicle_fee_amount, billing_cycle, class_teacher_id)
         VALUES (?,?,?,?,?,?,?,?,?)'
    )->execute([
        $tenantId, $publicId, $className, $grade ?: $className, $section,
        (int) ($body['tuitionFeeAmount'] ?? 0),
        (int) ($body['vehicleFeeAmount'] ?? 0),
        $body['billingCycle'] ?? 'Monthly',
        $body['classTeacherId'] ?? null,
    ]);
    json_ok(map_class(require_row_for_tenant('classes', $tenantId, $publicId)), 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $body = read_json_body();
    $id = trim((string) ($body['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    $row = require_row_for_tenant('classes', $tenantId, $id);
    db()->prepare(
        'UPDATE classes SET class_name=?, grade=?, section=?, tuition_fee_amount=?, vehicle_fee_amount=?, billing_cycle=?, class_teacher_id=?
         WHERE tenant_id = ? AND public_id = ?'
    )->execute([
        $body['className'] ?? $row['class_name'],
        $body['grade'] ?? $row['grade'],
        $body['section'] ?? $row['section'],
        array_key_exists('tuitionFeeAmount', $body) ? (int) $body['tuitionFeeAmount'] : (int) $row['tuition_fee_amount'],
        array_key_exists('vehicleFeeAmount', $body) ? (int) $body['vehicleFeeAmount'] : (int) $row['vehicle_fee_amount'],
        $body['billingCycle'] ?? $row['billing_cycle'],
        array_key_exists('classTeacherId', $body) ? $body['classTeacherId'] : $row['class_teacher_id'],
        $tenantId, $id,
    ]);
    json_ok(map_class(require_row_for_tenant('classes', $tenantId, $id)));
}

if ($method === 'DELETE') {
    $id = trim((string) ($_GET['id'] ?? read_json_body()['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    require_row_for_tenant('classes', $tenantId, $id);
    db()->prepare('DELETE FROM classes WHERE tenant_id = ? AND public_id = ?')->execute([$tenantId, $id]);
    json_ok(['id' => $id, 'deleted' => true]);
}

json_error('Method not allowed', 405);
