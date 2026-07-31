<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

require_method('POST');
$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$body = read_json_body();

$name = trim((string) ($body['name'] ?? ''));
if ($name === '') {
    json_error('name is required', 422);
}

$publicId = trim((string) ($body['id'] ?? '')) ?: generate_public_id('STU');
$shareToken = trim((string) ($body['shareToken'] ?? '')) ?: null;

$stmt = db()->prepare(
    'INSERT INTO students (
        tenant_id, public_id, name, cls, guardian, due, gender, phone, dob, email, address,
        photo_url, aadhaar, admission_number, place_of_birth, nationality, religion,
        student_category, blood_group, father_occupation, mother_name, guardian_relation,
        guardian_occupation, needs_bus, bus_point1, bus_point2, active, share_token, documents
     ) VALUES (
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
     )'
);

$stmt->execute([
    $tenantId,
    $publicId,
    $name,
    trim((string) ($body['cls'] ?? '')),
    trim((string) ($body['guardian'] ?? '')),
    (int) ($body['due'] ?? 0),
    $body['gender'] ?? null,
    $body['phone'] ?? null,
    $body['dob'] ?? null,
    $body['email'] ?? null,
    $body['address'] ?? null,
    $body['photoUrl'] ?? null,
    $body['aadhaar'] ?? null,
    $body['admissionNumber'] ?? null,
    $body['placeOfBirth'] ?? null,
    $body['nationality'] ?? null,
    $body['religion'] ?? null,
    $body['studentCategory'] ?? null,
    $body['bloodGroup'] ?? null,
    $body['fatherOccupation'] ?? null,
    $body['motherName'] ?? null,
    $body['guardianRelation'] ?? null,
    $body['guardianOccupation'] ?? null,
    bool_int($body['needsBus'] ?? false),
    $body['busPoint1'] ?? null,
    $body['busPoint2'] ?? null,
    bool_int($body['active'] ?? true, 1),
    $shareToken,
    isset($body['documents']) ? json_encode($body['documents']) : json_encode([]),
]);

$row = require_row_for_tenant('students', $tenantId, $publicId);

// Sync year ledger for active academic year
$ayStmt = db()->prepare('SELECT academic_year FROM school_settings WHERE tenant_id = ? LIMIT 1');
$ayStmt->execute([$tenantId]);
$ay = $ayStmt->fetchColumn() ?: 'AY 2025-26';
$ledger = db()->prepare(
    'INSERT INTO student_year_fields (tenant_id, student_id, academic_year, cls, due, active)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE cls = VALUES(cls), due = VALUES(due), active = VALUES(active)'
);
$ledger->execute([
    $tenantId,
    (int) $row['id'],
    $ay,
    $row['cls'],
    (int) $row['due'],
    (int) $row['active'],
]);

// Optional admission notification
$ntf = db()->prepare(
    'INSERT INTO notifications (tenant_id, public_id, title, body, category, is_read, time_label, href)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)'
);
$ntf->execute([
    $tenantId,
    generate_public_id('NTF'),
    'New admission',
    $name . ' enrolled in ' . ($row['cls'] ?: 'class') . '.',
    'admissions',
    'Just now',
    '/tenant/students?id=' . $publicId,
]);

json_ok(map_student($row), 201);
