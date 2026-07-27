import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw } from 'lucide-react';

export default function RecentTransactions({ recentTxns }) {
  return (
    <div className="neo-card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
         <div className="h3" style={{ fontSize: '20px' }}>Giao dịch gần đây</div>
      </div>
      
      <div style={{ flex: 1, padding: '16px 24px' }}>
        {recentTxns.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentTxns.map((txn, index) => {
              const isBuy = txn.type === 'buy';
              const isDca = txn.type === 'dca';
              const Icon = isBuy ? ArrowDownLeft : isDca ? RefreshCcw : ArrowUpRight;
              const bgColor = isBuy ? 'rgba(16, 185, 129, 0.1)' : isDca ? 'rgba(212, 175, 55, 0.1)' : 'rgba(239, 68, 68, 0.1)';
              const color = isBuy ? 'var(--emerald)' : isDca ? 'var(--gold)' : 'var(--ruby)';
              
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                       <Icon size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{txn.goldTypeName}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{txn.time}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: color, fontVariantNumeric: 'tabular-nums', marginBottom: '2px' }}>
                      {isBuy || isDca ? '+' : '-'}{txn.quantity.toFixed(3)} chỉ
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      ₫{txn.total.toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chưa có giao dịch nào
          </div>
        )}
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <Link to="/history" className="btn btn-outline" style={{ width: '100%', padding: '14px', borderRadius: '12px', textDecoration: 'none', display: 'flex', justifyContent: 'center', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', color: 'var(--gold)' }}>
          Xem toàn bộ lịch sử giao dịch
        </Link>
      </div>
    </div>
  );
}
