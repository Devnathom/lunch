<?php
require_once __DIR__ . '/config.php';

$d = jsonInput();
$db = getDB();

// Get settings
$rows = $db->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
$settings = [];
foreach ($rows as $r) $settings[$r['setting_key']] = $r['setting_value'];

$schoolName = $settings['schoolName'] ?? 'โรงเรียน';
$directorName = $settings['directorName'] ?? '';
$directorPosition = $settings['directorPosition'] ?? '';
$schoolAffiliation = $settings['schoolAffiliation'] ?? '';
$schoolAddress = $settings['schoolAddress'] ?? '';
$totalBudgetReceived = floatval($settings['totalBudgetReceived'] ?? 0);
$budgetReceivedDate = $settings['budgetReceivedDate'] ?? '';
$spentAtReset = floatval($settings['spentAtReset'] ?? 0);

// Parse data
$coopItems = json_decode($d['coopItems'] ?? '[]', true) ?: [];
$extItems = json_decode($d['externalItems'] ?? '[]', true) ?: [];
$budgetPerHead = floatval($d['budgetPerHead'] ?? 0);
$studentsFed = intval($d['studentsFed'] ?? 0);
$totalBudget = $budgetPerHead * $studentsFed;

$coopTotal = 0; $extTotal = 0;
foreach ($coopItems as $item) $coopTotal += (floatval($item['price'] ?? 0)) * (floatval($item['qty'] ?? 0));
foreach ($extItems as $item) $extTotal += (floatval($item['price'] ?? 0)) * (floatval($item['qty'] ?? 0));
$grandTotal = $coopTotal + $extTotal;
$remaining = $totalBudget - $grandTotal;

// Cumulative spending
$allSpent = floatval($db->query("SELECT COALESCE(SUM(actualSpent),0) as t FROM lunch_reports")->fetch()['t']);
$effectiveSpent = max(0, $allSpent - $spentAtReset);
$budgetRemaining = $totalBudgetReceived - $effectiveSpent;

// Thai months
$thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
function toThaiDate($dateStr) {
    global $thaiMonths;
    if (!$dateStr) return '-';
    $parts = explode('-', $dateStr);
    if (count($parts) !== 3) return $dateStr;
    $y = intval($parts[0]) + 543;
    $m = intval($parts[1]) - 1;
    $day = intval($parts[2]);
    return "$day {$thaiMonths[$m]} พ.ศ. $y";
}
function fN($n) { return number_format($n, 2); }

