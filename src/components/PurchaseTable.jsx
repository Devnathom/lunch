import { useEffect } from 'react';

function emptyRow() {
  return { name: '', unit: 'กก.', qty: '', price: '' };
}

export default function PurchaseTable({ type, items, onChange }) {
  const isCoopType = type === 'coop';
  const label = isCoopType ? 'ร้านค้าสหกรณ์โรงเรียน' : 'ร้านค้าภายนอก';
  const icon = isCoopType ? 'fas fa-store' : 'fas fa-shopping-bag';
  const color = isCoopType ? '#1565c0' : '#ef6c00';
  const bgLight = isCoopType ? '#e3f2fd' : '#fff3e0';

  const total = items.reduce((s, r) => s + (parseFloat(r.price) || 0) * (parseFloat(r.qty) || 0), 0);

  const addRow = () => onChange([...items, emptyRow()]);

  const removeRow = (i) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, idx) => idx !== i));
  };

  const updateRow = (i, field, val) => {
    const next = items.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
    onChange(next);
  };

  useEffect(() => {
    if (items.length === 0) onChange([emptyRow()]);
  }, []);

  return (
    <div style={{border:'1px solid #e0e0e0',borderRadius:12,overflow:'hidden',background:'#fff'}}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between px-3 py-2" style={{background:bgLight}}>
        <div className="d-flex align-items-center" style={{gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:color,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className={icon} style={{color:'#fff',fontSize:'.75rem'}}/>
          </div>
          <span style={{fontWeight:600,fontSize:'.88rem',color}}>{label}</span>
        </div>
        <span style={{fontWeight:700,fontSize:'.88rem',color}}>
          {total.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
        </span>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table purchase-table mb-0" style={{fontSize:'.85rem'}}>
          <thead>
            <tr style={{background:'#fafafa'}}>
              <th className="text-center" style={{width:35,padding:'6px 4px',color:'#9e9e9e',fontWeight:600,fontSize:'.78rem'}}>#</th>
              <th style={{padding:'6px 8px',color:'#757575',fontWeight:600,fontSize:'.78rem'}}>รายการ</th>
              <th className="text-center" style={{width:70,padding:'6px 4px',color:'#757575',fontWeight:600,fontSize:'.78rem'}}>หน่วย</th>
              <th className="text-center" style={{width:70,padding:'6px 4px',color:'#757575',fontWeight:600,fontSize:'.78rem'}}>จำนวน</th>
              <th className="text-center" style={{width:85,padding:'6px 4px',color:'#757575',fontWeight:600,fontSize:'.78rem'}}>ราคา(บาท)</th>
              <th className="text-right" style={{width:90,padding:'6px 8px',color:'#757575',fontWeight:600,fontSize:'.78rem'}}>รวมเงิน</th>
              <th style={{width:32}}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => {
              const rowTotal = (parseFloat(row.price) || 0) * (parseFloat(row.qty) || 0);
              return (
                <tr key={i}>
                  <td className="text-center" style={{padding:'4px',color:'#bdbdbd',fontSize:'.78rem'}}>{i + 1}</td>
                  <td style={{padding:'4px 6px'}}>
                    <input type="text" placeholder="ชื่อรายการ" value={row.name}
                      onChange={e => updateRow(i, 'name', e.target.value)} />
                  </td>
                  <td style={{padding:'4px 4px'}}>
                    <input type="text" placeholder="กก." value={row.unit} style={{ textAlign: 'center' }}
                      onChange={e => updateRow(i, 'unit', e.target.value)} />
                  </td>
                  <td style={{padding:'4px 4px'}}>
                    <input type="number" min="0" step="1" placeholder="0" value={row.qty}
                      onChange={e => updateRow(i, 'qty', e.target.value)} />
                  </td>
                  <td style={{padding:'4px 4px'}}>
                    <input type="number" min="0" step="0.01" placeholder="0" value={row.price}
                      onChange={e => updateRow(i, 'price', e.target.value)} />
                  </td>
                  <td className="text-right" style={{padding:'4px 8px',fontWeight:600,color,fontSize:'.82rem'}}>
                    {rowTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-center" style={{padding:'4px 2px'}}>
                    <button type="button" onClick={() => removeRow(i)} className="purchase-remove-btn" title="ลบรายการ">
                      <i className="fas fa-times"/>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="d-flex align-items-center justify-content-between px-3 py-2" style={{background:'#fafafa',borderTop:'1px solid #f0f0f0'}}>
        <button type="button" onClick={addRow} className="purchase-add-btn" style={{'--accent':color}}>
          <i className="fas fa-plus mr-1" style={{fontSize:'.7rem'}}/>เพิ่มรายการ
        </button>
        <div style={{fontSize:'.85rem'}}>รวม: <strong style={{color}}>{total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong> บาท</div>
      </div>
    </div>
  );
}
