<?php
// Auth helper functions - included by other API files

function getBearerToken() {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $header, $m)) return $m[1];
    return $_GET['token'] ?? $_COOKIE['auth_token'] ?? null;
}

function requireAuth() {
    $token = getBearerToken();
    if (!$token) jsonResponse(['success' => false, 'message' => 'กรุณาเข้าสู่ระบบ'], 401);

    $db = getDB();
    $stmt = $db->prepare("SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > NOW()");
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) jsonResponse(['success' => false, 'message' => 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่'], 401);
    if (!$user['is_active']) jsonResponse(['success' => false, 'message' => 'บัญชีถูกระงับ'], 403);

    return $user;
}

function optionalAuth() {
    $token = getBearerToken();
    if (!$token) return null;
    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > NOW()");
        $stmt->execute([$token]);
        return $stmt->fetch() ?: null;
    } catch (Exception $e) { return null; }
}
