<?php
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'provinces': getProvinces(); break;
    case 'districts': getDistricts(); break;
    case 'schools': getSchools(); break;
    case 'school_reports': getSchoolReports(); break;
    case 'latest_reports': getLatestReports(); break;
    case 'dashboard_stats': getDashboardStats(); break;
    default: jsonResponse(['error' => 'Invalid action'], 400);
}

function getProvinces() {
    $db = getDB();
    $rows = $db->query("SELECT p.*, COUNT(DISTINCT s.id) as school_count FROM provinces p LEFT JOIN schools s ON p.id = s.province_id GROUP BY p.id HAVING school_count > 0 ORDER BY p.name")->fetchAll();
    jsonResponse($rows);
}

function getDistricts() {
    $pid = intval($_GET['province_id'] ?? 0);
    if (!$pid) jsonResponse([]);
    $db = getDB();
    $stmt = $db->prepare("SELECT d.*, COUNT(DISTINCT s.id) as school_count FROM districts d LEFT JOIN schools s ON d.id = s.district_id WHERE d.province_id = ? GROUP BY d.id HAVING school_count > 0 ORDER BY d.name");
    $stmt->execute([$pid]);
    jsonResponse($stmt->fetchAll());
}

function getSchools() {
    $db = getDB();
    $where = "1=1";
    $params = [];

    if (!empty($_GET['province_id'])) {
        $where .= " AND s.province_id = ?";
        $params[] = intval($_GET['province_id']);
    }
    if (!empty($_GET['district_id'])) {
        $where .= " AND s.district_id = ?";
        $params[] = intval($_GET['district_id']);
    }
    if (!empty($_GET['search'])) {
        $where .= " AND s.name LIKE ?";
        $params[] = '%' . $_GET['search'] . '%';
    }

    $stmt = $db->prepare("SELECT s.*, p.name as province_name, d.name as district_name,
        (SELECT COUNT(*) FROM lunch_reports lr WHERE lr.school_id = s.id) as report_count,
        (SELECT lr.date FROM lunch_reports lr WHERE lr.school_id = s.id ORDER BY lr.date DESC LIMIT 1) as last_report_date
        FROM schools s
        LEFT JOIN provinces p ON s.province_id = p.id
        LEFT JOIN districts d ON s.district_id = d.id
        WHERE $where ORDER BY s.name LIMIT 100");
    $stmt->execute($params);
    jsonResponse($stmt->fetchAll());
}

function getSchoolReports() {
    $sid = intval($_GET['school_id'] ?? 0);
    if (!$sid) jsonResponse([]);
    $db = getDB();
    $stmt = $db->prepare("SELECT lr.*, s.name as school_name, s.logo_url FROM lunch_reports lr LEFT JOIN schools s ON lr.school_id = s.id WHERE lr.school_id = ? ORDER BY lr.date DESC LIMIT 30");
    $stmt->execute([$sid]);
    jsonResponse($stmt->fetchAll());
}

function getLatestReports() {
    $db = getDB();
    $limit = min(intval($_GET['limit'] ?? 20), 50);
    $limit = intval($limit);
    $rows = $db->query("SELECT lr.*, s.name as school_name, s.logo_url, p.name as province_name, d.name as district_name
        FROM lunch_reports lr
        LEFT JOIN schools s ON lr.school_id = s.id
        LEFT JOIN provinces p ON s.province_id = p.id
        LEFT JOIN districts d ON s.district_id = d.id
        ORDER BY lr.date DESC, lr.id DESC LIMIT $limit")->fetchAll();
    jsonResponse($rows);
}

function getDashboardStats() {
    $db = getDB();
    $stats = [
        'totalSchools' => $db->query("SELECT COUNT(*) FROM schools")->fetchColumn(),
        'totalReports' => $db->query("SELECT COUNT(*) FROM lunch_reports")->fetchColumn(),
        'totalStudents' => $db->query("SELECT COALESCE(SUM(total_students),0) FROM schools")->fetchColumn(),
        'todayReports' => $db->query("SELECT COUNT(*) FROM lunch_reports WHERE date = CURDATE()")->fetchColumn(),
        'totalProvinces' => $db->query("SELECT COUNT(DISTINCT province_id) FROM schools")->fetchColumn(),
        'totalDistricts' => $db->query("SELECT COUNT(DISTINCT district_id) FROM schools")->fetchColumn(),
    ];
    jsonResponse($stats);
}
