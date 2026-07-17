import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useLocation, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { supabase } from '../../supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { QrCode, Search, Check, ShieldAlert, XCircle } from 'lucide-react';

const supabaseLedger = supabase.schema('financial_ledgers');

export default function AdminO2o() {
  const navigate = useNavigate();
  const location = useLocation();

  const dbOrders = useStore(state => state.adminOrders);
  const usersMap = useStore(state => state.adminUsersMap);
  const dbInventory = useStore(state => state.adminInventory);
  const fetchAdminOrders = useStore(state => state.fetchAdminOrders);

  // States
  const [orderIdInput, setOrderIdInput] = useState('');
  const [secureTokenInput, setSecureTokenInput] = useState('');
  const [o2oError, setO2oError] = useState('');
  const [matchedOrder, setMatchedOrder] = useState(null);
  const [matchedUser, setMatchedUser] = useState(null);
  const [selectedInventoryBar, setSelectedInventoryBar] = useState('');
  const [totpVerificationResult, setTotpVerificationResult] = useState(null);



  const handleVerifyO2oQr = (customOrderId, customToken) => {
    setO2oError('');
    setMatchedOrder(null);
    setMatchedUser(null);
    setTotpVerificationResult(null);

    const checkOrderId = typeof customOrderId === 'string' ? customOrderId.trim() : orderIdInput.trim();
    const otp = typeof customToken === 'string' ? customToken.trim() : secureTokenInput.trim();

    if (!checkOrderId) {
      setO2oError('Vui lòng nhập Mã hợp đồng (Order ID).');
      return;
    }

    const order = dbOrders.find(o => o.id === checkOrderId);
    if (!order) {
      setO2oError('Không tìm thấy đơn hàng tương ứng với mã cung cấp.');
      return;
    }

    if (order.order_type !== 'WITHDRAW_PHYSICAL' && order.order_type !== 'PHYSICAL_WITHDRAWAL') {
      setO2oError('Đơn hàng này không phải loại rút vàng vật chất O2O.');
      return;
    }

    const client = usersMap[order.user_id] || { full_name: 'Khách hàng', phone: '—', id_card_number: '—' };

    if (!otp) {
      setO2oError('Bắt buộc: Khách hàng phải cung cấp Mã bảo mật (Token) trong Email để nhận vàng.');
      return;
    }

    if (otp === order.secure_token) {
      setMatchedOrder(order);
      setMatchedUser(client);
      setTotpVerificationResult({
        valid: true,
        message: 'Mã Lệnh bảo mật hợp lệ! Xác định chính xác chủ sở hữu tài sản.'
      });
    } else {
      setO2oError('Mã Bảo Mật không trùng khớp hoặc sai cú pháp (Báo động: Nghi vấn gian lận).');
      setTotpVerificationResult({
        valid: false,
        message: 'Từ chối hiển thị thông tin bảng đối chiếu do bảo mật.'
      });
    }

    // Auto select matching bar
    const matchingBar = dbInventory.find(i => 
      i.gold_type === order.gold_type && 
      i.status === 'AVAILABLE'
    );
    if (matchingBar) {
      setSelectedInventoryBar(matchingBar.gold_serial);
    } else {
      setSelectedInventoryBar('');
    }
  };

  const handleDispatchGold = async () => {
    if (!matchedOrder) return;

    const confirmMsg = `QUẢN TRỊ VIÊN XÁC NHẬN BÀN GIAO:\n\nĐơn hàng: ${matchedOrder.id}\nSản phẩm: ${(Number(matchedOrder.quantity_grams) / 3.75).toFixed(3)} chỉ ${matchedOrder.gold_type.toUpperCase()}\nThỏi Serial: ${selectedInventoryBar || 'Hệ thống tự động chọn'}\nKhách nhận: ${matchedUser.full_name} (CCCD: ${matchedUser.id_card_number})\n\nThao tác này là CUỐI CÙNG, sẽ khấu trừ ví vàng của khách và đóng đơn vĩnh viễn. Bạn có chắc chắn muốn xác nhận bàn giao không?`;
    
    const result = await Swal.fire({
      title: 'Xác nhận bàn giao',
      html: confirmMsg.replace(/\n/g, '<br/>'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy'
    });
    
    if (!result.isConfirmed) {
      return;
    }

    try {
      const { error: ordErr } = await supabaseLedger
        .from('orders')
        .update({
          payment_status: 'PAID',
          completed_at: new Date().toISOString(),
          order_status: 'COMPLETED'
        })
        .eq('id', matchedOrder.id);

      if (ordErr) throw ordErr;

      if (selectedInventoryBar) {
        const { error: invErr } = await supabase
          .from('vault_inventory')
          .update({
            status: 'DISPATCHED',
            order_id: matchedOrder.id,
            dispatched_at: new Date().toISOString()
          })
          .eq('gold_serial', selectedInventoryBar);

        if (invErr) throw invErr;
      }

      // Trừ ví vàng của user vào lúc Admin bấm xác nhận
      const { data: walletData, error: walletErr } = await supabase
        .from('gold_wallets')
        .select('id, quantity_grams')
        .eq('user_id', matchedOrder.user_id)
        .eq('gold_type', matchedOrder.gold_type)
        .single();
      
      if (!walletErr && walletData) {
        const newGrams = Math.max(0, Number(walletData.quantity_grams) - Number(matchedOrder.quantity_grams));
        await supabase
          .from('gold_wallets')
          .update({ quantity_grams: newGrams, last_updated_at: new Date().toISOString() })
          .eq('id', walletData.id);
      }

      // Gửi thông báo rút vàng thành công cho User
      const qtyChỉ = (Number(matchedOrder.quantity_grams) / 3.75).toFixed(3);
      await supabase.from('notifications').insert({
        user_id: matchedOrder.user_id,
        type: 'trade',
        title: 'Khớp lệnh rút vàng vật lý thành công',
        desc: `Đã hoàn tất bàn giao ${qtyChỉ} chỉ vàng ${matchedOrder.gold_type.toUpperCase()} tại quầy (Đơn hàng: ${matchedOrder.id}). Thỏi Serial: ${selectedInventoryBar || 'Tự động'}.`,
        unread: true,
        date: new Date().toLocaleString('vi-VN')
      });

      // Lưu log notification cho chính Admin
      const currentUserStr = window.localStorage.getItem('goldchain_store');
      let adminId = null;
      if (currentUserStr) {
        try {
          const parsed = JSON.parse(currentUserStr);
          if (parsed.state?.currentUser?.id) {
             adminId = parsed.state.currentUser.id;
          }
        } catch (e) {}
      }
      if (adminId) {
        await supabase.from('notifications').insert({
          user_id: adminId,
          type: 'system',
          title: 'Duyệt đơn O2O thành công',
          desc: `Bạn vừa hoàn tất bàn giao đơn ${matchedOrder.id} cho khách ${matchedUser.full_name}.`,
          unread: true,
          date: new Date().toLocaleString('vi-VN')
        });
      }

      Swal.fire('Thành công', `Đã bàn giao vàng vật chất thành công!\n- Đơn hàng: ${matchedOrder.id}\n- Thỏi vàng Serial: ${selectedInventoryBar || 'Tự động'}\n- Khách nhận: ${matchedUser.full_name}`, 'success');

      // Reset
      setOrderIdInput('');
      setSecureTokenInput('');
      setMatchedOrder(null);
      setMatchedUser(null);
      setSelectedInventoryBar('');
      setTotpVerificationResult(null);

      // Clean path search queries
      navigate('/admin/o2o', { replace: true });
      fetchAdminOrders();
    } catch (err) {
      console.error('Lỗi khi bàn giao vàng:', err);
      Swal.fire('Lỗi', 'Không thể hoàn thành bàn giao: ' + err.message, 'error');
    }
  };



  // Sync url order_id if redirected from Orders tab
  useEffect(() => {
    if (dbOrders.length > 0) {
      const params = new URLSearchParams(location.search);
      const urlOrderId = params.get('order_id');
      if (urlOrderId) {
        setOrderIdInput(urlOrderId);
        handleVerifyO2oQr(urlOrderId, '');
      }
    }
  }, [location.search, dbOrders]);

  const pendingOrders = dbOrders.filter(o => o.status === 'PENDING');
  const availableInventory = dbInventory.filter(i => i.status === 'AVAILABLE');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      
      {/* Scan Panel */}
      <div className="neo-card" style={{ padding: '24px' }}>
        <div className="h3" style={{ fontSize: '20px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
          <QrCode style={{ color: 'var(--gold)' }} size={24} />
          Quầy xác thực TOTP Dynamic QR Code
        </div>
        <p className="body-sm" style={{ marginBottom: '20px' }}>
          Nhập Token hoặc chuỗi Dynamic QR Code được sinh ra trên ứng dụng của khách hàng để đối chiếu bảo mật thời gian thực.
        </p>

        <div className="form-group">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Mã Hợp Đồng</label>
              <input
                className="form-input"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="VD: ORD-123456"
                style={{ background: '#121212', borderRadius: '8px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px', color: 'var(--gold)' }}>Mã Bảo Mật Email</label>
              <input
                className="form-input"
                value={secureTokenInput}
                onChange={(e) => setSecureTokenInput(e.target.value)}
                placeholder="VD: TOK-ABCDEF"
                style={{ background: '#121212', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.2)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-gold" onClick={() => handleVerifyO2oQr()} style={{ borderRadius: '8px', padding: '0 24px', height: '46px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Xác thực
              </button>
            </div>
          </div>
          {o2oError && <div style={{ color: 'var(--ruby)', fontSize: '12px', marginTop: '10px' }}>{o2oError}</div>}
        </div>


      </div>

      {/* Results Panel */}
      <div className="neo-card" style={{ padding: '24px' }}>
        <div className="h3" style={{ fontSize: '18px', marginBottom: '16px' }}>Kết quả đối chiếu thông tin gốc</div>

        {!matchedOrder ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--text-muted)' }}>
            <Search size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <span>Chưa có thông tin đơn hàng được quét.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* TOTP Alert */}
            {totpVerificationResult && (
              <div style={{
                padding: '12px', borderRadius: '8px',
                background: totpVerificationResult.valid ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: totpVerificationResult.valid ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <Check size={18} style={{ color: 'var(--emerald)' }} />
                <span style={{ fontSize: '13px', color: totpVerificationResult.valid ? 'var(--emerald)' : 'var(--ruby)', fontWeight: 500 }}>
                  {totpVerificationResult.message}
                </span>
              </div>
            )}

            {/* Info block */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TÊN KHÁCH HÀNG</span>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff', marginTop: '2px' }}>{matchedUser.full_name}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SỐ ĐIỆN THOẠI</span>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff', marginTop: '2px' }}>{matchedUser.phone}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SỐ CCCD ĐỐI CHIẾU</span>
                <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--gold)', marginTop: '2px', letterSpacing: '0.04em' }}>{matchedUser.id_card_number || '001234567890'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SẢN PHẨM RÚT</span>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff', marginTop: '2px' }}>{matchedOrder.gold_type.toUpperCase()}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SỐ LƯỢNG KÝ GỬI</span>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff', marginTop: '2px' }}>{(Number(matchedOrder.quantity_grams) / 3.75).toFixed(3)} chỉ</div>
              </div>
            </div>

            {/* CCCD Mock Photos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#121212', height: '90px', borderRadius: '6px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CCCD Mặt trước</span>
                <span style={{ fontSize: '12px', color: 'var(--emerald)', fontWeight: 500 }}>[ Đã lưu trên Cloud ]</span>
              </div>
              <div style={{ background: '#121212', height: '90px', borderRadius: '6px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CCCD Mặt sau</span>
                <span style={{ fontSize: '12px', color: 'var(--emerald)', fontWeight: 500 }}>[ Đã lưu trên Cloud ]</span>
              </div>
            </div>

            {/* Select stock gold bar */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Chọn thỏi vàng vật chất bàn giao (Serial trong Kho)</label>
              <select
                className="form-input"
                value={selectedInventoryBar}
                onChange={(e) => setSelectedInventoryBar(e.target.value)}
                style={{ background: '#121212', borderRadius: '8px' }}
              >
                <option value="">-- Tự động phân bổ thỏi ngẫu nhiên --</option>
                {availableInventory
                  .filter(i => i.gold_type === matchedOrder.gold_type)
                  .map(i => (
                    <option key={i.gold_serial} value={i.gold_serial}>
                      {i.gold_serial} ({i.weight_grams}g)
                    </option>
                  ))
                }
              </select>
            </div>

            {(() => {
              const activeBar = availableInventory.find(i => i.gold_serial === selectedInventoryBar);
              const barWeight = activeBar ? Number(activeBar.weight_grams) : 0;
              const orderQtyGrams = Number(matchedOrder.quantity_grams);
              if (selectedInventoryBar && Math.abs(barWeight - orderQtyGrams) > 0.001) {
                return (
                  <div style={{
                    padding: '10px 12px', borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: 'var(--ruby)', fontSize: '12px', marginTop: '8px',
                    fontWeight: 500, lineHeight: '1.4', textAlign: 'left'
                  }}>
                    ⚠️ Cảnh báo: Trọng lượng thỏi vàng chọn ({barWeight.toFixed(2)}g) không khớp với số lượng yêu cầu của đơn hàng ({orderQtyGrams.toFixed(2)}g / {(orderQtyGrams / 3.75).toFixed(2)} chỉ).
                  </div>
                );
              }
              return null;
            })()}

            <button
              onClick={handleDispatchGold}
              disabled={!totpVerificationResult || !totpVerificationResult.valid}
              className="btn btn-gold"
              style={{ width: '100%', padding: '14px', borderRadius: '99px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}
            >
              <Check size={18} /> Xác nhận bàn giao vàng vật lý & Đóng đơn
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
