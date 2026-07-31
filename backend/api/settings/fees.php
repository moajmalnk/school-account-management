<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$resource = trim((string) ($_GET['resource'] ?? 'terms')); // terms | categories

if ($resource === 'categories') {
    if ($method === 'GET') {
        $stmt = db()->prepare('SELECT * FROM payment_categories WHERE tenant_id = ? ORDER BY label');
        $stmt->execute([$tenantId]);
        json_ok(array_map('map_payment_category', $stmt->fetchAll()));
    }
    if ($method === 'POST') {
        $body = read_json_body();
        $label = trim((string) ($body['label'] ?? ''));
        if ($label === '') {
            json_error('label is required', 422);
        }
        $publicId = trim((string) ($body['id'] ?? '')) ?: generate_public_id('CAT');
        db()->prepare('INSERT INTO payment_categories (tenant_id, public_id, label) VALUES (?,?,?)')
            ->execute([$tenantId, $publicId, $label]);
        json_ok(map_payment_category(require_row_for_tenant('payment_categories', $tenantId, $publicId)), 201);
    }
    if ($method === 'PUT' || $method === 'PATCH') {
        $body = read_json_body();
        $id = trim((string) ($body['id'] ?? ''));
        if ($id === '') {
            json_error('id is required', 422);
        }
        $row = require_row_for_tenant('payment_categories', $tenantId, $id);
        db()->prepare('UPDATE payment_categories SET label=? WHERE tenant_id = ? AND public_id = ?')
            ->execute([$body['label'] ?? $row['label'], $tenantId, $id]);
        json_ok(map_payment_category(require_row_for_tenant('payment_categories', $tenantId, $id)));
    }
    if ($method === 'DELETE') {
        $id = trim((string) ($_GET['id'] ?? read_json_body()['id'] ?? ''));
        if ($id === '') {
            json_error('id is required', 422);
        }
        require_row_for_tenant('payment_categories', $tenantId, $id);
        db()->prepare('DELETE FROM payment_categories WHERE tenant_id = ? AND public_id = ?')->execute([$tenantId, $id]);
        json_ok(['id' => $id, 'deleted' => true]);
    }
    json_error('Method not allowed', 405);
}

// fee terms (default)
if ($method === 'GET') {
    $year = trim((string) ($_GET['academicYear'] ?? ''));
    $sql = 'SELECT * FROM fee_terms WHERE tenant_id = ?';
    $params = [$tenantId];
    if ($year !== '') {
        $sql .= ' AND academic_year = ?';
        $params[] = $year;
    }
    $sql .= ' ORDER BY start_date, label';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    json_ok(array_map('map_fee_term', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $body = read_json_body();
    $label = trim((string) ($body['label'] ?? ''));
    $kind = $body['kind'] ?? 'tuition';
    $periodMode = $body['periodMode'] ?? 'term';
    if ($label === '') {
        json_error('label is required', 422);
    }
    $publicId = trim((string) ($body['id'] ?? '')) ?: generate_public_id('FT');
    db()->prepare(
        'INSERT INTO fee_terms (tenant_id, public_id, kind, period_mode, label, academic_year, start_date, end_date, fee_amount, coverage)
         VALUES (?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $tenantId, $publicId, $kind, $periodMode, $label,
        $body['academicYear'] ?? null,
        $body['startDate'] ?? null,
        $body['endDate'] ?? null,
        $body['feeAmount'] ?? null,
        $body['coverage'] ?? null,
    ]);
    json_ok(map_fee_term(require_row_for_tenant('fee_terms', $tenantId, $publicId)), 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $body = read_json_body();
    $id = trim((string) ($body['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    $row = require_row_for_tenant('fee_terms', $tenantId, $id);
    db()->prepare(
        'UPDATE fee_terms SET kind=?, period_mode=?, label=?, academic_year=?, start_date=?, end_date=?, fee_amount=?, coverage=?
         WHERE tenant_id = ? AND public_id = ?'
    )->execute([
        $body['kind'] ?? $row['kind'],
        $body['periodMode'] ?? $row['period_mode'],
        $body['label'] ?? $row['label'],
        array_key_exists('academicYear', $body) ? $body['academicYear'] : $row['academic_year'],
        array_key_exists('startDate', $body) ? $body['startDate'] : $row['start_date'],
        array_key_exists('endDate', $body) ? $body['endDate'] : $row['end_date'],
        array_key_exists('feeAmount', $body) ? $body['feeAmount'] : $row['fee_amount'],
        array_key_exists('coverage', $body) ? $body['coverage'] : $row['coverage'],
        $tenantId, $id,
    ]);
    json_ok(map_fee_term(require_row_for_tenant('fee_terms', $tenantId, $id)));
}

if ($method === 'DELETE') {
    $id = trim((string) ($_GET['id'] ?? read_json_body()['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    require_row_for_tenant('fee_terms', $tenantId, $id);
    db()->prepare('DELETE FROM fee_terms WHERE tenant_id = ? AND public_id = ?')->execute([$tenantId, $id]);
    json_ok(['id' => $id, 'deleted' => true]);
}

json_error('Method not allowed', 405);
