import React, { useState, useMemo } from 'react';
import { TrendingUp, Scale, Database, Clock, CalendarDays, Activity } from 'lucide-react';
import useStore from '../../store/useStore';

export default function AdminDashboard() {
  const adminOrders = useStore(state => state.adminOrders);
  const adminInventory = useStore(state => state.adminInventory);
  const goldPrices = useStore(state => state.goldPrices);
  const adminHedges = useStore(state => state.adminHedges);

  const [timeFilter, setTimeFilter] = useState('ALL'); // 'TODAY', 'WEEK', 'MONTH', 'ALL'

  // Function to filter dataset by selected time boundary
  const isWithinTimeFilter = (dateString, filter) => {
    if (filter === 'ALL') return true;
    const date = new Date(dateString);
    const now = new Date();
    
    // Normalize today explicitly to start of day
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (filter === 'TODAY') {
      return date >= startOfToday;
    }
    if (filter === 'WEEK') {
      const day = startOfToday.getDay(); // 0 is Sunday
      const diff = startOfToday.getDate() - day + (day === 0 ? -6 : 1); // Get Monday
      const startOfWeek = new Date(startOfToday.setDate(diff));
      return date >= startOfWeek;
    }
    if (filter === 'MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return date >= startOfMonth;
    }
    return true;
  };

  // Compute Lãi/Lỗ & Metrics based on Orders & Hedges
  const metrics = useMemo(() => {
    let profitBySpread = 0;
    let profitByHedge = 0;
    let sjcVolGrams = 0;
    let revenueVND = 0;

    adminOrders.forEach(o => {
      if (o.status !== 'COMPLETED' && o.status !== 'OK') return;
      if (!isWithinTimeFilter(o.created_at || new Date().toISOString(), timeFilter)) return;
      
      const qty = Number(o.quantity_grams);
      const isSjc = o.gold_type.toLowerCase().includes('sjc');
      
      if (o.order_type.includes('BUY')) {
        revenueVND += Number(o.total_amount_vnd);
        if (isSjc) sjcVolGrams += qty;
        
        // Rough estimate of operational spread profit = Buy Volume * Fixed Spread (example: Assume 500k spread/chi = 133k/g)
        profitBySpread += qty * 133333; // This is purely an analytical estimate for demonstration based strictly off Volume*Spread
      } else if (o.order_type.includes('SELL')) {
        if (isSjc) sjcVolGrams += qty;
        profitBySpread += qty * 133333; 
      }
    });

    if (adminHedges) {
      adminHedges.forEach(h => {
        if (h.status !== 'CLOSED') return;
        if (!isWithinTimeFilter(h.closed_at || new Date().toISOString(), timeFilter)) return;
        profitByHedge += Number(h.pnl_vnd || 0);
      });
    }

    // Vault computation (Overall irrespective of timeframe if we look at current snapshot, but we can just show global Inventory)
    const sjcCount = adminInventory.filter(i => i.gold_type.toLowerCase().includes('sjc') && i.status === 'AVAILABLE').length;
    const pnjCount = adminInventory.filter(i => i.gold_type.toLowerCase().includes('pnj') && i.status === 'AVAILABLE').length;

    return {
      profitBySpread: Math.round(profitBySpread),
      profitByHedge: Math.round(profitByHedge),
      totalProfit: Math.round(profitBySpread + profitByHedge),
      revenueVND: Math.round(revenueVND),
      volumeChi: (sjcVolGrams / 3.75).toFixed(2),
      sjcCount,
      pnjCount,
      totalAssetsGrams: adminInventory.filter(i => i.status === 'AVAILABLE').reduce((ac, cur) => ac + Number(cur.weight_grams), 0)
    };
  }, [adminOrders, adminHedges, adminInventory, timeFilter]);

  
  return (
    <div className="admin-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 className="h2" style={{ margin: 0 }}>Tổng quan hệ thống</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Báo cáo hiệu suất kinh doanh và tài sản vật lý</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
          {['TODAY', 'WEEK', 'MONTH', 'ALL'].map(f => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              style={{
                padding: '8px 16px', background: timeFilter === f ? 'var(--gold-gradient)' : 'transparent',
                color: timeFilter === f ? '#000' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '13px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {f === 'TODAY' ? 'Hôm nay' : f === 'WEEK' ? 'Tuần này' : f === 'MONTH' ? 'Tháng này' : 'Dữ liệu tổng'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="stat-card" style={{ borderTop: '2px solid var(--emerald)' }}>
          <div className="stat-label">LỢI NHUẬN / DOANH THU</div>
          <div className="stat-value" style={{ color: 'var(--emerald)' }}>+ ₫{(metrics.totalProfit).toLocaleString('vi-VN')}</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Doanh thu thu về: ₫{(metrics.revenueVND).toLocaleString('vi-VN')}</div>
        </div>
        
        <div className="stat-card" style={{ borderTop: '2px solid rgba(255,255,255,0.2)' }}>
          <div className="stat-label">HIỆU SUẤT KHỚP LỆNH CHÊNH LỆCH</div>
          <div className="stat-value">₫{metrics.profitBySpread.toLocaleString('vi-VN')}</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Mô phỏng biên độ phí giao dịch (Spread)</div>
        </div>

        <div className="stat-card" style={{ borderTop: '2px solid #3b82f6' }}>
          <div className="stat-label">LỢI NHUẬN HEDGING</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{metrics.profitByHedge > 0 ? '+' : ''}₫{metrics.profitByHedge.toLocaleString('vi-VN')}</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Realized PnL từ vị thế đóng</div>
        </div>

        <div className="stat-card" style={{ borderTop: '2px solid var(--gold)' }}>
          <div className="stat-label">GIAO DỊCH THỂ TÍCH SJC</div>
          <div className="stat-value gold-text">{metrics.volumeChi} chỉ</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Mua/Bán thành công phân bổ mốc</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Tồn Kho Vàng */}
        <div className="neo-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={20} color="var(--gold)" />
            <h3 className="h3" style={{ fontSize: '18px', margin: 0 }}>Tổng quan Kho Lưu Ký Vật Lý</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'conic-gradient(var(--gold) 0% 60%, rgba(255,255,255,0.1) 60% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)', position: 'relative' }}>
                <div style={{ width: '80px', height: '80px', background: 'var(--bg-card)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{(metrics.totalAssetsGrams / 37.5).toFixed(1)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Lượng</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Dòng Vàng Miếng SJC</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{metrics.sjcCount} Thỏi khả dụng</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Dòng Vang PNJ</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{metrics.pnjCount} Lượng khả dụng</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Tổng trọng lượng Net</span>
                  <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{metrics.totalAssetsGrams.toFixed(2)} gram</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bảng Điện Chiếu Giá */}
        <div className="neo-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="var(--emerald)" />
            <h3 className="h3" style={{ fontSize: '18px', margin: 0 }}>Bảng Điện Chiếu Giá Thị Trường</h3>
          </div>
          <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', marginTop: '16px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Loại Vàng</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Giá Mua Vào</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Giá Bán Ra</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(goldPrices).map((key, i) => (
                  <tr key={key} style={{ borderBottom: i === Object.keys(goldPrices).length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{goldPrices[key].name}</td>
                    <td style={{ padding: '16px', color: 'var(--emerald)' }}>₫{goldPrices[key].buy.toLocaleString('vi-VN')}</td>
                    <td style={{ padding: '16px', color: 'var(--ruby)' }}>₫{goldPrices[key].sell.toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
