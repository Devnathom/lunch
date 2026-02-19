<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_helper.php';

$user = requireAuth();
$schoolId = $user['school_id'];
$db = getDB();

// Get school settings
if ($schoolId) {
    $stmt = $db->prepare("SELECT * FROM schools WHERE id = ?");
    $stmt->execute([$schoolId]);
    $school = $stmt->fetch();
    $totalBudgetReceived = floatval($school['total_budget_received'] ?? 0);
    $budgetPerHead = floatval($school['budget_per_head'] ?? 0);
    $totalStudents = intval($school['total_students'] ?? 0);
    $spentAtReset = floatval($school['spent_at_reset'] ?? 0);
    $budgetReceivedDate = $school['budget_received_date'] ?? '';

    $stmt2 = $db->prepare("SELECT actualSpent FROM lunch_reports WHERE school_id = ?");
    $stmt2->execute([$schoolId]);
    $reports = $stmt2->fetchAll();
} else {
    $rows = $db->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
    $s = [];
    foreach ($rows as $r) $s[$r['setting_key']] = $r['setting_value'];
    $totalBudgetReceived = floatval($s['totalBudgetReceived'] ?? 0);
    $budgetPerHead = floatval($s['budgetPerHead'] ?? 0);
    $totalStudents = intval($s['totalStudents'] ?? 0);
    $spentAtReset = floatval($s['spentAtReset'] ?? 0);
    $budgetReceivedDate = $s['budgetReceivedDate'] ?? '';
    $reports = $db->query("SELECT actualSpent FROM lunch_reports")->fetchAll();
}

$totalReports = count($reports);
$spentBudget = 0;
foreach ($reports as $r) $spentBudget += floatval($r['actualSpent'] ?? 0);

$effectiveSpent = max(0, $spentBudget - $spentAtReset);
$remainingBudget = $totalBudgetReceived - $effectiveSpent;
$costPerDay = $budgetPerHead * $totalStudents;
$totalCanServeDays = $costPerDay > 0 ? floor($totalBudgetReceived / $costPerDay) : 0;
$remainingDays = $costPerDay > 0 ? floor($remainingBudget / $costPerDay) : 0;

jsonResponse([
    'totalReports' => $totalReports,
    'spentBudget' => number_format($effectiveSpent, 2, '.', ''),
    'totalBudgetReceived' => number_format($totalBudgetReceived, 2, '.', ''),
    'remainingBudget' => number_format($remainingBudget, 2, '.', ''),
    'budgetPerHead' => $budgetPerHead,
    'totalStudents' => $totalStudents,
    'costPerDay' => number_format($costPerDay, 2, '.', ''),
    'totalCanServeDays' => $totalCanServeDays,
    'remainingDays' => $remainingDays,
    'budgetReceivedDate' => $budgetReceivedDate
]);
