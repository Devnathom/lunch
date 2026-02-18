import { useState, useEffect, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';
import html2canvas from 'html2canvas';
import { UtensilsCrossed, Settings, School, LogOut, Bell } from 'lucide-react';
import StatsCards from './components/StatsCards';
import BudgetBar from './components/BudgetBar';
import ReportTable from './components/ReportTable';
import ReportModal from './components/ReportModal';
import SettingsTab from './components/SettingsTab';
import ReportImageTemplate from './components/ReportImageTemplate';
import { formatThaiShort, fmtNum } from './utils/thaiDate';
import * as api from './utils/api';

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('report');
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const searchTimer = useRef(null);
  const imgRef = useRef(null);
  const [imgReport, setImgReport] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { window.location.href = '/login.html'; return; }
    api.getMe().then(r => {
      setUser(r.data.user);
      setAuthed(true);
    }).catch(() => { window.location.href = '/login.html'; });
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rr, sr, str] = await Promise.all([api.getReports(), api.getSettings(), api.getStats()]);
      const rpts = Array.isArray(rr.data) ? rr.data : [];
      setAllReports(rpts); setReports(rpts);
      setSettings(sr.data || {}); setStats(str.data || {});
    } catch (e) { Swal.fire('ผิดพลาด', e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) loadAll(); }, [authed, loadAll]);

  const handleSearch = (q) => {
    setSearchQ(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setReports(allReports); return; }
    searchTimer.current = setTimeout(async () => {
      try { const r = await api.searchReports(q); setReports(Array.isArray(r.data) ? r.data : []); }
      catch { setReports([]); }
    }, 300);
  };

  const handleSaved = async (payload, isEdit) => {
    setLoading(true);
    try {
      const res = isEdit ? await api.updateReport(payload) : await api.addReport(payload);
      if (!res.data.success) { Swal.fire('ผิดพลาด', res.data.message, 'error'); return; }
      setModalOpen(false);
      Toast.fire({ icon: 'success', title: res.data.message });
      await loadAll();
      doPdf({ ...payload, id: res.data.id || payload.id }, true);
    } catch (e) { Swal.fire('ผิดพลาด', e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = (r) => {
    Swal.fire({
      title: 'ยืนยันการลบ?', html: `ลบรายงานวันที่ <b>${r.date}</b>?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#d32f2f', confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก'
    }).then(async res => {
      if (!res.isConfirmed) return;
      setLoading(true);
      try {
        const dr = await api.deleteReport(r.id);
        if (dr.data.success) { Toast.fire({ icon: 'success', title: dr.data.message }); loadAll(); }
        else Swal.fire('ผิดพลาด', dr.data.message, 'error');
      } catch (e) { Swal.fire('ผิดพลาด', e.message, 'error'); }
      finally { setLoading(false); }
    });
  };

  const doPdf = async (r, isAuto = false) => {
    if (r.pdfUrl && !isAuto) {
      Swal.fire({ icon: 'info', title: 'PDF รายงาน',
        html: `<a href="${r.pdfUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:4px;background:#1565c0;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-family:Prompt;">📄 เปิด PDF</a>`,
        confirmButtonText: 'ปิด' });
      return;
    }
    Swal.fire({ title: 'กำลังสร้าง PDF...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
    try {
      const res = await api.generatePdf(r);
      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'สร้าง PDF สำเร็จ!',
          html: `<a href="${res.data.pdfUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:4px;background:#1565c0;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-family:Prompt;">📄 ดาวน์โหลด PDF</a>`,
          confirmButtonText: 'ปิด' }).then(() => { if (isAuto) loadAll(); });
      } else { Swal.fire('ไม่สามารถสร้าง PDF', res.data.message, 'warning'); if (isAuto) loadAll(); }
    } catch (e) { Swal.fire('ผิดพลาด', e.message, 'warning'); if (isAuto) loadAll(); }
  };

  const doImage = async (r) => {
    setImgReport(r);
    await new Promise(res => setTimeout(res, 300));
    if (!imgRef.current) { Swal.fire('ผิดพลาด', 'ไม่สามารถสร้าง template ได้', 'error'); return; }
    Swal.fire({ title: 'กำลังสร้างรูปรายงาน...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
    try {
      const canvas = await html2canvas(imgRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
      const base64 = canvas.toDataURL('image/png');
      const res = await api.uploadImage(base64, `report_${r.date}_${Date.now()}.png`);
      if (res.data.success) {
        const imageUrl = res.data.photoUrl;
        await api.updateReport({ ...r, imageUrl });
        await loadAll();
        Swal.fire({ icon: 'success', title: 'สร้างรูปรายงานสำเร็จ!',
          html: `<img src="${imageUrl}" style="max-width:100%;border-radius:8px;margin-bottom:8px"><br><a href="${imageUrl}" target="_blank" download style="display:inline-flex;align-items:center;gap:4px;background:#1565c0;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-family:Prompt;">📥 ดาวน์โหลดรูป</a>`,
          confirmButtonText: 'ปิด', width: 500 });
      } else { Swal.fire('ผิดพลาด', res.data.message, 'error'); }
    } catch (e) { Swal.fire('ผิดพลาด', e.message, 'error'); }
    finally { setImgReport(null); }
  };

  const doLine = (r) => {
    Swal.fire({
      title: 'ส่งรายงานเข้ากลุ่ม LINE?',
      html: `<div style="text-align:left;font-size:0.9rem">📅 <b>${formatThaiShort(r.date)}</b><br>🍽️ <b>${r.menu}</b></div>`,
      icon: 'question', showCancelButton: true, confirmButtonColor: '#06c755',
      confirmButtonText: '📤 ส่ง LINE', cancelButtonText: 'ยกเลิก'
    }).then(async res => {
      if (!res.isConfirmed) return;
      Swal.fire({ title: 'กำลังสร้างรูป + ส่ง LINE...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
      try {
        let sendData = { ...r };
        if (!r.imageUrl) {
          setImgReport(r);
          await new Promise(res => setTimeout(res, 300));
          if (imgRef.current) {
            const canvas = await html2canvas(imgRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
            const base64 = canvas.toDataURL('image/png');
            const upRes = await api.uploadImage(base64, `report_${r.date}_${Date.now()}.png`);
            if (upRes.data.success) {
              sendData.imageUrl = upRes.data.photoUrl;
              await api.updateReport({ ...r, imageUrl: upRes.data.photoUrl });
            }
          }
          setImgReport(null);
        }
        const lr = await api.sendLine(sendData);
        if (lr.data.success) { Swal.fire({ icon: 'success', title: lr.data.message, confirmButtonColor: '#06c755' }); loadAll(); }
        else Swal.fire('ไม่สำเร็จ', lr.data.message, 'warning');
      } catch (e) { Swal.fire('ผิดพลาด', e.message, 'error'); }
    });
  };

  const doView = (r) => {
    const photos = r.photoUrl ? r.photoUrl.split(',').filter(Boolean) : [];
    Swal.fire({ title: formatThaiShort(r.date), width: 500, confirmButtonText: 'ปิด',
      html: `${photos.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-bottom:8px">${photos.map(u=>`<img src="${u.trim()}" style="width:80px;height:80px;object-fit:cover;border-radius:8px" onerror="this.style.display='none'">`).join('')}</div>`:''}<table style="width:100%;text-align:left;font-size:0.88rem"><tr><td style="color:#757575;padding:4px">🍽️ เมนู</td><td style="font-weight:500">${r.menu}</td></tr><tr><td style="color:#757575;padding:4px">👥 นร.</td><td>${r.studentsFed}/${r.totalStudents} คน</td></tr><tr><td style="color:#757575;padding:4px">💰 งบ/หัว</td><td>${fmtNum(r.budgetPerHead)} บาท</td></tr><tr><td style="color:#757575;padding:4px">💵 งบรวม</td><td>${fmtNum(r.totalBudget)} บาท</td></tr><tr><td style="color:#757575;padding:4px">💸 ใช้จริง</td><td>${fmtNum(r.actualSpent)} บาท</td></tr>${r.note?`<tr><td style="color:#757575;padding:4px">📝</td><td>${r.note}</td></tr>`:''}</table>` });
  };

  const merged = { ...settings, remainingBudget: stats.remainingBudget };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-bg)]">
      {loading && <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-xl flex items-center gap-3 px-4 py-3 z-50"><div className="md-spinner"/><span className="text-sm text-[var(--md-text2)]">กำลังโหลด...</span></div>}

      <header className="bg-[var(--md-primary)] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.logoUrl ? <img src={settings.logoUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white/30" onError={e=>e.target.style.display='none'}/> : <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><School size={20} className="text-white/70"/></div>}
            <div><div className="font-semibold">ระบบรายงานอาหารกลางวัน</div>{settings.schoolName && <div className="text-xs opacity-80">{settings.schoolName}</div>}</div>
          </div>
          <div className="flex items-center gap-2">
            {user && <span className="text-xs opacity-75">{user.fullName}</span>}
            <button onClick={() => { Swal.fire({ title: 'ออกจากระบบ?', icon: 'question', showCancelButton: true, confirmButtonText: 'ออกจากระบบ', cancelButtonText: 'ยกเลิก' }).then(r => { if (r.isConfirmed) api.logout(); }); }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-content-center transition-colors" title="ออกจากระบบ"><LogOut size={16}/></button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-[var(--md-outline)] shadow-sm flex">
        {[['report',<UtensilsCrossed size={18}/>,'รายงานอาหารกลางวัน'],['settings',<Settings size={18}/>,'ตั้งค่า']].map(([id,icon,label])=>(
          <button key={id} onClick={()=>setTab(id)} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-all ${tab===id?'text-[var(--md-primary)] border-[var(--md-primary)]':'text-[var(--md-text2)] border-transparent hover:text-[var(--md-primary)] hover:bg-[var(--md-primary-light)]'}`}>{icon}{label}</button>
        ))}
      </nav>

      {tab === 'report' && (
        <div className="max-w-6xl mx-auto w-full px-4 py-4 pb-10">
          <StatsCards stats={stats}/>
          <BudgetBar stats={stats}/>
          <ReportTable reports={reports} loading={loading} searchQ={searchQ} onSearch={handleSearch}
            onAdd={()=>{setEditData(null);setModalOpen(true);}} onEdit={r=>{setEditData(r);setModalOpen(true);}}
            onDelete={handleDelete} onPdf={doPdf} onLine={doLine} onView={doView} onImage={doImage}/>
        </div>
      )}
      {tab === 'settings' && <SettingsTab settings={merged} onSettingsChange={()=>loadAll()} stats={stats}/>}

      <ReportModal open={modalOpen} onClose={()=>setModalOpen(false)} onSaved={handleSaved} editData={editData} settings={merged}/>

      {imgReport && <ReportImageTemplate ref={imgRef} report={imgReport} settings={settings} />}

      <footer className="bg-[var(--md-primary)] text-white text-center py-4 mt-auto text-sm">
        <div>© {new Date().getFullYear()+543} ระบบรายงานอาหารกลางวัน</div>
        <div>พัฒนาโดย <strong>รัชเดช ศรีแก้ว</strong></div>
      </footer>
    </div>
  );
}
