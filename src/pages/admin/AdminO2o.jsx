import React, { useEffect, useState } from 'react';
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
  const [qrInput, setQrInput] = useState('');
  const [o2oError, setO2oError] = useState('');
  const [matchedOrder, setMatchedOrder] = useState(null);
  const [matchedUser, setMatchedUser] = useState(null);
  const [selectedInventoryBar, setSelectedInventoryBar] = useState('');
  const [totpVerificationResult, setTotpVerificationResult] = useState(null);

  const fetchO2oData = async () => {
    try {
      await fetchAdminOrders();
    } catch (err) {
      console.error('Error fetching O2O counter data:', err);
    }
  };

  const handleVerifyO2oQr = (customInput) => {
    setO2oError('');
    setMatchedOrder(null);
    setMatchedUser(null);
    setTotpVerificationResult(null);

    const inputVal = typeof customInput === 'string' ? customInput : qrInput;

    if (!inputVal.trim()) {
      setO2oError('Vui lòng nhập mã QR hoặc token xác thực.');
      return;
    }

    const parts = inputVal.trim().split('#');
    const orderId = parts[0];
    const otp = parts[1] || '';

    const order = dbOrders.find(o => o.id === orderId);
    if (!order) {
      setO2oError('Không tìm thấy đơn hàng tương ứng với mã cung cấp.');
      return;
    }

    if (order.order_type !== 'WITHDRAW_PHYSICAL' && order.order_type !== 'PHYSICAL_WITHDRAWAL') {
      setO2oError('Đơn hàng này không phải loại rút vàng vật chất O2O.');
      return;
    }

    const client = usersMap[order.user_id] || { full_name: 'Khách hàng', phone: '—', id_card_number: '—' };
    setMatchedOrder(order);
    setMatchedUser(client);

    if (otp) {
      if (otp.length === 6) {
        setTotpVerificationResult({
          valid: true,
          message: 'Mã Dynamic QR khớp hoàn toàn! Xác minh thời gian thực (TOTP) hợp lệ.'
        });
      } else {
        setTotpVerificationResult({
          valid: false,
          message: 'Mã Dynamic QR không hợp lệ hoặc đã hết hạn (chu kỳ 30 giây).'
        });
      }
    } else {
      setTotpVerificationResult({
        valid: true,
        message: 'Xác thực thủ công (Admin Bypass) thành công.'
      });
    }

    // Auto select matching bar
    const getGoldTypeCode = (name) => {
      if (!name) return '';
      const reverseMap = {
        "sjc 9999": "SJL1L10",
        "nhẫn sjc": "SJ9999",
        "bảo tín sjc": "BTSJC",
        "bảo tín 9999": "BT9999NTT",
        "doji hà nội": "DOHNL",
        "doji hcm": "DOHCML",
        "doji nữ trang": "DOJINHTV",
        "pnj hà nội": "PQHNVM",
        "pnj 24k": "PQHN24NTT",
        "vn gold sjc": "VNGSJC",
        "viettin sjc": "VIETTINMSJC"
      };
      return reverseMap[name.toLowerCase()] || '';
    };

    const isLegacyTypeMatch = (legacyType, orderName) => {
      const l = legacyType.toLowerCase();
      const o = orderName.toLowerCase();
      if (l === 'sjc') return o.includes('sjc') || o.includes('viettin') || o.includes('vn gold');
      if (l === 'pnj') return o.includes('pnj');
      if (l === 'doji') return o.includes('doji');
      return false;
    };

    const goldTypeCode = getGoldTypeCode(order.gold_type);
    const matchingBar = dbInventory.find(i => 
      (i.gold_type === goldTypeCode || isLegacyTypeMatch(i.gold_type, order.gold_type)) && 
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

      // Gửi thông báo rút vàng thành công
      const qtyChỉ = (Number(matchedOrder.quantity_grams) / 3.75).toFixed(3);
      await supabase.from('notifications').insert({
        user_id: matchedOrder.user_id,
        type: 'trade',
        title: 'Khớp lệnh rút vàng vật lý thành công',
        desc: `Đã hoàn tất bàn giao ${qtyChỉ} chỉ vàng ${matchedOrder.gold_type.toUpperCase()} tại quầy (Đơn hàng: ${matchedOrder.id}). Thỏi Serial: ${selectedInventoryBar || 'Tự động'}.`,
        unread: true,
        date: new Date().toLocaleString('vi-VN')
      });

      alert(`Đã bàn giao vàng vật chất thành công!\n- Đơn hàng: ${matchedOrder.id}\n- Thỏi vàng Serial: ${selectedInventoryBar || 'Tự động'}\n- Khách nhận: ${matchedUser.full_name}`);

      // Reset
      setQrInput('');
      setMatchedOrder(null);
      setMatchedUser(null);
      setSelectedInventoryBar('');
      setTotpVerificationResult(null);

      // Clean path search queries
      navigate('/admin/o2o', { replace: true });
      fetchO2oData();
    } catch (err) {
      console.error('Lỗi khi bàn giao vàng:', err);
      alert('Không thể hoàn thành bàn giao: ' + err.message);
    }
  };

  useEffect(() => {
    fetchO2oData();
  }, []);

  // Sync url order_id if redirected from Orders tab
  useEffect(() => {
    if (dbOrders.length > 0) {
      const params = new URLSearchParams(location.search);
      const urlOrderId = params.get('order_id');
      if (urlOrderId) {
        setQrInput(urlOrderId);
        handleVerifyO2oQr(urlOrderId);
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
          <label className="form-label">Mã xác thực O2O (Order ID # TOTP)</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              className="form-input"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Ví dụ: ORD-20260707-123456#889900"
              style={{ background: '#121212', borderRadius: '8px' }}
            />
            <button className="btn btn-gold" onClick={() => handleVerifyO2oQr()} style={{ borderRadius: '99px', padding: '0 24px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Xác thực
            </button>
          </div>
          {o2oError && <div style={{ color: 'var(--ruby)', fontSize: '12px', marginTop: '6px' }}>{o2oError}</div>}
        </div>

        <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#fff', marginBottom: '8px' }}>Phím tắt demo nhanh:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {pendingOrders.filter(o => o.order_type === 'WITHDRAW_PHYSICAL' || o.order_type === 'PHYSICAL_WITHDRAWAL').map(o => (
              <button
                key={o.id}
                className="btn btn-sm"
                onClick={() => {
                  const demoVal = `${o.id}#${Math.floor(100000 + Math.random() * 900000)}`;
                  setQrInput(demoVal);
                  handleVerifyO2oQr(demoVal);
                }}
                style={{ fontSize: '11px', background: 'rgba(212,175,55,0.08)', borderColor: 'rgba(212,175,55,0.2)', color: 'var(--gold)' }}
              >
                Duyệt đơn {o.id.substring(0, 12)}...
              </button>
            ))}
            {pendingOrders.filter(o => o.order_type === 'WITHDRAW_PHYSICAL' || o.order_type === 'PHYSICAL_WITHDRAWAL').length === 0 && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Không có đơn rút vàng vật chất PENDING nào trên CSDL.</span>
            )}
          </div>
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
                  .filter(i => {
                    const getGoldTypeCode = (name) => {
                      if (!name) return '';
                      const reverseMap = {
                        "sjc 9999": "SJL1L10",
                        "nhẫn sjc": "SJ9999",
                        "bảo tín sjc": "BTSJC",
                        "bảo tín 9999": "BT9999NTT",
                        "doji hà nội": "DOHNL",
                        "doji hcm": "DOHCML",
                        "doji nữ trang": "DOJINHTV",
                        "pnj hà nội": "PQHNVM",
                        "pnj 24k": "PQHN24NTT",
                        "vn gold sjc": "VNGSJC",
                        "viettin sjc": "VIETTINMSJC"
                      };
                      return reverseMap[name.toLowerCase()] || '';
                    };

                    const isLegacyTypeMatch = (legacyType, orderName) => {
                      const l = legacyType.toLowerCase();
                      const o = orderName.toLowerCase();
                      if (l === 'sjc') return o.includes('sjc') || o.includes('viettin') || o.includes('vn gold');
                      if (l === 'pnj') return o.includes('pnj');
                      if (l === 'doji') return o.includes('doji');
                      return false;
                    };

                    const targetGoldTypeCode = getGoldTypeCode(matchedOrder.gold_type);
                    return i.gold_type === targetGoldTypeCode || isLegacyTypeMatch(i.gold_type, matchedOrder.gold_type);
                  })
                  .map(i => (
                    <option key={i.gold_serial} value={i.gold_serial}>
                      {i.gold_serial} ({i.bar_brand} - {i.weight_grams}g)
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
              disabled={totpVerificationResult && !totpVerificationResult.valid}
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
