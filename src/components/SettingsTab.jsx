import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { School, Landmark, Settings2, MessageCircle, Save, ImagePlus } from 'lucide-react';
import ThaiDatePicker from './ThaiDatePicker';
import { saveSettings, uploadLogo, testLine, resetBudget } from '../utils/api';
import { fmtNum } from '../utils/thaiDate';

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });

export default function SettingsTab({ settings, onSettingsChange, stats }) {
  const [form, setForm] = useState({
    schoolName: '', directorName: '', directorPosition: '',
    schoolAffiliation: '', schoolAddress: '', schoolPhone: '',
    budgetPerHead: '', totalStudents: '', totalBudgetReceived: '',
    budgetReceivedDate: '', lineChannelToken: '', lineGroupId: '',
    logoUrl: ''
  });
  const [saving, setSaving] = useState(false);
  const [prevBudget, setPrevBudget] = useState('');

  useEffect(() => {
    if (settings) {
      setForm(f => ({ ...f, ...settings }));
      setPrevBudget(settings.totalBudgetReceived || '');
    }
  }, [settings]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { Swal.fire('ไฟล์ใหญ่เกินไป', 'ไม่เกิน 2MB', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      set('logoUrl', ev.target.result);
      Swal.fire({ title: 'กำลังอัปโหลดโลโก้...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        const res = await uploadLogo(ev.target.result, `logo_${Date.now()}.png`);
        Swal.close();
        if (res.data.success) {
          set('logoUrl', res.data.logoUrl);
          Toast.fire({ icon: 'success', title: 'อัปโหลดโลโก้สำเร็จ' });
          onSettingsChange({ ...form, logoUrl: res.data.logoUrl });
        } else Swal.fire('ผิดพลาด', res.data.message, 'error');
      } catch (err) { Swal.close(); Swal.fire('ผิดพลาด', err.message, 'error'); }
    };
    reader.readAsDataURL(file);
  };

  const handleBudgetChange = async (val) => {
    const newVal = parseFloat(val) || 0;
    const result = await Swal.fire({
      title: 'รีเซ็ตงบประมาณ?',
      html: `<div style="font-size:0.9rem;">ยอดงบใหม่ <b>${newVal.toLocaleString()} บาท</b><br>ระบบจะรีเซ็ตและบันทึกทันที<br>ค่าใช้จ่ายก่อนหน้าจะไม่ถูกนับ</div>`,
      icon: 'question', showCancelButton: true,
      confirmButtonColor: 'var(--md-primary)', confirmButtonText: 'รีเซ็ตและบันทึก', cancelButtonText: 'ยกเลิก'
    });
    if (result.isConfirmed) {
      Swal.fire({ title: 'กำลังรีเซ็ตงบประมาณ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        const res = await resetBudget(newVal);
        Swal.close();
        if (res.data.success) {
          Toast.fire({ icon: 'success', title: res.data.message });
          set('totalBudgetReceived', String(newVal));
          setPrevBudget(String(newVal));
          onSettingsChange({ ...form, totalBudgetReceived: String(newVal) });
        } else Swal.fire('ผิดพลาด', res.data.message, 'error');
      } catch (err) { Swal.close(); Swal.fire('ผิดพลาด', err.message, 'error'); }
    } else {
      set('totalBudgetReceived', prevBudget);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveSettings(form);
      if (res.data.success) {
        Toast.fire({ icon: 'success', title: res.data.message });
        onSettingsChange(form);
      } else Swal.fire('ผิดพลาด', res.data.message, 'error');
    } catch (err) { Swal.fire('ผิดพลาด', err.message, 'error'); }
    setSaving(false);
  };

  const handleTestLine = async () => {
    Swal.fire({ title: 'กำลังทดสอบ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      const savRes = await saveSettings({ lineChannelToken: form.lineChannelToken, lineGroupId: form.lineGroupId });
      if (!savRes.data.success) { Swal.fire('ผิดพลาด', savRes.data.message, 'error'); return; }
      const res = await testLine({ lineChannelToken: form.lineChannelToken, lineGroupId: form.lineGroupId });
      Swal.close();
      if (res.data.success) Swal.fire({ icon: 'success', title: res.data.message, confirmButtonColor: '#06c755' });
      else Swal.fire('ทดสอบไม่สำเร็จ', res.data.message, 'warning');
    } catch (err) { Swal.close(); Swal.fire('ผิดพลาด', err.message, 'error'); }
  };

  const costPerDay = (parseFloat(form.budgetPerHead) || 0) * (parseInt(form.totalStudents) || 0);
  const totalBudget = parseFloat(form.totalBudgetReceived) || 0;
  const spentBudget = parseFloat(stats?.spentBudget) || 0;
  const remainingBudget = totalBudget - spentBudget;
  const totalDays = costPerDay > 0 ? Math.floor(totalBudget / costPerDay) : 0;
  const remainingDays = costPerDay > 0 ? Math.floor(remainingBudget / costPerDay) : 0;

  return (
    <div className="row">
      <div className="col-lg-8">
        {/* School Info */}
        <div className="card card-outline card-primary">
          <div className="card-header"><h3 className="card-title"><i className="fas fa-school mr-2"/>ข้อมูลโรงเรียน</h3></div>
          <div className="card-body">
            <div className="text-center mb-3">
              <div style={{width:100,height:100,borderRadius:'50%',border:'2px dashed #adb5bd',margin:'0 auto',overflow:'hidden',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8f9fa'}}
                onClick={()=>document.getElementById('logoInput').click()}>
                {form.logoUrl ? <img src={form.logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none'}}/> : <i className="fas fa-image fa-2x text-muted"/>}
              </div>
              <small className="text-muted">คลิกเพื่ออัปโหลดโลโก้</small>
              <input id="logoInput" type="file" className="d-none" accept="image/*" onChange={handleLogoUpload}/>
            </div>
            <div className="row">
              <div className="col-md-6 form-group"><label>ชื่อโรงเรียน</label><input className="form-control" value={form.schoolName} onChange={e=>set('schoolName',e.target.value)} placeholder="โรงเรียน..."/></div>
              <div className="col-md-6 form-group"><label>ชื่อผู้อำนวยการ</label><input className="form-control" value={form.directorName} onChange={e=>set('directorName',e.target.value)} placeholder="ชื่อ-นามสกุล"/></div>
              <div className="col-md-6 form-group"><label>ตำแหน่ง</label><input className="form-control" value={form.directorPosition} onChange={e=>set('directorPosition',e.target.value)} placeholder="ผู้อำนวยการโรงเรียน"/></div>
              <div className="col-md-6 form-group"><label>สังกัด</label><input className="form-control" value={form.schoolAffiliation} onChange={e=>set('schoolAffiliation',e.target.value)} placeholder="สพป. เชียงใหม่ เขต 1"/></div>
              <div className="col-12 form-group"><label>ที่อยู่โรงเรียน</label><textarea className="form-control" rows={2} value={form.schoolAddress} onChange={e=>set('schoolAddress',e.target.value)} placeholder="ที่อยู่เต็ม..."/></div>
              <div className="col-md-6 form-group"><label>เบอร์โทรศัพท์</label><input className="form-control" value={form.schoolPhone} onChange={e=>set('schoolPhone',e.target.value)} placeholder="0xx-xxx-xxxx"/></div>
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="card card-outline card-success">
          <div className="card-header"><h3 className="card-title"><i className="fas fa-landmark mr-2"/>งบประมาณอาหารกลางวัน</h3></div>
          <div className="card-body">
            <div className="row">
              <div className="col-6 col-md-3 form-group"><label>งบ/หัว (บาท)</label><input type="number" className="form-control" value={form.budgetPerHead} onChange={e=>set('budgetPerHead',e.target.value)} min="0" step="0.01"/></div>
              <div className="col-6 col-md-3 form-group"><label>จำนวน นร. (คน)</label><input type="number" className="form-control" value={form.totalStudents} onChange={e=>set('totalStudents',e.target.value)} min="0"/></div>
              <div className="col-6 col-md-3 form-group"><label>เงินจัดสรร (บาท)</label><input type="number" className="form-control" value={form.totalBudgetReceived} onChange={e=>set('totalBudgetReceived',e.target.value)} onBlur={e=>{if(e.target.value!==prevBudget)handleBudgetChange(e.target.value)}} min="0" step="0.01"/></div>
              <div className="col-6 col-md-3 form-group"><label>วันที่ได้รับเงิน</label><ThaiDatePicker value={form.budgetReceivedDate} onChange={v=>set('budgetReceivedDate',v)}/></div>
            </div>
            <div className="callout callout-info py-2 px-3">
              <small className="text-muted d-block mb-1"><i className="fas fa-calculator mr-1"/>ผลการคำนวณอัตโนมัติ</small>
              <div className="row text-center" style={{fontSize:'.85rem'}}>
                <div className="col-3"><strong>{fmtNum(costPerDay)}</strong><br/><small className="text-muted">บาท/วัน</small></div>
                <div className="col-3"><strong className="text-primary">{totalDays}</strong><br/><small className="text-muted">จัดได้ (วัน)</small></div>
                <div className="col-3"><strong className="text-success">{fmtNum(remainingBudget)}</strong><br/><small className="text-muted">งบคงเหลือ</small></div>
                <div className="col-3"><strong className="text-warning">{remainingDays}</strong><br/><small className="text-muted">เหลืออีก (วัน)</small></div>
              </div>
            </div>
          </div>
        </div>

        {/* LINE */}
        <div className="card card-outline card-warning">
          <div className="card-header"><h3 className="card-title"><i className="fab fa-line mr-2" style={{color:'#06c755'}}/>LINE Messaging API</h3></div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 form-group"><label>Channel Access Token</label><input type="password" className="form-control" value={form.lineChannelToken} onChange={e=>set('lineChannelToken',e.target.value)} placeholder="Channel Access Token"/><small className="text-muted">จาก <a href="https://developers.line.biz/" target="_blank">LINE Developers Console</a></small></div>
              <div className="col-md-6 form-group"><label>Group ID</label><input className="form-control" value={form.lineGroupId} onChange={e=>set('lineGroupId',e.target.value)} placeholder="Group ID ของกลุ่ม LINE"/><small className="text-muted">เชิญ Bot เข้ากลุ่มแล้วดึง Group ID</small></div>
            </div>
            <button type="button" className="btn btn-sm" style={{background:'#06c755',color:'#fff'}} onClick={handleTestLine}><i className="fab fa-line mr-1"/>ทดสอบส่ง LINE</button>
          </div>
        </div>
      </div>

      {/* Right sidebar - save button */}
      <div className="col-lg-4">
        <div className="card card-primary">
          <div className="card-header"><h3 className="card-title"><i className="fas fa-save mr-2"/>บันทึก</h3></div>
          <div className="card-body">
            <p className="text-muted" style={{fontSize:'.85rem'}}>กดปุ่มด้านล่างเพื่อบันทึกการตั้งค่าทั้งหมด</p>
            <button className="btn btn-primary btn-block btn-lg" onClick={handleSave} disabled={saving}>
              <i className={`fas fa-${saving?'spinner fa-spin':'save'} mr-2`}/>{saving?'กำลังบันทึก...':'บันทึกการตั้งค่า'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
