export default function StatsCards({ stats }) {
  const totalReports = stats.totalReports || 0;
  const spentBudget = parseFloat(stats.spentBudget) || 0;
  const remainingBudget = parseFloat(stats.remainingBudget) || 0;
  const remainingDays = stats.remainingDays || 0;

  const cards = [
    { num: totalReports, suffix: 'รายการ', label: 'จำนวนรายงาน', icon: 'fas fa-clipboard-list', gradient: 'linear-gradient(135deg,#42a5f5,#1565c0)', shadow: 'rgba(21,101,192,.35)' },
    { num: spentBudget.toLocaleString(), suffix: 'บาท', label: 'ใช้ไปแล้ว', icon: 'fas fa-money-bill-wave', gradient: 'linear-gradient(135deg,#ffa726,#ef6c00)', shadow: 'rgba(239,108,0,.35)' },
    { num: remainingBudget.toLocaleString(), suffix: 'บาท', label: 'คงเหลือ', icon: 'fas fa-wallet', gradient: 'linear-gradient(135deg,#66bb6a,#2e7d32)', shadow: 'rgba(46,125,50,.35)' },
    { num: remainingDays, suffix: 'วัน', label: 'จัดได้อีก', icon: 'fas fa-calendar-check', gradient: 'linear-gradient(135deg,#7e57c2,#4527a0)', shadow: 'rgba(69,39,160,.35)' },
  ];

  return (
    <div className="row">
      {cards.map((c, i) => (
        <div key={i} className="col-lg-3 col-6 mb-3">
          <div className="stats-card" style={{background:c.gradient,boxShadow:`0 4px 20px ${c.shadow}`}}>
            <div className="stats-card-icon"><i className={c.icon}/></div>
            <div className="stats-card-body">
              <div className="stats-card-num">{c.num} <small>{c.suffix}</small></div>
              <div className="stats-card-label">{c.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
