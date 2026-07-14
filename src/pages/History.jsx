import React, { useState } from 'react';
import useStore from '../store/useStore';
import ContractModal from '../components/ContractModal';
import { generateContractPDF } from '../utils/contractService';

export default function History() {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedGold, setSelectedGold] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Contract Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [activeContract, setActiveContract] = useState(null);
  const [activePdfDoc, setActivePdfDoc] = useState(null);

  const transactions = useStore(state => state.transactions);
  const currentUser = useStore(state => state.currentUser);

  // Filter logic
  const filteredTxns = transactions.filter(txn => {
    if (selectedType !== 'all') {
      if (selectedType === 'buy' && txn.type !== 'buy') return false;
      if (selectedType === 'sell' && txn.type !== 'sell') return false;
      if (selectedType === 'dca' && txn.type !== 'dca') return false;
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

  const handleViewContract = async (txn) => {
    // 1. Tìm hợp đồng đã lưu trong localStorage
    let contract = null;
    try {
      const arr = JSON.parse(localStorage.getItem('goldchain_contracts') || '[]');
      contract = arr.find(c => c.orderId === txn.id || c.txnId === txn.id);
    } catch {}

    // 2. Nếu không tìm thấy, tự động sinh lại dữ liệu hợp đồng
    if (!contract) {
      contract = {
        contractNumber: txn.contractNumber || `GC-RE-${txn.id.substring(0,8).toUpperCase()}`,
        contractDate: new Date(),
        transactionType: txn.type, // 'buy' | 'sell' | 'dca'
        orderId: txn.id,
        txnId: txn.id,
        goldType: txn.goldTypeName.toLowerCase().includes('sjc') ? 'sjc' : txn.goldTypeName.toLowerCase().includes('pnj') ? 'pnj' : 'doji',
        goldName: txn.goldTypeName,
        quantityChi: txn.quantity,
        quantityGrams: txn.quantity * 3.75,
        unitPrice: txn.price,
        totalAmount: txn.total,
        buyer: {
          name: currentUser?.name || 'Khách hàng',
          email: currentUser?.email || 'khachhang@email.com',
          phone: currentUser?.phone || 'Chưa cập nhật',
          cccd: currentUser?.cccd || 'Chưa cập nhật',
          id: currentUser?.id || ''
        }
      };
    }

    setActiveContract(contract);
    setModalOpen(true);

    try {
      const doc = await generateContractPDF(contract);
      setActivePdfDoc(doc);
    } catch (e) {
      console.error('Error generating PDF:', e);
    }
  };

  const handleExport = () => {
    alert('Tải xuống báo cáo giao dịch (CSV) thành công!');
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
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Hợp đồng</th>
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
                        ) : txn.type === 'dca' ? (
                          <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'var(--gold-gradient)', color: '#000', fontWeight: 600 }}>DCA</span>
                        ) : (
                          <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--ruby)', fontWeight: 600 }}>Bán</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 500, fontSize: '14px' }}>{txn.goldTypeName}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '14px' }}>{txn.quantity.toFixed(4)} chỉ</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '14px', color: 'var(--text-muted)' }}>₫{txn.price.toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '14px', fontWeight: 500 }}>₫{txn.total.toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>{txn.time}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', fontWeight: 600 }}>{txn.status}</span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer' }}
                          onClick={() => handleViewContract(txn)}
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
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

      {/* Contract Modal for history */}
      <ContractModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveContract(null);
          setActivePdfDoc(null);
        }}
        contractData={activeContract}
        pdfDoc={activePdfDoc}
        emailStatus="sent"
      />

    </div>
  );
}
