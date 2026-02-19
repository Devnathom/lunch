import { formatThaiShort } from '../utils/thaiDate';

export default function BudgetBar({ stats }) {
  const totalBudgetReceived = parseFloat(stats.totalBudgetReceived) || 0;
  if (totalBudgetReceived <= 0) return null;

  const spentBudget = parseFloat(stats.spentBudget) || 0;
  const remainingBudget = parseFloat(stats.remainingBudget) || 0;
  const pct = Math.min((spentBudget / totalBudgetReceived) * 100, 100);
  const barColor = pct > 90 ? '#dc3545' : pct > 70 ? '#ffc107' : '#1565c0';

  const infoItems = [
    { icon: 'fas fa-users', color: '#1565c0', value: stats.totalStudents || 0, label: 'นักเรียน' },
    { icon: 'fas fa-coins', color: '#ef6c00', value: `${Number(stats.budgetPerHead || 0).toLocaleString()}`, label: 'บาท/หัว' },
    { icon: 'fas fa-receipt', color: '#d32f2f', value: `${Number(stats.costPerDay || 0).toLocaleString()}`, label: 'บาท/วัน' },
    { icon: 'fas fa-calendar-check', color: '#2e7d32', value: stats.totalCanServeDays || 0, label: 'จัดได้ (วัน)' },
  ];

  return (
    <div className="card budget-card mb-3">
      <div className="card-header border-0 pb-0">
        <div className="d-flex align-items-center justify-content-between">
          <h3 className="card-title mb-0" style={{fontWeight:600,fontSize:'1rem'}}>
            <i className="fas fa-landmark mr-2" style={{color:'#1565c0'}}/>สรุปงบประมาณ
          </h3>
          {stats.budgetReceivedDate && (
            <span className="badge" style={{background:'#e3f2fd',color:'#1565c0',fontWeight:500,fontSize:'.78rem',padding:'5px 10px',borderRadius:20}}>
              <i className="fas fa-calendar-alt mr-1"/>ได้รับเงิน: {formatThaiShort(stats.budgetReceivedDate)}
            </span>
          )}
        </div>
      </div>
      <div className="card-body pt-3">
        {/* Progress section */}
        <div className="d-flex justify-content-between align-items-end mb-2">
          <div>
            <small className="text-muted d-block" style={{fontSize:'.75rem'}}>ใช้ไปแล้ว</small>
            <span style={{fontSize:'1.3rem',fontWeight:700,color:barColor}}>{spentBudget.toLocaleString()}</span>
            <small className="text-muted ml-1">บาท</small>
          </div>
          <div className="text-right">
            <small className="text-muted d-block" style={{fontSize:'.75rem'}}>งบทั้งหมด</small>
            <span style={{fontSize:'1.3rem',fontWeight:700,color:'#424242'}}>{totalBudgetReceived.toLocaleString()}</span>
            <small className="text-muted ml-1">บาท</small>
          </div>
        </div>
        <div className="progress mb-1" style={{height:12,borderRadius:6,background:'#f0f0f0'}}>
          <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
            style={{width:`${pct}%`,background:barColor,borderRadius:6,transition:'width .6s ease'}}/>
        </div>
        <div className="d-flex justify-content-between mb-3" style={{fontSize:'.75rem'}}>
          <span className="text-muted">{pct.toFixed(1)}% ใช้ไป</span>
          <span style={{color:'#2e7d32',fontWeight:600}}>คงเหลือ {remainingBudget.toLocaleString()} บาท</span>
        </div>

        {/* Info grid */}
        <div className="row">
          {infoItems.map((item, i) => (
            <div key={i} className="col-6 col-md-3 mb-2">
              <div className="budget-info-item">
                <div className="budget-info-icon" style={{background:`${item.color}15`,color:item.color}}>
                  <i className={item.icon}/>
                </div>
                <div>
                  <div style={{fontSize:'1.05rem',fontWeight:700,color:'#212121',lineHeight:1.2}}>{item.value}</div>
                  <div style={{fontSize:'.72rem',color:'#9e9e9e'}}>{item.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
