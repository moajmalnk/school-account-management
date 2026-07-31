<?php
/**
 * Map DB rows (snake_case) → frontend JSON (camelCase).
 */
require_once __DIR__ . '/tenant.php';

function map_school_details(array $row): array
{
    return [
        'name' => $row['name'],
        'logoUrl' => $row['logo_url'] ?: null,
        'letterheadUrl' => $row['letterhead_url'] ?: null,
        'tagline' => $row['tagline'] ?? '',
        'address' => $row['address'] ?? '',
        'phone' => $row['phone'] ?? '',
        'email' => $row['email'] ?? '',
        'website' => $row['website'] ?? '',
        'registrationNo' => $row['registration_no'] ?? '',
        'affiliationNo' => $row['affiliation_no'] ?? '',
        'principalName' => $row['principal_name'] ?? '',
        'establishedYear' => $row['established_year'] ?? '',
    ];
}

function map_theme_settings(array $row): array
{
    return [
        'mode' => $row['theme_mode'] ?? 'Light',
        'accent' => $row['theme_accent'] ?? 'Neon Lime',
        'density' => $row['theme_density'] ?? 'Comfortable',
        'navPlacement' => $row['theme_nav'] ?? 'Left',
    ];
}

function map_student(array $row): array
{
    return [
        'id' => $row['public_id'],
        'name' => $row['name'],
        'cls' => $row['cls'] ?? '',
        'guardian' => $row['guardian'] ?? '',
        'due' => (int) ($row['due'] ?? 0),
        'gender' => $row['gender'] ?: null,
        'phone' => $row['phone'] ?: null,
        'dob' => $row['dob'] ?: null,
        'email' => $row['email'] ?: null,
        'address' => $row['address'] ?: null,
        'photoUrl' => $row['photo_url'] ?: null,
        'aadhaar' => $row['aadhaar'] ?: null,
        'admissionNumber' => $row['admission_number'] ?: null,
        'placeOfBirth' => $row['place_of_birth'] ?: null,
        'nationality' => $row['nationality'] ?: null,
        'religion' => $row['religion'] ?: null,
        'studentCategory' => $row['student_category'] ?: null,
        'bloodGroup' => $row['blood_group'] ?: null,
        'fatherOccupation' => $row['father_occupation'] ?: null,
        'motherName' => $row['mother_name'] ?: null,
        'guardianRelation' => $row['guardian_relation'] ?: null,
        'guardianOccupation' => $row['guardian_occupation'] ?: null,
        'needsBus' => (bool) (int) ($row['needs_bus'] ?? 0),
        'busPoint1' => $row['bus_point1'] ?: null,
        'busPoint2' => $row['bus_point2'] ?: null,
        'active' => (bool) (int) ($row['active'] ?? 1),
        'shareToken' => $row['share_token'] ?: null,
        'documents' => json_col($row['documents'] ?? null, []),
        'deletedAt' => $row['deleted_at'] ?: null,
    ];
}

function map_staff(array $row, array $attendance = [], array $salaryHistory = [], array $statusHistory = []): array
{
    return [
        'id' => $row['public_id'],
        'name' => $row['name'],
        'role' => $row['role'] ?? '',
        'dept' => $row['dept'] ?? '',
        'active' => (bool) (int) ($row['active'] ?? 1),
        'joinedAt' => $row['joined_at'],
        'phone' => $row['phone'] ?: null,
        'altPhone' => $row['alt_phone'] ?: null,
        'guardianPhone' => $row['guardian_phone'] ?: null,
        'photoUrl' => $row['photo_url'] ?: null,
        'basicSalary' => (int) ($row['basic_salary'] ?? 0),
        'additionalAllowances' => (int) ($row['additional_allowances'] ?? 0),
        'attendanceByMonth' => $attendance,
        'documents' => json_col($row['documents'] ?? null, []),
        'salaryHistory' => $salaryHistory,
        'statusHistory' => $statusHistory,
        'deletedAt' => $row['deleted_at'] ?: null,
    ];
}

function map_payment(array $row): array
{
    return [
        'id' => $row['public_id'],
        'name' => $row['name'],
        'cat' => $row['cat'] ?? '',
        'mode' => $row['mode'] ?? '',
        'amount' => (int) ($row['amount'] ?? 0),
        'time' => $row['paid_at'],
        'academicYear' => $row['academic_year'] ?: null,
        'payerType' => $row['payer_type'] ?? 'student',
        'className' => $row['class_name'] ?: null,
        'feePeriodKind' => $row['fee_period_kind'] ?: null,
        'feePeriod' => $row['fee_period'] ?: null,
        'feeMonth' => $row['fee_month'] ?: null,
        'narration' => $row['narration'] ?: null,
        'attachments' => json_col($row['attachments'] ?? null, []),
    ];
}

