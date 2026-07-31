<?php
/**
 * Health check — verifies PHP + optional DB connectivity.
 */
require_once dirname(__DIR__) . '/cors.php';
require_once dirname(__DIR__) . '/lib/db.php';
require_once dirname(__DIR__) . '/lib/response.php';

$dbOk = false;
$dbError = null;
try {
    db()->query('SELECT 1');
    $dbOk = true;
} catch (Throwable $e) {
    $dbError = $e->getMessage();
}

json_ok([
    'service' => 'School Admin Console API',
    'version' => '1.0.0',
    'php' => PHP_VERSION,
    'database' => $dbOk ? 'ok' : 'error',
    'databaseError' => $dbError,
    'time' => date('c'),
]);
