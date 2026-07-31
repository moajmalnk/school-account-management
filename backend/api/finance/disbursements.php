<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    $id = trim((string) ($_GET['id'] ?? ''));
    if ($id !== '') {
        json_ok(map_disbursement(require_row_for_tenant('disbursements', $tenantId, $id)));
    }
    $stmt = db()->prepare('SELECT * FROM disbursements WHERE tenant_id = ? ORDER BY paid_at DESC');
    $stmt->execute([$tenantId]);
    json_ok(array_map('map_disbursement', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $body = read_json_body();
    $payee = trim((string) ($body['payee'] ?? ''));
    $amount = (int) ($body['amount'] ?? 0);
    if ($payee === '' || $amount < 1) {
        json_error('payee and amount are required', 422);
    }
    $publicId = trim((string) ($body['id'] ?? '')) ?: generate_public_id('DISB');
    $stmt = db()->prepare(
        'INSERT INTO disbursements (
            tenant_id, public_id, payee, description, amount, mode, payee_type, paid_at, status, attachments
         ) VALUES (?,?,?,?,?,?,?,?,?,?)'
    );
    $stmt->execute([
        $tenantId,
        $publicId,
        $payee,
        $body['desc'] ?? ($body['description'] ?? ''),
        $amount,
        $body['mode'] ?? '',
        $body['payeeType'] ?? 'Vendor',
        $body['time'] ?? date('Y-m-d H:i:s'),
        $body['status'] ?? 'Cleared',
        isset($body['attachments']) ? json_encode($body['attachments']) : null,
    ]);

    // Optional: append salary history when staffId provided
    if (($body['payeeType'] ?? '') === 'Salary' && !empty($body['staffId'])) {
        $staff = fetch_one_for_tenant('staff', $tenantId, (string) $body['staffId']);
        if ($staff) {
            db()->prepare(
                'INSERT INTO staff_salary_history (tenant_id, staff_id, public_id, amount, mode, paid_at, description, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            )->execute([
                $tenantId,
                (int) $staff['id'],
                generate_public_id('SAL'),
                $amount,
                $body['mode'] ?? '',
                $body['time'] ?? date('Y-m-d H:i:s'),
                $body['desc'] ?? '',
                $body['status'] === 'Queued' ? 'Queued' : 'Cleared',
            ]);
        }
    }

    json_ok(map_disbursement(require_row_for_tenant('disbursements', $tenantId, $publicId)), 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $body = read_json_body();
    $id = trim((string) ($body['id'] ?? $_GET['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    $row = require_row_for_tenant('disbursements', $tenantId, $id);
    db()->prepare(
        'UPDATE disbursements SET
            payee=?, description=?, amount=?, mode=?, payee_type=?, paid_at=?, status=?, attachments=?
         WHERE tenant_id = ? AND public_id = ?'
    )->execute([
        $body['payee'] ?? $row['payee'],
        $body['desc'] ?? ($body['description'] ?? $row['description']),
        array_key_exists('amount', $body) ? (int) $body['amount'] : (int) $row['amount'],
        $body['mode'] ?? $row['mode'],
        $body['payeeType'] ?? $row['payee_type'],
        $body['time'] ?? $row['paid_at'],
        $body['status'] ?? $row['status'],
        array_key_exists('attachments', $body) ? json_encode($body['attachments']) : $row['attachments'],
        $tenantId,
        $id,
    ]);
    json_ok(map_disbursement(require_row_for_tenant('disbursements', $tenantId, $id)));
}

if ($method === 'DELETE') {
    $id = trim((string) ($_GET['id'] ?? read_json_body()['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    require_row_for_tenant('disbursements', $tenantId, $id);
    db()->prepare('DELETE FROM disbursements WHERE tenant_id = ? AND public_id = ?')->execute([$tenantId, $id]);
    json_ok(['id' => $id, 'deleted' => true]);
}

json_error('Method not allowed', 405);
