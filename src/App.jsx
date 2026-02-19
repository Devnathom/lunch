import { useState, useEffect, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';
import html2canvas from 'html2canvas';
import { UtensilsCrossed, Settings, School, LogOut, Bell, ShieldCheck } from 'lucide-react';
import AdminTab from './components/AdminTab';
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
  const isAdmin = user?.role === 'admin';
  const pageTitle = { report: 'รายงานอาหารกลางวัน', settings: 'ตั้งค่าระบบ', admin: 'จัดการระบบ' }[tab] || '';

  if (!authed) return <div className="d-flex justify-content-center align-items-center" style={{minHeight:'100vh'}}><div className="spinner-border text-primary" /></div>;

  return (
    <div className="wrapper">
      {/* Navbar */}
      <nav className="main-header navbar navbar-expand navbar-dark" style={{background:'linear-gradient(135deg,#1565c0,#0d47a1)'}}>
        <ul className="navbar-nav">
          <li className="nav-item"><a className="nav-link" data-widget="pushmenu" href="#" role="button"><i className="fas fa-bars"/></a></li>
          <li className="nav-item d-none d-sm-inline-block"><span className="nav-link" style={{fontWeight:600}}>{settings.schoolName || 'ระบบรายงานอาหารกลางวัน'}</span></li>
        </ul>
        <ul className="navbar-nav ml-auto">
          {user && <li className="nav-item d-none d-md-block"><span className="nav-link"><i className="fas fa-user-circle mr-1"/>{user.fullName}</span></li>}
          <li className="nav-item">
            <a className="nav-link" href="#" role="button" title="ออกจากระบบ" onClick={e=>{e.preventDefault();Swal.fire({title:'ออกจากระบบ?',icon:'question',showCancelButton:true,confirmButtonText:'ออกจากระบบ',cancelButtonText:'ยกเลิก'}).then(r=>{if(r.isConfirmed)api.logout()})}}>
              <i className="fas fa-sign-out-alt"/>
            </a>
          </li>
        </ul>
      </nav>

      {/* Sidebar */}
      <aside className="main-sidebar sidebar-dark-primary elevation-4" style={{background:'linear-gradient(180deg,#0d47a1,#1a237e)'}}>
        <a href="/app.html" className="brand-link text-center" style={{borderBottom:'1px solid rgba(255,255,255,.1)'}}>
          {settings.logoUrl
            ? <img src={settings.logoUrl} alt="" className="brand-image img-circle elevation-3" style={{opacity:.9}} onError={e=>{e.target.style.display='none'}}/>
            : <i className="fas fa-utensils" style={{fontSize:'1.5rem',opacity:.8}}/>}
          <span className="brand-text font-weight-light" style={{fontSize:'.9rem'}}>อาหารกลางวัน</span>
        </a>
        <div className="sidebar">
          <div className="user-panel mt-3 pb-3 mb-3 d-flex" style={{borderBottom:'1px solid rgba(255,255,255,.1)'}}>
            <div className="image"><i className="fas fa-user-circle fa-2x text-light" style={{opacity:.7}}/></div>
            <div className="info"><span className="d-block text-light" style={{fontSize:'.85rem'}}>{user?.fullName}</span><small className="text-light" style={{opacity:.5}}>{isAdmin?'ผู้ดูแลระบบ':'โรงเรียน'}</small></div>
          </div>
          <nav className="mt-2">
            <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu">
              <li className="nav-item">
                <a href="#" className={`nav-link${tab==='report'?' active':''}`} onClick={e=>{e.preventDefault();setTab('report')}}>
                  <i className="nav-icon fas fa-clipboard-list"/><p>รายงาน</p>
                </a>
              </li>
              <li className="nav-item">
                <a href="#" className={`nav-link${tab==='settings'?' active':''}`} onClick={e=>{e.preventDefault();setTab('settings')}}>
                  <i className="nav-icon fas fa-cog"/><p>ตั้งค่า</p>
                </a>
              </li>
              {isAdmin && <li className="nav-item">
                <a href="#" className={`nav-link${tab==='admin'?' active':''}`} onClick={e=>{e.preventDefault();setTab('admin')}}>
                  <i className="nav-icon fas fa-shield-alt"/><p>จัดการระบบ</p>
                </a>
              </li>}
              <li className="nav-header" style={{color:'rgba(255,255,255,.4)'}}>ลิงก์</li>
              <li className="nav-item">
                <a href="/" className="nav-link" target="_blank"><i className="nav-icon fas fa-globe"/><p>หน้าหลัก</p></a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Content Wrapper */}
      <div className="content-wrapper" style={{background:'#f4f6f9'}}>
        <div className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6"><h1 className="m-0" style={{fontSize:'1.3rem'}}><i className={`fas fa-${tab==='report'?'clipboard-list':tab==='settings'?'cog':'shield-alt'} mr-2`} style={{color:'#1565c0'}}/>{pageTitle}</h1></div>
              <div className="col-sm-6"><ol className="breadcrumb float-sm-right"><li className="breadcrumb-item"><a href="/app.html">หน้าหลัก</a></li><li className="breadcrumb-item active">{pageTitle}</li></ol></div>
            </div>
          </div>
        </div>

        <section className="content">
          <div className="container-fluid">
            {loading && <div className="overlay-wrapper" style={{position:'fixed',bottom:20,right:20,zIndex:1050}}><div className="badge badge-primary p-2"><i className="fas fa-sync fa-spin mr-1"/>กำลังโหลด...</div></div>}

            {tab === 'report' && <>
              <StatsCards stats={stats}/>
              <BudgetBar stats={stats}/>
              <ReportTable reports={reports} loading={loading} searchQ={searchQ} onSearch={handleSearch}
                onAdd={()=>{setEditData(null);setModalOpen(true)}} onEdit={r=>{setEditData(r);setModalOpen(true)}}
                onDelete={handleDelete} onPdf={doPdf} onLine={doLine} onView={doView} onImage={doImage}/>
            </>}
            {tab === 'settings' && <SettingsTab settings={merged} onSettingsChange={()=>loadAll()} stats={stats}/>}
            {tab === 'admin' && isAdmin && <AdminTab />}
          </div>
        </section>
      </div>

      <ReportModal open={modalOpen} onClose={()=>setModalOpen(false)} onSaved={handleSaved} editData={editData} settings={merged}/>
      {imgReport && <ReportImageTemplate ref={imgRef} report={imgReport} settings={settings} />}

      <footer className="main-footer text-center" style={{fontSize:'.85rem'}}>
        <strong>© {new Date().getFullYear()+543} ระบบรายงานอาหารกลางวัน</strong> — พัฒนาโดย รัชเดช ศรีแก้ว
      </footer>
    </div>
  );
}
