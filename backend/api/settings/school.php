<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    $stmt = db()->prepare('SELECT * FROM school_settings WHERE tenant_id = ? LIMIT 1');
    $stmt->execute([$tenantId]);
    $row = $stmt->fetch();
    if (!$row) {
        json_error('School settings not found', 404);
    }

    $years = db()->prepare('SELECT label, is_active FROM academic_years WHERE tenant_id = ? ORDER BY label');
    $years->execute([$tenantId]);
    $academicYears = array_map(static fn($r) => $r['label'], $years->fetchAll());

    json_ok([
        'schoolDetails' => map_school_details($row),
        'themeSettings' => map_theme_settings($row),
        'academicYear' => $row['academic_year'],
        'academicYears' => $academicYears,
    ]);
}

if ($method === 'PUT' || $method === 'PATCH' || $method === 'POST') {
    $body = read_json_body();
    $stmt = db()->prepare('SELECT * FROM school_settings WHERE tenant_id = ? LIMIT 1');
    $stmt->execute([$tenantId]);
    $row = $stmt->fetch();
    if (!$row) {
        json_error('School settings not found', 404);
    }

    $details = $body['schoolDetails'] ?? $body;
    $theme = $body['themeSettings'] ?? [];

    db()->prepare(
        'UPDATE school_settings SET
            name=?, logo_url=?, letterhead_url=?, tagline=?, address=?, phone=?, email=?, website=?,
            registration_no=?, affiliation_no=?, principal_name=?, established_year=?,
            theme_mode=?, theme_accent=?, theme_density=?, theme_nav=?, academic_year=?
         WHERE tenant_id = ?'
    )->execute([
        $details['name'] ?? $row['name'],
        array_key_exists('logoUrl', $details) ? $details['logoUrl'] : $row['logo_url'],
        array_key_exists('letterheadUrl', $details) ? $details['letterheadUrl'] : $row['letterhead_url'],
        $details['tagline'] ?? $row['tagline'],
        $details['address'] ?? $row['address'],
        $details['phone'] ?? $row['phone'],
        $details['email'] ?? $row['email'],
        $details['website'] ?? $row['website'],
        $details['registrationNo'] ?? $row['registration_no'],
        $details['affiliationNo'] ?? $row['affiliation_no'],
        $details['principalName'] ?? $row['principal_name'],
        $details['establishedYear'] ?? $row['established_year'],
        $theme['mode'] ?? $row['theme_mode'],
        $theme['accent'] ?? $row['theme_accent'],
        $theme['density'] ?? $row['theme_density'],
        $theme['navPlacement'] ?? $row['theme_nav'],
        $body['academicYear'] ?? $row['academic_year'],
        $tenantId,
    ]);

    if (!empty($body['academicYear'])) {
        db()->prepare('UPDATE academic_years SET is_active = 0 WHERE tenant_id = ?')->execute([$tenantId]);
        db()->prepare('UPDATE academic_years SET is_active = 1 WHERE tenant_id = ? AND label = ?')
            ->execute([$tenantId, $body['academicYear']]);
    }

    $stmt->execute([$tenantId]);
    $row = $stmt->fetch();
    $years = db()->prepare('SELECT label FROM academic_years WHERE tenant_id = ? ORDER BY label');
    $years->execute([$tenantId]);

    json_ok([
        'schoolDetails' => map_school_details($row),
        'themeSettings' => map_theme_settings($row),
        'academicYear' => $row['academic_year'],
        'academicYears' => array_map(static fn($r) => $r['label'], $years->fetchAll()),
    ]);
}

json_error('Method not allowed', 405);
