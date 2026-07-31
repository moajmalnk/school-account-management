<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

require_method('GET');
$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);

$pdo = db();

$studentsStmt = $pdo->prepare(
    'SELECT COUNT(*) FROM students WHERE tenant_id = ? AND deleted_at IS NULL AND active = 1'
);
$studentsStmt->execute([$tenantId]);
$totalStudents = (int) $studentsStmt->fetchColumn();

$staffStmt = $pdo->prepare(
    'SELECT COUNT(*) FROM staff WHERE tenant_id = ? AND deleted_at IS NULL AND active = 1'
);
$staffStmt->execute([$tenantId]);
$totalStaff = (int) $staffStmt->fetchColumn();

$incomeStmt = $pdo->prepare(
    'SELECT COALESCE(SUM(amount), 0) FROM payments WHERE tenant_id = ?'
);
$incomeStmt->execute([$tenantId]);
$totalIncome = (int) $incomeStmt->fetchColumn();

$expenseStmt = $pdo->prepare(
    "SELECT COALESCE(SUM(amount), 0) FROM disbursements WHERE tenant_id = ? AND status = 'Cleared'"
);
$expenseStmt->execute([$tenantId]);
$totalExpenses = (int) $expenseStmt->fetchColumn();

$outstandingStmt = $pdo->prepare(
    'SELECT COALESCE(SUM(due), 0) FROM students WHERE tenant_id = ? AND deleted_at IS NULL AND due > 0'
);
$outstandingStmt->execute([$tenantId]);
$outstanding = (int) $outstandingStmt->fetchColumn();

$apStmt = $pdo->prepare(
    'SELECT COALESCE(SUM(amount), 0) FROM obligations WHERE tenant_id = ?'
);
$apStmt->execute([$tenantId]);
$accountsPayable = (int) $apStmt->fetchColumn();

$cashPosition = $totalIncome - $totalExpenses;

$dashStmt = $pdo->prepare('SELECT todos, note FROM dashboard_state WHERE tenant_id = ? LIMIT 1');
$dashStmt->execute([$tenantId]);
$dash = $dashStmt->fetch() ?: ['todos' => '["","","","",""]', 'note' => ''];

$settingsStmt = $pdo->prepare('SELECT academic_year, name FROM school_settings WHERE tenant_id = ? LIMIT 1');
$settingsStmt->execute([$tenantId]);
$settings = $settingsStmt->fetch() ?: ['academic_year' => 'AY 2025-26', 'name' => ''];

json_ok([
    'totalStudents' => $totalStudents,
    'totalStaff' => $totalStaff,
    'totalIncome' => $totalIncome,
    'totalExpenses' => $totalExpenses,
    'cashPosition' => $cashPosition,
    'outstandingPayments' => $outstanding,
    'accountsPayable' => $accountsPayable,
    'dashboardTodos' => json_col($dash['todos'], ['', '', '', '', '']),
    'dashboardNote' => $dash['note'] ?? '',
    'academicYear' => $settings['academic_year'],
    'schoolName' => $settings['name'] ?? '',
]);
