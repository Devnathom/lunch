import { FileText, Receipt, Wallet, CalendarCheck } from 'lucide-react';

export default function StatsCards({ stats }) {
  const totalReports = stats.totalReports || 0;
  const spentBudget = parseFloat(stats.spentBudget) || 0;
  const remainingBudget = parseFloat(stats.remainingBudget) || 0;
  const remainingDays = stats.remainingDays || 0;

  const cards = [
    { num: totalReports, label: 'จำนวนรายงาน', icon: <FileText size={22} />, cls: 'bg-blue-50 text-blue-700' },
    { num: spentBudget.toLocaleString(), label: 'ใช้ไปแล้ว (บาท)', icon: <Receipt size={22} />, cls: 'bg-orange-50 text-orange-700' },
    { num: remainingBudget.toLocaleString(), label: 'คงเหลือ (บาท)', icon: <Wallet size={22} />, cls: 'bg-green-50 text-green-700', numCls: 'text-green-700' },
    { num: remainingDays, label: 'จัดได้อีก (วัน)', icon: <CalendarCheck size={22} />, cls: 'bg-blue-50 text-blue-700', numCls: 'text-blue-700' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {cards.map((c, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <div className={`text-2xl font-bold leading-tight ${c.numCls || ''}`}>{c.num}</div>
            <div className="text-xs text-[var(--md-text2)] mt-0.5">{c.label}</div>
          </div>
          <div className={`w-11 h-11 rounded-full flex items-center justify-center ${c.cls}`}>{c.icon}</div>
        </div>
      ))}
    </div>
  );
}
