import React from 'react';
import { Layers } from 'lucide-react';

export default function OwnedGoldList({ ownedGoldList, balances, prices, avgBuyPrice }) {
  if (ownedGoldList.length === 0) return null;
  return (
    <div className="grid-3" style={{ marginBottom: '32px', gap: '20px' }}>
      {ownedGoldList.map(key => {
        const qty = balances[key];
        const targetPrice = prices[key];
        const currentBuyPrice = targetPrice ? targetPrice.buy : avgBuyPrice;
        const val = qty * (currentBuyPrice / 10);
        const name = targetPrice ? targetPrice.name : key;
        return (
          <div key={key} className="neo-card" style={{ padding: '0', overflow: 'hidden' }}>
             <div style={{ padding: '24px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '24px', right: '24px', opacity: 0.1 }}>
                  <Layers size={48} color="var(--gold)" />
                </div>
                <div className="body-sm" style={{ color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 10px var(--gold)' }}></div>
                  {name}
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginTop: '16px', letterSpacing: '-1px' }}>
                  {qty.toFixed(3)} <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0' }}>chỉ</span>
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                  Tương đương {Number((qty * 3.75).toFixed(6))}g
                </div>
             </div>
             <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trị giá tham khảo</span>
                <span style={{ color: 'var(--emerald)', fontWeight: 700, fontSize: '15px' }}>₫{val.toLocaleString('vi-VN')}</span>
             </div>
          </div>
        );
      })}
    </div>
  );
}
