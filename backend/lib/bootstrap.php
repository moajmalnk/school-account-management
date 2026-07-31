<?php
/**
 * Common bootstrap for authenticated API scripts.
 */
require_once dirname(__DIR__) . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/tenant.php';
require_once __DIR__ . '/mappers.php';
