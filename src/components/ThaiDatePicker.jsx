import { useState, useRef, useEffect } from 'react';
import { THAI_MONTHS, THAI_MONTHS_SHORT, WEEKDAYS, formatThaiDisplay, todayISO } from '../utils/thaiDate';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export default function ThaiDatePicker({ value, onChange, placeholder = 'เลือกวันที่...' }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewMode, setViewMode] = useState('days');
  const ref = useRef(null);

  useEffect(() => {
    if (value) {
      const p = value.split('-');
      setViewYear(parseInt(p[0]));
      setViewMonth(parseInt(p[1]) - 1);
    }
  }, [value]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = () => {
    if (!open) setViewMode('days');
    setOpen(o => !o);
  };

  const pick = (iso) => { onChange(iso); setOpen(false); };
  const pickToday = () => { pick(todayISO()); };

  const prev = () => {
    if (viewMode === 'days') {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
      else setViewMonth(m => m - 1);
    } else if (viewMode === 'months') setViewYear(y => y - 1);
    else setViewYear(y => y - 12);
  };
  const next = () => {
    if (viewMode === 'days') {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
      else setViewMonth(m => m + 1);
    } else if (viewMode === 'months') setViewYear(y => y + 1);
    else setViewYear(y => y + 12);
  };

  const today = todayISO();
  const thaiYear = viewYear + 543;

  const renderDays = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    const cells = [];

    for (let i = firstDay - 1; i >= 0; i--)
      cells.push(<div key={`p${i}`} className="thai-cal-day other-month">{prevMonthDays - i}</div>);

    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      let cls = 'thai-cal-day';
      if (iso === today) cls += ' today';
      if (iso === value) cls += ' selected';
      cells.push(<div key={iso} className={cls} onClick={() => pick(iso)}>{d}</div>);
    }

    const totalCells = firstDay + daysInMonth;
    const rem = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= rem; i++)
      cells.push(<div key={`n${i}`} className="thai-cal-day other-month">{i}</div>);

    return cells;
  };

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={toggle}
        className="flex items-center gap-2 border border-[var(--md-outline)] rounded-lg px-3 py-2 cursor-pointer bg-white hover:border-[var(--md-primary)] transition-colors text-sm"
      >
        <Calendar size={16} className="text-[var(--md-text2)]" />
        <span className={value ? 'text-[var(--md-text)]' : 'text-[var(--md-text2)]'}>
          {value ? formatThaiDisplay(value) : placeholder}
        </span>
      </div>

      {open && (
        <div className="thai-cal-popup show">
          <div className="thai-cal-header">
            <button type="button" onClick={prev}><ChevronLeft size={18} /></button>
            {viewMode === 'days' && (
              <span className="thai-cal-title" onClick={() => setViewMode('months')}>
                {THAI_MONTHS[viewMonth]} {thaiYear}
              </span>
            )}
            {viewMode === 'months' && (
              <span className="thai-cal-title" onClick={() => setViewMode('years')}>{thaiYear}</span>
            )}
            {viewMode === 'years' && (
              <span className="thai-cal-title">{viewYear - 5 + 543} - {viewYear + 6 + 543}</span>
            )}
            <button type="button" onClick={next}><ChevronRight size={18} /></button>
          </div>

          {viewMode === 'days' && (
            <>
              <div className="thai-cal-weekdays">{WEEKDAYS.map(w => <div key={w}>{w}</div>)}</div>
              <div className="thai-cal-days">{renderDays()}</div>
              <button type="button" className="thai-cal-today-btn" onClick={pickToday}>วันนี้</button>
            </>
          )}

          {viewMode === 'months' && (
            <div className="thai-cal-grid">
              {THAI_MONTHS_SHORT.map((m, i) => (
                <div key={i} className={`thai-cal-grid-item${i === viewMonth ? ' selected' : ''}`}
                  onClick={() => { setViewMonth(i); setViewMode('days'); }}>{m}</div>
              ))}
            </div>
          )}

          {viewMode === 'years' && (
            <div className="thai-cal-grid">
              {Array.from({ length: 12 }, (_, i) => viewYear - 5 + i).map(y => (
                <div key={y} className={`thai-cal-grid-item${y === viewYear ? ' selected' : ''}`}
                  onClick={() => { setViewYear(y); setViewMode('months'); }}>{y + 543}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