function map_disbursement(array $row): array
{
    return [
        'id' => $row['public_id'],
        'payee' => $row['payee'],
        'desc' => $row['description'] ?? '',
        'amount' => (int) ($row['amount'] ?? 0),
        'mode' => $row['mode'] ?? '',
        'payeeType' => $row['payee_type'] ?? 'Vendor',
        'time' => $row['paid_at'],
        'status' => $row['status'] ?? 'Cleared',
        'attachments' => json_col($row['attachments'] ?? null, []),
    ];
}

function map_obligation(array $row): array
{
    return [
        'id' => $row['public_id'],
        'payee' => $row['payee'],
        'desc' => $row['description'] ?? '',
        'amount' => (int) ($row['amount'] ?? 0),
        'due' => $row['due_date'],
        'payeeType' => $row['payee_type'] ?? 'Vendor',
    ];
}

function map_department(array $row): array
{
    return [
        'id' => $row['public_id'],
        'name' => $row['name'],
        'code' => $row['code'],
    ];
}

function map_org_role(array $row): array
{
    return [
        'id' => $row['public_id'],
        'title' => $row['title'],
        'departmentId' => $row['department_public_id'] ?? $row['department_id'],
    ];
}

function map_class(array $row): array
{
    return [
        'id' => $row['public_id'],
        'className' => $row['class_name'],
        'grade' => $row['grade'],
        'section' => $row['section'] ?? '',
        'tuitionFeeAmount' => (int) ($row['tuition_fee_amount'] ?? 0),
        'vehicleFeeAmount' => (int) ($row['vehicle_fee_amount'] ?? 0),
        'billingCycle' => $row['billing_cycle'] ?? 'Monthly',
        'classTeacherId' => $row['class_teacher_id'] ?: null,
    ];
}

function map_fee_term(array $row): array
{
    return [
        'id' => $row['public_id'],
        'kind' => $row['kind'],
        'periodMode' => $row['period_mode'],
        'label' => $row['label'],
        'academicYear' => $row['academic_year'] ?: null,
        'startDate' => $row['start_date'] ?: null,
        'endDate' => $row['end_date'] ?: null,
        'feeAmount' => isset($row['fee_amount']) && $row['fee_amount'] !== null ? (int) $row['fee_amount'] : null,
        'coverage' => $row['coverage'] ?: null,
    ];
}

function map_payment_category(array $row): array
{
    return [
        'id' => $row['public_id'],
        'label' => $row['label'],
    ];
}

function map_transport_route(array $row): array
{
    return [
        'id' => $row['public_id'],
        'mapFrom' => $row['map_from'],
        'mapTo' => $row['map_to'],
        'fromLat' => $row['from_lat'] !== null ? (float) $row['from_lat'] : null,
        'fromLng' => $row['from_lng'] !== null ? (float) $row['from_lng'] : null,
        'toLat' => $row['to_lat'] !== null ? (float) $row['to_lat'] : null,
        'toLng' => $row['to_lng'] !== null ? (float) $row['to_lng'] : null,
        'morningFee' => (int) ($row['morning_fee'] ?? 0),
        'eveningFee' => (int) ($row['evening_fee'] ?? 0),
        'bothFee' => (int) ($row['both_fee'] ?? 0),
    ];
}

function map_transport_vehicle(array $row): array
{
    return [
        'id' => $row['public_id'],
        'name' => $row['name'],
        'registrationNo' => $row['registration_no'],
        'capacity' => (int) ($row['capacity'] ?? 0),
        'ownership' => $row['ownership'] ?? 'owned',
        'driverName' => $row['driver_name'] ?: null,
        'driverPhone' => $row['driver_phone'] ?: null,
        'routeIds' => json_col($row['route_ids'] ?? null, []),
        'active' => (bool) (int) ($row['active'] ?? 1),
        'documents' => json_col($row['documents'] ?? null, []),
    ];
}

function map_notification(array $row): array
{
    return [
        'id' => $row['public_id'],
        'title' => $row['title'],
        'body' => $row['body'],
        'category' => $row['category'],
        'read' => (bool) (int) ($row['is_read'] ?? 0),
        'createdAt' => $row['created_at'],
        'timeLabel' => $row['time_label'] ?? '',
        'href' => $row['href'] ?: null,
    ];
}

function map_tenant_user(array $row): array
{
    $permissions = json_col($row['permissions'] ?? null, []);
    return [
        'id' => $row['public_id'],
        'email' => $row['email'],
        'password' => '', // never expose hash
        'displayName' => $row['display_name'],
        'roleId' => $row['org_role_public_id'] ?? null,
        'staffId' => $row['staff_public_id'] ?: null,
        'permissions' => $permissions,
        'active' => (bool) (int) ($row['active'] ?? 1),
        'createdAt' => $row['created_at'],
        'role' => $row['role'] ?? 'tenant_user',
    ];
}
