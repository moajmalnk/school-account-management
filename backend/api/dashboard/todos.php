<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    $stmt = db()->prepare('SELECT todos, note FROM dashboard_state WHERE tenant_id = ? LIMIT 1');
    $stmt->execute([$tenantId]);
    $row = $stmt->fetch();
    json_ok([
        'dashboardTodos' => json_col($row['todos'] ?? null, ['', '', '', '', '']),
        'dashboardNote' => $row['note'] ?? '',
    ]);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $body = read_json_body();
    $todos = $body['dashboardTodos'] ?? $body['todos'] ?? null;
    $note = $body['dashboardNote'] ?? $body['note'] ?? null;

    $existing = db()->prepare('SELECT id, todos, note FROM dashboard_state WHERE tenant_id = ? LIMIT 1');
    $existing->execute([$tenantId]);
    $row = $existing->fetch();

    $nextTodos = $todos !== null ? json_encode(array_values((array) $todos)) : ($row['todos'] ?? '[]');
    $nextNote = $note !== null ? (string) $note : ($row['note'] ?? '');

    if ($row) {
        $upd = db()->prepare('UPDATE dashboard_state SET todos = ?, note = ? WHERE tenant_id = ?');
        $upd->execute([$nextTodos, $nextNote, $tenantId]);
    } else {
        $ins = db()->prepare('INSERT INTO dashboard_state (tenant_id, todos, note) VALUES (?, ?, ?)');
        $ins->execute([$tenantId, $nextTodos, $nextNote]);
    }

    json_ok([
        'dashboardTodos' => json_decode($nextTodos, true),
        'dashboardNote' => $nextNote,
    ]);
}

json_error('Method not allowed', 405);
