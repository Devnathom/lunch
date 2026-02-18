import { useEffect } from 'react';
import { Plus, X, Store, ShoppingBag } from 'lucide-react';

function emptyRow() {
  return { name: '', unit: 'กก.', qty: '', price: '' };
}

export default function PurchaseTable({ type, items, onChange }) {
  const isCoopType = type === 'coop';
  const label = isCoopType ? 'ตารางที่ 1: ซื้อสินค้าจากร้านค้าสหกรณ์โรงเรียน' : 'ตารางที่ 2: ซื้อสินค้าจากร้านค้านอก';
  const Icon = isCoopType ? Store : ShoppingBag;
  const color = isCoopType ? '#1565c0' : '#ef6c00';

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
    <div className="border border-[var(--md-outline)] rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Icon size={16} style={{ color }} />
          {label}
        </div>
        <span className="font-bold text-sm" style={{ color }}>
          {total.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="purchase-table w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-[var(--md-outline)]">
              <th className="px-2 py-1 text-center text-[var(--md-text2)] font-semibold w-8">#</th>
              <th className="px-2 py-1 text-left text-[var(--md-text2)] font-semibold">รายการ</th>
              <th className="px-2 py-1 text-center text-[var(--md-text2)] font-semibold w-16">หน่วย</th>
              <th className="px-2 py-1 text-center text-[var(--md-text2)] font-semibold w-16">จำนวน</th>
              <th className="px-2 py-1 text-center text-[var(--md-text2)] font-semibold w-20">ราคา(บาท)</th>
              <th className="px-2 py-1 text-right text-[var(--md-text2)] font-semibold w-22">รวมเงิน</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => {
              const rowTotal = (parseFloat(row.price) || 0) * (parseFloat(row.qty) || 0);
              return (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-1 py-1 text-center text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-1 py-1">
                    <input type="text" placeholder="ชื่อรายการ" value={row.name}
                      onChange={e => updateRow(i, 'name', e.target.value)} />
                  </td>
                  <td className="px-1 py-1">
                    <input type="text" placeholder="กก." value={row.unit} style={{ textAlign: 'center' }}
                      onChange={e => updateRow(i, 'unit', e.target.value)} />
                  </td>
                  <td className="px-1 py-1">
                    <input type="number" min="0" step="1" placeholder="0" value={row.qty}
                      onChange={e => updateRow(i, 'qty', e.target.value)} />
                  </td>
                  <td className="px-1 py-1">
                    <input type="number" min="0" step="0.01" placeholder="0" value={row.price}
                      onChange={e => updateRow(i, 'price', e.target.value)} />
                  </td>
                  <td className="px-2 py-1 text-right font-semibold text-[var(--md-primary)] text-xs">
                    {rowTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-1 py-1 text-center">
                    <button type="button" onClick={() => removeRow(i)}
                      className="text-red-600 hover:bg-red-50 rounded-full p-0.5 transition-colors">
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
        <button type="button" onClick={addRow}
          className="flex items-center gap-1 text-[var(--md-primary)] border border-dashed border-[var(--md-primary)] rounded px-2 py-1 text-xs hover:bg-[var(--md-primary-light)] transition-colors">
          <Plus size={13} /> เพิ่มรายการ
        </button>
        <div className="text-sm">รวม: <b>{total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</b> บาท</div>
      </div>
    </div>
  );
}
