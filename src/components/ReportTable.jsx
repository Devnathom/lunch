import { useState } from 'react';
import { formatThaiShort } from '../utils/thaiDate';

const PER_PAGE = 10;

export default function ReportTable({
  reports, loading, searchQ, onSearch,
  onAdd, onEdit, onDelete, onPdf, onLine, onView, onImage
}) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(reports.length / PER_PAGE));
  const safeP = Math.min(page, totalPages);
  const paged = reports.slice((safeP - 1) * PER_PAGE, safeP * PER_PAGE);

  const actionBtn = (onClick, icon, tip, color, bg) => (
    <button className="report-action-btn" onClick={onClick} title={tip}
      style={{'--btn-color':color,'--btn-bg':bg}}>
      <i className={icon}/>
    </button>
  );

  return (
    <div className="card report-table-card mb-3">
      {/* Card Header */}
      <div className="card-header border-0">
        <div className="d-flex flex-wrap align-items-center justify-content-between" style={{gap:'10px'}}>
          <div className="d-flex align-items-center" style={{gap:'10px'}}>
            <h3 className="card-title mb-0" style={{fontWeight:600,fontSize:'1rem'}}>
              <i className="fas fa-table mr-2" style={{color:'#1565c0'}}/>รายงานทั้งหมด
            </h3>
            <span className="badge" style={{background:'#e3f2fd',color:'#1565c0',fontSize:'.8rem',padding:'4px 12px',borderRadius:20,fontWeight:600}}>
              {reports.length} รายการ
            </span>
          </div>
          <div className="d-flex align-items-center" style={{gap:'8px'}}>
            <div className="report-search-box">
              <i className="fas fa-search"/>
              <input type="text" placeholder="ค้นหาเมนู, วันที่..." value={searchQ} onChange={e=>{onSearch(e.target.value);setPage(1)}}/>
              {searchQ && <button className="report-search-clear" onClick={()=>onSearch('')}><i className="fas fa-times"/></button>}
            </div>
            <button className="btn btn-primary report-add-btn" onClick={onAdd}>
              <i className="fas fa-plus mr-1"/>เพิ่มรายงาน
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-body table-responsive p-0">
        <table className="table report-table mb-0">
          <thead>
            <tr>
              <th style={{width:40}}>#</th>
              <th style={{width:50}}>รูป</th>
              <th>วันที่</th>
              <th>รายการอาหาร</th>
              <th className="text-center">นร.</th>
              <th className="text-right">งบ/หัว</th>
              <th className="text-right">งบรวม</th>
              <th className="text-right">ใช้จ่ายจริง</th>
              <th className="text-center" style={{width:220}}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r, i) => {
              const urls = r.photoUrl ? r.photoUrl.split(',').filter(Boolean) : [];
              const firstUrl = urls[0]?.trim();
              const spent = parseFloat(r.actualSpent) || 0;
              const budget = parseFloat(r.totalBudget) || 0;
              const overspent = spent > budget && spent > 0;
              const rowIdx = (safeP - 1) * PER_PAGE + i + 1;
              return (
                <tr key={r.id} className="report-row">
                  <td className="text-muted" style={{fontSize:'.8rem'}}>{rowIdx}</td>
                  <td>
                    {firstUrl
                      ? <img src={firstUrl} alt="" className="report-thumb" onError={e=>{e.target.style.display='none'}}/>
                      : <div className="report-thumb-placeholder"><i className="fas fa-utensils"/></div>}
                  </td>
                  <td>
                    <span className="report-date-badge">
                      <i className="far fa-calendar-alt mr-1"/>{formatThaiShort(r.date)}
                    </span>
                  </td>
                  <td style={{maxWidth:220}}>
                    <div className="text-truncate" style={{fontWeight:600,color:'#212121'}}>{r.menu}</div>
                    {r.note && <div className="text-truncate text-muted" style={{fontSize:'.75rem',maxWidth:200}}>{r.note}</div>}
                  </td>
                  <td className="text-center">
                    <span className="badge" style={{background:'#e3f2fd',color:'#1565c0',padding:'4px 8px',borderRadius:12,fontWeight:600,fontSize:'.78rem'}}>
                      {r.studentsFed}/{r.totalStudents}
                    </span>
                  </td>
                  <td className="text-right" style={{fontWeight:500}}>{Number(r.budgetPerHead).toLocaleString()}</td>
                  <td className="text-right">
                    <span style={{fontWeight:700,color:'#2e7d32'}}>{Number(r.totalBudget).toLocaleString()}</span>
                  </td>
                  <td className="text-right">
                    <span style={{fontWeight:700,color:overspent?'#d32f2f':'#212121'}}>
                      {spent > 0 ? Number(r.actualSpent).toLocaleString() : '-'}
                    </span>
                    {overspent && <span className="badge ml-1" style={{background:'#fce4ec',color:'#c62828',fontSize:'.65rem',padding:'2px 6px',borderRadius:10}}>เกินงบ</span>}
                  </td>
                  <td>
                    <div className="d-flex justify-content-center" style={{gap:'4px'}}>
                      {actionBtn(()=>onView(r),'fas fa-eye','ดูรายละเอียด','#1565c0','#e3f2fd')}
                      {actionBtn(()=>onPdf(r),'fas fa-file-pdf','ดาวน์โหลด PDF','#d32f2f','#fce4ec')}
                      {actionBtn(()=>onImage(r),'fas fa-image','สร้างรูปรายงาน','#7b1fa2','#f3e5f5')}
                      {actionBtn(()=>onLine(r),'fab fa-line','ส่ง LINE','#06c755','#e8f5e9')}
                      {actionBtn(()=>onEdit(r),'fas fa-edit','แก้ไข','#ef6c00','#fff3e0')}
                      {actionBtn(()=>onDelete(r),'fas fa-trash-alt','ลบ','#d32f2f','#ffebee')}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {reports.length === 0 && !loading && (
        <div className="card-body text-center py-5">
          <div className="report-empty-icon"><i className="fas fa-utensils"/></div>
          <h5 style={{fontWeight:600,color:'#424242',marginBottom:4}}>ยังไม่มีรายงานอาหารกลางวัน</h5>
          <p className="text-muted mb-3" style={{fontSize:'.88rem'}}>เริ่มต้นบันทึกรายงานอาหารกลางวันวันแรกของคุณ</p>
          <button className="btn btn-primary" onClick={onAdd} style={{borderRadius:20,padding:'8px 24px'}}>
            <i className="fas fa-plus mr-1"/>เพิ่มรายงาน
          </button>
        </div>
      )}

      {/* Footer with pagination */}
      {reports.length > 0 && (
        <div className="card-footer d-flex flex-wrap align-items-center justify-content-between" style={{fontSize:'.85rem',gap:'8px'}}>
          <span className="text-muted">
            แสดง {(safeP-1)*PER_PAGE+1}-{Math.min(safeP*PER_PAGE,reports.length)} จาก {reports.length} รายการ
          </span>
          {totalPages > 1 && (
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item${safeP<=1?' disabled':''}`}>
                <button className="page-link" onClick={()=>setPage(p=>Math.max(1,p-1))}><i className="fas fa-chevron-left" style={{fontSize:'.7rem'}}/></button>
              </li>
              {Array.from({length:totalPages},(_,i)=>i+1).filter(n=>n===1||n===totalPages||Math.abs(n-safeP)<=1).map((n,i,arr)=>{
                const prev=arr[i-1];
                const els=[];
                if(prev&&n-prev>1) els.push(<li key={`d${n}`} className="page-item disabled"><span className="page-link">...</span></li>);
                els.push(<li key={n} className={`page-item${n===safeP?' active':''}`}><button className="page-link" onClick={()=>setPage(n)}>{n}</button></li>);
                return els;
              })}
              <li className={`page-item${safeP>=totalPages?' disabled':''}`}>
                <button className="page-link" onClick={()=>setPage(p=>Math.min(totalPages,p+1))}><i className="fas fa-chevron-right" style={{fontSize:'.7rem'}}/></button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
