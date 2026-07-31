<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

require_method('GET');
$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);

$pdo = db();

$incomeStmt = $pdo->prepare('SELECT COALESCE(SUM(amount),0) FROM payments WHERE tenant_id = ?');
$incomeStmt->execute([$tenantId]);
$income = (int) $incomeStmt->fetchColumn();

$expenseStmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM disbursements WHERE tenant_id = ? AND status = 'Cleared'");
$expenseStmt->execute([$tenantId]);
$expenses = (int) $expenseStmt->fetchColumn();

$byCat = $pdo->prepare(
    'SELECT cat AS account, SUM(amount) AS amount FROM payments WHERE tenant_id = ? GROUP BY cat ORDER BY amount DESC'
);
$byCat->execute([$tenantId]);
$incomeByCategory = array_map(static function ($r) {
    return ['account' => $r['account'] ?: 'Uncategorized', 'amount' => (int) $r['amount']];
}, $byCat->fetchAll());

$byPayeeType = $pdo->prepare(
    "SELECT payee_type AS account, SUM(amount) AS amount FROM disbursements
     WHERE tenant_id = ? AND status = 'Cleared' GROUP BY payee_type"
);
$byPayeeType->execute([$tenantId]);
$expenseByType = array_map(static function ($r) {
    return ['account' => $r['account'], 'amount' => (int) $r['amount']];
}, $byPayeeType->fetchAll());

$ap = $pdo->prepare('SELECT payee, amount FROM obligations WHERE tenant_id = ? ORDER BY due_date ASC');
$ap->execute([$tenantId]);
$accountsPayable = array_map(static function ($r) {
    return ['payee' => $r['payee'], 'amount' => (int) $r['amount']];
}, $ap->fetchAll());

// Simple daybook: merge receipts + payments
$receipts = $pdo->prepare(
    'SELECT public_id, paid_at, name, cat, mode, amount, narration FROM payments WHERE tenant_id = ? ORDER BY paid_at DESC LIMIT 100'
);
$receipts->execute([$tenantId]);
$paymentsOut = $pdo->prepare(
    'SELECT public_id, paid_at, payee, description, mode, amount, payee_type FROM disbursements WHERE tenant_id = ? ORDER BY paid_at DESC LIMIT 100'
);
$paymentsOut->execute([$tenantId]);

$daybook = [];
foreach ($receipts->fetchAll() as $r) {
    $daybook[] = [
        'id' => $r['public_id'],
        'time' => $r['paid_at'],
        'particular' => $r['name'],
        'account' => $r['cat'],
        'mode' => $r['mode'],
        'type' => 'Receipt',
        'amount' => (int) $r['amount'],
        'narration' => $r['narration'],
    ];
}
foreach ($paymentsOut->fetchAll() as $r) {
    $daybook[] = [
        'id' => $r['public_id'],
        'time' => $r['paid_at'],
        'particular' => $r['payee'],
        'account' => $r['payee_type'],
        'mode' => $r['mode'],
        'type' => 'Payment',
        'amount' => (int) $r['amount'],
        'narration' => $r['description'],
    ];
}
usort($daybook, static fn($a, $b) => strcmp($b['time'], $a['time']));

// Running ledger (simplified)
$ledger = [];
$balance = 0;
$all = $daybook;
usort($all, static fn($a, $b) => strcmp($a['time'], $b['time']));
foreach ($all as $entry) {
    $debit = $entry['type'] === 'Payment' ? $entry['amount'] : 0;
    $credit = $entry['type'] === 'Receipt' ? $entry['amount'] : 0;
    $balance += $credit - $debit;
    $ledger[] = [
        'date' => substr($entry['time'], 0, 10),
        'voucher' => $entry['id'],
        'particulars' => $entry['particular'],
        'account' => $entry['account'],
        'debit' => $debit,
        'credit' => $credit,
        'balance' => $balance,
    ];
}

json_ok([
    'totalIncome' => $income,
    'totalExpenses' => $expenses,
    'netProfit' => $income - $expenses,
    'cashPosition' => $income - $expenses,
    'incomeByCategory' => $incomeByCategory,
    'expenseByType' => $expenseByType,
    'accountsPayable' => $accountsPayable,
    'daybook' => $daybook,
    'ledger' => array_reverse($ledger),
]);
