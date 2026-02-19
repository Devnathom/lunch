<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_helper.php';

$user = requireAuth();
$schoolId = $user['school_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $db = getDB();
    if ($schoolId) {
        $stmt = $db->prepare("SELECT s.*, p.name as province_name, d.name as district_name FROM schools s LEFT JOIN provinces p ON s.province_id = p.id LEFT JOIN districts d ON s.district_id = d.id WHERE s.id = ?");
        $stmt->execute([$schoolId]);
        $school = $stmt->fetch();
        if ($school) {
            jsonResponse([
                'schoolName' => $school['name'],
                'directorName' => $school['director_name'],
                'directorPosition' => $school['director_position'],
                'schoolAffiliation' => $school['affiliation'],
                'schoolAddress' => $school['address'],
                'schoolPhone' => $school['phone'],
                'logoUrl' => $school['logo_url'],
                'budgetPerHead' => $school['budget_per_head'],
                'totalStudents' => $school['total_students'],
                'totalBudgetReceived' => $school['total_budget_received'],
                'budgetReceivedDate' => $school['budget_received_date'],
                'spentAtReset' => $school['spent_at_reset'],
                'lineChannelToken' => $school['line_channel_token'],
                'lineGroupId' => $school['line_group_id'],
                'provinceName' => $school['province_name'],
                'districtName' => $school['district_name'],
            ]);
        }
    }
    // Fallback for admin without school
    $rows = $db->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
    $settings = [];
    foreach ($rows as $r) $settings[$r['setting_key']] = $r['setting_value'];
    jsonResponse($settings);

} elseif ($method === 'POST') {
    $d = jsonInput();
    $db = getDB();
    if ($schoolId) {
        $map = [
            'schoolName' => 'name', 'directorName' => 'director_name', 'directorPosition' => 'director_position',
            'schoolAffiliation' => 'affiliation', 'schoolAddress' => 'address', 'schoolPhone' => 'phone',
            'logoUrl' => 'logo_url', 'budgetPerHead' => 'budget_per_head', 'totalStudents' => 'total_students',
            'totalBudgetReceived' => 'total_budget_received', 'budgetReceivedDate' => 'budget_received_date',
            'spentAtReset' => 'spent_at_reset', 'lineChannelToken' => 'line_channel_token', 'lineGroupId' => 'line_group_id',
        ];
        $sets = []; $vals = [];
        foreach ($d as $key => $value) {
            $col = $map[$key] ?? null;
            if ($col) { $sets[] = "$col = ?"; $vals[] = $value; }
        }
        if ($sets) {
            $vals[] = $schoolId;
            $db->prepare("UPDATE schools SET " . implode(',', $sets) . " WHERE id = ?")->execute($vals);
        }
        jsonResponse(['success' => true, 'message' => 'บันทึกการตั้งค่าสำเร็จ']);
    }
    // Fallback for admin
    foreach ($d as $key => $value) {
        $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)")
           ->execute([$key, $value ?? '']);
    }
    jsonResponse(['success' => true, 'message' => 'บันทึกการตั้งค่าสำเร็จ']);
} else {
    jsonResponse(['error' => 'Method not allowed'], 405);
}
