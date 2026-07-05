import React, { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { supabase } from '../supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { Download, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseLedger = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'financial_ledgers' }
});

export default function Admin() {
  const kycList = useStore((state) => state.kycSubmissions);
  const inventory = useStore((state) => state.inventory);
  const approveKyc = useStore((state) => state.approveKyc);
  const rejectKyc = useStore((state) => state.rejectKyc);

  const [dbOrders, setDbOrders] = useState([]);
  const [usersMap, setUsersMap] = useState({});

  // 1. Tải danh sách đơn hàng thực tế từ CSDL
  const fetchDbOrders = async () => {
    try {
      const { data: orders, error } = await supabaseLedger
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDbOrders(orders || []);

      // Tải thông tin người dùng tương ứng để lấy tên khách hàng
      const { data: users, error: userErr } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone');

      if (!userErr && users) {
        const uMap = {};
        users.forEach((u) => {
          uMap[u.id] = u;
        });
        setUsersMap(uMap);
      }
    } catch (err) {
      console.error('Lỗi khi tải đơn hàng:', err);
    }
  };

  useEffect(() => {
    fetchDbOrders();
  }, []);

  const pendingOrders = dbOrders.filter((o) => o.status === 'PENDING');
  const totalSjcInStock = inventory.filter((i) => i.goldType === 'sjc' && i.status === 'available').length;

  const handleApproveKyc = (id) => {
    approveKyc(id);
    alert('Đã duyệt hồ sơ KYC thành công!');
  };

  const handleRejectKyc = (id) => {
    rejectKyc(id);
    alert('Đã từ chối hồ sơ KYC.');
  };

  // 2. PHÊ DUYỆT ĐƠN HÀNG (MUA/BÁN) VÀ ĐỒNG BỘ VÍ VÀNG VÀO CƠ SỞ DỮ LIỆU
  const handleApproveOrder = async (order) => {
    try {
      // Xác định loại vàng (SJC, PNJ, DOJI)
      let goldType = 'sjc';
      const nameLower = order.gold_type.toLowerCase();
      if (nameLower.includes('pnj')) goldType = 'pnj';
      else if (nameLower.includes('doji')) goldType = 'doji';

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
        // Tạo mới ví nếu chưa tồn tại
        const { data: newWallet, error: insErr } = await supabase
          .from('gold_wallets')
          .insert({ user_id: order.user_id, gold_type: goldType, quantity_grams: 0 })
          .select();
        if (insErr) throw insErr;
        walletId = newWallet[0].id;
      }

      // 2. Tính toán số gram thay đổi (1 chỉ = 3.75g)
      const qtyGrams = Number(order.quantity_grams);
      let newGrams = currentGrams;

      if (order.order_type === 'BUY_ONLINE') {
        newGrams = currentGrams + qtyGrams;
      } else if (order.order_type === 'SELL_ONLINE') {
        if (currentGrams < qtyGrams) {
          alert(`Lỗi: Khách hàng không đủ vàng trong tài khoản để bán! (Số dư: ${(currentGrams/3.75).toFixed(3)} chỉ, Cần bán: ${(qtyGrams/3.75).toFixed(3)} chỉ)`);
          return;
        }
        newGrams = currentGrams - qtyGrams;
      } else if (order.order_type === 'PHYSICAL_WITHDRAWAL') {
        // Vàng đã được trừ khi tạo hợp đồng rút online, admin chỉ cần bàn giao vàng thật tại quầy và xác nhận hoàn thành
        newGrams = currentGrams;
      }

      // 3. Cập nhật ví vàng của khách trong CSDL
      const { error: updErr } = await supabase
        .from('gold_wallets')
        .update({ quantity_grams: newGrams })
        .eq('user_id', order.user_id)
        .eq('gold_type', goldType);

      if (updErr) throw updErr;

      // 4. Cập nhật trạng thái đơn hàng thành COMPLETED
      const { error: ordErr } = await supabaseLedger
        .from('orders')
        .update({ status: 'COMPLETED' })
        .eq('id', order.id);

      if (ordErr) throw ordErr;

      alert(`Đã duyệt khớp đơn thành công! Ví vàng của khách đã được cập nhật thành ${(newGrams/3.75).toFixed(3)} chỉ.`);
      
      // Đồng bộ lại local store cho người dùng hiện tại nếu họ đang đăng nhập
      const storeState = useStore.getState();
      if (storeState.currentUser && order.user_id) {
        storeState.fetchUserBalances(order.user_id);
      }

      fetchDbOrders();
    } catch (err) {
      console.error('Lỗi khi duyệt đơn hàng:', err);
      alert('Không thể duyệt đơn hàng: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyItems: 'flex-end', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <div className="tag" style={{ marginBottom: '8px' }}>VẬN HÀNH HỆ THỐNG</div>
          <div className="h2">Admin Dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={fetchDbOrders} style={{ borderRadius: '12px', padding: '10px 16px' }}>
            Làm mới danh sách
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="stat-card" style={{ borderTop: '2px solid var(--gold)' }}>
          <div className="stat-label">TỔNG ĐƠN HÀNG HỆ THỐNG</div>
          <div className="stat-value gold-text">{dbOrders.length}</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Cập nhật từ Supabase</div>
        </div>
        <div className="stat-card" style={{ borderTop: '2px solid rgba(255,255,255,0.2)' }}>
          <div className="stat-label">ĐƠN CHỜ PHÊ DUYỆT</div>
          <div className="stat-value">{pendingOrders.length}</div>
          <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Cần khớp lệnh vật lý</div>
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
                          <button onClick={() => handleApproveKyc(item.id)} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Duyệt
                          </button>
                          <button onClick={() => handleRejectKyc(item.id)} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: 'var(--ruby)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
              Đơn hàng chờ khớp lệnh
              {pendingOrders.length > 0 && <span style={{ padding: '2px 8px', background: 'var(--gold)', color: '#000', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>{pendingOrders.length}</span>}
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>Khách hàng</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>Chi tiết đơn</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có đơn hàng nào chờ khớp lệnh</td>
                  </tr>
                ) : (
                  pendingOrders.map(o => {
                    const client = usersMap[o.user_id] || { full_name: 'Khách vãng lai', phone: '—' };
                    const isBuy = o.order_type === 'BUY_ONLINE';
                    const qtyChỉ = (Number(o.quantity_grams) / 3.75).toFixed(3);

                    return (
                      <tr key={o.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{client.full_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SĐT: {client.phone}</div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ 
                              fontSize: '11px', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              background: isBuy ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                              color: isBuy ? 'var(--emerald)' : 'var(--ruby)', 
                              fontWeight: 600 
                            }}>
                              {isBuy ? 'MUA' : 'BÁN'}
                            </span>
                            <span style={{ fontWeight: 600, color: '#fff' }}>{o.gold_type} ({qtyChỉ} chỉ)</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gold)', marginTop: '4px' }}>
                            Tổng tiền: ₫{Number(o.total_amount_vnd).toLocaleString('vi-VN')}
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <button 
                            onClick={() => handleApproveOrder(o)} 
                            style={{ 
                              padding: '8px 16px', 
                              borderRadius: '8px', 
                              background: 'var(--gold-gradient)', 
                              color: '#000', 
                              fontWeight: 'bold', 
                              border: 'none', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px' 
                            }}
                          >
                            <CheckCircle size={14} /> Khớp lệnh
                          </button>
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
    </div>
  );
}
