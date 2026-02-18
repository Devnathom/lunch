import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { X, CloudUpload, PlusCircle, Edit3 } from 'lucide-react';
import ThaiDatePicker from './ThaiDatePicker';
import PurchaseTable from './PurchaseTable';
import { todayISO, fmtNum } from '../utils/thaiDate';
import { uploadImage } from '../utils/api';

const MAX_PHOTOS = 5;
const MAX_WIDTH = 1024;
const JPEG_QUALITY = 0.7;

function resizeImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > MAX_WIDTH) { h = Math.round(h * MAX_WIDTH / w); w = MAX_WIDTH; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ReportModal({ open, onClose, onSaved, editData, settings }) {
  const [date, setDate] = useState(todayISO());
  const [menu, setMenu] = useState('');
  const [totalStudents, setTotalStudents] = useState('');
  const [studentsFed, setStudentsFed] = useState('');
  const [budgetPerHead, setBudgetPerHead] = useState('');
  const [note, setNote] = useState('');
  const [coopItems, setCoopItems] = useState([{ name: '', unit: 'กก.', qty: '', price: '' }]);
  const [extItems, setExtItems] = useState([{ name: '', unit: 'กก.', qty: '', price: '' }]);
  const [existingUrls, setExistingUrls] = useState([]);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef(null);

  const isEdit = !!editData;

  useEffect(() => {
    if (!open) return;
    if (editData) {
      setDate(editData.date || todayISO());
      setMenu(editData.menu || '');
      setTotalStudents(String(editData.totalStudents || ''));
      setStudentsFed(String(editData.studentsFed || ''));
      setBudgetPerHead(String(editData.budgetPerHead || ''));
      setNote(editData.note || '');
      try { setCoopItems(JSON.parse(editData.coopItems || '[]').length ? JSON.parse(editData.coopItems) : [{ name: '', unit: 'กก.', qty: '', price: '' }]); } catch { setCoopItems([{ name: '', unit: 'กก.', qty: '', price: '' }]); }
      try { setExtItems(JSON.parse(editData.externalItems || '[]').length ? JSON.parse(editData.externalItems) : [{ name: '', unit: 'กก.', qty: '', price: '' }]); } catch { setExtItems([{ name: '', unit: 'กก.', qty: '', price: '' }]); }
      setExistingUrls(editData.photoUrl ? editData.photoUrl.split(',').map(u => u.trim()).filter(Boolean) : []);
      setPendingPhotos([]);
    } else {
      setDate(todayISO());
      setMenu('');
      setTotalStudents(String(settings?.totalStudents || ''));
      setStudentsFed(String(settings?.totalStudents || ''));
      setBudgetPerHead(String(settings?.budgetPerHead || ''));
      setNote('');
      setCoopItems([{ name: '', unit: 'กก.', qty: '', price: '' }]);
      setExtItems([{ name: '', unit: 'กก.', qty: '', price: '' }]);
      setExistingUrls([]);
      setPendingPhotos([]);
    }
  }, [open, editData]);

  const fed = parseInt(studentsFed) || 0;
  const perHead = parseFloat(budgetPerHead) || 0;
  const todayBudget = fed * perHead;

  const coopTotal = coopItems.reduce((s, r) => s + (parseFloat(r.price) || 0) * (parseFloat(r.qty) || 0), 0);
  const extTotal = extItems.reduce((s, r) => s + (parseFloat(r.price) || 0) * (parseFloat(r.qty) || 0), 0);
  const totalSpent = coopTotal + extTotal;
  const diff = todayBudget - totalSpent;

  const remainingBudget = parseFloat(settings?.remainingBudget || 0);
  const costPerDay = (parseFloat(settings?.budgetPerHead || 0)) * (parseInt(settings?.totalStudents || 0));
  const afterToday = remainingBudget - todayBudget;
  const daysLeft = costPerDay > 0 ? Math.max(0, Math.floor(afterToday / costPerDay)) : 0;

  const handlePhotos = async (files) => {
    const total = existingUrls.length + pendingPhotos.length;
    const canAdd = MAX_PHOTOS - total;
    if (canAdd <= 0) { Swal.fire('เต็มแล้ว', `อัปโหลดได้สูงสุด ${MAX_PHOTOS} รูป`, 'warning'); return; }
    const toProcess = Array.from(files).slice(0, canAdd);
    const results = await Promise.all(toProcess.map(f => resizeImage(f)));
    setPendingPhotos(prev => [...prev, ...results.map((b, i) => ({ base64: b, id: Date.now() + '_' + i }))]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handlePhotos(e.dataTransfer.files);
  };

  const save = async () => {
    if (!date) { Swal.fire('กรุณาเลือกวันที่', '', 'warning'); return; }
    if (!menu.trim()) { Swal.fire('กรุณากรอกรายการอาหาร', '', 'warning'); return; }
    if (!studentsFed) { Swal.fire('กรุณากรอกจำนวนนักเรียน', '', 'warning'); return; }
    if (!budgetPerHead) { Swal.fire('กรุณากรอกงบประมาณ/หัว', '', 'warning'); return; }

    setSaving(true);
    try {
      let uploadedUrls = [...existingUrls];
      for (let i = 0; i < pendingPhotos.length; i++) {
        const res = await uploadImage(pendingPhotos[i].base64, `lunch_${Date.now()}_${i}.jpg`);
        if (res.data.success) uploadedUrls.push(res.data.photoUrl);
        else throw new Error(res.data.message);
      }

      const payload = {
        id: editData?.id || null,
        date, menu: menu.trim(),
        totalStudents: parseInt(totalStudents) || 0,
        studentsFed: parseInt(studentsFed) || 0,
        budgetPerHead: parseFloat(budgetPerHead) || 0,
        note: note.trim(),
        photoUrl: uploadedUrls.join(','),
        coopItems: JSON.stringify(coopItems.filter(r => r.name || parseFloat(r.price) > 0 || parseFloat(r.qty) > 0)),
        externalItems: JSON.stringify(extItems.filter(r => r.name || parseFloat(r.price) > 0 || parseFloat(r.qty) > 0)),
        actualSpent: totalSpent
      };

      onSaved(payload, isEdit);
    } catch (e) {
      Swal.fire('ผิดพลาด', e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const totalPhotos = existingUrls.length + pendingPhotos.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--md-outline)]">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            {isEdit ? <Edit3 size={20} className="text-orange-500" /> : <PlusCircle size={20} className="text-[var(--md-primary)]" />}
            {isEdit ? 'แก้ไขรายงาน' : 'เพิ่มรายงานอาหารกลางวัน'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="grid grid-cols-1 gap-4">
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-[var(--md-text2)] mb-1">รูปถ่ายอาหาร (สูงสุด {MAX_PHOTOS} รูป)</label>
              <div
                className="border-2 border-dashed border-[var(--md-outline)] rounded-lg p-4 text-center cursor-pointer hover:border-[var(--md-primary)] hover:bg-[var(--md-primary-light)] transition-all"
                onClick={() => photoInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
              >
                <CloudUpload size={28} className="mx-auto text-gray-400 mb-1" />
                <div className="text-sm text-gray-500">คลิกหรือลากไฟล์รูปอาหาร</div>
                <div className="text-xs text-gray-400">
                  {totalPhotos >= MAX_PHOTOS ? `อัปโหลดครบ ${MAX_PHOTOS} รูปแล้ว` : `(เหลืออีก ${MAX_PHOTOS - totalPhotos} รูป)`}
                </div>
              </div>
              <input ref={photoInputRef} type="file" className="hidden" accept="image/*" multiple
                onChange={e => { handlePhotos(e.target.files); e.target.value = ''; }} />
              {totalPhotos > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {existingUrls.map((url, i) => (
                    <div key={`e${i}`} className="photo-thumb">
                      <img src={url} alt="" onError={e => e.target.style.display='none'} />
                      <div className="remove-photo" onClick={() => setExistingUrls(u => u.filter((_,idx) => idx !== i))}>×</div>
                    </div>
                  ))}
                  {pendingPhotos.map((p, i) => (
                    <div key={p.id} className="photo-thumb">
                      <img src={p.base64} alt="" />
                      <div className="remove-photo" onClick={() => setPendingPhotos(ps => ps.filter((_,idx) => idx !== i))}>×</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date & Menu */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--md-text2)] mb-1">วันที่ <span className="text-red-500">*</span></label>
                <ThaiDatePicker value={date} onChange={setDate} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--md-text2)] mb-1">รายการอาหาร <span className="text-red-500">*</span></label>
                <input type="text" value={menu} onChange={e => setMenu(e.target.value)}
                  placeholder="เช่น ข้าวผัด, ส้มตำ, น้ำเต้าหู้"
                  className="w-full border border-[var(--md-outline)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--md-primary)] focus:ring-1 focus:ring-[var(--md-primary)]" />
              </div>
            </div>

            {/* Students & Budget */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--md-text2)] mb-1">นร.ทั้งหมด <span className="text-red-500">*</span></label>
                <input type="number" value={totalStudents} onChange={e => setTotalStudents(e.target.value)} min="0" placeholder="จำนวน"
                  className="w-full border border-[var(--md-outline)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--md-primary)] focus:ring-1 focus:ring-[var(--md-primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--md-text2)] mb-1">รับอาหาร <span className="text-red-500">*</span></label>
                <input type="number" value={studentsFed} onChange={e => setStudentsFed(e.target.value)} min="0" placeholder="จำนวน"
                  className="w-full border border-[var(--md-outline)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--md-primary)] focus:ring-1 focus:ring-[var(--md-primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--md-text2)] mb-1">งบ/หัว (บาท) <span className="text-red-500">*</span></label>
                <input type="number" value={budgetPerHead} onChange={e => setBudgetPerHead(e.target.value)} min="0" step="0.01" placeholder="บาท"
                  className="w-full border border-[var(--md-outline)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--md-primary)] focus:ring-1 focus:ring-[var(--md-primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--md-text2)] mb-1">งบรวม (อัตโนมัติ)</label>
                <input type="text" readOnly value={todayBudget > 0 ? `${todayBudget.toLocaleString()} บาท` : ''}
                  className="w-full border border-[var(--md-outline)] rounded-lg px-3 py-2 text-sm bg-gray-50" />
              </div>
            </div>

            {/* Budget Info Box */}
            <div className="rounded-lg p-3" style={{ background: 'linear-gradient(135deg,#e3f2fd 0%,#f3e5f5 100%)' }}>
              <div className="font-semibold text-sm mb-2 flex items-center gap-1 text-[var(--md-primary)]">
                <span>💰</span> สรุปงบประมาณ
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--md-text2)]">ค่าใช้จ่ายวันนี้</span><span className="font-semibold">{fmtNum(todayBudget)} บาท</span></div>
                <div className="flex justify-between"><span className="text-[var(--md-text2)]">งบคงเหลือ</span><span className="font-semibold text-green-700">{fmtNum(remainingBudget)} บาท</span></div>
                <div className="flex justify-between"><span className="text-[var(--md-text2)]">จัดได้อีก</span>
                  <span className="font-semibold" style={{ color: daysLeft <= 3 ? '#d32f2f' : daysLeft <= 7 ? '#ef6c00' : 'var(--md-primary)' }}>{daysLeft} วัน</span>
                </div>
              </div>
            </div>

            {/* Purchase Tables */}
            <PurchaseTable type="coop" items={coopItems} onChange={setCoopItems} />
            <PurchaseTable type="ext" items={extItems} onChange={setExtItems} />

            {/* Spending Summary */}
            <div className="rounded-lg p-3" style={{ background: 'linear-gradient(135deg,#e3f2fd 0%,#f3e5f5 100%)' }}>
              <div className="font-semibold text-sm mb-2 flex items-center gap-1 text-[var(--md-primary)]">
                <span>🧾</span> สรุปค่าใช้จ่ายจริง
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-[var(--md-text2)]">ร้านค้าสหกรณ์</span><span className="font-semibold">{fmtNum(coopTotal)} บาท</span></div>
                <div className="flex justify-between"><span className="text-[var(--md-text2)]">ร้านค้านอก</span><span className="font-semibold">{fmtNum(extTotal)} บาท</span></div>
                <div className="flex justify-between border-t border-black/10 pt-1 mt-1"><span className="font-semibold">รวมทั้งหมด</span><span className="font-bold text-base">{fmtNum(totalSpent)} บาท</span></div>
                <div className="flex justify-between"><span className="text-[var(--md-text2)]">งบประมาณที่ได้รับ</span><span className="font-semibold">{fmtNum(todayBudget)} บาท</span></div>
                <div className="flex justify-between">
                  <span className="text-[var(--md-text2)]">ส่วนต่าง</span>
                  <span className="font-semibold" style={{ color: diff >= 0 ? '#2e7d32' : '#c62828' }}>
                    {diff >= 0 ? '+' : ''}{fmtNum(diff)} บาท
                  </span>
                </div>
              </div>
              {diff < 0 && (
                <div className="mt-2 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-xs flex items-center gap-1">
                  ⚠️ ค่าใช้จ่ายเกินงบประมาณ {fmtNum(Math.abs(diff))} บาท! (ยังสามารถบันทึกได้)
                </div>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-[var(--md-text2)] mb-1">หมายเหตุ</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="รายละเอียดเพิ่มเติม..."
                className="w-full border border-[var(--md-outline)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--md-primary)] focus:ring-1 focus:ring-[var(--md-primary)] resize-y" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--md-outline)]">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--md-primary)] rounded-lg hover:bg-[var(--md-primary-light)] transition-colors">ยกเลิก</button>
          <button onClick={save} disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-[var(--md-primary)] text-white rounded-lg hover:bg-[var(--md-primary-dark)] transition-colors disabled:opacity-60">
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}
