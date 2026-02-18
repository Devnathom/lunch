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

  const inputCls = "w-full border border-[var(--md-outline)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--md-primary)] focus:ring-1 focus:ring-[var(--md-primary)]";
  const cardCls = "bg-white rounded-xl shadow-sm p-5 mb-4";
  const titleCls = "font-semibold text-base mb-4 flex items-center gap-2 text-[var(--md-text)]";
  const labelCls = "block text-sm font-medium text-[var(--md-text2)] mb-1";

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl pb-10">

      {/* School Info */}
      <div className={cardCls}>
        <div className={titleCls}>
          <School size={18} className="text-[var(--md-primary)]" /> ข้อมูลโรงเรียน
        </div>

        {/* Logo */}
        <div className="text-center mb-4">
          <div
            className="w-28 h-28 rounded-full mx-auto border-2 border-dashed border-[var(--md-outline)] flex items-center justify-center cursor-pointer overflow-hidden hover:border-[var(--md-primary)] transition-colors"
            onClick={() => document.getElementById('logoInput').click()}
          >
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="logo" className="w-full h-full object-cover"
                onError={e => { e.target.style.display='none'; }} />
            ) : (
              <ImagePlus size={32} className="text-gray-300" />
            )}
          </div>
          <div className="text-xs text-[var(--md-text2)] mt-1">คลิกเพื่ออัปโหลดโลโก้โรงเรียน</div>
          <input id="logoInput" type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
        </div>

        <div className="border-t border-[var(--md-outline)] mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className={labelCls}>ชื่อโรงเรียน</label>
            <input className={inputCls} value={form.schoolName} onChange={e => set('schoolName', e.target.value)} placeholder="โรงเรียน..." /></div>
          <div><label className={labelCls}>ชื่อผู้อำนวยการ / ครูใหญ่</label>
            <input className={inputCls} value={form.directorName} onChange={e => set('directorName', e.target.value)} placeholder="ชื่อ-นามสกุล" /></div>
          <div><label className={labelCls}>ตำแหน่ง</label>
            <input className={inputCls} value={form.directorPosition} onChange={e => set('directorPosition', e.target.value)} placeholder="เช่น ผู้อำนวยการโรงเรียน" /></div>
          <div><label className={labelCls}>สังกัด</label>
            <input className={inputCls} value={form.schoolAffiliation} onChange={e => set('schoolAffiliation', e.target.value)} placeholder="เช่น สพป. เชียงใหม่ เขต 1" /></div>
          <div className="md:col-span-2"><label className={labelCls}>ที่อยู่โรงเรียน</label>
            <textarea className={inputCls + " resize-y"} rows={2} value={form.schoolAddress} onChange={e => set('schoolAddress', e.target.value)} placeholder="ที่อยู่เต็ม..." /></div>
          <div><label className={labelCls}>เบอร์โทรศัพท์</label>
            <input className={inputCls} value={form.schoolPhone} onChange={e => set('schoolPhone', e.target.value)} placeholder="0xx-xxx-xxxx" /></div>
        </div>
      </div>

      {/* Budget */}
      <div className={cardCls}>
        <div className={titleCls}>
          <Landmark size={18} className="text-[var(--md-primary)]" /> งบประมาณอาหารกลางวัน
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div><label className={labelCls}>งบประมาณ/หัว (บาท)</label>
            <input type="number" className={inputCls} value={form.budgetPerHead} onChange={e => set('budgetPerHead', e.target.value)} min="0" step="0.01" placeholder="เช่น 21" /></div>
          <div><label className={labelCls}>จำนวนนักเรียน (คน)</label>
            <input type="number" className={inputCls} value={form.totalStudents} onChange={e => set('totalStudents', e.target.value)} min="0" placeholder="จำนวน" /></div>
          <div><label className={labelCls}>เงินที่ได้รับจัดสรร (บาท)</label>
            <input type="number" className={inputCls} value={form.totalBudgetReceived}
              onChange={e => set('totalBudgetReceived', e.target.value)}
              onBlur={e => { if (e.target.value !== prevBudget) handleBudgetChange(e.target.value); }}
              min="0" step="0.01" placeholder="จำนวนเงิน" /></div>
          <div><label className={labelCls}>วันที่ได้รับเงิน</label>
            <ThaiDatePicker value={form.budgetReceivedDate} onChange={v => set('budgetReceivedDate', v)} /></div>
        </div>
        <div className="border-t border-[var(--md-outline)] mb-3" />
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs font-semibold mb-2 flex items-center gap-1 text-[var(--md-primary)]">
            🧮 ผลการคำนวณ (อัตโนมัติ)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div><div className="text-[var(--md-text2)] text-xs">ค่าใช้จ่าย/วัน</div><div className="font-semibold">{fmtNum(costPerDay)} บาท</div></div>
            <div><div className="text-[var(--md-text2)] text-xs">จัดอาหารได้</div><div className="font-semibold text-[var(--md-primary)]">{totalDays} วัน</div></div>
            <div><div className="text-[var(--md-text2)] text-xs">งบที่เหลือ</div><div className="font-semibold text-green-700">{fmtNum(remainingBudget)} บาท</div></div>
            <div><div className="text-[var(--md-text2)] text-xs">จัดได้อีก</div><div className="font-semibold text-orange-600">{remainingDays} วัน</div></div>
          </div>
        </div>
      </div>

      {/* LINE */}
      <div className={cardCls}>
        <div className={titleCls}>
          <span style={{ color: '#06c755', fontSize: 18 }}>💬</span> LINE Messaging API
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelCls}>Channel Access Token</label>
            <input type="password" className={inputCls} value={form.lineChannelToken} onChange={e => set('lineChannelToken', e.target.value)} placeholder="ใส่ Channel Access Token" />
            <div className="text-xs text-[var(--md-text2)] mt-1">จาก <a href="https://developers.line.biz/" target="_blank" className="text-[var(--md-primary)]">LINE Developers Console</a> → Messaging API</div>
          </div>
          <div>
            <label className={labelCls}>Group ID (กลุ่มที่จะส่ง)</label>
            <input className={inputCls} value={form.lineGroupId} onChange={e => set('lineGroupId', e.target.value)} placeholder="ใส่ Group ID ของกลุ่ม LINE" />
            <div className="text-xs text-[var(--md-text2)] mt-1">เชิญ Bot เข้ากลุ่มแล้วดึง Group ID จาก Webhook event</div>
          </div>
        </div>
        <button type="button" onClick={handleTestLine}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2"
          style={{ background: '#06c755' }}>
          📤 ทดสอบส่ง LINE
        </button>
      </div>

      {/* Save */}
      <div className="text-right">
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2 bg-[var(--md-primary)] text-white font-medium rounded-lg hover:bg-[var(--md-primary-dark)] transition-colors disabled:opacity-60 flex items-center gap-2 ml-auto">
          <Save size={16} /> {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );
}
