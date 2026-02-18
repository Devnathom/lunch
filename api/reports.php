<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (!empty($_GET['search'])) {
            searchReports($_GET['search']);
        } else {
            getReports();
        }
        break;
    case 'POST': addReport(); break;
    case 'PUT': updateReport(); break;
    case 'DELETE': deleteReport(); break;
    default: jsonResponse(['error' => 'Method not allowed'], 405);
}

function getReports() {
    $db = getDB();
    $rows = $db->query("SELECT * FROM lunch_reports ORDER BY date DESC")->fetchAll();
    foreach ($rows as &$r) {
        $r['totalBudget'] = round(($r['budgetPerHead'] ?? 0) * ($r['studentsFed'] ?? 0), 2);
    }
    jsonResponse($rows);
}

function searchReports($q) {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM lunch_reports WHERE date LIKE :q OR menu LIKE :q2 OR note LIKE :q3 ORDER BY date DESC");
    $like = "%$q%";
    $stmt->execute([':q' => $like, ':q2' => $like, ':q3' => $like]);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['totalBudget'] = round(($r['budgetPerHead'] ?? 0) * ($r['studentsFed'] ?? 0), 2);
    }
    jsonResponse($rows);
}

function addReport() {
    $d = jsonInput();
    $db = getDB();
    $totalBudget = round(($d['budgetPerHead'] ?? 0) * ($d['studentsFed'] ?? 0), 2);
    $stmt = $db->prepare("INSERT INTO lunch_reports (date, menu, totalStudents, studentsFed, budgetPerHead, totalBudget, photoUrl, note, coopItems, externalItems, actualSpent, createdDate) VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())");
    $stmt->execute([
        $d['date'] ?? null,
        $d['menu'] ?? '',
        intval($d['totalStudents'] ?? 0),
        intval($d['studentsFed'] ?? 0),
        floatval($d['budgetPerHead'] ?? 0),
        $totalBudget,
        $d['photoUrl'] ?? '',
        $d['note'] ?? '',
        $d['coopItems'] ?? '[]',
        $d['externalItems'] ?? '[]',
        floatval($d['actualSpent'] ?? 0)
    ]);
    jsonResponse(['success' => true, 'message' => 'เพิ่มรายงานอาหารกลางวันสำเร็จ', 'id' => $db->lastInsertId()]);
}

function updateReport() {
    $d = jsonInput();
    if (empty($d['id'])) jsonResponse(['success' => false, 'message' => 'ไม่พบข้อมูลที่ต้องแก้ไข']);
    $db = getDB();
    $totalBudget = round(($d['budgetPerHead'] ?? 0) * ($d['studentsFed'] ?? 0), 2);
    $stmt = $db->prepare("UPDATE lunch_reports SET date=?, menu=?, totalStudents=?, studentsFed=?, budgetPerHead=?, totalBudget=?, photoUrl=?, note=?, coopItems=?, externalItems=?, actualSpent=? WHERE id=?");
    $stmt->execute([
        $d['date'] ?? null,
        $d['menu'] ?? '',
        intval($d['totalStudents'] ?? 0),
        intval($d['studentsFed'] ?? 0),
        floatval($d['budgetPerHead'] ?? 0),
        $totalBudget,
        $d['photoUrl'] ?? '',
        $d['note'] ?? '',
        $d['coopItems'] ?? '[]',
        $d['externalItems'] ?? '[]',
        floatval($d['actualSpent'] ?? 0),
        $d['id']
    ]);
    jsonResponse(['success' => true, 'message' => 'แก้ไขรายงานสำเร็จ', 'id' => $d['id']]);
}

function deleteReport() {
    $id = $_GET['id'] ?? null;
    if (!$id) jsonResponse(['success' => false, 'message' => 'ไม่พบข้อมูลที่ต้องลบ']);
    $db = getDB();
    // Delete associated uploaded files
    $row = $db->prepare("SELECT photoUrl FROM lunch_reports WHERE id=?");
    $row->execute([$id]);
    $report = $row->fetch();
    if ($report && $report['photoUrl']) {
        $urls = explode(',', $report['photoUrl']);
        foreach ($urls as $url) {
            $path = str_replace('/api/uploads/', __DIR__ . '/uploads/', trim($url));
            if (file_exists($path)) @unlink($path);
        }
    }
    $db->prepare("DELETE FROM lunch_reports WHERE id=?")->execute([$id]);
    jsonResponse(['success' => true, 'message' => 'ลบรายงานสำเร็จ']);
}
