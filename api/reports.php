<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_helper.php';

$user = requireAuth();
$schoolId = $user['school_id'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (!empty($_GET['search'])) {
            searchReports($_GET['search'], $schoolId);
        } else {
            getReports($schoolId);
        }
        break;
    case 'POST': addReport($schoolId); break;
    case 'PUT': updateReport($schoolId); break;
    case 'DELETE': deleteReport($schoolId); break;
    default: jsonResponse(['error' => 'Method not allowed'], 405);
}

function getReports($schoolId) {
    $db = getDB();
    if ($schoolId) {
        $stmt = $db->prepare("SELECT * FROM lunch_reports WHERE school_id = ? ORDER BY date DESC");
        $stmt->execute([$schoolId]);
        $rows = $stmt->fetchAll();
    } else {
        $rows = $db->query("SELECT * FROM lunch_reports ORDER BY date DESC")->fetchAll();
    }
    foreach ($rows as &$r) {
        $r['totalBudget'] = round(($r['budgetPerHead'] ?? 0) * ($r['studentsFed'] ?? 0), 2);
    }
    jsonResponse($rows);
}

function searchReports($q, $schoolId) {
    $db = getDB();
    $like = "%$q%";
    if ($schoolId) {
        $stmt = $db->prepare("SELECT * FROM lunch_reports WHERE school_id = ? AND (date LIKE ? OR menu LIKE ? OR note LIKE ?) ORDER BY date DESC");
        $stmt->execute([$schoolId, $like, $like, $like]);
    } else {
        $stmt = $db->prepare("SELECT * FROM lunch_reports WHERE date LIKE ? OR menu LIKE ? OR note LIKE ? ORDER BY date DESC");
        $stmt->execute([$like, $like, $like]);
    }
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['totalBudget'] = round(($r['budgetPerHead'] ?? 0) * ($r['studentsFed'] ?? 0), 2);
    }
    jsonResponse($rows);
}

function addReport($schoolId) {
    $d = jsonInput();
    $db = getDB();
    $totalBudget = round(($d['budgetPerHead'] ?? 0) * ($d['studentsFed'] ?? 0), 2);
    $stmt = $db->prepare("INSERT INTO lunch_reports (school_id, date, menu, totalStudents, studentsFed, budgetPerHead, totalBudget, photoUrl, note, coopItems, externalItems, actualSpent, createdDate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW())");
    $stmt->execute([
        $schoolId,
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

function updateReport($schoolId) {
    $d = jsonInput();
    if (empty($d['id'])) jsonResponse(['success' => false, 'message' => 'ไม่พบข้อมูลที่ต้องแก้ไข']);
    $db = getDB();
    $totalBudget = round(($d['budgetPerHead'] ?? 0) * ($d['studentsFed'] ?? 0), 2);
    $where = $schoolId ? " AND school_id = $schoolId" : "";
    $stmt = $db->prepare("UPDATE lunch_reports SET date=?, menu=?, totalStudents=?, studentsFed=?, budgetPerHead=?, totalBudget=?, photoUrl=?, note=?, coopItems=?, externalItems=?, actualSpent=? WHERE id=? $where");
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

function deleteReport($schoolId) {
    $id = $_GET['id'] ?? null;
    if (!$id) jsonResponse(['success' => false, 'message' => 'ไม่พบข้อมูลที่ต้องลบ']);
    $db = getDB();
    $where = $schoolId ? " AND school_id = $schoolId" : "";
    $row = $db->prepare("SELECT photoUrl FROM lunch_reports WHERE id=? $where");
    $row->execute([$id]);
    $report = $row->fetch();
    if ($report && $report['photoUrl']) {
        $urls = explode(',', $report['photoUrl']);
        foreach ($urls as $url) {
            $path = str_replace('/api/uploads/', __DIR__ . '/uploads/', trim($url));
            if (file_exists($path)) @unlink($path);
        }
    }
    $db->prepare("DELETE FROM lunch_reports WHERE id=? $where")->execute([$id]);
    jsonResponse(['success' => true, 'message' => 'ลบรายงานสำเร็จ']);
}
