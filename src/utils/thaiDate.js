export const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
export const THAI_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
  'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
export const WEEKDAYS = ['อา','จ','อ','พ','พฤ','ศ','ส'];

export function formatThaiDisplay(isoStr) {
  if (!isoStr) return 'เลือกวันที่...';
  const p = isoStr.split('-');
  const d = parseInt(p[2]);
  const m = parseInt(p[1]) - 1;
  const y = parseInt(p[0]) + 543;
  return `${d} ${THAI_MONTHS[m]} ${y}`;
}

export function formatThaiShort(isoStr) {
  if (!isoStr) return '-';
  const p = isoStr.split('-');
  const d = parseInt(p[2]);
  const m = parseInt(p[1]) - 1;
  const y = parseInt(p[0]) + 543;
  return `${d} ${THAI_MONTHS_SHORT[m]} ${y}`;
}

export function toThaiDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    const y = parseInt(parts[0]) + 543;
    const m = parseInt(parts[1]) - 1;
    const d = parseInt(parts[2]);
    return `${d} ${THAI_MONTHS[m]} พ.ศ. ${y}`;
  } catch { return dateStr; }
}

export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}

export function fmtNum(n) {
  const parts = Number(n || 0).toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
