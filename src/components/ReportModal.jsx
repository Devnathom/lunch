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
    <div className="modal fade show d-block" style={{background:'rgba(0,0,0,.45)',zIndex:1060}}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
        <div className="modal-content" style={{borderRadius:16,border:'none',overflow:'hidden'}}>
          {/* Header */}
          <div className="modal-header border-0 px-4 py-3" style={{background:'linear-gradient(135deg,#1565c0,#0d47a1)'}}>
            <div className="d-flex align-items-center">
              <div style={{width:40,height:40,borderRadius:12,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',marginRight:12}}>
                <i className={`fas fa-${isEdit?'edit':'plus'} text-white`}/>
              </div>
              <div>
                <h5 className="modal-title text-white mb-0" style={{fontWeight:600,fontSize:'1.05rem'}}>{isEdit ? 'แก้ไขรายงาน' : 'เพิ่มรายงานอาหารกลางวัน'}</h5>
                <small style={{color:'rgba(255,255,255,.7)',fontSize:'.75rem'}}>{isEdit ? 'แก้ไขข้อมูลรายงานที่บันทึกไว้' : 'บันทึกข้อมูลอาหารกลางวันประจำวัน'}</small>
              </div>
            </div>
            <button type="button" className="close" onClick={onClose} style={{color:'#fff',opacity:.8,textShadow:'none'}}>
              <i className="fas fa-times"/>
            </button>
          </div>

          <div className="modal-body px-4" style={{background:'#f8f9fa'}}>
            {/* Section: Photo Upload */}
            <div className="modal-section">
              <div className="modal-section-title"><i className="fas fa-camera mr-2" style={{color:'#1565c0'}}/>รูปถ่ายอาหาร <small className="text-muted font-weight-normal">({totalPhotos}/{MAX_PHOTOS})</small></div>
              <div className="photo-upload-zone" onClick={()=>totalPhotos<MAX_PHOTOS&&photoInputRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={handleDrop}
                style={{cursor:totalPhotos>=MAX_PHOTOS?'default':'pointer',borderColor:totalPhotos>=MAX_PHOTOS?'#e0e0e0':'#90caf9'}}>
                <div style={{padding:'20px 0',textAlign:'center'}}>
                  <div style={{width:48,height:48,borderRadius:'50%',background:'#e3f2fd',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                    <i className="fas fa-cloud-upload-alt" style={{fontSize:'1.2rem',color:'#1565c0'}}/>
                  </div>
                  <div style={{fontSize:'.88rem',color:totalPhotos>=MAX_PHOTOS?'#9e9e9e':'#424242',fontWeight:500}}>
                    {totalPhotos>=MAX_PHOTOS?'อัปโหลดครบแล้ว':'คลิกหรือลากรูปอาหารมาวาง'}
                  </div>
                  {totalPhotos<MAX_PHOTOS && <div style={{fontSize:'.75rem',color:'#9e9e9e'}}>รองรับ JPG, PNG (เหลือ {MAX_PHOTOS-totalPhotos} รูป)</div>}
                </div>
              </div>
              <input ref={photoInputRef} type="file" className="d-none" accept="image/*" multiple onChange={e=>{handlePhotos(e.target.files);e.target.value=''}}/>
              {totalPhotos>0 && (
                <div className="d-flex flex-wrap mt-2" style={{gap:'8px'}}>
                  {existingUrls.map((url,i)=>(
                    <div key={`e${i}`} className="photo-preview-item">
                      <img src={url} alt="" onError={e=>e.target.style.display='none'}/>
                      <button className="photo-remove-btn" onClick={()=>setExistingUrls(u=>u.filter((_,idx)=>idx!==i))}><i className="fas fa-times"/></button>
                    </div>
                  ))}
                  {pendingPhotos.map((p,i)=>(
                    <div key={p.id} className="photo-preview-item">
                      <img src={p.base64} alt=""/>
                      <button className="photo-remove-btn" onClick={()=>setPendingPhotos(ps=>ps.filter((_,idx)=>idx!==i))}><i className="fas fa-times"/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Date & Menu */}
            <div className="modal-section">
              <div className="modal-section-title"><i className="fas fa-utensils mr-2" style={{color:'#ef6c00'}}/>ข้อมูลรายงาน</div>
              <div className="row">
                <div className="col-md-4 form-group">
                  <label className="modal-label">วันที่ <span className="text-danger">*</span></label>
                  <ThaiDatePicker value={date} onChange={setDate} />
                </div>
                <div className="col-md-8 form-group">
                  <label className="modal-label">รายการอาหาร <span className="text-danger">*</span></label>
                  <input type="text" className="form-control modal-input" value={menu} onChange={e=>setMenu(e.target.value)} placeholder="เช่น ข้าวผัด, ส้มตำ, น้ำเต้าหู้"/>
                </div>
              </div>
              <div className="row">
                <div className="col-6 col-md-3 form-group">
                  <label className="modal-label">นร.ทั้งหมด <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <div className="input-group-prepend"><span className="input-group-text" style={{background:'#e3f2fd',border:'none',color:'#1565c0'}}><i className="fas fa-users" style={{fontSize:'.8rem'}}/></span></div>
                    <input type="number" className="form-control modal-input" value={totalStudents} onChange={e=>setTotalStudents(e.target.value)} min="0"/>
                  </div>
                </div>
                <div className="col-6 col-md-3 form-group">
                  <label className="modal-label">รับอาหาร <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <div className="input-group-prepend"><span className="input-group-text" style={{background:'#e8f5e9',border:'none',color:'#2e7d32'}}><i className="fas fa-user-check" style={{fontSize:'.8rem'}}/></span></div>
                    <input type="number" className="form-control modal-input" value={studentsFed} onChange={e=>setStudentsFed(e.target.value)} min="0"/>
                  </div>
                </div>
                <div className="col-6 col-md-3 form-group">
                  <label className="modal-label">งบ/หัว (บาท) <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <div className="input-group-prepend"><span className="input-group-text" style={{background:'#fff3e0',border:'none',color:'#ef6c00'}}><i className="fas fa-coins" style={{fontSize:'.8rem'}}/></span></div>
                    <input type="number" className="form-control modal-input" value={budgetPerHead} onChange={e=>setBudgetPerHead(e.target.value)} min="0" step="0.01"/>
                  </div>
                </div>
                <div className="col-6 col-md-3 form-group">
                  <label className="modal-label">งบรวมวันนี้</label>
                  <input type="text" className="form-control modal-input" readOnly value={todayBudget>0?`${todayBudget.toLocaleString()} บาท`:'-'} style={{background:'#f5f5f5',fontWeight:600,color:'#2e7d32'}}/>
                </div>
              </div>

              {/* Budget Quick Info */}
              <div className="row mb-2" style={{margin:'0 -2px'}}>
                {[
                  {label:'ค่าใช้จ่ายวันนี้',value:`${fmtNum(todayBudget)} บ.`,color:'#1565c0',bg:'#e3f2fd',icon:'fas fa-receipt'},
                  {label:'งบคงเหลือ',value:`${fmtNum(remainingBudget)} บ.`,color:'#2e7d32',bg:'#e8f5e9',icon:'fas fa-wallet'},
                  {label:'จัดได้อีก',value:`${daysLeft} วัน`,color:daysLeft<=3?'#d32f2f':daysLeft<=7?'#ef6c00':'#1565c0',bg:daysLeft<=3?'#fce4ec':daysLeft<=7?'#fff3e0':'#e3f2fd',icon:'fas fa-calendar-check'},
                ].map((item,i)=>(
                  <div key={i} className="col-4" style={{padding:'0 2px'}}>
                    <div style={{background:item.bg,borderRadius:10,padding:'10px 8px',textAlign:'center'}}>
                      <i className={item.icon} style={{color:item.color,fontSize:'.85rem'}}/>
                      <div style={{fontSize:'.68rem',color:'#9e9e9e',marginTop:2}}>{item.label}</div>
                      <div style={{fontSize:'.9rem',fontWeight:700,color:item.color}}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Purchase Tables */}
            <div className="modal-section">
              <div className="modal-section-title"><i className="fas fa-shopping-cart mr-2" style={{color:'#2e7d32'}}/>รายการจัดซื้อ</div>
              <PurchaseTable type="coop" items={coopItems} onChange={setCoopItems} />
              <div style={{height:12}}/>
              <PurchaseTable type="ext" items={extItems} onChange={setExtItems} />
            </div>

            {/* Section: Spending Summary */}
            <div className="modal-section">
              <div className="modal-section-title"><i className="fas fa-calculator mr-2" style={{color:'#7b1fa2'}}/>สรุปค่าใช้จ่ายจริง</div>
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #e0e0e0',overflow:'hidden'}}>
                <table className="table table-sm mb-0" style={{fontSize:'.85rem'}}>
                  <tbody>
                    <tr><td className="text-muted border-0 px-3 pt-3"><i className="fas fa-store mr-1" style={{color:'#1565c0'}}/>ร้านค้าสหกรณ์</td><td className="text-right border-0 px-3 pt-3"><strong>{fmtNum(coopTotal)} บาท</strong></td></tr>
                    <tr><td className="text-muted px-3"><i className="fas fa-shopping-bag mr-1" style={{color:'#ef6c00'}}/>ร้านค้านอก</td><td className="text-right px-3"><strong>{fmtNum(extTotal)} บาท</strong></td></tr>
                    <tr style={{background:'#f5f5f5'}}><td className="px-3" style={{fontWeight:600}}><i className="fas fa-receipt mr-1"/>รวมทั้งหมด</td><td className="text-right px-3"><strong style={{fontSize:'1.1rem',color:'#1565c0'}}>{fmtNum(totalSpent)} บาท</strong></td></tr>
                    <tr><td className="text-muted px-3">งบประมาณที่ได้รับ</td><td className="text-right px-3">{fmtNum(todayBudget)} บาท</td></tr>
                    <tr><td className="px-3 pb-3" style={{fontWeight:600}}>ส่วนต่าง</td><td className="text-right px-3 pb-3"><strong style={{color:diff>=0?'#2e7d32':'#c62828',fontSize:'1.05rem'}}>{diff>=0?'+':''}{fmtNum(diff)} บาท</strong></td></tr>
                  </tbody>
                </table>
                {diff<0 && (
                  <div style={{background:'#fce4ec',padding:'8px 16px',fontSize:'.82rem',color:'#c62828',display:'flex',alignItems:'center',gap:6}}>
                    <i className="fas fa-exclamation-triangle"/>ค่าใช้จ่ายเกินงบประมาณ {fmtNum(Math.abs(diff))} บาท!
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            <div className="modal-section">
              <div className="modal-section-title"><i className="fas fa-sticky-note mr-2" style={{color:'#9e9e9e'}}/>หมายเหตุ</div>
              <textarea className="form-control modal-input" value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="รายละเอียดเพิ่มเติม..." style={{borderRadius:10}}/>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 px-4 py-3" style={{background:'#fff'}}>
            <button type="button" className="btn btn-default" onClick={onClose} style={{borderRadius:10,padding:'8px 20px'}}>
              <i className="fas fa-times mr-1"/>ยกเลิก
            </button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving} style={{borderRadius:10,padding:'8px 24px',background:'linear-gradient(135deg,#1565c0,#0d47a1)',border:'none'}}>
              <i className={`fas fa-${saving?'spinner fa-spin':'save'} mr-1`}/>{saving?'กำลังบันทึก...':'บันทึกรายงาน'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
