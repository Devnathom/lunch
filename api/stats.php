<?php
require_once __DIR__ . '/config.php';

$db = getDB();

// Get settings
$rows = $db->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
$settings = [];
foreach ($rows as $r) $settings[$r['setting_key']] = $r['setting_value'];

$totalBudgetReceived = floatval($settings['totalBudgetReceived'] ?? 0);
$budgetPerHead = floatval($settings['budgetPerHead'] ?? 0);
$totalStudents = intval($settings['totalStudents'] ?? 0);
$spentAtReset = floatval($settings['spentAtReset'] ?? 0);
$budgetReceivedDate = $settings['budgetReceivedDate'] ?? '';

// Get reports
$reports = $db->query("SELECT actualSpent FROM lunch_reports")->fetchAll();
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
