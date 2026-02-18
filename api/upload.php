<?php
require_once __DIR__ . '/config.php';

$d = jsonInput();
$base64 = $d['base64'] ?? '';
$fileName = $d['fileName'] ?? 'image_' . time() . '.jpg';

if (empty($base64)) {
    jsonResponse(['success' => false, 'message' => 'ไม่มีข้อมูลรูปภาพ']);
}

$parts = explode(',', $base64);
$data = base64_decode(end($parts));
if ($data === false) {
    jsonResponse(['success' => false, 'message' => 'ไม่สามารถถอดรหัสรูปภาพ']);
}

$ext = pathinfo($fileName, PATHINFO_EXTENSION) ?: 'jpg';
$newName = uniqid('lunch_') . '.' . $ext;
$path = $UPLOAD_DIR . $newName;
file_put_contents($path, $data);

$baseUrl = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$photoUrl = $baseUrl . '/uploads/' . $newName;

jsonResponse(['success' => true, 'photoUrl' => $photoUrl]);
