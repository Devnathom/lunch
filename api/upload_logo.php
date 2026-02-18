<?php
require_once __DIR__ . '/config.php';

$d = jsonInput();
$base64 = $d['base64'] ?? '';
$fileName = $d['fileName'] ?? 'logo_' . time() . '.png';

if (empty($base64)) {
    jsonResponse(['success' => false, 'message' => 'ไม่มีข้อมูลรูปภาพ']);
}

$parts = explode(',', $base64);
$data = base64_decode(end($parts));
if ($data === false) {
    jsonResponse(['success' => false, 'message' => 'ไม่สามารถถอดรหัสรูปภาพ']);
}

$ext = pathinfo($fileName, PATHINFO_EXTENSION) ?: 'png';
$newName = 'logo_' . uniqid() . '.' . $ext;
$path = $UPLOAD_DIR . $newName;
file_put_contents($path, $data);

$baseUrl = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$logoUrl = $baseUrl . '/uploads/' . $newName;

// Save to settings
$db = getDB();
$stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('logoUrl', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
$stmt->execute([$logoUrl]);

jsonResponse(['success' => true, 'logoUrl' => $logoUrl]);
