<?php
require_once __DIR__ . '/config.php';

$d = jsonInput();
$db = getDB();

$token = $d['lineChannelToken'] ?? '';
$groupId = $d['lineGroupId'] ?? '';

if (!$token) {
    $rows = $db->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('lineChannelToken','lineGroupId')")->fetchAll();
    foreach ($rows as $r) {
        if ($r['setting_key'] === 'lineChannelToken' && !$token) $token = $r['setting_value'];
        if ($r['setting_key'] === 'lineGroupId' && !$groupId) $groupId = $r['setting_value'];
    }
}

if (!$token) jsonResponse(['success' => false, 'message' => 'กรุณาใส่ Channel Access Token']);
if (!$groupId) jsonResponse(['success' => false, 'message' => 'กรุณาใส่ Group ID']);

$rows2 = $db->query("SELECT setting_value FROM settings WHERE setting_key='schoolName'")->fetch();
$schoolName = $rows2['setting_value'] ?? 'ระบบรายงานอาหารกลางวัน';

$payload = json_encode([
    'to' => $groupId,
    'messages' => [[
        'type' => 'text',
        'text' => "✅ ทดสอบเชื่อมต่อ LINE สำเร็จ!\n🏫 $schoolName\n📅 " . date('d/m/Y H:i')
    ]]
], JSON_UNESCAPED_UNICODE);

$ch = curl_init('https://api.line.me/v2/bot/message/push');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', "Authorization: Bearer $token"],
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_RETURNTRANSFER => true
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    jsonResponse(['success' => true, 'message' => 'เชื่อมต่อ LINE สำเร็จ! ตรวจสอบกลุ่ม LINE ของท่าน']);
} else {
    $err = json_decode($response, true);
    jsonResponse(['success' => false, 'message' => $err['message'] ?? "Error $httpCode"]);
}
