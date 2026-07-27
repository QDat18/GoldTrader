import React from 'react';
import { Wallet, TrendingUp, Sparkles, Building, Briefcase } from 'lucide-react';

export default function AssetOverview({ totalAssetsValue, unrealizedPnl, unrealizedPercent, pnlColor, pnlSign, wallet, totalGoldValue, totalGoldCost, totalGoldQty }) {
  return (
    <div className="neo-card" style={{ marginBottom: '32px', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '32px 32px 24px', background: 'linear-gradient(180deg, rgba(212,175,55,0.05) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div className="body-sm" style={{ color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={16} color="var(--gold)" />
              Tổng giá trị tài sản (Mark-to-Market)
            </div>
            <div style={{ fontSize: '56px', fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: '16px', letterSpacing: '-1.5px', textShadow: '0 4px 24px rgba(212, 175, 55, 0.4)' }}>
              ₫{totalAssetsValue.toLocaleString('vi-VN')}
            </div>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '99px',
              background: unrealizedPnl >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${unrealizedPnl >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
               <TrendingUp size={16} color={pnlColor} style={{ transform: unrealizedPnl < 0 ? 'scaleY(-1)' : 'none' }} />
               <span style={{ fontSize: '15px', fontWeight: 600, color: pnlColor }}>
                 Lãi/lỗ tạm tính: {pnlSign}₫{unrealizedPnl.toLocaleString('vi-VN')} ({unrealizedPercent > 0 ? '+' : ''}{unrealizedPercent.toFixed(2)}%)
               </span>
            </div>
          </div>

          {unrealizedPercent > 5 && totalGoldQty > 0 && (
            <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '20px', borderRadius: '16px', maxWidth: '320px', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.1)', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={18} color="var(--emerald)" fill="var(--emerald)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Robo Advisor</span>
              </div>
              <div style={{ fontSize: '14px', color: '#e5e7eb', lineHeight: 1.5 }}>Vàng trong kho của bạn đang sinh lời <b style={{color: '#fff'}}>+{unrealizedPercent.toFixed(2)}%</b> so với giá vốn. Đã đạt ngưỡng an toàn, cân nhắc chốt lời một phần!</div>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.06)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ padding: '24px 32px', background: 'var(--bg-card)' }}>
          <div className="body-sm" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wallet size={14} /> Số dư ví VND
          </div>
          <div style={{ fontSize: '20px', color: '#fff', marginTop: '8px', fontWeight: 600 }}>
            ₫{wallet.toLocaleString('vi-VN')}
          </div>
        </div>
        <div style={{ padding: '24px 32px', background: 'var(--bg-card)' }}>
          <div className="body-sm" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={14} /> Tổng Vốn Vàng
          </div>
          <div style={{ fontSize: '20px', color: '#fff', marginTop: '8px', fontWeight: 600 }}>
             ₫{totalGoldCost.toLocaleString('vi-VN')}
          </div>
        </div>
        <div style={{ padding: '24px 32px', background: 'var(--bg-card)' }}>
          <div className="body-sm" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={14} /> Trị giá vàng quy đổi
          </div>
          <div style={{ fontSize: '20px', color: 'var(--gold)', marginTop: '8px', fontWeight: 600 }}>
            ₫{totalGoldValue.toLocaleString('vi-VN')}
          </div>
        </div>
      </div>
    </div>
  );
}
