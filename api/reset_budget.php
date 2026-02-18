<?php
require_once __DIR__ . '/config.php';

$d = jsonInput();
$newAmount = floatval($d['amount'] ?? 0);

$db = getDB();

// Calculate cumulative spending
$rows = $db->query("SELECT SUM(actualSpent) as total FROM lunch_reports")->fetch();
$allSpent = floatval($rows['total'] ?? 0);

// Save settings
$today = date('Y-m-d');
$updates = [
    'totalBudgetReceived' => $newAmount,
    'spentAtReset' => $allSpent,
    'budgetReceivedDate' => $today
];

foreach ($updates as $key => $value) {
    $stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
    $stmt->execute([$key, $value]);
}

jsonResponse([
    'success' => true,
    'message' => 'รีเซ็ตงบประมาณสำเร็จ! ยอดใหม่ ' . number_format($newAmount) . ' บาท',
    'spentAtReset' => $allSpent,
    'newBudget' => $newAmount
]);
