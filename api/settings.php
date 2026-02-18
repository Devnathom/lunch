<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $db = getDB();
    $rows = $db->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
    $settings = [];
    foreach ($rows as $r) {
        $settings[$r['setting_key']] = $r['setting_value'];
    }
    jsonResponse($settings);
} elseif ($method === 'POST') {
    $d = jsonInput();
    $db = getDB();
    foreach ($d as $key => $value) {
        $stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
        $stmt->execute([$key, $value ?? '']);
    }
    jsonResponse(['success' => true, 'message' => 'บันทึกการตั้งค่าสำเร็จ']);
} else {
    jsonResponse(['error' => 'Method not allowed'], 405);
}
