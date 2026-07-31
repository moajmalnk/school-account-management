<?php
/**
 * Minimal HS256 JWT + requireAuth() with tenant isolation.
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/response.php';

function jwt_b64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function jwt_b64url_decode(string $data): string
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    $decoded = base64_decode(strtr($data, '-_', '+/'), true);
    if ($decoded === false) {
        throw new RuntimeException('Invalid base64url');
    }
    return $decoded;
}

function jwt_encode(array $payload): string
{
    $cfg = app_config()['jwt'];
    $header = ['typ' => 'JWT', 'alg' => 'HS256'];
    $now = time();
    $payload = array_merge($payload, [
        'iss' => $cfg['issuer'],
        'iat' => $now,
        'exp' => $now + (int) $cfg['ttl_seconds'],
    ]);

    $segments = [
        jwt_b64url_encode(json_encode($header, JSON_UNESCAPED_SLASHES)),
        jwt_b64url_encode(json_encode($payload, JSON_UNESCAPED_SLASHES)),
    ];
    $signingInput = implode('.', $segments);
    $signature = hash_hmac('sha256', $signingInput, $cfg['secret'], true);
    $segments[] = jwt_b64url_encode($signature);
    return implode('.', $segments);
}

function jwt_decode(string $token): array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        throw new RuntimeException('Malformed token');
    }
    [$h64, $p64, $s64] = $parts;
    $cfg = app_config()['jwt'];
    $expected = jwt_b64url_encode(hash_hmac('sha256', $h64 . '.' . $p64, $cfg['secret'], true));
    if (!hash_equals($expected, $s64)) {
        throw new RuntimeException('Invalid signature');
    }
    $payload = json_decode(jwt_b64url_decode($p64), true);
    if (!is_array($payload)) {
        throw new RuntimeException('Invalid payload');
    }
    if (($payload['exp'] ?? 0) < time()) {
        throw new RuntimeException('Token expired');
    }
    return $payload;
}

function bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) {
        return $m[1];
    }
    return null;
}

/**
 * @return array{userId:int,tenantId:int,role:string,email:string,permissions:array,publicId:string,displayName:string}
 */
function require_auth(): array
{
    $token = bearer_token();
    if ($token === null) {
        json_error('Unauthorized', 401);
    }
    try {
        $payload = jwt_decode($token);
    } catch (Throwable $e) {
        json_error('Unauthorized: ' . $e->getMessage(), 401);
    }

    $tenantId = (int) ($payload['tenantId'] ?? 0);
    $userId = (int) ($payload['userId'] ?? 0);
    if ($tenantId < 1 || $userId < 1) {
        json_error('Unauthorized: invalid claims', 401);
    }

    $stmt = db()->prepare(
        'SELECT u.id, u.tenant_id, u.public_id, u.email, u.display_name, u.role, u.permissions, u.active,
                t.status AS tenant_status
         FROM users u
         INNER JOIN tenants t ON t.id = u.tenant_id
         WHERE u.id = ? AND u.tenant_id = ?
         LIMIT 1'
    );
    $stmt->execute([$userId, $tenantId]);
    $user = $stmt->fetch();
    if (!$user || !(int) $user['active']) {
        json_error('Unauthorized: user inactive', 401);
    }
    if (($user['tenant_status'] ?? '') === 'Suspended') {
        json_error('Tenant suspended', 403);
    }

    $permissions = json_decode($user['permissions'] ?? '[]', true);
    if (!is_array($permissions)) {
        $permissions = [];
    }

    return [
        'userId' => (int) $user['id'],
        'tenantId' => (int) $user['tenant_id'],
        'publicId' => (string) $user['public_id'],
        'email' => (string) $user['email'],
        'displayName' => (string) $user['display_name'],
        'role' => (string) $user['role'],
        'permissions' => $permissions,
    ];
}

function auth_has_permission(array $auth, string $key): bool
{
    $perms = $auth['permissions'] ?? [];
    if (in_array('*', $perms, true)) {
        return true;
    }
    if ($auth['role'] === 'school_admin') {
        return true;
    }
    return in_array($key, $perms, true);
}
