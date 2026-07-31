<?php
/**
 * Public parent profile by shareToken — no JWT.
 * Always scopes lookup by share_token uniqueness (global unique).
 */
require_once dirname(__DIR__, 2) . '/cors.php';
require_once dirname(__DIR__, 2) . '/lib/db.php';
require_once dirname(__DIR__, 2) . '/lib/response.php';
require_once dirname(__DIR__, 2) . '/lib/mappers.php';

require_method('GET');

$token = trim((string) ($_GET['token'] ?? ''));
if ($token === '') {
    json_error('token is required', 422);
}

$stmt = db()->prepare(
    'SELECT s.*, ss.name AS school_name, ss.logo_url, ss.phone AS school_phone, ss.email AS school_email
     FROM students s
     INNER JOIN school_settings ss ON ss.tenant_id = s.tenant_id
     WHERE s.share_token = ? AND s.deleted_at IS NULL AND s.active = 1
     LIMIT 1'
);
$stmt->execute([$token]);
$row = $stmt->fetch();
if (!$row) {
    json_error('Student not found', 404);
}

$student = map_student($row);
// Parent-safe subset
json_ok([
    'student' => [
        'id' => $student['id'],
        'name' => $student['name'],
        'cls' => $student['cls'],
        'guardian' => $student['guardian'],
        'due' => $student['due'],
        'photoUrl' => $student['photoUrl'],
        'gender' => $student['gender'],
        'needsBus' => $student['needsBus'],
    ],
    'school' => [
        'name' => $row['school_name'],
        'logoUrl' => $row['logo_url'],
        'phone' => $row['school_phone'],
        'email' => $row['school_email'],
    ],
]);
