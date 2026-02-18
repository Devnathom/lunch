<?php
require_once __DIR__ . '/config.php';

$d = jsonInput();
$db = getDB();

// Get settings
$rows = $db->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
$settings = [];
foreach ($rows as $r) $settings[$r['setting_key']] = $r['setting_value'];

$token = $settings['lineChannelToken'] ?? '';
$groupId = $settings['lineGroupId'] ?? '';

if (!$token) jsonResponse(['success' => false, 'message' => 'กรุณาตั้งค่า LINE Channel Access Token ในหน้าตั้งค่า']);
if (!$groupId) jsonResponse(['success' => false, 'message' => 'กรุณาตั้งค่า LINE Group ID ในหน้าตั้งค่า']);

$schoolName = $settings['schoolName'] ?? 'โรงเรียน';
$budgetPerHead = floatval($d['budgetPerHead'] ?? 0);
$studentsFed = intval($d['studentsFed'] ?? 0);
$totalBudget = $budgetPerHead * $studentsFed;
$actualSpent = floatval($d['actualSpent'] ?? 0);
$totalBudgetReceived = floatval($settings['totalBudgetReceived'] ?? 0);
$spentAtReset = floatval($settings['spentAtReset'] ?? 0);

$allSpent = floatval($db->query("SELECT COALESCE(SUM(actualSpent),0) as t FROM lunch_reports")->fetch()['t']);
$effectiveSpent = max(0, $allSpent - $spentAtReset);
$budgetRemaining = $totalBudgetReceived - $effectiveSpent;

// Thai date
$thaiMonthsShort = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
$thaiDate = $d['date'] ?? '-';
$parts = explode('-', $d['date'] ?? '');
if (count($parts) === 3) {
    $y = intval($parts[0]) + 543;
    $m = intval($parts[1]) - 1;
    $day = intval($parts[2]);
    $thaiDate = "$day {$thaiMonthsShort[$m]} $y";
}

$lines = [
    "🍱 รายงานอาหารกลางวัน",
    "🏫 $schoolName",
    "📅 $thaiDate",
    "🍽️ เมนู: " . ($d['menu'] ?? '-'),
    "👨‍🎓 นร.รับอาหาร: $studentsFed คน",
    "💰 งบ/หัว: " . number_format($budgetPerHead) . " บาท",
    "📊 งบรวม: " . number_format($totalBudget) . " บาท"
];

if ($actualSpent > 0) $lines[] = "💸 ใช้จ่ายจริง: " . number_format($actualSpent) . " บาท";
$lines[] = "💰 งบประมาณที่ได้รับ: " . number_format($totalBudgetReceived) . " บาท";
if ($budgetRemaining >= 0) $lines[] = "✅ งบประมาณคงเหลือ: " . number_format($budgetRemaining) . " บาท";
else $lines[] = "⚠️ งบประมาณเกิน: " . number_format(abs($budgetRemaining)) . " บาท";
if (!empty($d['note'])) $lines[] = "📝 หมายเหตุ: " . $d['note'];
if (!empty($d['pdfUrl'])) { $lines[] = ""; $lines[] = "📄 PDF: " . $d['pdfUrl']; }

$messages = [['type' => 'text', 'text' => implode("\n", $lines)]];

$payload = json_encode(['to' => $groupId, 'messages' => $messages], JSON_UNESCAPED_UNICODE);
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
    jsonResponse(['success' => true, 'message' => 'ส่งข้อความเข้ากลุ่ม LINE สำเร็จ!']);
} else {
    $err = json_decode($response, true);
    jsonResponse(['success' => false, 'message' => $err['message'] ?? "LINE API Error: $httpCode"]);
}
