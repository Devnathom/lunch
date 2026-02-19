<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_helper.php';

$user = requireAuth();
$schoolId = $user['school_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $db = getDB();
    if ($schoolId) {
        $stmt = $db->prepare("SELECT * FROM budget_notifications WHERE school_id = ? ORDER BY created_at DESC LIMIT 20");
        $stmt->execute([$schoolId]);
    } else {
        $stmt = $db->query("SELECT bn.*, s.name as school_name FROM budget_notifications bn JOIN schools s ON bn.school_id = s.id ORDER BY bn.created_at DESC LIMIT 50");
    }
    jsonResponse($stmt->fetchAll());
} elseif ($method === 'POST') {
    $d = jsonInput();
    if (($d['action'] ?? '') === 'read') {
        $db = getDB();
        $id = intval($d['id'] ?? 0);
        if ($id) {
            $db->prepare("UPDATE budget_notifications SET is_read = 1 WHERE id = ?" . ($schoolId ? " AND school_id = $schoolId" : ""))->execute([$id]);
        } else {
            $db->prepare("UPDATE budget_notifications SET is_read = 1 WHERE school_id = ?")->execute([$schoolId]);
        }
        jsonResponse(['success' => true, 'message' => 'อ่านแล้ว']);
    }
    jsonResponse(['error' => 'Invalid action'], 400);
} else {
    jsonResponse(['error' => 'Method not allowed'], 405);
}
