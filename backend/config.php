<?php
/**
 * Active config for spi.macadz.com.
 * If this file is missing on the server, lib/db.php falls back to config.example.php.
 */
return [
    'db' => [
        // Hostinger shared hosting usually uses localhost from PHP on the same account.
        // If DB connect fails, try: 'auth-db845.hstgr.io'
        'host' => 'localhost',
        'name' => 'u455934768_spi',
        'user' => 'u455934768_spi',
        'pass' => 'School@8848',
        'charset' => 'utf8mb4',
    ],
    'jwt' => [
        'secret' => 'spi-silver-hills-change-me-in-production-2026',
        'ttl_seconds' => 60 * 60 * 24 * 7,
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
