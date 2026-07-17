import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import useStore from '../../store/useStore';
import { supabase } from '../../supabaseClient';
import { Plus } from 'lucide-react';

export default function AdminInventory() {
  const dbInventory = useStore(state => state.adminInventory);
  const fetchAdminInventory = useStore(state => state.fetchAdminInventory);
  const currentUser = useStore(state => state.currentUser);
  const [toast, setToast] = useState(null);

  // States
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [newInvType, setNewInvType] = useState('SJL1L10');
  const [newInvWeight, setNewInvWeight] = useState('1'); // 1 chỉ = 3.75g
  const [newInvSerial, setNewInvSerial] = useState('');
  const [newInvImportSource, setNewInvImportSource] = useState('');
  const [newInvCostPrice, setNewInvCostPrice] = useState('');
  const [newInvReceiptId, setNewInvReceiptId] = useState('');
  const [invFilterType, setInvFilterType] = useState('all');
  const [invFilterStatus, setInvFilterStatus] = useState('all');
  const [invSearchQuery, setInvSearchQuery] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };



  const handleAddInventory = async (e) => {
    e.preventDefault();
    const weightVal = parseFloat(newInvWeight);

    if (!newInvSerial.trim()) {
      showToast('Vui lòng nhập Mã Serial.', 'error');
      return;
    }

    if (isNaN(weightVal) || weightVal <= 0) {
      showToast('Trọng lượng thỏi vàng không hợp lệ.', 'error');
      return;
    }

    try {
      const serialUpper = newInvSerial.trim().toUpperCase();
      const { error } = await supabase
        .from('vault_inventory')
        .insert({
          gold_serial: serialUpper,
          gold_type: newInvType,
          weight_grams: weightVal * 3.75, // convert input chỉ to grams for db storage
          status: 'AVAILABLE',
          import_source: newInvImportSource,
          cost_price_vnd: newInvCostPrice ? parseFloat(newInvCostPrice) : null,
          receipt_id: newInvReceiptId
        });

      if (error) {
        if (error.code === '23505') {
          showToast('Mã Serial này đã tồn tại trong kho!', 'error');
        } else {
          throw error;
        }
        return;
      }

      showToast(`Nhập kho thỏi vàng ${serialUpper} thành công!`, 'success');
      Swal.fire('Thành công', `Nhập kho thỏi vàng ${serialUpper} thành công!`, 'success');

      if (currentUser?.id) {
        await supabase.from('notifications').insert({
          user_id: currentUser.id,
          title: 'Nhập Kho',
          desc: `Bạn đã nhập thành công thỏi vàng ${serialUpper} vào kho (Nguồn: ${newInvImportSource || 'Không rõ'}).`,
          type: 'system',
          date: new Date().toISOString(),
          unread: true
        });
      }
      setShowAddInventory(false);
      setNewInvSerial(''); // reset
      setNewInvImportSource('');
      setNewInvCostPrice('');
      setNewInvReceiptId('');

    } catch (err) {
      console.error('Lỗi khi nhập kho:', err);
      showToast('Lỗi nhập kho: ' + err.message, 'error');
    }
  };





  // Name mapping helper
  const getGoldTypeName = (goldType) => {
    const targetMap = {
      "SJL1L10": "SJC 9999",
      "SJ9999": "Nhẫn SJC",
      "BTSJC": "Bảo Tín SJC",
      "BT9999NTT": "Bảo Tín 9999",
      "DOHNL": "DOJI Hà Nội",
      "DOHCML": "DOJI HCM",
      "DOJINHTV": "DOJI Nữ Trang",
      "PQHNVM": "PNJ Hà Nội",
      "PQHN24NTT": "PNJ 24K",
      "VNGSJC": "VN Gold SJC",
      "VIETTINMSJC": "Viettin SJC"
    };
    return targetMap[goldType] || goldType;
  };

  // Helper to check brand categories of keys
  const isSjcCategory = (goldType) => {
    const code = goldType.toUpperCase();
    return code.startsWith('SJ') || code === 'BTSJC' || code === 'VNGSJC' || code === 'VIETTINMSJC';
  };
  const isPnjCategory = (goldType) => {
    return goldType.toUpperCase().startsWith('PQ') || goldType.toLowerCase() === 'pnj';
  };
  const isDojiCategory = (goldType) => {
    return goldType.toUpperCase().startsWith('DOJI') || goldType.toLowerCase() === 'doji';
  };

  // Stats
  const sjcStock = dbInventory.filter(i => (isSjcCategory(i.gold_type) || i.gold_type.toLowerCase() === 'sjc') && i.status === 'AVAILABLE').length;
  const pnjStock = dbInventory.filter(i => isPnjCategory(i.gold_type) && i.status === 'AVAILABLE').length;
  const dojiStock = dbInventory.filter(i => isDojiCategory(i.gold_type) && i.status === 'AVAILABLE').length;

  const sjcWeight = dbInventory.filter(i => (isSjcCategory(i.gold_type) || i.gold_type.toLowerCase() === 'sjc') && i.status === 'AVAILABLE').reduce((sum, i) => sum + Number(i.weight_grams), 0);
  const pnjWeight = dbInventory.filter(i => isPnjCategory(i.gold_type) && i.status === 'AVAILABLE').reduce((sum, i) => sum + Number(i.weight_grams), 0);
  const dojiWeight = dbInventory.filter(i => isDojiCategory(i.gold_type) && i.status === 'AVAILABLE').reduce((sum, i) => sum + Number(i.weight_grams), 0);

  const filteredInventory = dbInventory.filter(item => {
    if (invFilterType !== 'all' && item.gold_type !== invFilterType) return false;
    if (invFilterStatus !== 'all' && item.status !== invFilterStatus) return false;
    if (invSearchQuery.trim() !== '') {
      return item.gold_serial.toLowerCase().includes(invSearchQuery.toLowerCase().trim());
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 10000,
          background: toast.type === 'success' ? 'var(--emerald)' : 'var(--ruby)',
          color: '#fff', padding: '16px 24px', borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)', fontWeight: 600, fontSize: '14px',
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}

      {/* Inventory Stats */}
      <div className="grid-3">
        <div className="stat-card" style={{ borderLeft: '3px solid var(--gold)' }}>
          <div className="stat-label">SJC TRONG KHO (AVAILABLE)</div>
          <div className="stat-value">{sjcStock} thỏi</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Khối lượng: {sjcWeight.toFixed(2)}g (~ {(sjcWeight / 3.75).toFixed(2)} chỉ)</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #888' }}>
          <div className="stat-label">PNJ TRONG KHO (AVAILABLE)</div>
          <div className="stat-value">{pnjStock} thỏi</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Khối lượng: {pnjWeight.toFixed(2)}g (~ {(pnjWeight / 3.75).toFixed(2)} chỉ)</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--ruby)' }}>
          <div className="stat-label">DOJI TRONG KHO (AVAILABLE)</div>
          <div className="stat-value" style={{ color: dojiStock < 5 ? 'var(--ruby)' : '#fff' }}>{dojiStock} thỏi</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Khối lượng: {dojiWeight.toFixed(2)}g (~ {(dojiWeight / 3.75).toFixed(2)} chỉ) | {dojiStock < 5 ? 'Thấp!' : 'An toàn'}</div>
        </div>
      </div>

      {/* Action Row & Filter */}
      <div className="neo-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-input" style={{ width: 'auto', borderRadius: '8px', fontSize: '12px', padding: '6px 12px', height: '34px' }} value={invFilterType} onChange={e => setInvFilterType(e.target.value)}>
              <option value="all">Tất cả loại vàng</option>
              <option value="sjc">SJC</option>
              <option value="pnj">PNJ</option>
              <option value="doji">DOJI</option>
            </select>
            <select className="form-input" style={{ width: 'auto', borderRadius: '8px', fontSize: '12px', padding: '6px 12px', height: '34px' }} value={invFilterStatus} onChange={e => setInvFilterStatus(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="AVAILABLE">Sẵn sàng (AVAILABLE)</option>
              <option value="RESERVED">Đặt cọc (RESERVED)</option>
              <option value="DISPATCHED">Đã bàn giao (DISPATCHED)</option>
            </select>
            <input
              className="form-input"
              placeholder="Tìm kiếm mã Serial..."
              style={{ width: '180px', borderRadius: '8px', fontSize: '12px', padding: '6px 12px', height: '34px' }}
              value={invSearchQuery}
              onChange={e => setInvSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-gold" onClick={() => setShowAddInventory(!showAddInventory)} style={{ borderRadius: '99px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <Plus size={14} /> Nhập kho thỏi vàng mới
          </button>
        </div>

        {/* Add stock form */}
        {showAddInventory && (
          <form onSubmit={handleAddInventory} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Loại vàng</label>
              <select
                className="form-input"
                value={newInvType}
                onChange={e => {
                  const val = e.target.value;
                  setNewInvType(val);
                  setNewInvWeight('1');
                }}
              >
                <option value="SJL1L10">SJC 9999</option>
                <option value="SJ9999">Nhẫn SJC</option>
                <option value="BTSJC">Bảo Tín SJC</option>
                <option value="BT9999NTT">Bảo Tín 9999</option>
                <option value="DOHNL">DOJI Hà Nội</option>
                <option value="DOHCML">DOJI HCM</option>
                <option value="DOJINHTV">DOJI Nữ Trang</option>
                <option value="PQHNVM">PNJ Hà Nội</option>
                <option value="PQHN24NTT">PNJ 24K</option>
                <option value="VNGSJC">VN Gold SJC</option>
                <option value="VIETTINMSJC">Viettin SJC</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Trọng lượng (chỉ)</label>
              <input className="form-input" type="number" step="0.01" value={newInvWeight} onChange={e => setNewInvWeight(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Mã Serial thỏi vàng</label>
              <input
                className="form-input"
                placeholder="VD: SJC123456"
                value={newInvSerial}
                onChange={e => setNewInvSerial(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nguồn nhập (Tùy chọn)</label>
              <input
                className="form-input"
                placeholder="VD: Chi nhánh Quận 1"
                value={newInvImportSource}
                onChange={e => setNewInvImportSource(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Mã biên nhận (Tùy chọn)</label>
              <input
                className="form-input"
                placeholder="VD: RC12356"
                value={newInvReceiptId}
                onChange={e => setNewInvReceiptId(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Giá vốn - VNĐ (Tùy chọn)</label>
              <input
                className="form-input"
                type="number"
                placeholder="Giá nhập kho..."
                value={newInvCostPrice}
                onChange={e => setNewInvCostPrice(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-gold" style={{ flex: 1, padding: '12px', borderRadius: '99px', fontWeight: 600 }}>
                Nhập kho
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowAddInventory(false)} style={{ padding: '12px', borderRadius: '99px', fontWeight: 600 }}>
                Hủy
              </button>
            </div>
          </form>
        )}

        {/* Inventory table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Mã Serial</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Loại vàng</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Trọng lượng</th>

                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Trạng thái</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Hợp đồng/Đơn gán</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Mã biên nhận</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Nguồn nhập</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Ngày nhập</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có dữ liệu thỏi vàng vật chất nào</td>
                </tr>
              ) : (
                filteredInventory.map(item => {
                  let badgeClass = 'badge-green';
                  if (item.status === 'RESERVED') badgeClass = 'badge-gold';
                  else if (item.status === 'DISPATCHED') badgeClass = 'badge-gray';

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontWeight: 'bold' }}>{item.gold_serial}</td>
                      <td style={{ padding: '12px 8px' }}>{getGoldTypeName(item.gold_type).toUpperCase()}</td>
                      <td style={{ padding: '12px 8px' }}>{(Number(item.weight_grams) / 3.75).toFixed(2)} chỉ ({item.weight_grams}g)</td>

                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${badgeClass}`} style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>{item.status}</span>
                      </td>
                      <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.order_id ? item.order_id : '—'}
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '13px' }}>{item.receipt_id || '—'}</td>
                      <td style={{ padding: '12px 8px', fontSize: '13px' }}>
                        {item.import_source || '—'}
                        {item.cost_price_vnd && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Giá vốn: {Number(item.cost_price_vnd).toLocaleString('vi-VN')} đ</div>}
                      </td>
                      <td className="body-sm" style={{ padding: '12px 8px' }}>{new Date(item.stored_at).toLocaleDateString('vi-VN')}</td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
