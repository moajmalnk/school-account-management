<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

function staff_related(int $tenantId, int $staffPk): array
{
    $att = db()->prepare(
        'SELECT month, days_present AS daysPresent, working_days AS workingDays
         FROM staff_attendance WHERE tenant_id = ? AND staff_id = ? ORDER BY month DESC'
    );
    $att->execute([$tenantId, $staffPk]);
    $attendance = $att->fetchAll();

    $sal = db()->prepare(
        'SELECT public_id AS id, amount, mode, paid_at AS paidAt, description, status
         FROM staff_salary_history WHERE tenant_id = ? AND staff_id = ? ORDER BY paid_at DESC'
    );
    $sal->execute([$tenantId, $staffPk]);
    $salary = array_map(static function ($r) {
        $r['amount'] = (int) $r['amount'];
        return $r;
    }, $sal->fetchAll());

    $st = db()->prepare(
        'SELECT public_id AS id, type, at, note
         FROM staff_status_events WHERE tenant_id = ? AND staff_id = ? ORDER BY at DESC'
    );
    $st->execute([$tenantId, $staffPk]);
    $status = $st->fetchAll();

    return [$attendance, $salary, $status];
}

function map_staff_full(array $row, int $tenantId): array
{
    [$attendance, $salary, $status] = staff_related($tenantId, (int) $row['id']);
    return map_staff($row, $attendance, $salary, $status);
}
