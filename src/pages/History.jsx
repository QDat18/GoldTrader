import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import useStore from '../store/useStore';

export default function History() {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedGold, setSelectedGold] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [showInvoiceOpen, setShowInvoiceOpen] = useState(false);

  const transactions = useStore(state => state.transactions);
  const currentUser = useStore(state => state.currentUser);
  const fetchTransactions = useStore(state => state.fetchTransactions);

  useEffect(() => {
    if (currentUser?.id) {
      fetchTransactions(currentUser.id);
    }
  }, [currentUser, fetchTransactions]);

  // Filter logic
  const filteredTxns = transactions.filter(txn => {
    if (selectedType !== 'all') {
      if (selectedType === 'buy' && txn.type !== 'buy') return false;
      if (selectedType === 'sell' && txn.type !== 'sell') return false;
      if (selectedType === 'dca' && txn.type !== 'dca') return false;
      if (selectedType === 'withdraw' && txn.type !== 'withdraw') return false;
      if (selectedType === 'deposit' && txn.type !== 'deposit') return false;
    }
    if (selectedGold !== 'all') {
      const brandStr = selectedGold.toUpperCase();
      if (!txn.goldTypeName.toUpperCase().includes(brandStr)) return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchesId = txn.id.toLowerCase().includes(q);
      const matchesName = txn.goldTypeName.toLowerCase().includes(q);
      if (!matchesId && !matchesName) return false;
    }
    return true;
  });

  // Calculate stats
  const totalTransactions = filteredTxns.length;
  const totalBuy = filteredTxns
    .filter(t => t.type === 'buy' || t.type === 'dca')
    .reduce((sum, t) => sum + t.total, 0);
  const totalSell = filteredTxns
    .filter(t => t.type === 'sell')
    .reduce((sum, t) => sum + t.total, 0);
  const realizedPnl = Math.round(totalSell * 0.08); // Mock dynamic PNL

  const handleExport = () => {
    Swal.fire('Thành công', 'Tải xuống báo cáo giao dịch (CSV) thành công!', 'success');
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', background: 'var(--bg-main)' }}>
      {/* Sidebar Filter */}
      <div style={{ width: '260px', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(20,20,20,0.4)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '12px', paddingLeft: '8px' }}>BỘ LỌC GIAO DỊCH</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button 
              className="btn" 
              onClick={() => setSelectedType('all')}
              style={{ background: selectedType === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent', textAlign: 'left', padding: '10px 16px', borderRadius: '12px', color: selectedType === 'all' ? 'var(--text-main)' : 'var(--text-muted)' }}
            >
              <i className="ti ti-list" style={{ marginRight: '8px' }}></i> Tất cả
            </button>
            <button 
              className="btn" 
              onClick={() => setSelectedType('buy')}
              style={{ background: selectedType === 'buy' ? 'rgba(255,255,255,0.1)' : 'transparent', textAlign: 'left', padding: '10px 16px', borderRadius: '12px', color: selectedType === 'buy' ? 'var(--text-main)' : 'var(--text-muted)' }}
            >
              <i className="ti ti-arrow-down" style={{ marginRight: '8px', color: 'var(--emerald)' }}></i> Lệnh mua
            </button>
            <button 
              className="btn" 
              onClick={() => setSelectedType('sell')}
              style={{ background: selectedType === 'sell' ? 'rgba(255,255,255,0.1)' : 'transparent', textAlign: 'left', padding: '10px 16px', borderRadius: '12px', color: selectedType === 'sell' ? 'var(--text-main)' : 'var(--text-muted)' }}
            >
              <i className="ti ti-arrow-up" style={{ marginRight: '8px', color: 'var(--ruby)' }}></i> Lệnh bán
            </button>
            <button 
              className="btn" 
              onClick={() => setSelectedType('dca')}
              style={{ background: selectedType === 'dca' ? 'rgba(255,255,255,0.1)' : 'transparent', textAlign: 'left', padding: '10px 16px', borderRadius: '12px', color: selectedType === 'dca' ? 'var(--text-main)' : 'var(--text-muted)' }}
            >
              <i className="ti ti-repeat" style={{ marginRight: '8px', color: 'var(--gold)' }}></i> DCA tự động
            </button>
            <button 
              className="btn" 
              onClick={() => setSelectedType('withdraw')}
              style={{ background: selectedType === 'withdraw' ? 'rgba(255,255,255,0.1)' : 'transparent', textAlign: 'left', padding: '10px 16px', borderRadius: '12px', color: selectedType === 'withdraw' ? 'var(--text-main)' : 'var(--text-muted)' }}
            >
              <i className="ti ti-file-export" style={{ marginRight: '8px', color: '#eab308' }}></i> Lịch sử Rút vàng
            </button>
            <button 
              className="btn" 
              onClick={() => setSelectedType('deposit')}
              style={{ background: selectedType === 'deposit' ? 'rgba(255,255,255,0.1)' : 'transparent', textAlign: 'left', padding: '10px 16px', borderRadius: '12px', color: selectedType === 'deposit' ? 'var(--text-main)' : 'var(--text-muted)' }}
            >
              <i className="ti ti-wallet" style={{ marginRight: '8px', color: '#3b82f6' }}></i> Lịch sử Nạp tiền
            </button>
          </div>
        </div>

        <div className="divider" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}></div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '12px', paddingLeft: '8px' }}>LOẠI VÀNG</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button 
              className="btn" 
              onClick={() => setSelectedGold('all')}
              style={{ background: selectedGold === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent', textAlign: 'left', padding: '10px 16px', borderRadius: '12px', color: selectedGold === 'all' ? 'var(--text-main)' : 'var(--text-muted)' }}
            >
              Tất cả loại
            </button>
            <button 
              className="btn" 
              onClick={() => setSelectedGold('sjc')}
              style={{ background: selectedGold === 'sjc' ? 'rgba(255,255,255,0.1)' : 'transparent', textAlign: 'left', padding: '10px 16px', borderRadius: '12px', color: selectedGold === 'sjc' ? 'var(--text-main)' : 'var(--text-muted)' }}
            >
              SJC 1 Chỉ
            </button>
            <button 
              className="btn" 
              onClick={() => setSelectedGold('pnj')}
              style={{ background: selectedGold === 'pnj' ? 'rgba(255,255,255,0.1)' : 'transparent', textAlign: 'left', padding: '10px 16px', borderRadius: '12px', color: selectedGold === 'pnj' ? 'var(--text-main)' : 'var(--text-muted)' }}
            >
              PNJ 9999
            </button>
            <button 
              className="btn" 
              onClick={() => setSelectedGold('doji')}
              style={{ background: selectedGold === 'doji' ? 'rgba(255,255,255,0.1)' : 'transparent', textAlign: 'left', padding: '10px 16px', borderRadius: '12px', color: selectedGold === 'doji' ? 'var(--text-main)' : 'var(--text-muted)' }}
            >
              DOJI 999.9
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div className="h2">Lịch sử giao dịch</div>
            <div className="body-sm" style={{ marginTop: '4px', color: 'var(--text-muted)' }}>Quản lý và theo dõi toàn bộ biến động tài sản của bạn</div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm mã GD..."
                style={{ padding: '10px 16px 10px 36px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', width: '240px' }}
              />
            </div>
            <button className="btn" onClick={handleExport} style={{ borderRadius: '99px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <i className="ti ti-download" style={{ marginRight: '6px' }}></i> Xuất CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: '32px', gap: '16px' }}>
          <div className="card" style={{ borderRadius: '24px', background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px' }}>TỔNG GIAO DỊCH</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-main)', marginTop: '8px' }}>{totalTransactions}</div>
          </div>
          <div className="card" style={{ borderRadius: '24px', background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px' }}>TỔNG MUA VÀO</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-main)', marginTop: '8px' }}>₫{totalBuy.toLocaleString('vi-VN')}</div>
          </div>
          <div className="card" style={{ borderRadius: '24px', background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px' }}>TỔNG BÁN RA</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-main)', marginTop: '8px' }}>₫{totalSell.toLocaleString('vi-VN')}</div>
          </div>
        </div>

        {/* Pending Withdrawals O2O */}
        {(() => {
          const pendingWithdrawals = transactions.filter(t => t.type === 'withdraw' && t.status === 'Chờ nhận tại quầy');
          if (pendingWithdrawals.length === 0) return null;
          return (
            <div style={{ marginBottom: '32px' }}>
              <div className="h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-clock" style={{ color: 'var(--gold)' }}></i> Yêu cầu Rút Vàng Đang chờ Bàn giao
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {pendingWithdrawals.map(req => (
                  <div key={req.id} style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: 'var(--gold)' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.05em' }}>MÃ HỢP ĐỒNG: {req.id}</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>{req.goldTypeName}</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>Số lượng: {req.quantity} chỉ ({(req.quantity * 3.75).toFixed(2)}g)</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(req.time).toLocaleString('vi-VN')}</div>
                        <div style={{ padding: '6px 12px', background: 'rgba(212,175,55,0.1)', color: 'var(--gold)', borderRadius: '99px', fontSize: '12px', fontWeight: 600, marginTop: '12px', display: 'inline-block' }}>Chờ xác thực tại quầy</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Table */}
        <div className="card" style={{ borderRadius: '24px', background: 'rgba(30,30,30,0.3)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Mã GD</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Loại</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Vàng</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Số lượng</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Đơn giá</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Tổng tiền</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Thời gian</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Trạng thái</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.length > 0 ? filteredTxns.map((txn, index) => {
                  const isLast = index === filteredTxns.length - 1;
                  const borderBottom = isLast ? 'none' : '1px solid rgba(255,255,255,0.02)';
                  
                  return (
                    <tr key={txn.id} style={{ borderBottom }}>
                      <td style={{ padding: '16px 24px', fontFamily: 'SF Mono, monospace', fontSize: '12px', color: 'var(--text-muted)' }}>{txn.id}</td>
                      <td style={{ padding: '16px 24px' }}>
                        {txn.type === 'buy' ? (
                          <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', fontWeight: 600 }}>Mua</span>
                        ) : txn.type === 'deposit' ? (
                          <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 600 }}>Nạp tiền</span>
                        ) : txn.type === 'dca' ? (
                          <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'var(--gold-gradient)', color: '#000', fontWeight: 600 }}>DCA</span>
                        ) : txn.type === 'withdraw' ? (
                          <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', fontWeight: 600 }}>Rút</span>
                        ) : (
                          <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--ruby)', fontWeight: 600 }}>Bán</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 500, fontSize: '14px' }}>{txn.type === 'deposit' ? 'Nạp tiền VNĐ' : txn.goldTypeName}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '14px' }}>
                        {txn.type === 'deposit' ? '—' : (
                          <>
                            {txn.quantity.toFixed(4)} chỉ
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>({Number((txn.quantity * 3.75).toFixed(4))}g)</span>
                          </>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '14px', color: 'var(--text-muted)' }}>{txn.type === 'deposit' ? '—' : `₫${txn.price.toLocaleString('vi-VN')}`}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '14px', fontWeight: 500 }}>
                        {txn.type === 'deposit' ? <span style={{ color: 'var(--emerald)' }}>+ ₫{txn.total.toLocaleString('vi-VN')}</span> : `₫${txn.total.toLocaleString('vi-VN')}`}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>{txn.time}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', fontWeight: 600 }}>{txn.status}</span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        {txn.type !== 'deposit' && (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button 
                              onClick={() => {
                                setInvoiceDetails({
                                  name: currentUser?.name || 'Khách hàng',
                                  contractId: txn.id,
                                  goldType: txn.goldTypeName,
                                  quantity: `${txn.quantity.toString()} (${Number((txn.quantity * 3.75).toFixed(4))}g)`,
                                  price: txn.price.toLocaleString('vi-VN'),
                                  total: txn.total.toLocaleString('vi-VN'),
                                  date: txn.time,
                                  type: txn.type
                                });
                                setShowInvoiceOpen(true);
                              }}
                              style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(212,175,55,0.1)', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '6px', cursor: 'pointer', transition: '0.2s', fontWeight: 600 }}
                            >
                              Chi tiết hoá đơn
                            </button>
                            <button 
                              onClick={() => {
                                Swal.fire('Thông báo', 'Tính năng xem lại Hợp đồng PDF đang được hoàn thiện.', 'info');
                              }}
                              style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', transition: '0.2s' }}
                            >
                              Hợp đồng (PDF)
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      <i className="ti ti-history" style={{ fontSize: '32px', marginBottom: '12px', display: 'block', opacity: 0.5 }}></i>
                      Không tìm thấy giao dịch nào khớp với bộ lọc
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* HÓA ĐƠN BIÊN NHẬN CHI TIẾT */}
      {showInvoiceOpen && invoiceDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }}>
          <div style={{ 
            maxWidth: '440px', 
            width: '100%', 
            background: '#1E1E1E', 
            border: '1px solid #2D3748', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header đồng bộ HopDongMua.html */}
            <div style={{
              padding: '24px 20px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #1A1A1A, #121212)',
              borderBottom: '2px solid #B38728',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                color: '#121212',
                fontSize: '20px'
              }}>G</div>
              <div style={{
                fontSize: '18px',
                fontWeight: '750',
                color: '#FFFFFF',
                letterSpacing: '1px'
              }}>GOLD<span style={{ color: '#B38728' }}>CHAIN</span></div>
            </div>

            {/* Content hóa đơn */}
            <div style={{ padding: '24px', color: '#E2E8F0', fontSize: '13px', lineHeight: '1.5' }}>
              <div style={{ fontSize: '18px', color: '#FFFFFF', fontWeight: '600', marginBottom: '4px', textAlign: 'center' }}>Chi tiết Giao Dịch</div>
              <div style={{ textAlign: 'center', fontSize: '13px', color: '#B38728', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px' }}>
                {invoiceDetails.type === 'withdraw' ? 'Lệnh Rút vàng vật chất' : `Hóa đơn ${invoiceDetails.type === 'buy' || invoiceDetails.type === 'dca' ? 'Mua' : 'Bán'} vàng điện tử`}
              </div>
              
              <p style={{ margin: '0 0 16px 0' }}>
                Kính gửi quý khách <strong style={{ color: '#FFFFFF' }}>{invoiceDetails.name}</strong>,
              </p>
              <p style={{ margin: '0 0 16px 0' }}>
                Dưới đây là thông tin chi tiết hợp đồng giao dịch mà bạn đã thực hiện qua hệ thống GoldChain:
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#121212', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2D3748', marginBottom: '20px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#A0AEC0', fontWeight: '550' }}>Mã hợp đồng (Order ID)</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#B38728', fontWeight: 'bold', textAlign: 'right' }}>{invoiceDetails.contractId}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#A0AEC0', fontWeight: '550' }}>Sản phẩm vàng</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#FFFFFF', fontWeight: 'bold', textAlign: 'right' }}>{invoiceDetails.goldType}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#A0AEC0', fontWeight: '550' }}>Số lượng vàng</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#FFFFFF', fontWeight: 'bold', textAlign: 'right' }}>{invoiceDetails.quantity} chỉ</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#A0AEC0', fontWeight: '550' }}>Đơn giá niêm yết</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#FFFFFF', fontWeight: 'bold', textAlign: 'right' }}>₫{invoiceDetails.price} / chỉ</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#A0AEC0', fontWeight: '550' }}>Thời gian giao dịch</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#FFFFFF', fontWeight: 'bold', textAlign: 'right' }}>{invoiceDetails.date}</td>
                  </tr>
                  <tr style={{ background: 'rgba(179, 135, 40, 0.08)' }}>
                    <td style={{ padding: '10px 14px', color: '#B38728', fontWeight: '700' }}>
                      {invoiceDetails.type === 'sell' ? 'Tổng tiền nhận (Ví VND)' : invoiceDetails.type === 'withdraw' ? 'Trị giá tương đương' : 'Tổng thanh toán'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#B38728', fontSize: '15px', fontWeight: '800', textAlign: 'right' }}>₫{invoiceDetails.total}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{
                textAlign: 'center',
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                color: '#10B981',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '16px'
              }}>
                {invoiceDetails.type === 'withdraw' 
                  ? '🛡️ Thư mời & Mã bảo mật quét QR nhận vàng đã được gửi qua Email.' 
                  : '🛡️ Chứng nhận quyền sở hữu vàng vật chất 1:1 trong kho ký gửi của GoldChain.'}
              </div>

              <p style={{ fontSize: '11px', color: '#A0AEC0', textAlign: 'center', margin: '0 0 16px 0' }}>
                Hóa đơn và bằng chứng số (SHA-256 Hash) của hợp đồng này đã được lưu trữ bảo vệ trên sổ cái Blockchain. Bản sao PDF đã được gửi qua email của quý khách.
              </p>

              <button 
                className="btn btn-gold" 
                onClick={() => {
                  setShowInvoiceOpen(false);
                  setInvoiceDetails(null);
                }}
                style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: 'bold' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
