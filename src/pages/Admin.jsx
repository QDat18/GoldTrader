import React from 'react';
import useStore from '../store/useStore';
import { Download, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

export default function Admin() {
  const kycList = useStore((state) => state.kycSubmissions);
  const orders = useStore((state) => state.orders);
  const inventory = useStore((state) => state.inventory);
  const approveKyc = useStore((state) => state.approveKyc);
  const rejectKyc = useStore((state) => state.rejectKyc);

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const totalSjcInStock = inventory.filter((i) => i.goldType === 'sjc' && i.status === 'available').length;

  const handleApprove = (id) => {
    approveKyc(id);
    alert('Đã duyệt hồ sơ KYC thành công!');
  };

  const handleReject = (id) => {
    rejectKyc(id);
    alert('Đã từ chối hồ sơ KYC.');
  };

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <div className="tag" style={{ marginBottom: '8px' }}>VẬN HÀNH HỆ THỐNG</div>
          <div className="h2">Admin Dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select className="form-input" style={{ width: 'auto', padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <option>Hôm nay</option>
            <option>7 ngày qua</option>
            <option>30 ngày qua</option>
          </select>
          <button className="btn btn-outline" style={{ borderRadius: '12px', padding: '10px 16px' }}>
            <Download size={16} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="stat-card" style={{ borderTop: '2px solid var(--gold)' }}>
          <div className="stat-label">DOANH THU HÔM NAY</div>
          <div className="stat-value gold-text">₫124.500.000</div>
          <div className="stat-sub price-up" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={14} /> +18.4% so hôm qua</div>
        </div>
        <div className="stat-card" style={{ borderTop: '2px solid rgba(255,255,255,0.2)' }}>
          <div className="stat-label">TỔNG ĐƠN HÀNG</div>
          <div className="stat-value">{orders.length}</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Đang chờ nhận: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{pendingOrders.length}</span></div>
        </div>
        <div className="stat-card" style={{ borderTop: '2px solid #3b82f6' }}>
          <div className="stat-label">YÊU CẦU DUYỆT KYC</div>
          <div className="stat-value">{kycList.length}</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Hồ sơ chờ xử lý</div>
        </div>
        <div className="stat-card" style={{ borderTop: '2px solid var(--emerald)' }}>
          <div className="stat-label">KHO VÀNG VẬT LÝ SJC</div>
          <div className="stat-value">{totalSjcInStock} chỉ</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Số lượng có sẵn</div>
        </div>
      </div>

      {/* Mock Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginBottom: '32px' }}>
        <div className="neo-card">
          <div className="h3" style={{ fontSize: '20px', marginBottom: '16px' }}>Doanh thu theo ngày</div>
          <div style={{ height: '180px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            [ Biểu đồ cột - Doanh thu ]
          </div>
        </div>
        <div className="neo-card">
          <div className="h3" style={{ fontSize: '20px', marginBottom: '16px' }}>Cơ cấu giao dịch</div>
          <div style={{ height: '180px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            [ Biểu đồ tròn - Mua/Bán/DCA ]
          </div>
        </div>
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        
        {/* KYC Table */}
        <div className="neo-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="h3" style={{ fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              KYC chờ duyệt
              {kycList.length > 0 && <span style={{ padding: '2px 8px', background: 'var(--ruby)', borderRadius: '99px', fontSize: '12px' }}>{kycList.length}</span>}
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>Khách hàng</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>Thời gian</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {kycList.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có hồ sơ nào chờ duyệt</td>
                  </tr>
                ) : (
                  kycList.map(item => (
                    <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 600, fontSize: '12px' }}>
                            {item.avatar}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{item.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.type}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{item.time}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleApprove(item.id)} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Duyệt
                          </button>
                          <button onClick={() => handleReject(item.id)} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: 'var(--ruby)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={14} /> Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders Table */}
        <div className="neo-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="h3" style={{ fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              Đơn hàng chờ nhận
              {pendingOrders.length > 0 && <span style={{ padding: '2px 8px', background: 'var(--gold)', color: '#000', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>{pendingOrders.length}</span>}
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>Mã đơn</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>Sản phẩm</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có đơn hàng chờ nhận</td>
                  </tr>
                ) : (
                  pendingOrders.map(o => (
                    <tr key={o.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 24px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{o.id.substring(0,8)}...</td>
                      <td style={{ padding: '16px 24px', fontWeight: 600, color: '#fff' }}>{o.goldTypeName} × {o.quantity} chỉ</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span className="tag">Chờ nhận</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
