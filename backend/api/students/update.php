<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

require_method('PUT', 'PATCH', 'POST');
$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$body = read_json_body();

$id = trim((string) ($body['id'] ?? $_GET['id'] ?? ''));
if ($id === '') {
    json_error('id is required', 422);
}

$row = require_row_for_tenant('students', $tenantId, $id);

$fields = [
    'name' => $body['name'] ?? $row['name'],
    'cls' => $body['cls'] ?? $row['cls'],
    'guardian' => $body['guardian'] ?? $row['guardian'],
    'due' => array_key_exists('due', $body) ? (int) $body['due'] : (int) $row['due'],
    'gender' => array_key_exists('gender', $body) ? $body['gender'] : $row['gender'],
    'phone' => array_key_exists('phone', $body) ? $body['phone'] : $row['phone'],
    'dob' => array_key_exists('dob', $body) ? $body['dob'] : $row['dob'],
    'email' => array_key_exists('email', $body) ? $body['email'] : $row['email'],
    'address' => array_key_exists('address', $body) ? $body['address'] : $row['address'],
    'photo_url' => array_key_exists('photoUrl', $body) ? $body['photoUrl'] : $row['photo_url'],
    'aadhaar' => array_key_exists('aadhaar', $body) ? $body['aadhaar'] : $row['aadhaar'],
    'admission_number' => array_key_exists('admissionNumber', $body) ? $body['admissionNumber'] : $row['admission_number'],
    'place_of_birth' => array_key_exists('placeOfBirth', $body) ? $body['placeOfBirth'] : $row['place_of_birth'],
    'nationality' => array_key_exists('nationality', $body) ? $body['nationality'] : $row['nationality'],
    'religion' => array_key_exists('religion', $body) ? $body['religion'] : $row['religion'],
    'student_category' => array_key_exists('studentCategory', $body) ? $body['studentCategory'] : $row['student_category'],
    'blood_group' => array_key_exists('bloodGroup', $body) ? $body['bloodGroup'] : $row['blood_group'],
    'father_occupation' => array_key_exists('fatherOccupation', $body) ? $body['fatherOccupation'] : $row['father_occupation'],
    'mother_name' => array_key_exists('motherName', $body) ? $body['motherName'] : $row['mother_name'],
    'guardian_relation' => array_key_exists('guardianRelation', $body) ? $body['guardianRelation'] : $row['guardian_relation'],
    'guardian_occupation' => array_key_exists('guardianOccupation', $body) ? $body['guardianOccupation'] : $row['guardian_occupation'],
    'needs_bus' => array_key_exists('needsBus', $body) ? bool_int($body['needsBus']) : (int) $row['needs_bus'],
    'bus_point1' => array_key_exists('busPoint1', $body) ? $body['busPoint1'] : $row['bus_point1'],
    'bus_point2' => array_key_exists('busPoint2', $body) ? $body['busPoint2'] : $row['bus_point2'],
    'active' => array_key_exists('active', $body) ? bool_int($body['active'], 1) : (int) $row['active'],
    'share_token' => array_key_exists('shareToken', $body) ? $body['shareToken'] : $row['share_token'],
    'documents' => array_key_exists('documents', $body) ? json_encode($body['documents']) : $row['documents'],
];

$stmt = db()->prepare(
    'UPDATE students SET
        name=?, cls=?, guardian=?, due=?, gender=?, phone=?, dob=?, email=?, address=?,
        photo_url=?, aadhaar=?, admission_number=?, place_of_birth=?, nationality=?, religion=?,
        student_category=?, blood_group=?, father_occupation=?, mother_name=?, guardian_relation=?,
        guardian_occupation=?, needs_bus=?, bus_point1=?, bus_point2=?, active=?, share_token=?, documents=?
     WHERE tenant_id = ? AND public_id = ?'
);
$stmt->execute([
    $fields['name'], $fields['cls'], $fields['guardian'], $fields['due'], $fields['gender'],
    $fields['phone'], $fields['dob'], $fields['email'], $fields['address'], $fields['photo_url'],
    $fields['aadhaar'], $fields['admission_number'], $fields['place_of_birth'], $fields['nationality'],
    $fields['religion'], $fields['student_category'], $fields['blood_group'], $fields['father_occupation'],
    $fields['mother_name'], $fields['guardian_relation'], $fields['guardian_occupation'],
    $fields['needs_bus'], $fields['bus_point1'], $fields['bus_point2'], $fields['active'],
    $fields['share_token'], $fields['documents'],
    $tenantId, $id,
]);

json_ok(map_student(require_row_for_tenant('students', $tenantId, $id)));
