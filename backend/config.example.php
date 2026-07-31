<?php
/**
 * Copy to config.php on the server (or keep both in sync).
 * Do not commit production secrets to public repos.
 */
return [
    'db' => [
        'host' => 'localhost',
        'name' => 'u455934768_spi',
        'user' => 'u455934768_spi',
        'pass' => 'School@8848',
        'charset' => 'utf8mb4',
    ],
    'jwt' => [
        'secret' => 'spi-silver-hills-change-me-in-production-2026',
        'ttl_seconds' => 60 * 60 * 24 * 7, // 7 days
        'issuer' => 'spi.macadz.com',
    ],
    'cors' => [
        'allowed_origins' => [
            'http://localhost:8080',
            'http://localhost:8081',
            'http://127.0.0.1:8080',
            'http://127.0.0.1:8081',
            'https://spi.macadz.com',
        ],
        'allow_credentials' => true,
    ],
    'uploads' => [
        'dir' => __DIR__ . '/uploads',
        'public_base' => '/uploads',
        'max_bytes' => 5 * 1024 * 1024,
    ],
];
