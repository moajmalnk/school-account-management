<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';
require_once __DIR__ . '/_helpers.php';

require_method('POST');
$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$body = read_json_body();

$name = trim((string) ($body['name'] ?? ''));
if ($name === '') {
    json_error('name is required', 422);
}

$publicId = trim((string) ($body['id'] ?? '')) ?: generate_public_id('STF');
$joinedAt = $body['joinedAt'] ?? date('Y-m-d');

$stmt = db()->prepare(
    'INSERT INTO staff (
        tenant_id, public_id, name, role, dept, active, joined_at, phone, alt_phone,
        guardian_phone, photo_url, basic_salary, additional_allowances, documents
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
);
$stmt->execute([
    $tenantId,
    $publicId,
    $name,
    trim((string) ($body['role'] ?? '')),
    trim((string) ($body['dept'] ?? '')),
    bool_int($body['active'] ?? true, 1),
    $joinedAt,
    $body['phone'] ?? null,
    $body['altPhone'] ?? null,
    $body['guardianPhone'] ?? null,
    $body['photoUrl'] ?? null,
    (int) ($body['basicSalary'] ?? 0),
    (int) ($body['additionalAllowances'] ?? 0),
    isset($body['documents']) ? json_encode($body['documents']) : json_encode([]),
]);

$row = require_row_for_tenant('staff', $tenantId, $publicId);

$ev = db()->prepare(
    'INSERT INTO staff_status_events (tenant_id, staff_id, public_id, type, at, note)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$ev->execute([
    $tenantId,
    (int) $row['id'],
    generate_public_id('SSE'),
    'joined',
    $joinedAt . ' 09:00:00',
    null,
]);

json_ok(map_staff_full($row, $tenantId), 201);
