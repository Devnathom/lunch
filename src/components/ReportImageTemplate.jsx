import { forwardRef } from 'react';
import { toThaiDate, fmtNum } from '../utils/thaiDate';

const ReportImageTemplate = forwardRef(({ report, settings }, ref) => {
  const schoolName = settings?.schoolName || 'โรงเรียน';
  const directorName = settings?.directorName || '';
  const directorPosition = settings?.directorPosition || '';
  const schoolAffiliation = settings?.schoolAffiliation || '';
  const schoolAddress = settings?.schoolAddress || '';
  const logoUrl = settings?.logoUrl || '';

  const budgetPerHead = parseFloat(report?.budgetPerHead) || 0;
  const studentsFed = parseInt(report?.studentsFed) || 0;
  const totalStudents = parseInt(report?.totalStudents) || 0;
  const totalBudget = budgetPerHead * studentsFed;
  const actualSpent = parseFloat(report?.actualSpent) || 0;
  const diff = totalBudget - actualSpent;

  let coopItems = [];
  let extItems = [];
  try { coopItems = JSON.parse(report?.coopItems || '[]'); } catch {}
  try { extItems = JSON.parse(report?.externalItems || '[]'); } catch {}
  const coopTotal = coopItems.reduce((s, r) => s + (parseFloat(r.price) || 0) * (parseFloat(r.qty) || 0), 0);
  const extTotal = extItems.reduce((s, r) => s + (parseFloat(r.price) || 0) * (parseFloat(r.qty) || 0), 0);

  const photos = report?.photoUrl ? report.photoUrl.split(',').map(u => u.trim()).filter(Boolean) : [];

  const fN = (n) => Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div ref={ref} style={{
      width: 800, minHeight: 1000, background: '#fff', fontFamily: 'Prompt, sans-serif',
      padding: '40px 50px', boxSizing: 'border-box', position: 'absolute', left: '-9999px', top: 0
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        {logoUrl && <img src={logoUrl} alt="" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }} crossOrigin="anonymous" />}
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1565c0' }}>{schoolName}</div>
        {schoolAddress && <div style={{ fontSize: 12, color: '#757575', marginTop: 2 }}>{schoolAddress}</div>}
        {schoolAffiliation && <div style={{ fontSize: 12, color: '#757575' }}>{schoolAffiliation}</div>}
      </div>

      {/* Title */}
      <div style={{ background: 'linear-gradient(135deg, #1565c0, #0d47a1)', color: '#fff', borderRadius: 12, padding: '14px 20px', textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>รายงานอาหารกลางวัน</div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>ประจำวันที่ {toThaiDate(report?.date)}</div>
      </div>

      {/* Menu */}
      <div style={{ background: '#f5f5f5', borderRadius: 10, padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 28 }}>🍽️</span>
        <div>
          <div style={{ fontSize: 11, color: '#757575' }}>รายการอาหาร</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{report?.menu || '-'}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { icon: '👥', label: 'นร.ทั้งหมด', value: `${totalStudents} คน`, bg: '#e3f2fd' },
          { icon: '🍱', label: 'รับอาหาร', value: `${studentsFed} คน`, bg: '#e8f5e9' },
          { icon: '💰', label: 'งบ/หัว', value: `${fN(budgetPerHead)} บาท`, bg: '#fff3e0' },
          { icon: '💵', label: 'งบรวม', value: `${fN(totalBudget)} บาท`, bg: '#fce4ec' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 10, color: '#757575' }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {photos.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt="" crossOrigin="anonymous" style={{ width: photos.length === 1 ? 360 : 170, height: photos.length === 1 ? 240 : 130, objectFit: 'cover', borderRadius: 10, border: '2px solid #e0e0e0' }}
              onError={e => { e.target.style.display = 'none'; }} />
          ))}
        </div>
      )}

      {/* Purchase Tables */}
      {coopItems.length > 0 && coopItems.some(r => r.name) && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1565c0', marginBottom: 4 }}>🏪 ร้านค้าสหกรณ์โรงเรียน</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#e3f2fd' }}>
                <th style={{ padding: '4px 6px', border: '1px solid #bbdefb', textAlign: 'left' }}>รายการ</th>
                <th style={{ padding: '4px 6px', border: '1px solid #bbdefb', width: 50 }}>จำนวน</th>
                <th style={{ padding: '4px 6px', border: '1px solid #bbdefb', width: 60 }}>ราคา</th>
                <th style={{ padding: '4px 6px', border: '1px solid #bbdefb', width: 70, textAlign: 'right' }}>รวม</th>
              </tr>
            </thead>
            <tbody>
              {coopItems.filter(r => r.name).map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: '3px 6px', border: '1px solid #e0e0e0' }}>{item.name}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #e0e0e0', textAlign: 'center' }}>{item.qty} {item.unit}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #e0e0e0', textAlign: 'right' }}>{fN(item.price)}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #e0e0e0', textAlign: 'right', fontWeight: 600 }}>{fN((parseFloat(item.price) || 0) * (parseFloat(item.qty) || 0))}</td>
                </tr>
              ))}
              <tr style={{ background: '#e3f2fd' }}>
                <td colSpan={3} style={{ padding: '4px 6px', border: '1px solid #bbdefb', fontWeight: 600, textAlign: 'right' }}>รวม</td>
                <td style={{ padding: '4px 6px', border: '1px solid #bbdefb', fontWeight: 700, textAlign: 'right', color: '#1565c0' }}>{fN(coopTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {extItems.length > 0 && extItems.some(r => r.name) && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#ef6c00', marginBottom: 4 }}>🛒 ร้านค้านอก</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#fff3e0' }}>
                <th style={{ padding: '4px 6px', border: '1px solid #ffe0b2', textAlign: 'left' }}>รายการ</th>
                <th style={{ padding: '4px 6px', border: '1px solid #ffe0b2', width: 50 }}>จำนวน</th>
                <th style={{ padding: '4px 6px', border: '1px solid #ffe0b2', width: 60 }}>ราคา</th>
                <th style={{ padding: '4px 6px', border: '1px solid #ffe0b2', width: 70, textAlign: 'right' }}>รวม</th>
              </tr>
            </thead>
            <tbody>
              {extItems.filter(r => r.name).map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: '3px 6px', border: '1px solid #e0e0e0' }}>{item.name}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #e0e0e0', textAlign: 'center' }}>{item.qty} {item.unit}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #e0e0e0', textAlign: 'right' }}>{fN(item.price)}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #e0e0e0', textAlign: 'right', fontWeight: 600 }}>{fN((parseFloat(item.price) || 0) * (parseFloat(item.qty) || 0))}</td>
                </tr>
              ))}
              <tr style={{ background: '#fff3e0' }}>
                <td colSpan={3} style={{ padding: '4px 6px', border: '1px solid #ffe0b2', fontWeight: 600, textAlign: 'right' }}>รวม</td>
                <td style={{ padding: '4px 6px', border: '1px solid #ffe0b2', fontWeight: 700, textAlign: 'right', color: '#ef6c00' }}>{fN(extTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1565c0', marginBottom: 8 }}>🧾 สรุปค่าใช้จ่าย</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#757575' }}>สหกรณ์</span><span style={{ fontWeight: 600 }}>{fN(coopTotal)} บาท</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#757575' }}>ร้านนอก</span><span style={{ fontWeight: 600 }}>{fN(extTotal)} บาท</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600 }}>ใช้จ่ายรวม</span><span style={{ fontWeight: 700, fontSize: 14 }}>{fN(actualSpent)} บาท</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#757575' }}>งบวันนี้</span><span style={{ fontWeight: 600 }}>{fN(totalBudget)} บาท</span></div>
        </div>
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span style={{ fontWeight: 600 }}>ส่วนต่าง</span>
          <span style={{ fontWeight: 700, color: diff >= 0 ? '#2e7d32' : '#c62828' }}>{diff >= 0 ? '+' : ''}{fN(diff)} บาท</span>
        </div>
      </div>

      {/* Note */}
      {report?.note && (
        <div style={{ background: '#fffde7', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 10 }}>
          📝 {report.note}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '2px solid #1565c0', paddingTop: 10, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {directorName && <div style={{ fontSize: 12, fontWeight: 600 }}>{directorName}</div>}
          {directorPosition && <div style={{ fontSize: 10, color: '#757575' }}>{directorPosition}</div>}
        </div>
        <div style={{ textAlign: 'right', fontSize: 10, color: '#9e9e9e' }}>
          <div>ระบบรายงานอาหารกลางวัน</div>
          <div>{schoolName}</div>
        </div>
      </div>
    </div>
  );
});

ReportImageTemplate.displayName = 'ReportImageTemplate';
export default ReportImageTemplate;
