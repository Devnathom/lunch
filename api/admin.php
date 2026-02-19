<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_helper.php';

$user = requireAuth();
if ($user['role'] !== 'admin') jsonResponse(['success' => false, 'message' => 'ไม่มีสิทธิ์เข้าถึง'], 403);

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    // Provinces
    case 'provinces':
        $rows = getDB()->query("SELECT * FROM provinces ORDER BY name")->fetchAll();
        jsonResponse($rows);
        break;

    // Districts
    case 'districts':
        if ($method === 'GET') getDistricts();
        elseif ($method === 'POST') addDistrict();
        elseif ($method === 'DELETE') deleteDistrict();
        break;

    // Schools
    case 'schools':
        if ($method === 'GET') getSchoolsList();
        elseif ($method === 'POST') addSchool();
        elseif ($method === 'PUT') updateSchool();
        elseif ($method === 'DELETE') deleteSchool();
        break;

    // Users
    case 'users':
        if ($method === 'GET') getUsersList();
        elseif ($method === 'POST') addUser();
        elseif ($method === 'PUT') updateUser();
        elseif ($method === 'DELETE') deleteUser();
        break;

    // Notify budget
    case 'notify_budget':
        notifyBudget();
        break;

    // Dashboard
    case 'dashboard':
        adminDashboard();
        break;

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}

// === Districts ===
function getDistricts() {
    $db = getDB();
    $pid = intval($_GET['province_id'] ?? 0);
    if ($pid) {
        $stmt = $db->prepare("SELECT d.*, p.name as province_name, (SELECT COUNT(*) FROM schools s WHERE s.district_id = d.id) as school_count FROM districts d JOIN provinces p ON d.province_id = p.id WHERE d.province_id = ? ORDER BY d.name");
        $stmt->execute([$pid]);
    } else {
        $stmt = $db->query("SELECT d.*, p.name as province_name, (SELECT COUNT(*) FROM schools s WHERE s.district_id = d.id) as school_count FROM districts d JOIN provinces p ON d.province_id = p.id ORDER BY p.name, d.name");
    }
    jsonResponse($stmt->fetchAll());
}

function addDistrict() {
    $d = jsonInput();
    $db = getDB();
    $stmt = $db->prepare("INSERT INTO districts (province_id, name) VALUES (?, ?)");
    $stmt->execute([intval($d['province_id']), $d['name'] ?? '']);
    jsonResponse(['success' => true, 'message' => 'เพิ่มอำเภอสำเร็จ', 'id' => $db->lastInsertId()]);
}

function deleteDistrict() {
    $id = intval($_GET['id'] ?? 0);
    $db = getDB();
    $count = $db->prepare("SELECT COUNT(*) FROM schools WHERE district_id = ?");
    $count->execute([$id]);
    if ($count->fetchColumn() > 0) jsonResponse(['success' => false, 'message' => 'ไม่สามารถลบได้ ยังมีโรงเรียนในอำเภอนี้']);
    $db->prepare("DELETE FROM districts WHERE id = ?")->execute([$id]);
    jsonResponse(['success' => true, 'message' => 'ลบอำเภอสำเร็จ']);
}

