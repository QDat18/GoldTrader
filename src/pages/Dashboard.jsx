import React from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore';
import { Clock, AlertTriangle, ShieldCheck, TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react';

export default function Dashboard() {
  const user = useStore(state => state.currentUser);
  const prices = useStore(state => state.goldPrices);
  const balances = useStore(state => state.goldBalances);
  const wallet = useStore(state => state.walletBalance);
  const transactions = useStore(state => state.transactions);

  const sjcValue = balances.sjc * prices.sjc.sell;
  const pnjValue = balances.pnj * prices.pnj.sell;
  const dojiValue = balances.doji * prices.doji.sell;
  const totalGoldValue = sjcValue + pnjValue + dojiValue;
  
  // Real calculation would rely on average purchase price * quantity
  // For now, if no gold, totalInvested is 0. 
  const totalInvested = 0; 
  const pnlVal = totalInvested > 0 ? totalGoldValue - totalInvested : 0;
  const pnlPercent = totalInvested > 0 ? (pnlVal / totalInvested) * 100 : 0;
  const pnlSign = pnlVal > 0 ? '+' : '';
  const pnlClass = pnlVal >= 0 ? 'price-up' : 'price-dn';

  // Get last 3 transactions
  const recentTxns = transactions.slice(0, 3);

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* KYC Banner */}
      {user.kycStatus === 'pending' && (
        <div className="neo-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(212, 175, 55, 0.05)', borderColor: 'rgba(212, 175, 55, 0.3)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Clock color="var(--gold)" size={24} />
            <div>
              <div style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: 600 }}>Hồ sơ KYC đang chờ phê duyệt</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Yêu cầu xác thực tài khoản của bạn đang được Admin xem xét.</div>
            </div>
          </div>
          <Link to="/admin" className="btn btn-gold" style={{ textDecoration: 'none', padding: '8px 16px' }}>Tới duyệt KYC (Dev)</Link>
        </div>
      )}
      
      {user.kycStatus === 'rejected' && (
        <div className="neo-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <AlertTriangle color="var(--ruby)" size={24} />
            <div>
              <div style={{ fontSize: '14px', color: 'var(--ruby)', fontWeight: 600 }}>Hồ sơ KYC bị từ chối</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>CCCD bị mờ hoặc không hợp lệ. Vui lòng cung cấp lại thông tin.</div>
            </div>
          </div>
          <Link to="/register" className="btn btn-red" style={{ textDecoration: 'none', padding: '8px 16px' }}>Cập nhật KYC</Link>
        </div>
      )}

      {user.kycStatus === 'verified' && (
        <div className="neo-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <ShieldCheck color="var(--emerald)" size={24} />
          <div>
            <div style={{ fontSize: '14px', color: 'var(--emerald)', fontWeight: 600 }}>Tài khoản đã xác minh (KYC Verified)</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Tài khoản của bạn đã được xác minh toàn diện. Bạn đã được phép rút vàng thật tại quầy O2O.</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="h2">Tổng quan danh mục</div>
        <div className="body-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
           <Activity size={14} color="var(--emerald)" /> Cập nhật: Vừa xong
        </div>
      </div>
      
      <div className="neo-card" style={{ marginBottom: '24px', padding: '32px' }}>
        <div className="body-sm" style={{ color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Tổng giá trị vàng hiện tại</div>
        <div style={{ fontSize: '48px', fontWeight: 600, color: 'var(--gold)', lineHeight: 1, marginBottom: '24px' }}>₫{totalGoldValue.toLocaleString('vi-VN')}</div>
        
        <div style={{ display: 'flex', gap: '40px', borderTop: '1px solid var(--border-silver)', paddingTop: '24px' }}>
          <div>
            <div className="body-sm" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px' }}>Tổng đầu tư</div>
            <div style={{ fontSize: '18px', color: 'var(--text-main)', marginTop: '4px', fontWeight: 500 }}>₫{totalInvested.toLocaleString('vi-VN')}</div>
          </div>
          <div>
            <div className="body-sm" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px' }}>Lãi / Lỗ</div>
            <div style={{ fontSize: '18px', marginTop: '4px', fontWeight: 500, color: pnlVal >= 0 ? 'var(--emerald)' : 'var(--ruby)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {pnlVal >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {pnlSign}₫{Math.abs(pnlVal).toLocaleString('vi-VN')} ({pnlSign}{Math.abs(pnlPercent).toFixed(2)}%)
            </div>
          </div>
          <div>
            <div className="body-sm" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px' }}>Số dư ví VNĐ</div>
            <div style={{ fontSize: '18px', color: 'var(--text-main)', marginTop: '4px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={18} color="var(--gold)" /> ₫{wallet.toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: '24px', gap: '16px' }}>
        <div className="neo-card" style={{ padding: '24px' }}>
          <div className="body-sm" style={{ fontWeight: 600 }}>SJC 1 CHỈ</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-main)', marginTop: '8px' }}>{balances.sjc.toFixed(2)} chỉ</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {balances.sjc > 0 ? <><TrendingUp size={14} color="var(--emerald)" /> <span style={{ color: 'var(--emerald)' }}>+0.0% so với giá vốn</span></> : 'Chưa có số dư'}
          </div>
        </div>
        <div className="neo-card" style={{ padding: '24px' }}>
          <div className="body-sm" style={{ fontWeight: 600 }}>PNJ 9999</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-main)', marginTop: '8px' }}>{balances.pnj.toFixed(2)} chỉ</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {balances.pnj > 0 ? <><TrendingUp size={14} color="var(--emerald)" /> <span style={{ color: 'var(--emerald)' }}>+0.0% so với giá vốn</span></> : 'Chưa có số dư'}
          </div>
        </div>
        <div className="neo-card" style={{ padding: '24px' }}>
          <div className="body-sm" style={{ fontWeight: 600 }}>DOJI 999.9</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-main)', marginTop: '8px' }}>{balances.doji.toFixed(2)} chỉ</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>Chưa có số dư</div>
        </div>
        <div className="neo-card" style={{ padding: '24px', background: 'var(--bg-card)' }}>
          <div className="body-sm" style={{ fontWeight: 600 }}>Giá vốn TB (SJC)</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-main)', marginTop: '8px' }}>₫0</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>Giá hiện tại: ₫{prices.sjc.sell.toLocaleString('vi-VN')}</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '16px' }}>
        <div className="neo-card" style={{ padding: '24px' }}>
          <div className="h3" style={{ marginBottom: '16px' }}>Biến động giá trị danh mục (30 ngày)</div>
          <div style={{ height: '250px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border-silver)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            [ Biểu đồ Line Chart — Giá trị ví theo thời gian ]
          </div>
        </div>
        <div className="neo-card" style={{ padding: '24px' }}>
          <div className="h3" style={{ marginBottom: '16px' }}>Giao dịch gần nhất</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-silver)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 500 }}>Loại</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 500 }}>Vàng</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 500 }}>Số lượng</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 500 }}>Giá trị</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 500 }}>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.length > 0 ? recentTxns.map((txn, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-silver)' }}>
                    <td style={{ padding: '16px 8px' }}>
                      {txn.type === 'buy' ? <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Mua</span> :
                       txn.type === 'dca' ? <span style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold)', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>DCA</span> :
                       <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--ruby)', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Bán</span>}
                    </td>
                    <td style={{ padding: '16px 8px', fontWeight: 500 }}>{txn.goldTypeName}</td>
                    <td style={{ padding: '16px 8px' }}>{txn.quantity.toFixed(2)} chỉ</td>
                    <td style={{ padding: '16px 8px' }}>₫{txn.total.toLocaleString('vi-VN')}</td>
                    <td style={{ padding: '16px 8px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '13px' }}>{txn.time}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có giao dịch nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Link to="/history" className="btn btn-outline" style={{ width: '100%', marginTop: '20px', textDecoration: 'none', justifyContent: 'center' }}>
            Xem toàn bộ lịch sử
          </Link>
        </div>
      </div>
    </div>
  );
}
