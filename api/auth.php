<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login': doLogin(); break;
    case 'logout': doLogout(); break;
    case 'me': getMe(); break;
    case 'register': registerSchool(); break;
    default: jsonResponse(['error' => 'Invalid action'], 400);
}

function doLogin() {
    $d = jsonInput();
    $username = trim($d['username'] ?? '');
    $password = $d['password'] ?? '';

    if (!$username || !$password) {
        jsonResponse(['success' => false, 'message' => 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน']);
    }

    $db = getDB();

    // Check if account is locked
    $stmt = $db->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง']);
    }

    if (!$user['is_active']) {
        jsonResponse(['success' => false, 'message' => 'บัญชีนี้ถูกระงับการใช้งาน']);
    }

    // Check lock
    if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
        $mins = ceil((strtotime($user['locked_until']) - time()) / 60);
        jsonResponse(['success' => false, 'message' => "บัญชีถูกล็อค กรุณาลองใหม่ใน $mins นาที"]);
    }

    // Verify password
    if (!password_verify($password, $user['password_hash'])) {
        $attempts = $user['login_attempts'] + 1;
        $lock = $attempts >= 5 ? ", locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE)" : "";
        $db->prepare("UPDATE users SET login_attempts = ? $lock WHERE id = ?")->execute([$attempts, $user['id']]);
        $remaining = 5 - $attempts;
        $msg = $remaining > 0 ? "รหัสผ่านไม่ถูกต้อง (เหลืออีก $remaining ครั้ง)" : "บัญชีถูกล็อค 15 นาที";
        jsonResponse(['success' => false, 'message' => $msg]);
    }

    // Reset attempts
    $db->prepare("UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?")->execute([$user['id']]);

    // Create session token
    $token = bin2hex(random_bytes(64));
    $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
    $db->prepare("INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)")
       ->execute([$token, $user['id'], $_SERVER['REMOTE_ADDR'] ?? '', substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500), $expires]);

    // Clean old sessions
    $db->exec("DELETE FROM sessions WHERE expires_at < NOW()");

    // Get school info
    $school = null;
    if ($user['school_id']) {
        $s = $db->prepare("SELECT s.*, p.name as province_name, d.name as district_name FROM schools s LEFT JOIN provinces p ON s.province_id = p.id LEFT JOIN districts d ON s.district_id = d.id WHERE s.id = ?");
        $s->execute([$user['school_id']]);
        $school = $s->fetch();
    }

    jsonResponse([
        'success' => true,
        'message' => 'เข้าสู่ระบบสำเร็จ',
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'fullName' => $user['full_name'],
            'role' => $user['role'],
            'schoolId' => $user['school_id']
        ],
        'school' => $school
    ]);
}

function doLogout() {
    $token = getBearerToken();
    if ($token) {
        getDB()->prepare("DELETE FROM sessions WHERE id = ?")->execute([$token]);
    }
    jsonResponse(['success' => true, 'message' => 'ออกจากระบบสำเร็จ']);
}

function getMe() {
    $auth = requireAuth();
    $db = getDB();
    $school = null;
    if ($auth['school_id']) {
        $s = $db->prepare("SELECT s.*, p.name as province_name, d.name as district_name FROM schools s LEFT JOIN provinces p ON s.province_id = p.id LEFT JOIN districts d ON s.district_id = d.id WHERE s.id = ?");
        $s->execute([$auth['school_id']]);
        $school = $s->fetch();
    }
    jsonResponse([
        'user' => [
            'id' => $auth['id'],
            'username' => $auth['username'],
            'fullName' => $auth['full_name'],
            'role' => $auth['role'],
            'schoolId' => $auth['school_id']
        ],
        'school' => $school
    ]);
}

function registerSchool() {
    $auth = requireAuth();
    if ($auth['role'] !== 'admin') jsonResponse(['success' => false, 'message' => 'ไม่มีสิทธิ์'], 403);

    $d = jsonInput();
    $db = getDB();

    // Create school
    $stmt = $db->prepare("INSERT INTO schools (province_id, district_id, name, address, phone, affiliation, director_name, director_position) VALUES (?,?,?,?,?,?,?,?)");
    $stmt->execute([
        intval($d['provinceId'] ?? 0), intval($d['districtId'] ?? 0),
        $d['schoolName'] ?? '', $d['address'] ?? '', $d['phone'] ?? '',
        $d['affiliation'] ?? '', $d['directorName'] ?? '', $d['directorPosition'] ?? ''
    ]);
    $schoolId = $db->lastInsertId();

    // Create user for school
    $username = $d['username'] ?? '';
    $password = $d['password'] ?? '';
    if (!$username || !$password) jsonResponse(['success' => false, 'message' => 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน']);
    if (strlen($password) < 6) jsonResponse(['success' => false, 'message' => 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร']);

    $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    $db->prepare("INSERT INTO users (school_id, username, password_hash, full_name, role) VALUES (?,?,?,?,?)")
       ->execute([$schoolId, $username, $hash, $d['fullName'] ?? $d['schoolName'], 'school']);

    jsonResponse(['success' => true, 'message' => 'สร้างบัญชีโรงเรียนสำเร็จ', 'schoolId' => $schoolId]);
}

// Helper functions are in auth_helper.php
