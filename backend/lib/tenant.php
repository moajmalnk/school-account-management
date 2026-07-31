<?php
/**
 * Tenant-scoped query helpers — always bind tenant_id.
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/response.php';

function tenant_id_from_auth(array $auth): int
{
    $id = (int) ($auth['tenantId'] ?? 0);
    if ($id < 1) {
        json_error('Missing tenant context', 403);
    }
    return $id;
}

function generate_public_id(string $prefix): string
{
    return strtoupper($prefix) . '-' . strtoupper(bin2hex(random_bytes(4)));
}

function fetch_one_for_tenant(string $table, int $tenantId, string $publicId, string $extraWhere = ''): ?array
{
    $sql = "SELECT * FROM {$table} WHERE tenant_id = ? AND public_id = ? {$extraWhere} LIMIT 1";
    $stmt = db()->prepare($sql);
    $stmt->execute([$tenantId, $publicId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function require_row_for_tenant(string $table, int $tenantId, string $publicId, string $extraWhere = '', string $notFound = 'Not found'): array
{
    $row = fetch_one_for_tenant($table, $tenantId, $publicId, $extraWhere);
    if (!$row) {
        json_error($notFound, 404);
    }
    return $row;
}

function bool_int(mixed $value, int $default = 0): int
{
    if ($value === null) {
        return $default;
    }
    return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
}

function json_col(mixed $value, mixed $default = null): mixed
{
    if ($value === null || $value === '') {
        return $default;
    }
    if (is_array($value)) {
        return $value;
    }
    $decoded = json_decode((string) $value, true);
    return is_array($decoded) ? $decoded : $default;
}