// === Schools ===
function getSchoolsList() {
    $db = getDB();
    $rows = $db->query("SELECT s.*, p.name as province_name, d.name as district_name,
        (SELECT COUNT(*) FROM lunch_reports lr WHERE lr.school_id = s.id) as report_count,
        (SELECT u.username FROM users u WHERE u.school_id = s.id LIMIT 1) as username
        FROM schools s
        LEFT JOIN provinces p ON s.province_id = p.id
        LEFT JOIN districts d ON s.district_id = d.id
        ORDER BY p.name, d.name, s.name")->fetchAll();
    jsonResponse($rows);
}

function addSchool() {
    $d = jsonInput();
    $db = getDB();

    // Auto find/create district
    $districtId = intval($d['district_id'] ?? 0);
    if (!$districtId && !empty($d['district_name']) && !empty($d['province_id'])) {
        $pid = intval($d['province_id']);
        $dname = trim($d['district_name']);
        $stmt2 = $db->prepare("SELECT id FROM districts WHERE province_id = ? AND name = ?");
        $stmt2->execute([$pid, $dname]);
        $row = $stmt2->fetch();
        if ($row) { $districtId = $row['id']; }
        else { $db->prepare("INSERT INTO districts (province_id, name) VALUES (?, ?)")->execute([$pid, $dname]); $districtId = $db->lastInsertId(); }
    }

    $stmt = $db->prepare("INSERT INTO schools (province_id, district_id, name, address, phone, affiliation, director_name, director_position, budget_per_head, total_students) VALUES (?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        intval($d['province_id']), $districtId,
        $d['name'] ?? '', $d['address'] ?? '', $d['phone'] ?? '',
        $d['affiliation'] ?? '', $d['director_name'] ?? '', $d['director_position'] ?? '',
        floatval($d['budget_per_head'] ?? 21), intval($d['total_students'] ?? 0)
    ]);
    $schoolId = $db->lastInsertId();

    // Create user account for school
    if (!empty($d['username']) && !empty($d['password'])) {
        $existing = $db->prepare("SELECT id FROM users WHERE username = ?");
        $existing->execute([$d['username']]);
        if ($existing->fetch()) {
            jsonResponse(['success' => false, 'message' => 'ชื่อผู้ใช้ซ้ำ กรุณาเปลี่ยน']);
        }
        $hash = password_hash($d['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        $db->prepare("INSERT INTO users (school_id, username, password_hash, full_name, role) VALUES (?,?,?,?,'school')")
           ->execute([$schoolId, $d['username'], $hash, $d['name']]);
    }

    jsonResponse(['success' => true, 'message' => 'เพิ่มโรงเรียนสำเร็จ', 'id' => $schoolId]);
}

function updateSchool() {
    $d = jsonInput();
    if (empty($d['id'])) jsonResponse(['success' => false, 'message' => 'ไม่พบข้อมูล']);
    $db = getDB();

    $stmt = $db->prepare("UPDATE schools SET province_id=?, district_id=?, name=?, address=?, phone=?, affiliation=?, director_name=?, director_position=?, budget_per_head=?, total_students=?, total_budget_received=?, budget_received_date=? WHERE id=?");
    $stmt->execute([
        intval($d['province_id']), intval($d['district_id']),
        $d['name'] ?? '', $d['address'] ?? '', $d['phone'] ?? '',
        $d['affiliation'] ?? '', $d['director_name'] ?? '', $d['director_position'] ?? '',
        floatval($d['budget_per_head'] ?? 21), intval($d['total_students'] ?? 0),
        floatval($d['total_budget_received'] ?? 0), $d['budget_received_date'] ?: null,
        $d['id']
    ]);
    jsonResponse(['success' => true, 'message' => 'แก้ไขโรงเรียนสำเร็จ']);
}

function deleteSchool() {
    $id = intval($_GET['id'] ?? 0);
    $db = getDB();
    $db->prepare("DELETE FROM users WHERE school_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM lunch_reports WHERE school_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM budget_notifications WHERE school_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM schools WHERE id = ?")->execute([$id]);
    jsonResponse(['success' => true, 'message' => 'ลบโรงเรียนสำเร็จ']);
}

// === Users ===
function getUsersList() {
    $db = getDB();
    $rows = $db->query("SELECT u.id, u.school_id, u.username, u.full_name, u.role, u.is_active, u.last_login, u.created_at, s.name as school_name FROM users u LEFT JOIN schools s ON u.school_id = s.id ORDER BY u.role, u.full_name")->fetchAll();
    jsonResponse($rows);
}

function addUser() {
    $d = jsonInput();
    $db = getDB();
    if (empty($d['username']) || empty($d['password'])) jsonResponse(['success' => false, 'message' => 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน']);
    if (strlen($d['password']) < 6) jsonResponse(['success' => false, 'message' => 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร']);

    $existing = $db->prepare("SELECT id FROM users WHERE username = ?");
    $existing->execute([$d['username']]);
    if ($existing->fetch()) jsonResponse(['success' => false, 'message' => 'ชื่อผู้ใช้ซ้ำ']);

    $hash = password_hash($d['password'], PASSWORD_BCRYPT, ['cost' => 12]);
    $db->prepare("INSERT INTO users (school_id, username, password_hash, full_name, role) VALUES (?,?,?,?,?)")
       ->execute([$d['school_id'] ?: null, $d['username'], $hash, $d['full_name'] ?? '', $d['role'] ?? 'school']);
    jsonResponse(['success' => true, 'message' => 'เพิ่มผู้ใช้สำเร็จ', 'id' => $db->lastInsertId()]);
}

function updateUser() {
    $d = jsonInput();
    if (empty($d['id'])) jsonResponse(['success' => false, 'message' => 'ไม่พบข้อมูล']);
    $db = getDB();

    $db->prepare("UPDATE users SET full_name=?, role=?, is_active=?, school_id=? WHERE id=?")
       ->execute([$d['full_name'] ?? '', $d['role'] ?? 'school', $d['is_active'] ?? 1, $d['school_id'] ?: null, $d['id']]);

    if (!empty($d['password']) && strlen($d['password']) >= 6) {
        $hash = password_hash($d['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([$hash, $d['id']]);
    }
    jsonResponse(['success' => true, 'message' => 'แก้ไขผู้ใช้สำเร็จ']);
}

function deleteUser() {
    $id = intval($_GET['id'] ?? 0);
    if ($id === 1) jsonResponse(['success' => false, 'message' => 'ไม่สามารถลบ admin หลักได้']);
    $db = getDB();
    $db->prepare("DELETE FROM sessions WHERE user_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);
    jsonResponse(['success' => true, 'message' => 'ลบผู้ใช้สำเร็จ']);
}

// === Budget Notification ===
function notifyBudget() {
    $d = jsonInput();
    $db = getDB();
    $schoolId = intval($d['school_id'] ?? 0);
    $amount = floatval($d['amount'] ?? 0);
    if (!$schoolId || !$amount) jsonResponse(['success' => false, 'message' => 'กรุณาระบุโรงเรียนและจำนวนเงิน']);

    // Update school budget
    $db->prepare("UPDATE schools SET total_budget_received = ?, budget_received_date = CURDATE() WHERE id = ?")
       ->execute([$amount, $schoolId]);

    // Get school name
    $s = $db->prepare("SELECT name FROM schools WHERE id = ?");
    $s->execute([$schoolId]);
    $school = $s->fetch();

    // Create notification
    $msg = "ได้รับงบประมาณอาหารกลางวัน จำนวน " . number_format($amount, 2) . " บาท";
    $db->prepare("INSERT INTO budget_notifications (school_id, amount, message) VALUES (?,?,?)")
       ->execute([$schoolId, $amount, $msg]);

    jsonResponse(['success' => true, 'message' => "แจ้งเตือนงบประมาณไปยัง {$school['name']} สำเร็จ"]);
}

// === Dashboard ===
function adminDashboard() {
    $db = getDB();
    jsonResponse([
        'totalSchools' => $db->query("SELECT COUNT(*) FROM schools")->fetchColumn(),
        'totalUsers' => $db->query("SELECT COUNT(*) FROM users")->fetchColumn(),
        'totalReports' => $db->query("SELECT COUNT(*) FROM lunch_reports")->fetchColumn(),
        'todayReports' => $db->query("SELECT COUNT(*) FROM lunch_reports WHERE date = CURDATE()")->fetchColumn(),
        'totalStudents' => $db->query("SELECT COALESCE(SUM(total_students),0) FROM schools")->fetchColumn(),
        'recentSchools' => $db->query("SELECT s.id, s.name, p.name as province_name, d.name as district_name, s.created_at FROM schools s LEFT JOIN provinces p ON s.province_id = p.id LEFT JOIN districts d ON s.district_id = d.id ORDER BY s.created_at DESC LIMIT 5")->fetchAll(),
    ]);
}
