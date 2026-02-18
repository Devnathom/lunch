-- ==========================================
-- ระบบรายงานอาหารกลางวัน - Database Schema
-- MySQL / MariaDB
-- ==========================================

CREATE DATABASE IF NOT EXISTS lunch_report
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lunch_report;

-- ==========================================
-- ตาราง Settings (key-value)
-- ==========================================
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ค่าเริ่มต้น
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
  ('schoolName', ''),
  ('directorName', ''),
  ('directorPosition', ''),
  ('schoolAffiliation', ''),
  ('schoolAddress', ''),
  ('schoolPhone', ''),
  ('logoUrl', ''),
  ('budgetPerHead', '21'),
  ('totalBudgetReceived', '0'),
  ('totalStudents', '0'),
  ('budgetReceivedDate', ''),
  ('spentAtReset', '0'),
  ('lineChannelToken', ''),
  ('lineGroupId', '');

-- ==========================================
-- ตาราง LunchReports
-- ==========================================
CREATE TABLE IF NOT EXISTS lunch_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  menu VARCHAR(500) NOT NULL DEFAULT '',
  totalStudents INT NOT NULL DEFAULT 0,
  studentsFed INT NOT NULL DEFAULT 0,
  budgetPerHead DECIMAL(10,2) NOT NULL DEFAULT 0,
  totalBudget DECIMAL(10,2) NOT NULL DEFAULT 0,
  photoUrl TEXT,
  note TEXT,
  createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  coopItems JSON,
  externalItems JSON,
  actualSpent DECIMAL(10,2) NOT NULL DEFAULT 0,
  pdfUrl VARCHAR(500) DEFAULT '',
  imageUrl VARCHAR(500) DEFAULT '',
  INDEX idx_date (date),
  INDEX idx_created (createdDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