// Generate HTML for PDF
$html = '<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
body { font-family: "Sarabun", "TH SarabunPSK", sans-serif; font-size: 16px; margin: 36px 50px; }
h1 { text-align: center; font-size: 20px; margin: 0; }
.center { text-align: center; }
.small { font-size: 14px; }
table { width: 100%; border-collapse: collapse; margin: 8px 0; }
table.bordered th, table.bordered td { border: 1px solid #999; padding: 4px 8px; }
table.bordered th { background: #f5f5f5; text-align: center; font-weight: bold; }
.right { text-align: right; }
.bold { font-weight: bold; }
hr { border: none; border-top: 1px solid #999; margin: 8px 0; }
</style></head><body>';

$html .= "<h1>$schoolName</h1>";
if ($schoolAddress) $html .= "<p class='center small'>$schoolAddress</p>";
if ($directorName) {
    $dirLine = $directorName;
    if ($directorPosition) $dirLine .= "  $directorPosition";
    $html .= "<p class='center'>$dirLine</p>";
}
if ($schoolAffiliation) $html .= "<p class='center small'>$schoolAffiliation</p>";
$html .= "<hr>";
$html .= "<h1 style='font-size:18px;'>รายงานอาหารกลางวัน</h1>";
$html .= "<p class='center'>ประจำวันที่ " . toThaiDate($d['date'] ?? '') . "</p>";
$html .= "<p class='bold'>รายการอาหาร: " . ($d['menu'] ?? '-') . "</p>";

// Info table
$html .= "<table class='bordered'><tr><th>รายการ</th><th>รายละเอียด</th></tr>";
$html .= "<tr><td>จำนวนนักเรียนทั้งหมด</td><td class='right'>" . ($d['totalStudents'] ?? 0) . " คน</td></tr>";
$html .= "<tr><td>จำนวนนักเรียนที่รับอาหาร</td><td class='right'>$studentsFed คน</td></tr>";
$html .= "<tr><td>งบประมาณ / หัว</td><td class='right'>" . fN($budgetPerHead) . " บาท</td></tr>";
$html .= "<tr><td>งบประมาณรวมวันนี้</td><td class='right'>" . fN($totalBudget) . " บาท</td></tr>";
$html .= "<tr><td>วันที่ได้รับเงินงบประมาณ</td><td class='right'>" . toThaiDate($budgetReceivedDate) . "</td></tr>";
$html .= "<tr><td>จำนวนเงินงบประมาณที่ได้รับ</td><td class='right'>" . fN($totalBudgetReceived) . " บาท</td></tr>";
$html .= "<tr><td>เงินงบประมาณคงเหลือ</td><td class='right'>" . fN($budgetRemaining) . " บาท</td></tr>";
$html .= "</table>";

// Coop table
if (count($coopItems) > 0) {
    $html .= "<p class='bold'>ตารางที่ 1: ซื้อสินค้าจากร้านค้าสหกรณ์โรงเรียน</p>";
    $html .= "<table class='bordered'><tr><th>ลำดับ</th><th>รายการ</th><th>หน่วย</th><th>จำนวน</th><th>ราคา(บาท)</th><th>รวมเงิน(บาท)</th></tr>";
    foreach ($coopItems as $i => $item) {
        $rt = (floatval($item['price'] ?? 0)) * (floatval($item['qty'] ?? 0));
        $html .= "<tr><td class='center'>" . ($i+1) . "</td><td>" . ($item['name'] ?? '') . "</td><td class='center'>" . ($item['unit'] ?? '') . "</td><td class='right'>" . ($item['qty'] ?? 0) . "</td><td class='right'>" . fN($item['price'] ?? 0) . "</td><td class='right'>" . fN($rt) . "</td></tr>";
    }
    $html .= "<tr><td colspan='4'></td><td class='right bold'>รวม</td><td class='right bold'>" . fN($coopTotal) . "</td></tr></table>";
}

// Ext table
if (count($extItems) > 0) {
    $html .= "<p class='bold'>ตารางที่ 2: ซื้อสินค้าจากร้านค้านอก</p>";
    $html .= "<table class='bordered'><tr><th>ลำดับ</th><th>รายการ</th><th>หน่วย</th><th>จำนวน</th><th>ราคา(บาท)</th><th>รวมเงิน(บาท)</th></tr>";
    foreach ($extItems as $i => $item) {
        $rt = (floatval($item['price'] ?? 0)) * (floatval($item['qty'] ?? 0));
        $html .= "<tr><td class='center'>" . ($i+1) . "</td><td>" . ($item['name'] ?? '') . "</td><td class='center'>" . ($item['unit'] ?? '') . "</td><td class='right'>" . ($item['qty'] ?? 0) . "</td><td class='right'>" . fN($item['price'] ?? 0) . "</td><td class='right'>" . fN($rt) . "</td></tr>";
    }
    $html .= "<tr><td colspan='4'></td><td class='right bold'>รวม</td><td class='right bold'>" . fN($extTotal) . "</td></tr></table>";
}

// Summary
$html .= "<p class='bold'>สรุปค่าใช้จ่ายประจำวัน</p>";
$html .= "<table class='bordered'><tr><th>รายการ</th><th>จำนวนเงิน (บาท)</th></tr>";
$html .= "<tr><td>ซื้อสินค้าจากร้านค้าสหกรณ์โรงเรียน (ตารางที่ 1)</td><td class='right'>" . fN($coopTotal) . "</td></tr>";
$html .= "<tr><td>ซื้อสินค้าจากร้านค้านอก (ตารางที่ 2)</td><td class='right'>" . fN($extTotal) . "</td></tr>";
$html .= "<tr><td class='bold'>รวมค่าใช้จ่ายทั้งหมด</td><td class='right bold'>" . fN($grandTotal) . "</td></tr>";
$html .= "<tr><td class='bold'>งบประมาณที่ได้รับวันนี้</td><td class='right bold'>" . fN($totalBudget) . "</td></tr>";
$html .= "<tr><td class='bold'>คงเหลือ</td><td class='right bold'>" . fN($remaining) . "</td></tr></table>";

if ($remaining > 0) {
    $html .= "<p class='bold'>นำฝากสหกรณ์ออมทรัพย์</p>";
    $html .= "<p>เงินคงเหลือจากการจัดอาหารกลางวันวันนี้ จำนวน " . fN($remaining) . " บาท นำฝากเข้าบัญชีสหกรณ์ออมทรัพย์โรงเรียน</p>";
} elseif ($remaining < 0) {
    $html .= "<p class='bold'>หมายเหตุ: ค่าใช้จ่ายเกินงบประมาณ " . fN(abs($remaining)) . " บาท</p>";
}
if (!empty($d['note'])) $html .= "<p>หมายเหตุ: " . $d['note'] . "</p>";
$html .= "</body></html>";

// Save HTML as PDF-ready file
$pdfDir = $UPLOAD_DIR . 'pdf/';
if (!is_dir($pdfDir)) mkdir($pdfDir, 0755, true);
$pdfName = 'report_' . ($d['date'] ?? date('Y-m-d')) . '_' . uniqid() . '.html';
$pdfPath = $pdfDir . $pdfName;
file_put_contents($pdfPath, $html);

$baseUrl = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$pdfUrl = $baseUrl . '/uploads/pdf/' . $pdfName;

// Save PDF URL to report
if (!empty($d['id'])) {
    $stmt = $db->prepare("UPDATE lunch_reports SET pdfUrl=? WHERE id=?");
    $stmt->execute([$pdfUrl, $d['id']]);
}

jsonResponse(['success' => true, 'pdfUrl' => $pdfUrl, 'message' => 'สร้างรายงานสำเร็จ']);
