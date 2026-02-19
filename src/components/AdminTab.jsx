import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Building2, Users, MapPin, Plus, Pencil, Trash2, Search, Bell, ChevronDown } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('auth_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });

export default function AdminTab() {
  const [sub, setSub] = useState('schools');
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [dash, setDash] = useState({});
  const [filterProv, setFilterProv] = useState('');
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    api.get('/admin.php?action=provinces').then(r => setProvinces(r.data)).catch(() => {});
    api.get('/admin.php?action=dashboard').then(r => setDash(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (sub === 'districts') loadDistricts();
    if (sub === 'schools') loadSchools();
    if (sub === 'users') loadUsers();
  }, [sub]);

  const loadDistricts = () => api.get('/admin.php?action=districts' + (filterProv ? `&province_id=${filterProv}` : '')).then(r => setDistricts(r.data));
  const loadSchools = () => api.get('/admin.php?action=schools').then(r => setSchools(r.data));
  const loadUsers = () => api.get('/admin.php?action=users').then(r => setUsers(r.data));

  useEffect(() => { if (sub === 'districts') loadDistricts(); }, [filterProv]);

  // --- Add District ---
  const addDistrict = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'เพิ่มอำเภอ', confirmButtonText: 'เพิ่ม', showCancelButton: true, cancelButtonText: 'ยกเลิก',
      html: `<select id="swal-prov" class="swal2-select" style="width:100%;margin-bottom:8px">${provinces.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}</select><input id="swal-name" class="swal2-input" placeholder="ชื่ออำเภอ" style="margin-top:0">`,
      preConfirm: () => ({ province_id: document.getElementById('swal-prov').value, name: document.getElementById('swal-name').value })
    });
    if (!formValues || !formValues.name) return;
    try {
      const r = await api.post('/admin.php?action=districts', formValues);
      if (r.data.success) { Toast.fire({ icon: 'success', title: r.data.message }); loadDistricts(); }
      else Swal.fire('ผิดพลาด', r.data.message, 'error');
    } catch (e) { Swal.fire('ผิดพลาด', e.message, 'error'); }
  };

  const deleteDistrict = (d) => {
    Swal.fire({ title: `ลบอำเภอ ${d.name}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d32f2f', confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' })
      .then(async r => { if (!r.isConfirmed) return; const res = await api.delete(`/admin.php?action=districts&id=${d.id}`); if (res.data.success) { Toast.fire({ icon: 'success', title: res.data.message }); loadDistricts(); } else Swal.fire('ผิดพลาด', res.data.message, 'error'); });
  };

  // --- Load districts from thai_address API ---
  const loadDistrictsForProvince = async (pid) => {
    try {
      const r = await api.get(`/thai_address.php?action=districts&province_id=${pid}`);
      return Array.isArray(r.data) ? r.data : [];
    } catch { return []; }
  };

  // --- Add School ---
  const addSchool = async () => {
    const provOpts = provinces.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    const { value: fv } = await Swal.fire({
      title: 'เพิ่มโรงเรียน', width: 600, confirmButtonText: 'เพิ่ม', showCancelButton: true, cancelButtonText: 'ยกเลิก',
      html: `<div style="text-align:left;font-size:.9rem">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div><label class="small text-muted">จังหวัด</label><select id="s-prov" class="swal2-select" style="width:100%"><option value="">-- เลือกจังหวัด --</option>${provOpts}</select></div>
          <div><label class="small text-muted">อำเภอ</label><input id="s-dist-name" class="swal2-input" list="dist-list" placeholder="พิมพ์หรือเลือกอำเภอ..." style="margin:0;width:100%"><datalist id="dist-list"></datalist></div>
        </div>
        <div style="margin-bottom:8px"><label class="small text-muted">ชื่อโรงเรียน</label><input id="s-name" class="swal2-input" placeholder="โรงเรียน..." style="margin:0;width:100%"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div><label class="small text-muted">ผู้อำนวยการ</label><input id="s-dir" class="swal2-input" placeholder="ชื่อ-นามสกุล" style="margin:0;width:100%"></div>
          <div><label class="small text-muted">ตำแหน่ง</label><input id="s-pos" class="swal2-input" placeholder="ผอ." style="margin:0;width:100%"></div>
        </div>
        <div style="margin-bottom:8px"><label class="small text-muted">สังกัด</label><input id="s-aff" class="swal2-input" placeholder="เช่น สพป.เชียงใหม่ เขต 1" style="margin:0;width:100%"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div><label class="small text-muted">งบ/หัว (บาท)</label><input id="s-bph" type="number" class="swal2-input" value="21" style="margin:0;width:100%"></div>
          <div><label class="small text-muted">จำนวน นร.</label><input id="s-stu" type="number" class="swal2-input" value="0" style="margin:0;width:100%"></div>
        </div>
        <hr><p style="font-weight:600;margin:8px 0 4px">🔑 บัญชีเข้าสู่ระบบ</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div><label class="small text-muted">ชื่อผู้ใช้</label><input id="s-user" class="swal2-input" placeholder="username" style="margin:0;width:100%"></div>
          <div><label class="small text-muted">รหัสผ่าน</label><input id="s-pass" class="swal2-input" placeholder="อย่างน้อย 6 ตัว" style="margin:0;width:100%"></div>
        </div>
      </div>`,
      didOpen: () => {
        const provSel = document.getElementById('s-prov');
        provSel.addEventListener('change', async () => {
          const pid = provSel.value;
          const dl = document.getElementById('dist-list');
          const inp = document.getElementById('s-dist-name');
          dl.innerHTML = ''; inp.value = '';
          if (!pid) return;
          const dists = await loadDistrictsForProvince(pid);
          dl.innerHTML = dists.map(d => `<option value="${d.name}">`).join('');
        });
      },
      preConfirm: () => {
        const name = document.getElementById('s-name').value;
        const prov = document.getElementById('s-prov').value;
        const dist = document.getElementById('s-dist-name').value.trim();
        if (!name) { Swal.showValidationMessage('กรุณากรอกชื่อโรงเรียน'); return false; }
        if (!prov) { Swal.showValidationMessage('กรุณาเลือกจังหวัด'); return false; }
        if (!dist) { Swal.showValidationMessage('กรุณากรอกอำเภอ'); return false; }
        return {
          province_id: prov, district_name: dist,
          name, director_name: document.getElementById('s-dir').value,
          director_position: document.getElementById('s-pos').value,
          affiliation: document.getElementById('s-aff').value,
          budget_per_head: document.getElementById('s-bph').value,
          total_students: document.getElementById('s-stu').value,
          username: document.getElementById('s-user').value,
          password: document.getElementById('s-pass').value
        };
      }
    });
    if (!fv) return;
    try {
      const r = await api.post('/admin.php?action=schools', fv);
      if (r.data.success) { Toast.fire({ icon: 'success', title: r.data.message }); loadSchools(); loadDistricts(); }
      else Swal.fire('ผิดพลาด', r.data.message, 'error');
    } catch (e) { Swal.fire('ผิดพลาด', e.message, 'error'); }
  };

  const deleteSchool = (s) => {
    Swal.fire({ title: `ลบ ${s.name}?`, text: 'รายงานและบัญชีผู้ใช้จะถูกลบด้วย', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d32f2f', confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' })
      .then(async r => { if (!r.isConfirmed) return; const res = await api.delete(`/admin.php?action=schools&id=${s.id}`); if (res.data.success) { Toast.fire({ icon: 'success', title: res.data.message }); loadSchools(); } else Swal.fire('ผิดพลาด', res.data.message, 'error'); });
  };

  // --- Notify Budget ---
  const notifyBudget = async (s) => {
    const { value: amount } = await Swal.fire({
      title: `แจ้งงบประมาณ`, html: `<b>${s.name}</b>`, input: 'number', inputLabel: 'จำนวนเงิน (บาท)',
      inputPlaceholder: 'เช่น 50000', showCancelButton: true, confirmButtonText: 'แจ้งเตือน', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#388e3c',
      inputValidator: v => { if (!v || v <= 0) return 'กรุณากรอกจำนวนเงิน'; }
    });
    if (!amount) return;
    try {
      const r = await api.post('/admin.php?action=notify_budget', { school_id: s.id, amount });
      if (r.data.success) { Toast.fire({ icon: 'success', title: r.data.message }); loadSchools(); }
      else Swal.fire('ผิดพลาด', r.data.message, 'error');
    } catch (e) { Swal.fire('ผิดพลาด', e.message, 'error'); }
  };

  const deleteUser = (u) => {
    Swal.fire({ title: `ลบผู้ใช้ ${u.username}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d32f2f', confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' })
      .then(async r => { if (!r.isConfirmed) return; const res = await api.delete(`/admin.php?action=users&id=${u.id}`); if (res.data.success) { Toast.fire({ icon: 'success', title: res.data.message }); loadUsers(); } else Swal.fire('ผิดพลาด', res.data.message, 'error'); });
  };

  const resetPassword = async (u) => {
    const { value: pw } = await Swal.fire({ title: `รีเซ็ตรหัสผ่าน`, html: `ผู้ใช้: <b>${u.username}</b>`, input: 'text', inputLabel: 'รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)', showCancelButton: true, confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก' });
    if (!pw || pw.length < 6) { if (pw) Swal.fire('ผิดพลาด', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว', 'error'); return; }
    try {
      const r = await api.put('/admin.php?action=users', { id: u.id, full_name: u.full_name, role: u.role, is_active: u.is_active, school_id: u.school_id, password: pw });
      if (r.data.success) Toast.fire({ icon: 'success', title: 'รีเซ็ตรหัสผ่านสำเร็จ' });
    } catch (e) { Swal.fire('ผิดพลาด', e.message, 'error'); }
  };

  const filtered = schools.filter(s => !searchQ || s.name.includes(searchQ) || (s.province_name||'').includes(searchQ) || (s.district_name||'').includes(searchQ));

  const cardCls = 'bg-white rounded-xl shadow-sm p-4 mb-4';
  const btnPri = 'flex items-center gap-1 bg-[var(--md-primary)] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[var(--md-primary-dark)] transition-colors';

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-4 pb-10">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { n: dash.totalSchools || 0, l: 'โรงเรียน', c: 'bg-blue-50 text-blue-700' },
          { n: dash.totalUsers || 0, l: 'ผู้ใช้', c: 'bg-purple-50 text-purple-700' },
          { n: dash.totalReports || 0, l: 'รายงาน', c: 'bg-green-50 text-green-700' },
          { n: dash.todayReports || 0, l: 'รายงานวันนี้', c: 'bg-orange-50 text-orange-700' },
          { n: Number(dash.totalStudents || 0).toLocaleString(), l: 'นักเรียน', c: 'bg-pink-50 text-pink-700' },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-3 text-center ${s.c}`}>
            <div className="text-2xl font-bold">{s.n}</div>
            <div className="text-xs opacity-75">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl shadow-sm p-1">
        {[['schools', <Building2 size={16}/>, 'โรงเรียน'], ['districts', <MapPin size={16}/>, 'อำเภอ'], ['users', <Users size={16}/>, 'ผู้ใช้งาน']].map(([id, icon, label]) => (
          <button key={id} onClick={() => setSub(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${sub === id ? 'bg-[var(--md-primary)] text-white shadow' : 'text-[var(--md-text2)] hover:bg-gray-100'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Schools Tab */}
      {sub === 'schools' && (
        <div className={cardCls}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="ค้นหาโรงเรียน..."
                className="w-full bg-gray-100 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:bg-white focus:shadow-md transition-all" />
            </div>
            <button onClick={addSchool} className={btnPri}><Plus size={16}/> เพิ่มโรงเรียน</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="px-3 py-2">#</th><th className="px-3 py-2">โรงเรียน</th><th className="px-3 py-2">จังหวัด/อำเภอ</th>
                <th className="px-3 py-2">นร.</th><th className="px-3 py-2">งบ/หัว</th><th className="px-3 py-2">รายงาน</th><th className="px-3 py-2">บัญชี</th><th className="px-3 py-2">จัดการ</th>
              </tr></thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{s.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{s.province_name} / {s.district_name}</td>
                    <td className="px-3 py-2">{s.total_students}</td>
                    <td className="px-3 py-2">{s.budget_per_head}</td>
                    <td className="px-3 py-2"><span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{s.report_count}</span></td>
                    <td className="px-3 py-2 text-xs">{s.username || <span className="text-red-500">ยังไม่มี</span>}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button onClick={() => notifyBudget(s)} title="แจ้งงบประมาณ" className="w-7 h-7 rounded-full inline-flex items-center justify-center text-green-600 hover:bg-green-50"><Bell size={14}/></button>
                      <button onClick={() => deleteSchool(s)} title="ลบ" className="w-7 h-7 rounded-full inline-flex items-center justify-center text-red-600 hover:bg-red-50"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-8 text-gray-400">🏫 ยังไม่มีโรงเรียน กดปุ่ม "เพิ่มโรงเรียน"</div>}
          </div>
        </div>
      )}

      {/* Districts Tab */}
      {sub === 'districts' && (
        <div className={cardCls}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <select value={filterProv} onChange={e => setFilterProv(e.target.value)}
              className="bg-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none">
              <option value="">ทุกจังหวัด</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={addDistrict} className={btnPri}><Plus size={16}/> เพิ่มอำเภอ</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="px-3 py-2">#</th><th className="px-3 py-2">อำเภอ</th><th className="px-3 py-2">จังหวัด</th><th className="px-3 py-2">โรงเรียน</th><th className="px-3 py-2">จัดการ</th>
              </tr></thead>
              <tbody>
                {districts.map((d, i) => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{d.name}</td>
                    <td className="px-3 py-2 text-gray-500">{d.province_name}</td>
                    <td className="px-3 py-2"><span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{d.school_count}</span></td>
                    <td className="px-3 py-2">
                      <button onClick={() => deleteDistrict(d)} className="w-7 h-7 rounded-full inline-flex items-center justify-center text-red-600 hover:bg-red-50"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {districts.length === 0 && <div className="text-center py-8 text-gray-400">📍 ยังไม่มีอำเภอ</div>}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {sub === 'users' && (
        <div className={cardCls}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">ผู้ใช้งานทั้งหมด ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="px-3 py-2">#</th><th className="px-3 py-2">ชื่อผู้ใช้</th><th className="px-3 py-2">ชื่อเต็ม</th><th className="px-3 py-2">บทบาท</th>
                <th className="px-3 py-2">โรงเรียน</th><th className="px-3 py-2">สถานะ</th><th className="px-3 py-2">จัดการ</th>
              </tr></thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{u.username}</td>
                    <td className="px-3 py-2">{u.full_name}</td>
                    <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{u.role}</span></td>
                    <td className="px-3 py-2 text-xs text-gray-500">{u.school_name || '-'}</td>
                    <td className="px-3 py-2">{u.is_active ? <span className="text-green-600 text-xs">✓ ใช้งาน</span> : <span className="text-red-600 text-xs">✕ ระงับ</span>}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button onClick={() => resetPassword(u)} title="รีเซ็ตรหัสผ่าน" className="text-xs text-[var(--md-primary)] hover:underline mr-2">รีเซ็ต</button>
                      {u.id !== 1 && <button onClick={() => deleteUser(u)} className="w-7 h-7 rounded-full inline-flex items-center justify-center text-red-600 hover:bg-red-50"><Trash2 size={14}/></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
