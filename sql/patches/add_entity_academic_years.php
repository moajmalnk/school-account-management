<?php
/**
 * One-shot: add academic_year on year-scoped catalogs + staff.
 * Place next to other API routes (same bootstrap depth as super-admin tenant update)
 * and POST as a super-admin, or run the companion SQL in phpMyAdmin instead.
 */
require_once dirname(__DIR__, 3) . '/lib/bootstrap.php';

require_method('POST', 'PUT', 'PATCH');
require_super_admin();

$pdo = db();

function column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS c
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?',
    );
    $stmt->execute([$table, $column]);
    return (int) ($stmt->fetch()['c'] ?? 0) > 0;
}

function index_exists(PDO $pdo, string $table, string $index): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS c
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND INDEX_NAME = ?',
    );
    $stmt->execute([$table, $index]);
    return (int) ($stmt->fetch()['c'] ?? 0) > 0;
}

function table_exists(PDO $pdo, string $table): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS c
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?',
    );
    $stmt->execute([$table]);
    return (int) ($stmt->fetch()['c'] ?? 0) > 0;
}

function read_academic_year(array $body): ?string
{
    $raw = $body['academicYear'] ?? $body['academic_year'] ?? null;
    if (!is_string($raw)) {
        return null;
    }
    $label = trim($raw);
    return $label === '' ? null : $label;
}

function ensure_year_column(PDO $pdo, string $table, array &$added): void
{
    if (!table_exists($pdo, $table)) {
        return;
    }
    if (!column_exists($pdo, $table, 'academic_year')) {
        $pdo->exec("ALTER TABLE `{$table}` ADD COLUMN academic_year VARCHAR(64) NULL");
        $added[] = "{$table}.academic_year";
    }
    $index = "idx_{$table}_year";
    if (!index_exists($pdo, $table, $index)) {
        $pdo->exec(
            "ALTER TABLE `{$table}` ADD INDEX `{$index}` (tenant_id, branch_id, academic_year)",
        );
        $added[] = $index;
    }
}

$added = [];

foreach (
    [
        'classes',
        'staff',
        'departments',
        'roles',
        'payment_categories',
        'fee_categories',
        'transport_routes',
        'transport',
    ] as $table
) {
    ensure_year_column($pdo, $table, $added);
}

json_ok([
    'added' => $added,
    'readAcademicYear' =>
        'Use read_academic_year($body) in classes/departments/roles/fees/transport/staff create/update handlers',
]);
