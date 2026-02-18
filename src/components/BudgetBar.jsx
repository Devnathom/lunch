import { Landmark } from 'lucide-react';
import { formatThaiShort } from '../utils/thaiDate';

export default function BudgetBar({ stats }) {
  const totalBudgetReceived = parseFloat(stats.totalBudgetReceived) || 0;
  if (totalBudgetReceived <= 0) return null;

  const spentBudget = parseFloat(stats.spentBudget) || 0;
  const pct = Math.min((spentBudget / totalBudgetReceived) * 100, 100);
  const barColor = pct > 90 ? '#d32f2f' : pct > 70 ? '#ef6c00' : '#1565c0';

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="font-semibold text-sm flex items-center gap-1">
          <Landmark size={16} className="text-[var(--md-primary)]" /> สรุปงบประมาณ
        </div>
        <div className="text-xs text-[var(--md-text2)]">
          {stats.budgetReceivedDate ? `ได้รับเงินวันที่: ${formatThaiShort(stats.budgetReceivedDate)}` : ''}
        </div>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-xs text-[var(--md-text2)] mb-1">
          <span>ใช้ไป <b className="text-[var(--md-text)]">{spentBudget.toLocaleString()}</b> บาท</span>
          <span>จาก <b className="text-[var(--md-text)]">{totalBudgetReceived.toLocaleString()}</b> บาท</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: barColor }} />
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-[var(--md-text2)]">
        <span>👤 {stats.totalStudents || 0} คน</span>
        <span>💰 {Number(stats.budgetPerHead || 0).toLocaleString()} บาท/หัว</span>
        <span>📅 ค่าใช้จ่าย/วัน: <b className="text-[var(--md-text)]">{Number(stats.costPerDay || 0).toLocaleString()}</b> บาท</span>
        <span>📆 จัดได้ทั้งหมด <b className="text-[var(--md-primary)]">{stats.totalCanServeDays || 0}</b> วัน</span>
      </div>
    </div>
  );
}
