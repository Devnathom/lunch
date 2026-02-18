import { Search, Plus, Eye, Pencil, Trash2, FileText, MessageCircle } from 'lucide-react';
import { formatThaiShort, fmtNum } from '../utils/thaiDate';
import Swal from 'sweetalert2';

export default function ReportTable({
  reports, loading, searchQ, onSearch,
  onAdd, onEdit, onDelete, onPdf, onLine, onView
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--md-outline)] flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-text2)]" />
          <input
            type="text" value={searchQ} onChange={e => onSearch(e.target.value)}
            placeholder="ค้นหาวันที่, เมนู, หมายเหตุ..."
            className="w-full bg-gray-100 border-none rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:bg-white focus:shadow-md transition-all"
          />
        </div>
        <button onClick={onAdd}
          className="flex items-center gap-2 bg-[var(--md-primary)] text-white px-4 py-2 rounded-2xl text-sm font-medium shadow-md hover:bg-[var(--md-primary-dark)] transition-colors">
          <Plus size={18} /> เพิ่มรายงาน
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--md-outline)]">
              {['#','รูป','วันที่','รายการอาหาร','นร.รับอาหาร','งบ/หัว','งบรวม','ค่าใช้จ่ายจริง','จัดการ'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium text-[var(--md-text2)] uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((r, i) => {
              const urls = r.photoUrl ? r.photoUrl.split(',').filter(Boolean) : [];
              const firstUrl = urls[0]?.trim();
              const overspent = parseFloat(r.actualSpent) > parseFloat(r.totalBudget) && parseFloat(r.actualSpent) > 0;
              return (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-3 py-2">
                    {firstUrl ? (
                      <div className="relative inline-block">
                        <img src={firstUrl} alt="" className="w-11 h-11 rounded-lg object-cover cursor-pointer hover:scale-110 transition-transform"
                          onError={e => { e.target.style.display = 'none'; }} />
                        {urls.length > 1 && <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[0.6rem] px-1 rounded">+{urls.length-1}</span>}
                      </div>
                    ) : <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-lg">🍽️</div>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">{formatThaiShort(r.date)}</td>
                  <td className="px-3 py-2 font-medium max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">{r.menu}</td>
                  <td className="px-3 py-2">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{r.studentsFed}/{r.totalStudents}</span>
                  </td>
                  <td className="px-3 py-2">{Number(r.budgetPerHead).toLocaleString()}</td>
                  <td className="px-3 py-2 font-medium text-green-700">{Number(r.totalBudget).toLocaleString()}</td>
                  <td className="px-3 py-2 font-medium">
                    {parseFloat(r.actualSpent) > 0 ? Number(r.actualSpent).toLocaleString() : '-'}
                    {overspent && <span className="ml-1 bg-red-50 text-red-700 text-[0.65rem] px-1.5 py-0.5 rounded font-semibold">เกินงบ!</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <IconBtn onClick={() => onPdf(r)} title="สร้าง PDF" cls="text-red-600 hover:bg-red-50"><FileText size={16} /></IconBtn>
                    <IconBtn onClick={() => onLine(r)} title="ส่ง LINE" cls="text-[#06c755] hover:bg-green-50"><MessageCircle size={16} /></IconBtn>
                    <IconBtn onClick={() => onView(r)} title="ดู" cls="text-[var(--md-primary)] hover:bg-[var(--md-primary-light)]"><Eye size={16} /></IconBtn>
                    <IconBtn onClick={() => onEdit(r)} title="แก้ไข" cls="text-orange-500 hover:bg-orange-50"><Pencil size={16} /></IconBtn>
                    <IconBtn onClick={() => onDelete(r)} title="ลบ" cls="text-red-600 hover:bg-red-50"><Trash2 size={16} /></IconBtn>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {reports.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-5xl mb-2">📭</div>
          <p className="text-[var(--md-text2)] text-sm">ยังไม่มีรายงานอาหารกลางวัน<br /><small>กดปุ่ม &quot;เพิ่มรายงาน&quot; เพื่อเริ่มบันทึก</small></p>
        </div>
      )}
      {reports.length > 0 && (
        <div className="px-4 py-2 text-xs text-[var(--md-text2)]">แสดงทั้งหมด {reports.length} รายการ</div>
      )}
    </div>
  );
}

function IconBtn({ onClick, title, cls, children }) {
  return (
    <button onClick={onClick} title={title}
      className={`w-8 h-8 rounded-full inline-flex items-center justify-center transition-colors ${cls}`}>
      {children}
    </button>
  );
}
