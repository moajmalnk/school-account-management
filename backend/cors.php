<?php
/**
 * CORS middleware — include at the top of every API entrypoint.
 * When opened directly in the browser, returns a health JSON payload
 * (useful if health.php has not been uploaded yet).
 */
$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    $configFile = __DIR__ . '/config.example.php';
}
$config = require $configFile;

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = $config['cors']['allowed_origins'] ?? [];

if ($origin !== '' && in_array($origin, $allowed, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} elseif ($origin === '' || in_array('*', $allowed, true)) {
    header('Access-Control-Allow-Origin: *');
}

if (!empty($config['cors']['allow_credentials']) && $origin !== '' && in_array($origin, $allowed, true)) {
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Direct hit on /cors.php → health check (no separate health.php required)
$script = realpath($_SERVER['SCRIPT_FILENAME'] ?? '') ?: '';
$self = realpath(__FILE__) ?: '';
if ($script !== '' && $self !== '' && $script === $self) {
    header('Content-Type: application/json; charset=utf-8');
    $dbOk = false;
    $dbError = null;
    try {
        $db = $config['db'];
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            $db['host'],
            $db['name'],
            $db['charset'] ?? 'utf8mb4'
        );
        $pdo = new PDO($dsn, $db['user'], $db['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
        $pdo->query('SELECT 1');
        $dbOk = true;
    } catch (Throwable $e) {
        $dbError = $e->getMessage();
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'service' => 'School Admin Console API',
            'version' => '1.0.0',
            'php' => PHP_VERSION,
            'database' => $dbOk ? 'ok' : 'error',
            'databaseError' => $dbError,
            'time' => date('c'),
            'hint' => 'Upload health.php + config.php into /public_html/spi for the dedicated health endpoint',
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
