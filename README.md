# ระบบรายงานอาหารกลางวัน (Lunch Report System)

ระบบจัดการและรายงานอาหารกลางวันโรงเรียน พัฒนาด้วย React + Vite (Frontend) และ PHP + MySQL (Backend)

แปลงมาจากระบบ Google Apps Script (Code.gs + index.html) เป็น Full Stack Web Application

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Lucide Icons, SweetAlert2
- **Backend**: PHP 8+, MySQL/MariaDB
- **Font**: Prompt (Thai)

## Features

- CRUD รายงานอาหารกลางวัน (เพิ่ม/แก้ไข/ลบ/ดู)
- อัปโหลดรูปอาหาร (สูงสุด 5 รูป, auto-resize)
- ตารางซื้อสินค้าจากร้านค้าสหกรณ์ + ร้านค้านอก
- สรุปค่าใช้จ่ายจริง & เปรียบเทียบกับงบประมาณ
- สร้างรายงาน PDF (HTML-based)
- ส่งรายงานผ่าน LINE Messaging API
- ปฏิทินไทย (พ.ศ.) Thai Buddhist Era Date Picker
- แดชบอร์ดสรุปงบประมาณ & สถิติ
- รีเซ็ตงบประมาณ
- ตั้งค่าข้อมูลโรงเรียน, งบ, LINE

## Setup

### 1. Database
```bash
mysql -u root -p < database/init.sql
```

### 2. PHP API
แก้ไขไฟล์ `api/config.php` ตั้งค่า database:
```php
$DB_HOST = 'localhost';
$DB_NAME = 'lunch_report';
$DB_USER = 'root';
$DB_PASS = '';
```

รัน PHP built-in server:
```bash
php -S localhost:8080 -t api/
```

### 3. Frontend
```bash
npm install
npm run dev
```

เปิดเว็บที่ `http://localhost:5173`

## Project Structure
```
lunch-app/
├── src/                    # React Frontend
│   ├── App.jsx
│   ├── components/
│   │   ├── StatsCards.jsx
│   │   ├── BudgetBar.jsx
│   │   ├── ReportTable.jsx
│   │   ├── ReportModal.jsx
│   │   ├── PurchaseTable.jsx
│   │   ├── ThaiDatePicker.jsx
│   │   └── SettingsTab.jsx
│   └── utils/
│       ├── api.js
│       └── thaiDate.js
├── api/                    # PHP Backend
│   ├── config.php
│   ├── reports.php
│   ├── settings.php
│   ├── stats.php
│   ├── upload.php
│   ├── upload_logo.php
│   ├── generate_pdf.php
│   ├── reset_budget.php
│   ├── send_line.php
│   ├── test_line.php
│   └── uploads/
├── database/
│   └── init.sql
└── package.json
```

## Developer

พัฒนาโดย **รัชเดช ศรีแก้ว**
- Facebook: [jacknathom](https://www.facebook.com/jacknathom)
- LINE: jacknewd
- Tel: 093-073-2896
