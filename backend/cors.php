<?php
/**
 * CORS middleware — include at the top of every API entrypoint.
 * Reflects the request Origin so local Vite (localhost / LAN IP) works.
 * When opened directly, returns health JSON.
 */
$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    $configFile = __DIR__ . '/config.example.php';
}
$config = require $configFile;

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = $config['cors']['allowed_origins'] ?? [];

$originAllowed = false;
if ($origin !== '') {
    if (in_array($origin, $allowed, true) || in_array('*', $allowed, true)) {
        $originAllowed = true;
    } elseif (preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#i', $origin)) {
        $originAllowed = true;
    } elseif (preg_match('#^https?://(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$#', $origin)) {
        // Local network Vite / preview hosts
        $originAllowed = true;
    } elseif (preg_match('#^https?://([a-z0-9-]+\.)?macadz\.com$#i', $origin)) {
        $originAllowed = true;
    } elseif (preg_match('#^https?://.*\.vercel\.app$#i', $origin)) {
        $originAllowed = true;
    }
}

if ($originAllowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    if (!empty($config['cors']['allow_credentials'])) {
        header('Access-Control-Allow-Credentials: true');
    }
} elseif ($origin === '') {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Direct hit on /cors.php → health check
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
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
