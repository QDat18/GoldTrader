import React, { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import { supabase } from '../../supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { Layers, Plus } from 'lucide-react';

const supabaseLedger = supabase.schema('financial_ledgers');

export default function AdminHedging() {
  const dbHedges = useStore(state => state.adminHedges);
  const fetchAdminHedges = useStore(state => state.fetchAdminHedges);
  const [toast, setToast] = useState(null);

  // States
  const [showAddHedge, setShowAddHedge] = useState(false);
  const [newHedgeGoldType, setNewHedgeGoldType] = useState('sjc');
  const [newHedgeQty, setNewHedgeQty] = useState('1');
  const [newHedgePrice, setNewHedgePrice] = useState('');
  const [newHedgeDirection, setNewHedgeDirection] = useState('BUY');
  const [newHedgeBroker, setNewHedgeBroker] = useState('DOJI Wholesale');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };



  const handleAddHedge = async (e) => {
    e.preventDefault();
    const qtyVal = parseFloat(newHedgeQty);
    const priceVal = parseFloat(newHedgePrice);

    if (isNaN(qtyVal) || qtyVal <= 0) {
      showToast('Khối lượng hedging không hợp lệ.', 'error');
      return;
    }
    if (isNaN(priceVal) || priceVal <= 0) {
      showToast('Giá khớp bảo vệ không hợp lệ.', 'error');
      return;
    }

    try {
      const qtyGrams = qtyVal * 3.75;
      const pricePerGram = Math.round(priceVal / 3.75);

      const { error } = await supabaseLedger
        .from('hedge_positions')
        .insert({
          order_id: `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`,
          gold_type: newHedgeGoldType,
          quantity_grams: qtyGrams,
          hedge_price_vnd: pricePerGram,
          direction: newHedgeDirection,
          counterparty: newHedgeBroker,
          status: 'OPEN',
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      showToast('Đã mở vị thế Hedging thủ công thành công!', 'success');
      setShowAddHedge(false);
      setNewHedgeQty('1');
      setNewHedgePrice('');
      fetchAdminHedges();
    } catch (err) {
      console.error('Lỗi khi mở vị thế hedging:', err);
      showToast('Lỗi mở vị thế: ' + err.message, 'error');
    }
  };

  const handleCloseHedge = async (id) => {
    try {
      const position = dbHedges.find(h => h.id === id);
      if (!position) {
        showToast('Không tìm thấy vị thế này.', 'error');
        return;
      }

      // Lấy giá thị trường hiện tại từ store
      const storeState = useStore.getState();
      const goldPrices = storeState.goldPrices;
      const goldType = position.gold_type.toLowerCase();
      const currentMarket = goldPrices[goldType];

      let marketPricePerGram = 0;
      if (currentMarket) {
        // Long (BUY): bán lại sỉ ở giá mua (buy) của sàn
        // Short (SELL): mua lại sỉ ở giá bán (sell) của sàn
        const marketRateChi = position.direction === 'BUY' ? currentMarket.buy : currentMarket.sell;
        marketPricePerGram = Number(marketRateChi) / 3.75;
      } else {
        marketPricePerGram = Number(position.hedge_price_vnd) * (1 + (Math.random() - 0.5) * 0.01);
      }

      const qtyGrams = Number(position.quantity_grams);
      const hedgePricePerGram = Number(position.hedge_price_vnd);

      let pnlVnd = 0;
      if (position.direction === 'BUY') {
        pnlVnd = Math.round(qtyGrams * (marketPricePerGram - hedgePricePerGram));
      } else {
        pnlVnd = Math.round(qtyGrams * (hedgePricePerGram - marketPricePerGram));
      }

      const { error } = await supabaseLedger
        .from('hedge_positions')
        .update({
          status: 'CLOSED',
          closed_at: new Date().toISOString(),
          pnl_vnd: pnlVnd
        })
        .eq('id', id);

      if (error) throw error;
      showToast(`Đã đóng vị thế ${id}! Lãi/Lỗ tất toán: ₫${pnlVnd.toLocaleString('vi-VN')}`, 'success');
      fetchAdminHedges();
    } catch (err) {
      console.error('Lỗi khi tất toán vị thế:', err);
      showToast('Lỗi đóng vị thế: ' + err.message, 'error');
    }
  };



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

      {/* Hedging summary cards */}
      <div className="grid-3">
        <div className="stat-card" style={{ borderTop: '2px solid var(--emerald)' }}>
          <div className="stat-label">TỔNG VỊ THẾ HEDGING ĐANG MỞ (OPEN)</div>
          <div className="stat-value">{dbHedges.filter(h => h.status === 'OPEN').length} vị thế</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Khóa toàn bộ rủi ro trượt giá sàn</div>
        </div>
        <div className="stat-card" style={{ borderTop: '2px solid var(--gold)' }}>
          <div className="stat-label">KHỐI LƯỢNG HEDGING TÍCH LŨY</div>
          <div className="stat-value">{(dbHedges.reduce((sum, h) => sum + Number(h.quantity_grams), 0) / 3.75).toFixed(2)} chỉ</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Tổng khối lượng đối ứng nhà sỉ</div>
        </div>
        <div className="stat-card" style={{ borderTop: '2px solid var(--ruby)' }}>
          <div className="stat-label">LŨY KẾ LÃI/LỖ HEDGING CHỐT</div>
          {(() => {
            const sumPnl = dbHedges.filter(h => h.status === 'CLOSED').reduce((sum, h) => sum + Number(h.pnl_vnd || 0), 0);
            return (
              <>
                <div className="stat-value" style={{ color: sumPnl >= 0 ? 'var(--emerald)' : 'var(--ruby)' }}>
                  {sumPnl >= 0 ? '+' : ''}₫{sumPnl.toLocaleString('vi-VN')}
                </div>
                <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Từ các vị thế đã đóng</div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Action Row & Filter */}
      <div className="neo-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="h3" style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--gold)" /> Quản lý Hedging phòng vệ rủi ro
          </div>
          <button className="btn btn-gold" onClick={() => setShowAddHedge(!showAddHedge)} style={{ borderRadius: '99px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <Plus size={14} /> Mở vị thế Hedging thủ công
          </button>
        </div>

        {/* Add hedge form */}
        {showAddHedge && (
          <form onSubmit={handleAddHedge} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Chiều vị thế</label>
              <select className="form-input" value={newHedgeDirection} onChange={e => setNewHedgeDirection(e.target.value)}>
                <option value="BUY">MUA VÀO (LONG)</option>
                <option value="SELL">BÁN RA (SHORT)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Loại vàng</label>
              <select className="form-input" value={newHedgeGoldType} onChange={e => setNewHedgeGoldType(e.target.value)}>
                <option value="sjc">SJC 9999</option>
                <option value="pnj">PNJ 24K</option>
                <option value="doji">DOJI Hà Nội</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Khối lượng (chỉ)</label>
              <input className="form-input" type="number" step="0.01" value={newHedgeQty} onChange={e => setNewHedgeQty(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Giá khớp bảo vệ (đ/chỉ)</label>
              <input className="form-input" type="number" value={newHedgePrice} onChange={e => setNewHedgePrice(e.target.value)} placeholder="VD: 78500000" required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nhà đối ứng sỉ</label>
              <select className="form-input" value={newHedgeBroker} onChange={e => setNewHedgeBroker(e.target.value)}>
                <option value="DOJI Wholesale">DOJI Wholesale</option>
                <option value="PNJ Wholesale">PNJ Wholesale</option>
                <option value="SJC Wholesale">SJC Wholesale</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-gold" style={{ flex: 1, padding: '12px', borderRadius: '99px', fontWeight: 600 }}>
                Mở vị thế
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowAddHedge(false)} style={{ padding: '12px', borderRadius: '99px', fontWeight: 600 }}>
                Hủy
              </button>
            </div>
          </form>
        )}

        {/* Hedges list */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Mã vị thế</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Mã đơn liên kết</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Loại vàng</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Khối lượng</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Giá khớp bảo vệ</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Nhà đối ứng sỉ</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Chiều vị thế</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Trạng thái</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Lãi/Lỗ chốt (VND)</th>
                <th style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--text-muted)' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dbHedges.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có vị thế hedging nào được ghi nhận</td>
                </tr>
              ) : (
                dbHedges.map(h => {
                  const isBuy = h.direction === 'BUY';
                  const isOpen = h.status === 'OPEN';
                  return (
                    <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontWeight: 'bold' }}>{h.id}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '11px' }}>{h.order_id}</td>
                      <td style={{ padding: '12px 8px' }}>{h.gold_type.toUpperCase()}</td>
                      <td style={{ padding: '12px 8px' }}>{(Number(h.quantity_grams) / 3.75).toFixed(3)} chỉ</td>
                      <td style={{ padding: '12px 8px' }}>₫{Number(h.hedge_price_vnd * 3.75).toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '12px 8px' }}>{h.counterparty}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${isBuy ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '10px' }}>
                          {isBuy ? 'LONG (MUA)' : 'SHORT (BÁN)'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${isOpen ? 'badge-gold' : 'badge-gray'}`} style={{ fontSize: '10px' }}>
                          {h.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', color: Number(h.pnl_vnd) >= 0 ? 'var(--emerald)' : 'var(--ruby)', fontWeight: 'bold' }}>
                        {isOpen ? '—' : `₫${Number(h.pnl_vnd || 0).toLocaleString('vi-VN')}`}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        {isOpen ? (
                          <button className="btn btn-sm btn-outline" onClick={() => handleCloseHedge(h.id)} style={{ padding: '6px 14px', fontSize: '12px', borderColor: 'var(--gold)', color: 'var(--gold)', borderRadius: '99px', fontWeight: 600 }}>
                            Đóng vị thế
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(h.closed_at).toLocaleTimeString('vi-VN')}</span>
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
