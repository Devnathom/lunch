<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// Load .env file if exists (for Hostinger production)
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($key, $value) = array_pad(explode('=', $line, 2), 2, '');
        $_ENV[trim($key)] = trim($value);
    }
}

$DB_HOST = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost';
$DB_NAME = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'lunch_report';
$DB_USER = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root';
$DB_PASS = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '';
$UPLOAD_DIR = __DIR__ . '/uploads/';

if (!is_dir($UPLOAD_DIR)) mkdir($UPLOAD_DIR, 0755, true);

function getDB() {
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
            $DB_USER, $DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    }
    return $pdo;
}

function jsonInput() {
    return json_decode(file_get_contents('php://input'), true) ?: [];
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
