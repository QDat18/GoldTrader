import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import useStore from '../../store/useStore';
import { supabase } from '../../supabaseClient';
import { Plus, Pencil, Trash2, Package, Weight, DollarSign } from 'lucide-react';

export default function AdminInventory() {
  const dbInventory = useStore(state => state.adminInventory);
  const fetchAdminInventory = useStore(state => state.fetchAdminInventory);
  const currentUser = useStore(state => state.currentUser);
  const [toast, setToast] = useState(null);

  // States - Nhập kho
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [newInvType, setNewInvType] = useState('SJL1L10');
  const [newInvWeight, setNewInvWeight] = useState('1');
  const [newInvSerial, setNewInvSerial] = useState('');
  const [newInvImportSource, setNewInvImportSource] = useState('');
  const [newInvCostPrice, setNewInvCostPrice] = useState('');
  const [newInvReceiptId, setNewInvReceiptId] = useState('');

  // States - Bộ lọc
  const [invFilterType, setInvFilterType] = useState('all');
  const [invFilterStatus, setInvFilterStatus] = useState('all');
  const [invSearchQuery, setInvSearchQuery] = useState('');

  // States - Chỉnh sửa
  const [editingId, setEditingId] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ==== NHẬP KHO ====
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
          weight_grams: weightVal * 3.75,
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
      setNewInvSerial('');
      setNewInvImportSource('');
      setNewInvCostPrice('');
      setNewInvReceiptId('');
      fetchAdminInventory();
    } catch (err) {
      console.error('Lỗi khi nhập kho:', err);
      showToast('Lỗi nhập kho: ' + err.message, 'error');
    }
  };

  // ==== SỬA TRỌNG LƯỢNG / NGUỒN NHẬP ====
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditWeight((Number(item.weight_grams) / 3.75).toFixed(4));
    setEditSource(item.import_source || '');
    setEditCostPrice(item.cost_price_vnd ? String(item.cost_price_vnd) : '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditWeight('');
    setEditSource('');
    setEditCostPrice('');
  };

  const handleSaveEdit = async (item) => {
    const weightVal = parseFloat(editWeight);
    if (isNaN(weightVal) || weightVal <= 0) {
      showToast('Trọng lượng không hợp lệ.', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('vault_inventory')
        .update({
          weight_grams: Number((weightVal * 3.75).toFixed(4)),
          import_source: editSource || item.import_source,
          cost_price_vnd: editCostPrice ? parseFloat(editCostPrice) : item.cost_price_vnd
        })
        .eq('id', item.id);

      if (error) throw error;

      showToast(`Cập nhật ${item.gold_serial} thành công!`);
      handleCancelEdit();
      fetchAdminInventory();
    } catch (err) {
      console.error('Lỗi cập nhật:', err);
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  // ==== XÓA ====
  const handleDelete = async (item) => {
    if (item.status === 'RESERVED') {
      showToast('Không thể xóa mặt hàng đang RESERVED cho đơn hàng!', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      html: `Bạn có chắc muốn xóa <b>${item.gold_serial}</b> (${(Number(item.weight_grams) / 3.75).toFixed(2)} chỉ ${getGoldTypeName(item.gold_type)}) khỏi kho?<br/><br/>Thao tác này <b>không thể hoàn tác</b>.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444'
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from('vault_inventory')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      showToast(`Đã xóa ${item.gold_serial} khỏi kho.`);
      fetchAdminInventory();
    } catch (err) {
      console.error('Lỗi xóa:', err);
      showToast('Lỗi xóa: ' + err.message, 'error');
    }
  };

  // ==== HELPERS ====
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

  const isSjcCategory = (goldType) => {
    const code = goldType.toUpperCase();
    return code.startsWith('SJ') || code === 'BTSJC' || code === 'VNGSJC' || code === 'VIETTINMSJC';
  };
  const isPnjCategory = (goldType) => {
    return goldType.toUpperCase().startsWith('PQ') || goldType.toLowerCase() === 'pnj';
  };
  const isDojiCategory = (goldType) => {
    return goldType.toUpperCase().startsWith('DO') || goldType.toLowerCase() === 'doji';
  };
  const isBtCategory = (goldType) => {
    return goldType.toUpperCase().startsWith('BT');
  };

  const getCategoryForType = (goldType) => {
    if (isSjcCategory(goldType)) return 'sjc';
    if (isPnjCategory(goldType)) return 'pnj';
    if (isDojiCategory(goldType)) return 'doji';
    if (isBtCategory(goldType)) return 'bt';
    return 'other';
  };

  // ==== STATS ====
  const allAvailable = dbInventory.filter(i => i.status === 'AVAILABLE');
  const allReserved = dbInventory.filter(i => i.status === 'RESERVED');
  const allDispatched = dbInventory.filter(i => i.status === 'DISPATCHED');

  const totalAvailableWeight = allAvailable.reduce((sum, i) => sum + Number(i.weight_grams), 0);
  const totalReservedWeight = allReserved.reduce((sum, i) => sum + Number(i.weight_grams), 0);
  const totalCostValue = dbInventory.filter(i => i.status === 'AVAILABLE' && i.cost_price_vnd).reduce((sum, i) => sum + Number(i.cost_price_vnd), 0);

  // Filter logic — sử dụng category functions thay vì so sánh trực tiếp
  const filteredInventory = dbInventory.filter(item => {
    if (invFilterType !== 'all') {
      const itemCategory = getCategoryForType(item.gold_type);
      if (invFilterType !== item.gold_type && invFilterType !== itemCategory) return false;
    }
    if (invFilterStatus !== 'all' && item.status !== invFilterStatus) return false;
    if (invSearchQuery.trim() !== '') {
      const q = invSearchQuery.toLowerCase().trim();
      return item.gold_serial.toLowerCase().includes(q) ||
             getGoldTypeName(item.gold_type).toLowerCase().includes(q) ||
             (item.import_source || '').toLowerCase().includes(q) ||
             (item.order_id || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Tính tổng trọng lượng đang hiện trên bảng (filtered)
  const filteredTotalWeight = filteredInventory.reduce((sum, i) => sum + Number(i.weight_grams), 0);

  // Unique gold types for filter dropdown
  const allGoldTypes = [...new Set(dbInventory.map(i => i.gold_type))];

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--emerald)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Package size={16} style={{ color: 'var(--emerald)' }} />
            <div className="stat-label">SẴN SÀNG (AVAILABLE)</div>
          </div>
          <div className="stat-value" style={{ fontSize: '22px' }}>{allAvailable.length} lô</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
            {(totalAvailableWeight / 3.75).toFixed(2)} chỉ ({totalAvailableWeight.toFixed(2)}g)
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Weight size={16} style={{ color: 'var(--gold)' }} />
            <div className="stat-label">ĐÃ ĐẶT CỌC (RESERVED)</div>
          </div>
          <div className="stat-value" style={{ fontSize: '22px' }}>{allReserved.length} lô</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
            {(totalReservedWeight / 3.75).toFixed(2)} chỉ ({totalReservedWeight.toFixed(2)}g)
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid rgba(255,255,255,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Package size={16} style={{ color: 'var(--text-muted)' }} />
            <div className="stat-label">ĐÃ BÀN GIAO (DISPATCHED)</div>
          </div>
          <div className="stat-value" style={{ fontSize: '22px', color: 'var(--text-muted)' }}>{allDispatched.length} lô</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
            Đã xuất kho vĩnh viễn
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <DollarSign size={16} style={{ color: 'var(--gold)' }} />
            <div className="stat-label">TỔNG GIÁ VỐN KHO</div>
          </div>
          <div className="stat-value" style={{ fontSize: '22px' }}>
            {totalCostValue > 0 ? `₫${(totalCostValue / 1_000_000_000).toFixed(2)}B` : '—'}
          </div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>
            {totalCostValue > 0 ? `${totalCostValue.toLocaleString('vi-VN')} đ` : 'Chưa có dữ liệu giá vốn'}
          </div>
        </div>
      </div>

      {/* Action Row & Filter */}
      <div className="neo-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Filter theo loại vàng — dùng danh sách thực từ database */}
            <select className="form-input" style={{ width: 'auto', borderRadius: '8px', fontSize: '12px', padding: '6px 12px', height: '34px' }} value={invFilterType} onChange={e => setInvFilterType(e.target.value)}>
              <option value="all">Tất cả loại vàng</option>
              <optgroup label="Theo danh mục">
                <option value="sjc">Nhóm SJC</option>
                <option value="pnj">Nhóm PNJ</option>
                <option value="doji">Nhóm DOJI</option>
                <option value="bt">Nhóm Bảo Tín</option>
              </optgroup>
              <optgroup label="Theo mã cụ thể">
                {allGoldTypes.map(t => (
                  <option key={t} value={t}>{t} — {getGoldTypeName(t)}</option>
                ))}
              </optgroup>
            </select>
            <select className="form-input" style={{ width: 'auto', borderRadius: '8px', fontSize: '12px', padding: '6px 12px', height: '34px' }} value={invFilterStatus} onChange={e => setInvFilterStatus(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="AVAILABLE">✅ Sẵn sàng (AVAILABLE)</option>
              <option value="RESERVED">🔒 Đặt cọc (RESERVED)</option>
              <option value="DISPATCHED">📦 Đã bàn giao (DISPATCHED)</option>
            </select>
            <input
              className="form-input"
              placeholder="Tìm Serial, loại vàng, nguồn nhập, mã đơn..."
              style={{ width: '260px', borderRadius: '8px', fontSize: '12px', padding: '6px 12px', height: '34px' }}
              value={invSearchQuery}
              onChange={e => setInvSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-gold" onClick={() => setShowAddInventory(!showAddInventory)} style={{ borderRadius: '99px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <Plus size={14} /> Nhập kho mới
          </button>
        </div>

        {/* Add stock form */}
        {showAddInventory && (
          <form onSubmit={handleAddInventory} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--gold)' }}>Nhập lô vàng mới vào kho</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Loại vàng</label>
                <select
                  className="form-input"
                  value={newInvType}
                  onChange={e => {
                    setNewInvType(e.target.value);
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
                <label className="form-label">
                  Trọng lượng (chỉ)
                  {newInvWeight && !isNaN(newInvWeight) && parseFloat(newInvWeight) > 0 && (
                    <span style={{ color: 'var(--gold)', fontWeight: 400, marginLeft: '8px' }}>
                      = {(parseFloat(newInvWeight) * 3.75).toFixed(4)}g
                    </span>
                  )}
                </label>
                <input className="form-input" type="number" step="0.01" min="0.01" value={newInvWeight} onChange={e => setNewInvWeight(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mã Serial</label>
                <input
                  className="form-input"
                  placeholder="VD: SJC123456"
                  value={newInvSerial}
                  onChange={e => setNewInvSerial(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nguồn nhập</label>
                <input
                  className="form-input"
                  placeholder="VD: Chi nhánh Quận 1"
                  value={newInvImportSource}
                  onChange={e => setNewInvImportSource(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mã biên nhận</label>
                <input
                  className="form-input"
                  placeholder="VD: RC12356"
                  value={newInvReceiptId}
                  onChange={e => setNewInvReceiptId(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Giá vốn (VNĐ)</label>
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
            </div>
          </form>
        )}

        {/* Summary bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>Hiển thị <b style={{ color: '#fff' }}>{filteredInventory.length}</b> / {dbInventory.length} lô hàng</span>
          <span>Tổng khối lượng (đang lọc): <b style={{ color: 'var(--gold)' }}>{(filteredTotalWeight / 3.75).toFixed(2)} chỉ</b> ({filteredTotalWeight.toFixed(2)}g)</span>
        </div>

        {/* Inventory table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Mã Serial</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Loại vàng</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Trọng lượng</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Trạng thái</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Đơn hàng gán</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Biên nhận</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Nguồn nhập / Giá vốn</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Ngày nhập</th>
                <th style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--text-muted)', width: '100px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Package size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <div>Không có dữ liệu phù hợp với bộ lọc</div>
                  </td>
                </tr>
              ) : (
                filteredInventory.map(item => {
                  const isEditing = editingId === item.id;
                  let badgeColor = 'var(--emerald)';
                  let badgeBg = 'rgba(16,185,129,0.1)';
                  let badgeLabel = 'AVAILABLE';
                  if (item.status === 'RESERVED') {
                    badgeColor = 'var(--gold)';
                    badgeBg = 'rgba(212,175,55,0.1)';
                    badgeLabel = 'RESERVED';
                  } else if (item.status === 'DISPATCHED') {
                    badgeColor = 'var(--text-muted)';
                    badgeBg = 'rgba(255,255,255,0.05)';
                    badgeLabel = 'DISPATCHED';
                  }

                  const weightGrams = Number(item.weight_grams);
                  const weightChi = (weightGrams / 3.75).toFixed(2);

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isEditing ? 'rgba(212,175,55,0.03)' : 'transparent' }}>
                      <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px' }}>{item.gold_serial}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: 600. }}>{getGoldTypeName(item.gold_type)}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.gold_type}</div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <input
                              className="form-input"
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={editWeight}
                              onChange={e => setEditWeight(e.target.value)}
                              style={{ width: '100px', padding: '4px 8px', fontSize: '12px', height: '30px' }}
                            />
                            <span style={{ fontSize: '10px', color: 'var(--gold)' }}>
                              = {editWeight && !isNaN(editWeight) ? (parseFloat(editWeight) * 3.75).toFixed(4) : 0}g
                            </span>
                          </div>
                        ) : (
                          <>
                            <span style={{ fontWeight: 600 }}>{weightChi} chỉ</span>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{weightGrams}g</div>
                          </>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          fontSize: '10px', padding: '4px 10px', borderRadius: '6px',
                          background: badgeBg, color: badgeColor, fontWeight: 600, letterSpacing: '0.02em'
                        }}>
                          {badgeLabel}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.order_id ? item.order_id : '—'}
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '12px' }}>{item.receipt_id || '—'}</td>
                      <td style={{ padding: '12px 8px', fontSize: '12px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <input
                              className="form-input"
                              value={editSource}
                              onChange={e => setEditSource(e.target.value)}
                              placeholder="Nguồn nhập"
                              style={{ padding: '4px 8px', fontSize: '11px', height: '28px' }}
                            />
                            <input
                              className="form-input"
                              type="number"
                              value={editCostPrice}
                              onChange={e => setEditCostPrice(e.target.value)}
                              placeholder="Giá vốn (VNĐ)"
                              style={{ padding: '4px 8px', fontSize: '11px', height: '28px' }}
                            />
                          </div>
                        ) : (
                          <>
                            {item.import_source || '—'}
                            {item.cost_price_vnd && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Giá vốn: {Number(item.cost_price_vnd).toLocaleString('vi-VN')} đ</div>}
                          </>
                        )}
                      </td>
                      <td className="body-sm" style={{ padding: '12px 8px', fontSize: '12px' }}>{new Date(item.stored_at).toLocaleDateString('vi-VN')}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button onClick={() => handleSaveEdit(item)} className="btn btn-gold" style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '6px', fontWeight: 600 }}>Lưu</button>
                            <button onClick={handleCancelEdit} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}>Hủy</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            {item.status === 'AVAILABLE' && (
                              <button
                                onClick={() => handleStartEdit(item)}
                                title="Chỉnh sửa"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', padding: '4px', borderRadius: '4px' }}
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {item.status !== 'RESERVED' && (
                              <button
                                onClick={() => handleDelete(item)}
                                title="Xóa"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ruby)', padding: '4px', borderRadius: '4px', opacity: 0.7 }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
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
