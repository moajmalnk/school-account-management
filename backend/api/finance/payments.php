<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    $id = trim((string) ($_GET['id'] ?? ''));
    if ($id !== '') {
        json_ok(map_payment(require_row_for_tenant('payments', $tenantId, $id)));
    }
    $year = trim((string) ($_GET['academicYear'] ?? ''));
    $sql = 'SELECT * FROM payments WHERE tenant_id = ?';
    $params = [$tenantId];
    if ($year !== '') {
        $sql .= ' AND academic_year = ?';
        $params[] = $year;
    }
    $sql .= ' ORDER BY paid_at DESC';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    json_ok(array_map('map_payment', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $body = read_json_body();
    $name = trim((string) ($body['name'] ?? ''));
    $amount = (int) ($body['amount'] ?? 0);
    if ($name === '' || $amount < 1) {
        json_error('name and amount are required', 422);
    }
    $publicId = trim((string) ($body['id'] ?? '')) ?: generate_public_id('PAY');
    $paidAt = $body['time'] ?? date('Y-m-d H:i:s');

    $stmt = db()->prepare(
        'INSERT INTO payments (
            tenant_id, public_id, name, cat, mode, amount, paid_at, academic_year,
            payer_type, class_name, fee_period_kind, fee_period, fee_month, narration, attachments
         ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    $stmt->execute([
        $tenantId,
        $publicId,
        $name,
        $body['cat'] ?? '',
        $body['mode'] ?? '',
        $amount,
        $paidAt,
        $body['academicYear'] ?? null,
        $body['payerType'] ?? 'student',
        $body['className'] ?? null,
        $body['feePeriodKind'] ?? null,
        $body['feePeriod'] ?? null,
        $body['feeMonth'] ?? null,
        $body['narration'] ?? null,
        isset($body['attachments']) ? json_encode($body['attachments']) : null,
    ]);

    // Reduce student due when payer matches a student name (best-effort) or explicit studentId
    if (($body['payerType'] ?? 'student') === 'student' && !empty($body['reduceDue'])) {
        $studentId = trim((string) ($body['studentId'] ?? ''));
        if ($studentId !== '') {
            db()->prepare(
                'UPDATE students SET due = GREATEST(0, due - ?) WHERE tenant_id = ? AND public_id = ?'
            )->execute([$amount, $tenantId, $studentId]);
        }
    }

    json_ok(map_payment(require_row_for_tenant('payments', $tenantId, $publicId)), 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $body = read_json_body();
    $id = trim((string) ($body['id'] ?? $_GET['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    $row = require_row_for_tenant('payments', $tenantId, $id);
    $stmt = db()->prepare(
        'UPDATE payments SET
            name=?, cat=?, mode=?, amount=?, paid_at=?, academic_year=?, payer_type=?,
            class_name=?, fee_period_kind=?, fee_period=?, fee_month=?, narration=?, attachments=?
         WHERE tenant_id = ? AND public_id = ?'
    );
    $stmt->execute([
        $body['name'] ?? $row['name'],
        $body['cat'] ?? $row['cat'],
        $body['mode'] ?? $row['mode'],
        array_key_exists('amount', $body) ? (int) $body['amount'] : (int) $row['amount'],
        $body['time'] ?? $row['paid_at'],
        array_key_exists('academicYear', $body) ? $body['academicYear'] : $row['academic_year'],
        $body['payerType'] ?? $row['payer_type'],
        array_key_exists('className', $body) ? $body['className'] : $row['class_name'],
        array_key_exists('feePeriodKind', $body) ? $body['feePeriodKind'] : $row['fee_period_kind'],
        array_key_exists('feePeriod', $body) ? $body['feePeriod'] : $row['fee_period'],
        array_key_exists('feeMonth', $body) ? $body['feeMonth'] : $row['fee_month'],
        array_key_exists('narration', $body) ? $body['narration'] : $row['narration'],
        array_key_exists('attachments', $body) ? json_encode($body['attachments']) : $row['attachments'],
        $tenantId,
        $id,
    ]);
    json_ok(map_payment(require_row_for_tenant('payments', $tenantId, $id)));
}

if ($method === 'DELETE') {
    $id = trim((string) ($_GET['id'] ?? ''));
    if ($id === '') {
        $body = read_json_body();
        $id = trim((string) ($body['id'] ?? ''));
    }
    if ($id === '') {
        json_error('id is required', 422);
    }
    require_row_for_tenant('payments', $tenantId, $id);
    db()->prepare('DELETE FROM payments WHERE tenant_id = ? AND public_id = ?')->execute([$tenantId, $id]);
    json_ok(['id' => $id, 'deleted' => true]);
}

json_error('Method not allowed', 405);
