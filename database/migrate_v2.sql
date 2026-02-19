-- ==========================================
-- Lunch Report System v2 - Multi-School
-- Migration Script
-- ==========================================

-- จังหวัด
CREATE TABLE IF NOT EXISTS provinces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- อำเภอ
CREATE TABLE IF NOT EXISTS districts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  province_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  FOREIGN KEY (province_id) REFERENCES provinces(id),
  UNIQUE KEY uq_district (province_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- โรงเรียน
CREATE TABLE IF NOT EXISTS schools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  province_id INT NOT NULL,
  district_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  affiliation VARCHAR(200),
  director_name VARCHAR(100),
  director_position VARCHAR(100),
  logo_url VARCHAR(500) DEFAULT '',
  budget_per_head DECIMAL(10,2) DEFAULT 21.00,
  total_students INT DEFAULT 0,
  total_budget_received DECIMAL(12,2) DEFAULT 0,
  budget_received_date DATE DEFAULT NULL,
  spent_at_reset DECIMAL(12,2) DEFAULT 0,
  line_channel_token TEXT,
  line_group_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (province_id) REFERENCES provinces(id),
  FOREIGN KEY (district_id) REFERENCES districts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ผู้ใช้งาน
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT DEFAULT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role ENUM('admin','school','viewer') NOT NULL DEFAULT 'school',
  is_active TINYINT(1) DEFAULT 1,
  last_login DATETIME DEFAULT NULL,
  login_attempts INT DEFAULT 0,
  locked_until DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- เพิ่ม tambon, moo ใน schools (ถ้ายังไม่มี)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS tambon VARCHAR(100) DEFAULT '' AFTER district_id;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS moo VARCHAR(50) DEFAULT '' AFTER tambon;

-- เพิ่ม school_id ใน lunch_reports (ถ้ายังไม่มี)
ALTER TABLE lunch_reports ADD COLUMN IF NOT EXISTS school_id INT DEFAULT NULL AFTER id;
ALTER TABLE lunch_reports ADD INDEX IF NOT EXISTS idx_school (school_id);

-- แจ้งเตือนงบประมาณ
CREATE TABLE IF NOT EXISTS budget_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  message TEXT,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login sessions
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id INT NOT NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ข้อมูลตัวอย่าง: จังหวัด
INSERT IGNORE INTO provinces (id, name) VALUES
(1, 'กรุงเทพมหานคร'), (2, 'กระบี่'), (3, 'กาญจนบุรี'), (4, 'กาฬสินธุ์'),
(5, 'กำแพงเพชร'), (6, 'ขอนแก่น'), (7, 'จันทบุรี'), (8, 'ฉะเชิงเทรา'),
(9, 'ชลบุรี'), (10, 'ชัยนาท'), (11, 'ชัยภูมิ'), (12, 'ชุมพร'),
(13, 'เชียงราย'), (14, 'เชียงใหม่'), (15, 'ตรัง'), (16, 'ตราด'),
(17, 'ตาก'), (18, 'นครนายก'), (19, 'นครปฐม'), (20, 'นครพนม'),
(21, 'นครราชสีมา'), (22, 'นครศรีธรรมราช'), (23, 'นครสวรรค์'), (24, 'นนทบุรี'),
(25, 'นราธิวาส'), (26, 'น่าน'), (27, 'บึงกาฬ'), (28, 'บุรีรัมย์'),
(29, 'ปทุมธานี'), (30, 'ประจวบคีรีขันธ์'), (31, 'ปราจีนบุรี'), (32, 'ปัตตานี'),
(33, 'พระนครศรีอยุธยา'), (34, 'พะเยา'), (35, 'พังงา'), (36, 'พัทลุง'),
(37, 'พิจิตร'), (38, 'พิษณุโลก'), (39, 'เพชรบุรี'), (40, 'เพชรบูรณ์'),
(41, 'แพร่'), (42, 'ภูเก็ต'), (43, 'มหาสารคาม'), (44, 'มุกดาหาร'),
(45, 'แม่ฮ่องสอน'), (46, 'ยโสธร'), (47, 'ยะลา'), (48, 'ร้อยเอ็ด'),
(49, 'ระนอง'), (50, 'ระยอง'), (51, 'ราชบุรี'), (52, 'ลพบุรี'),
(53, 'ลำปาง'), (54, 'ลำพูน'), (55, 'เลย'), (56, 'ศรีสะเกษ'),
(57, 'สกลนคร'), (58, 'สงขลา'), (59, 'สตูล'), (60, 'สมุทรปราการ'),
(61, 'สมุทรสงคราม'), (62, 'สมุทรสาคร'), (63, 'สระแก้ว'), (64, 'สระบุรี'),
(65, 'สิงห์บุรี'), (66, 'สุโขทัย'), (67, 'สุพรรณบุรี'), (68, 'สุราษฎร์ธานี'),
(69, 'สุรินทร์'), (70, 'หนองคาย'), (71, 'หนองบัวลำภู'), (72, 'อ่างทอง'),
(73, 'อำนาจเจริญ'), (74, 'อุดรธานี'), (75, 'อุตรดิตถ์'), (76, 'อุทัยธานี'),
(77, 'อุบลราชธานี');

-- สร้าง Admin account (password: admin1234)
INSERT IGNORE INTO users (username, password_hash, full_name, role)
VALUES ('admin', '$2y$12$LJ3m4ys3Gp1Z5v8TbQJ1nugJAWyAKx.OWiJbGfWHF8fV8EhqF8Iby', 'ผู้ดูแลระบบ', 'admin');
