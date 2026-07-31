<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';
require_once __DIR__ . '/_helpers.php';

require_method('PUT', 'PATCH', 'POST');
$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$body = read_json_body();

$id = trim((string) ($body['id'] ?? $_GET['id'] ?? ''));
if ($id === '') {
    json_error('id is required', 422);
}

$row = require_row_for_tenant('staff', $tenantId, $id);
$wasActive = (int) $row['active'];

$active = array_key_exists('active', $body) ? bool_int($body['active'], 1) : $wasActive;

$stmt = db()->prepare(
    'UPDATE staff SET
        name=?, role=?, dept=?, active=?, joined_at=?, phone=?, alt_phone=?, guardian_phone=?,
        photo_url=?, basic_salary=?, additional_allowances=?, documents=?
     WHERE tenant_id = ? AND public_id = ?'
);
$stmt->execute([
    $body['name'] ?? $row['name'],
    $body['role'] ?? $row['role'],
    $body['dept'] ?? $row['dept'],
    $active,
    $body['joinedAt'] ?? $row['joined_at'],
    array_key_exists('phone', $body) ? $body['phone'] : $row['phone'],
    array_key_exists('altPhone', $body) ? $body['altPhone'] : $row['alt_phone'],
    array_key_exists('guardianPhone', $body) ? $body['guardianPhone'] : $row['guardian_phone'],
    array_key_exists('photoUrl', $body) ? $body['photoUrl'] : $row['photo_url'],
    array_key_exists('basicSalary', $body) ? (int) $body['basicSalary'] : (int) $row['basic_salary'],
    array_key_exists('additionalAllowances', $body) ? (int) $body['additionalAllowances'] : (int) $row['additional_allowances'],
    array_key_exists('documents', $body) ? json_encode($body['documents']) : $row['documents'],
    $tenantId,
    $id,
]);

if ($active !== $wasActive) {
    $type = $active ? 'reactivated' : 'deactivated';
    $ev = db()->prepare(
        'INSERT INTO staff_status_events (tenant_id, staff_id, public_id, type, at, note)
         VALUES (?, ?, ?, ?, NOW(), ?)'
    );
    $ev->execute([$tenantId, (int) $row['id'], generate_public_id('SSE'), $type, $body['statusNote'] ?? null]);
}

// Upsert attendance rows if provided
if (!empty($body['attendanceByMonth']) && is_array($body['attendanceByMonth'])) {
    $upsert = db()->prepare(
        'INSERT INTO staff_attendance (tenant_id, staff_id, month, days_present, working_days)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE days_present = VALUES(days_present), working_days = VALUES(working_days)'
    );
    foreach ($body['attendanceByMonth'] as $a) {
        $upsert->execute([
            $tenantId,
            (int) $row['id'],
            $a['month'],
            (int) ($a['daysPresent'] ?? 0),
            (int) ($a['workingDays'] ?? 0),
        ]);
    }
}

json_ok(map_staff_full(require_row_for_tenant('staff', $tenantId, $id), $tenantId));
