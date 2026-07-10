import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { supabase } from '../../supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle2, RotateCw } from 'lucide-react';

const supabaseLedger = supabase.schema('financial_ledgers');

export default function AdminOrders() {
  const navigate = useNavigate();

  const dbOrders = useStore(state => state.adminOrders);
  const usersMap = useStore(state => state.adminUsersMap);
  const dbInventory = useStore(state => state.adminInventory);
  const fetchAdminOrders = useStore(state => state.fetchAdminOrders);
  const prices = useStore(state => state.goldPrices);

  const [toast, setToast] = useState(null);

  // Filters
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderFilterType, setOrderFilterType] = useState('all');
  const [orderFilterStatus, setOrderFilterStatus] = useState('all');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };



  const handleApproveOrder = async (order) => {
    try {
      // Tìm mã định danh gốc (VD: SJL1L10) từ tên tiếng Việt lưu trong đơn hàng
      const goldType = Object.keys(prices).find(k => prices[k].name === order.gold_type) || order.gold_type;

      // 1. Lấy ví vàng của khách hàng trong CSDL
      const { data: wallets, error: walletErr } = await supabase
        .from('gold_wallets')
        .select('*')
        .eq('user_id', order.user_id)
        .eq('gold_type', goldType);

      if (walletErr) throw walletErr;

      let currentGrams = 0;
      let walletId = null;

      if (wallets && wallets.length > 0) {
        currentGrams = Number(wallets[0].quantity_grams);
        walletId = wallets[0].id;
      } else {
        // Tạo phí vàng mới cho user nếu chưa có ví loại này
        const { data: newWallet, error: nwErr } = await supabase
          .from('gold_wallets')
          .insert({ user_id: order.user_id, gold_type: goldType, quantity_grams: 0.0 })
          .select()
          .single();
        if (nwErr) throw nwErr;
        currentGrams = 0;
        walletId = newWallet.id;
      }

      const qtyGrams = Number(order.quantity_grams);
      const isOnlineBuy = order.order_type === 'BUY_ONLINE';
      const isOnlineSell = order.order_type === 'SELL_ONLINE';

      // 2. Cập nhật các bảng số dư
      if (isOnlineBuy) {
        // Tăng số dư ví vàng
        const newGoldGrams = currentGrams + qtyGrams;
        const { error: updErr } = await supabase
          .from('gold_wallets')
          .update({ quantity_grams: newGoldGrams, updated_at: new Date().toISOString() })
          .eq('id', walletId);
        if (updErr) throw updErr;

        // Lưu log giao dịch tài sản vàng vật lý
        await supabase.from('gold_transactions').insert({
          user_id: order.user_id,
          gold_type: goldType,
          amount_grams: qtyGrams,
          tx_type: 'DEPOSIT',
          desc_text: `Đã mua online ${ (qtyGrams / 3.75).toFixed(3) } chỉ vàng ${goldType.toUpperCase()} (Tự động cộng tài khoản khi hoàn tất).`
        });

        // Gửi thông báo cho user mang tick xanh
        await supabase.from('notifications').insert({
          user_id: order.user_id,
          type: 'trade',
          title: 'Khớp lệnh mua online thành công',
          desc: `Đã khớp mua ${(qtyGrams / 3.75).toFixed(3)} chỉ vàng ${goldType.toUpperCase()}. Số dư vàng đã cộng vào ví của bạn.`,
          unread: true,
          date: new Date().toLocaleString('vi-VN')
        });

      } else if (isOnlineSell) {
        // Khi bán online, hệ thống trừ số dư vàng (đã bị lock/reserve hoặc bị trừ khi submit đơn hàng)
        // Lưu log giao dịch tài sản vàng
        await supabase.from('gold_transactions').insert({
          user_id: order.user_id,
          gold_type: goldType,
          amount_grams: -qtyGrams,
          tx_type: 'WITHDRAWAL',
          desc_text: `Đã khớp bán online ${ (qtyGrams / 3.75).toFixed(3) } chỉ vàng ${goldType.toUpperCase()} thu tiền mặt về ví VND.`
        });

        // Cộng tiền VND vào ví của user
        const { data: userProfile, error: profileErr } = await supabase
          .from('user_profiles')
          .select('wallet_balance_vnd')
          .eq('id', order.user_id)
          .single();

        if (profileErr) throw profileErr;
        const currentBalance = Number(userProfile.wallet_balance_vnd) || 0;
        const totalAmount = Number(order.total_amount_vnd);

        const { error: balErr } = await supabase
          .from('user_profiles')
          .update({ wallet_balance_vnd: currentBalance + totalAmount })
          .eq('id', order.user_id);
        if (balErr) throw balErr;

        // Gửi thông báo
        await supabase.from('notifications').insert({
          user_id: order.user_id,
          type: 'system',
          title: 'Khớp bán vàng trực tuyến thành công',
          desc: `Số tiền ₫${totalAmount.toLocaleString('vi-VN')} đã được chuyển vào tài khoản ví VND của bạn sau khi khớp lệnh bán thành công.`,
          unread: true,
          date: new Date().toLocaleString('vi-VN')
        });
      }

      // 3. Cập nhật trạng thái đơn hàng
      const { error: ordErr } = await supabaseLedger
        .from('orders')
        .update({ order_status: 'COMPLETED', payment_status: 'PAID', completed_at: new Date().toISOString() })
        .eq('id', order.id);
      if (ordErr) throw ordErr;

      // 4. Tự động mở vị thế đối ứng Hedging (Back-to-Back Hedging) như mô tả trong Chương 2.2
      const hedgeId = 'HDG-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const hedgeDirection = order.order_type === 'BUY_ONLINE' ? 'BUY' : 'SELL';

      const { error: hedgeErr } = await supabaseLedger
        .from('hedge_positions')
        .insert({
          id: hedgeId,
          order_id: order.id,
          gold_type: goldType,
          quantity_grams: qtyGrams,
          hedge_price_vnd: Number(order.unit_price_vnd),
          counterparty: 'DOJI Wholesale',
          direction: hedgeDirection,
          status: 'OPEN'
        });

      if (hedgeErr) console.error("Lỗi tự động mở vị thế Hedging đối ứng:", hedgeErr);

      showToast(`Đã duyệt khớp đơn thành công! Vị thế Hedging ${hedgeId} tự động mở.`, 'success');

      // Đồng bộ local store cho user đang đăng nhập
      const storeState = useStore.getState();
      if (storeState.currentUser && order.user_id) {
        storeState.fetchUserBalances(order.user_id);
      }

      fetchAdminOrders();
    } catch (err) {
      console.error('Lỗi khi duyệt đơn hàng:', err);
      showToast('Không thể khớp lệnh đơn hàng: ' + err.message, 'error');
    }
  };



  const pendingOrders = dbOrders.filter(o => o.status === 'PENDING');
  const availableInventory = dbInventory.filter(i => i.status === 'AVAILABLE');
  const dbKycWaitLength = dbOrders.filter(o => o.status === 'PENDING' && o.order_type.includes('WITHDRAW')).length; // quick fallback stats
  
  const filteredOrders = dbOrders.filter(o => {
    // 1. Filter by type
    if (orderFilterType !== 'all') {
      if (orderFilterType === 'BUY' && o.order_type !== 'BUY_ONLINE') return false;
      if (orderFilterType === 'SELL' && o.order_type !== 'SELL_ONLINE') return false;
      if (orderFilterType === 'WITHDRAW' && o.order_type !== 'WITHDRAW_PHYSICAL' && o.order_type !== 'PHYSICAL_WITHDRAWAL') return false;
    }

    // 2. Filter by status
    if (orderFilterStatus !== 'all' && o.status !== orderFilterStatus) return false;

    // 3. Filter by search query
    if (orderSearchQuery.trim() !== '') {
      const q = orderSearchQuery.toLowerCase();
      const client = usersMap[o.user_id] || { full_name: '', phone: '' };
      return (
        o.id.toLowerCase().includes(q) ||
        client.full_name.toLowerCase().includes(q) ||
        client.phone.includes(q)
      );
    }

    return true;
  });

  const sjcStock = dbInventory.filter(i => (i.gold_type.toLowerCase().startsWith('sj') || i.gold_type.toLowerCase().includes('sjc')) && i.status === 'AVAILABLE').length;

  return (
    <>
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

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="stat-card" style={{ borderTop: '2px solid var(--gold)' }}>
          <div className="stat-label">TỔNG ĐƠN HÀNG HỆ THỐNG</div>
          <div className="stat-value gold-text">{dbOrders.length}</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Giao dịch lưu Supabase</div>
        </div>
        <div className="stat-card" style={{ borderTop: '2px solid rgba(255,255,255,0.2)' }}>
          <div className="stat-label">ĐƠN CHỜ PHÊ DUYỆT</div>
          <div className="stat-value">{pendingOrders.length}</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Cần khớp lệnh trực tuyến</div>
        </div>
        <div className="stat-card" style={{ borderTop: '2px solid #3b82f6' }}>
          <div className="stat-label">ĐƠN RÚT VÀNG CHỜ XỬ LÝ</div>
          <div className="stat-value">{dbKycWaitLength}</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Yêu cầu mang mã O2O tại quầy</div>
        </div>
        <div className="stat-card" style={{ borderTop: '2px solid var(--emerald)' }}>
          <div className="stat-label">KHO VÀNG VẬT LÝ SJC</div>
          <div className="stat-value">{sjcStock} thỏi</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Thỏi sẵn sàng bàn giao</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Orders Table */}
        <div className="neo-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div className="h3" style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={20} color="var(--gold)" /> Quản lý Đơn hàng Giao dịch
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn btn-outline" onClick={fetchAdminOrders} style={{ borderRadius: '8px', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', height: '34px' }}>
                <RotateCw size={14} /> Làm mới
              </button>
              <select
                className="form-input"
                style={{ width: 'auto', borderRadius: '8px', fontSize: '12px', padding: '6px 12px', height: '34px' }}
                value={orderFilterType}
                onChange={e => setOrderFilterType(e.target.value)}
              >
                <option value="all">Tất cả loại giao dịch</option>
                <option value="BUY">Mua trực tuyến (BUY)</option>
                <option value="SELL">Bán trực tuyến (SELL)</option>
                <option value="WITHDRAW">Rút vàng vật lý (WITHDRAW)</option>
              </select>
              <select
                className="form-input"
                style={{ width: 'auto', borderRadius: '8px', fontSize: '12px', padding: '6px 12px', height: '34px' }}
                value={orderFilterStatus}
                onChange={e => setOrderFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PENDING">Chờ khớp (PENDING)</option>
                <option value="COMPLETED">Đã khớp (COMPLETED)</option>
                <option value="CANCELLED">Đã hủy (CANCELLED)</option>
              </select>
              <input
                className="form-input"
                placeholder="Tìm ID hoặc SĐT..."
                style={{ width: '180px', borderRadius: '8px', fontSize: '12px', padding: '6px 12px', height: '34px' }}
                value={orderSearchQuery}
                onChange={e => setOrderSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Mã đơn / Ngày lập</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Khách hàng</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Loại & Sản phẩm</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Trọng lượng</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Giá trị giao dịch</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Trạng thái</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-muted)', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có đơn đặt giao dịch nào khớp với bộ lọc</td>
                  </tr>
                ) : (
                  filteredOrders.map(o => {
                    const client = usersMap[o.user_id] || { full_name: 'Khách hàng', phone: '—' };
                    const isBuy = o.order_type.includes('BUY');
                    const isWithdraw = o.order_type.includes('WITHDRAW') || o.order_type.includes('PHYSICAL') || o.order_type.includes('withdrawal');
                    const qtyChỉ = (Number(o.quantity_grams) / 3.75).toFixed(3);
                    return (
                      <tr key={o.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 18px', fontFamily: 'monospace' }}>
                          <div style={{ fontWeight: 600 }}>{o.id.substring(0, 8)}...</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {new Date(o.created_at).toLocaleDateString('vi-VN')} {new Date(o.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{client.full_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{client.phone}</div>
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span className={`badge ${isWithdraw ? 'badge-gold' : isBuy ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '10px', padding: '3px 6px' }}>
                            {o.order_type.toUpperCase()}
                          </span>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Vàng {(prices[o.gold_type]?.name || o.gold_type).toUpperCase()}
                          </div>
                        </td>
                        <td style={{ padding: '12px 18px', fontWeight: 600 }}>
                          {qtyChỉ} chỉ
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>({o.quantity_grams}g)</div>
                        </td>
                        <td style={{ padding: '12px 18px', color: 'var(--gold)', fontWeight: 600 }}>
                          ₫{Number(o.total_amount_vnd).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span className={`badge ${o.status === 'PENDING' ? 'badge-gold' : o.status === 'COMPLETED' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '10px', borderRadius: '4px', padding: '4px 8px' }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                          {o.status === 'PENDING' ? (
                            isWithdraw ? (
                              <button
                                onClick={() => {
                                  navigate(`/admin/o2o?order_id=${o.id}`);
                                }}
                                className="btn btn-sm btn-outline"
                                style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '99px', fontWeight: 600, color: 'var(--gold)', borderColor: 'var(--gold)' }}
                              >
                                Duyệt O2O
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApproveOrder(o)}
                                className="btn btn-sm btn-gold"
                                style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '99px', fontWeight: 600 }}
                              >
                                Khớp lệnh
                              </button>
                            )
                          ) : (
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>✓ Đã xử lý</span>
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
    </>
  );
}
