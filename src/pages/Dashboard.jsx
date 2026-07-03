import React from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore';

export default function Dashboard() {
  const user = useStore(state => state.currentUser);
  const prices = useStore(state => state.goldPrices);
  const balances = useStore(state => state.goldBalances);
  const wallet = useStore(state => state.walletBalance);
  const transactions = useStore(state => state.transactions);

  // Calculate real-time portfolio values
  const sjcValue = balances.sjc * prices.sjc.sell;
  const pnjValue = balances.pnj * prices.pnj.sell;
  const dojiValue = balances.doji * prices.doji.sell;
  const totalGoldValue = sjcValue + pnjValue + dojiValue;
  const totalInvested = 60000000; // Mock total invested
  const pnlVal = totalGoldValue - totalInvested;
  const pnlPercent = (pnlVal / totalInvested) * 100;
  const pnlSign = pnlVal >= 0 ? '+' : '';
  const pnlClass = pnlVal >= 0 ? 'price-up' : 'price-dn';

  // Get last 3 transactions
  const recentTxns = transactions.slice(0, 3);

  return (
    <div style={{ padding: '24px' }}>
      {/* KYC Banner */}
      {user.kycStatus === 'pending' && (
        <div style={{ background: 'var(--gold-pale)', border: '0.5px solid var(--gold)', padding: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#7A5A10', fontWeight: 500 }}>
              <i className="ti ti-clock" style={{ fontSize: '15px', verticalAlign: '-2px', marginRight: '6px' }}></i>
              Hồ sơ KYC đang chờ phê duyệt
            </div>
            <div style={{ fontSize: '12px', color: '#7A5A10', marginTop: '4px' }}>
              Yêu cầu xác thực tài khoản của bạn đang được Admin xem xét. Bạn có thể sang Admin Panel để tự duyệt nhanh.
            </div>
          </div>
          <Link to="/admin" className="btn btn-sm btn-gold" style={{ textDecoration: 'none' }}>Tới duyệt KYC</Link>
        </div>
      )}
      
      {user.kycStatus === 'rejected' && (
        <div style={{ background: 'var(--red-bg)', border: '0.5px solid var(--red)', padding: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--red)', fontWeight: 500 }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: '15px', verticalAlign: '-2px', marginRight: '6px' }}></i>
              Hồ sơ KYC bị từ chối
            </div>
            <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '4px' }}>
              CCCD bị mờ hoặc không hợp lệ. Vui lòng cung cấp lại thông tin để tiếp tục giao dịch.
            </div>
          </div>
          <Link to="/register" className="btn btn-sm btn-danger" style={{ textDecoration: 'none' }}>Cập nhật KYC</Link>
        </div>
      )}

      {user.kycStatus === 'verified' && (
        <div style={{ background: 'var(--green-bg)', border: '0.5px solid var(--green)', padding: '14px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 500 }}>
            <i className="ti ti-shield-check" style={{ fontSize: '15px', verticalAlign: '-2px', marginRight: '6px' }}></i>
            Tài khoản đã xác minh (KYC Verified)
          </div>
          <div style={{ fontSize: '12px', color: 'var(--green)', marginTop: '4px' }}>
            Tài khoản của bạn đã được xác minh toàn diện. Bạn đã được phép rút vàng thật tại quầy O2O.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="h2">Tổng quan danh mục</div>
        <div className="body-sm">Cập nhật: Vừa xong</div>
      </div>
      
      <div className="wallet-balance">
        <div className="label" style={{ color: 'var(--gray-400)', marginBottom: '6px' }}>TỔNG GIÁ TRỊ VÀNG HIỆN TẠI</div>
        <div style={{ fontSize: '32px', fontWeight: 500, color: 'var(--gold)' }}>₫{totalGoldValue.toLocaleString('vi-VN')}</div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
          <div>
            <div className="label" style={{ color: 'var(--gray-400)' }}>TỔNG ĐẦU TƯ</div>
            <div style={{ fontSize: '14px', color: 'var(--white)', marginTop: '2px' }}>₫{totalInvested.toLocaleString('vi-VN')}</div>
          </div>
          <div>
            <div className="label" style={{ color: 'var(--gray-400)' }}>LÃI / LỖ</div>
            <div style={{ fontSize: '14px', marginTop: '2px' }} className={pnlClass}>
              {pnlSign}₫{pnlVal.toLocaleString('vi-VN')} ({pnlSign}{pnlPercent.toFixed(2)}%)
            </div>
          </div>
          <div>
            <div className="label" style={{ color: 'var(--gray-400)' }}>SỐ DƯ VÍ</div>
            <div style={{ fontSize: '14px', color: 'var(--white)', marginTop: '2px' }}>₫{wallet.toLocaleString('vi-VN')}</div>
          </div>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: '16px' }}>
        <div className="stat-card">
          <div className="stat-label">SJC 1 CHỈ</div>
          <div className="stat-value">{balances.sjc.toFixed(2)} chỉ</div>
          <div className="stat-sub price-up">+12.4% so với giá vốn</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">PNJ 9999</div>
          <div className="stat-value">{balances.pnj.toFixed(2)} chỉ</div>
          <div className="stat-sub price-up">+8.7% so với giá vốn</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">DOJI 999.9</div>
          <div className="stat-value">{balances.doji.toFixed(2)} chỉ</div>
          <div className="stat-sub" style={{ color: 'var(--gray-400)' }}>Chưa có số dư</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Giá vốn TB (SJC)</div>
          <div className="stat-value" style={{ fontSize: '16px' }}>₫7.780.000</div>
          <div className="stat-sub" style={{ color: 'var(--gray-400)' }}>Giá hiện tại: ₫{prices.sjc.sell.toLocaleString('vi-VN')}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="h3" style={{ marginBottom: '12px' }}>Biến động giá trị danh mục (30 ngày)</div>
          <div className="chart-placeholder" style={{ height: '200px' }}>[ Biểu đồ Line Chart — Giá trị ví theo thời gian ]</div>
        </div>
        <div className="card">
          <div className="h3" style={{ marginBottom: '12px' }}>Giao dịch gần nhất</div>
          <table className="table">
            <thead>
              <tr>
                <th>Loại</th>
                <th>Vàng</th>
                <th>Số lượng</th>
                <th>Giá trị</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {recentTxns.length > 0 ? recentTxns.map((txn, index) => (
                <tr key={index}>
                  <td>
                    {txn.type === 'buy' ? <span className="badge badge-green">Mua</span> :
                     txn.type === 'dca' ? <span className="badge badge-gold">DCA</span> :
                     <span className="badge badge-red">Bán</span>}
                  </td>
                  <td>{txn.goldTypeName}</td>
                  <td>{txn.quantity.toFixed(2)} chỉ</td>
                  <td>₫{txn.total.toLocaleString('vi-VN')}</td>
                  <td className="body-sm">{txn.time}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Chưa có giao dịch nào</td>
                </tr>
              )}
            </tbody>
          </table>
          <Link to="/history" className="btn" style={{ width: '100%', marginTop: '12px', fontSize: '13px', textDecoration: 'none' }}>
            Xem toàn bộ lịch sử
          </Link>
        </div>
      </div>
    </div>
  );
}
