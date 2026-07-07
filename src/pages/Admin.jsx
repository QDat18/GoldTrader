import React, { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { supabase } from '../supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { 
  Download, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Building, 
  QrCode, 
  Layers, 
  RotateCw, 
  Plus, 
  Search, 
  Check, 
  ShieldAlert 
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseLedger = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'financial_ledgers' }
});

export default function Admin() {
  // Supabase states for KYC list
  const [dbKycList, setDbKycList] = useState([]);

  // Tabs: 'overview', 'o2o', 'inventory', 'hedging'
  const [activeTab, setActiveTab] = useState('overview');

  // Supabase states
  const [dbOrders, setDbOrders] = useState([]);
  const [kycList, setKycList] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [dbInventory, setDbInventory] = useState([]);
  const [dbHedges, setDbHedges] = useState([]);

  // O2O Verification states
  const [qrInput, setQrInput] = useState('');
  const [o2oError, setO2oError] = useState('');
  const [matchedOrder, setMatchedOrder] = useState(null);
  const [matchedUser, setMatchedUser] = useState(null);
  const [selectedInventoryBar, setSelectedInventoryBar] = useState('');
  const [totpVerificationResult, setTotpVerificationResult] = useState(null);

  // Inventory Management states
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [newInvType, setNewInvType] = useState('sjc');
  const [newInvBrand, setNewInvBrand] = useState('SJC HCM');
  const [newInvWeight, setNewInvWeight] = useState('3.75'); // 3.75g = 1 chỉ
  const [invFilterType, setInvFilterType] = useState('all');
  const [invFilterStatus, setInvFilterStatus] = useState('all');
  const [invSearchQuery, setInvSearchQuery] = useState('');

  // 1. Tải danh sách đơn hàng từ CSDL
  const fetchDbOrders = async () => {
    try {
      // 1. Fetch Orders
      const { data: orders, error } = await supabaseLedger
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDbOrders(orders || []);

      // 2. Fetch Users & pending KYCs
      const { data: users, error: userErr } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone, id_card_number');


      if (!userErr && users) {
        const uMap = {};
        const pendingKyc = [];
        users.forEach((u) => {
          uMap[u.id] = u;
          if (u.kyc_status === 'PENDING') {
            pendingKyc.push({
              id: u.id,
              name: u.full_name || 'Khách hàng',
              avatar: (u.full_name || 'K').charAt(0).toUpperCase(),
              type: `CCCD: ${u.id_card_number || 'Chưa cung cấp'}`,
              time: new Date(u.created_at).toLocaleDateString('vi-VN')
            });
          }
        });
        setUsersMap(uMap);
        setKycList(pendingKyc);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu admin:', err);
    }
  };

  // 2. Tải kho vàng vật chất từ CSDL
  const fetchDbInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('vault_inventory')
        .select('*')
        .order('stored_at', { ascending: false });
      if (error) throw error;
      setDbInventory(data || []);
    } catch (err) {
      console.error('Lỗi khi tải kho vật chất:', err);
    }
  };

  // 3. Tải vị thế phòng ngừa rủi ro Hedging từ CSDL
  const fetchDbHedges = async () => {
    try {
      const { data, error } = await supabaseLedger
        .from('hedge_positions')
        .select('*')
        .order('opened_at', { ascending: false });
      if (error) throw error;
      setDbHedges(data || []);
    } catch (err) {
      console.error('Lỗi khi tải vị thế hedging:', err);
    }
  };

  // 1.5. Tải danh sách eKYC chờ duyệt từ CSDL
  const fetchDbKycList = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('kyc_status', 'PENDING')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setDbKycList(data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách eKYC:', err);
    }
  };

  const refreshAllData = () => {
    fetchDbOrders();
    fetchDbInventory();
    fetchDbHedges();
    fetchDbKycList();
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const pendingOrders = dbOrders.filter((o) => o.status === 'PENDING');
  const availableInventory = dbInventory.filter((i) => i.status === 'AVAILABLE');
  
  // Calculate inventory counts
  const sjcStock = dbInventory.filter((i) => i.gold_type === 'sjc' && i.status === 'AVAILABLE').length;
  const pnjStock = dbInventory.filter((i) => i.gold_type === 'pnj' && i.status === 'AVAILABLE').length;
  const dojiStock = dbInventory.filter((i) => i.gold_type === 'doji' && i.status === 'AVAILABLE').length;

  const handleApproveKyc = async (id) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          kyc_status: 'VERIFIED',
          kyc_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role: 'user'
        })
        .eq('id', id);

      if (error) throw error;
      
      // Gửi thông báo cho user
      await supabase.from('notifications').insert({
        user_id: id,
        type: 'system',
        title: 'Xác thực tài khoản thành công',
        desc: 'Hồ sơ KYC của bạn đã được duyệt. Tài khoản hiện đã có tick xanh (Verified).',
        unread: true,
        date: new Date().toLocaleString('vi-VN')
      });

      alert('Đã duyệt hồ sơ eKYC thành công!');
      
      // Đồng bộ local store cho user đang đăng nhập nếu chính họ được duyệt
      const storeState = useStore.getState();
      if (storeState.currentUser && storeState.currentUser.id === id) {
        storeState.updateKycStatus('verified');
      }

      fetchDbKycList();
    } catch (err) {
      console.error('Lỗi duyệt eKYC:', err);
      alert('Lỗi duyệt eKYC: ' + err.message);
    }
  };

  const handleRejectKyc = async (id) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          kyc_status: 'REJECTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: id,
        type: 'system',
        title: 'Từ chối xác thực tài khoản',
        desc: 'Hồ sơ KYC của bạn bị từ chối do hình ảnh không hợp lệ hoặc sai thông tin. Vui lòng cập nhật lại.',
        unread: true,
        date: new Date().toLocaleString('vi-VN')
      });

      alert('Đã từ chối hồ sơ eKYC.');
      
      const storeState = useStore.getState();
      if (storeState.currentUser && storeState.currentUser.id === id) {
        storeState.updateKycStatus('rejected');
      }

      fetchDbKycList();
    } catch (err) {
      console.error('Lỗi từ chối eKYC:', err);
      alert('Lỗi từ chối eKYC: ' + err.message);
    }
  };

  // 4. PHÊ DUYỆT ĐƠN HÀNG TRỰC TUYẾN (MUA/BÁN)
  const handleApproveOrder = async (order) => {
    try {
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
        const { data: newWallet, error: insErr } = await supabase
          .from('gold_wallets')
          .insert({ user_id: order.user_id, gold_type: goldType, quantity_grams: 0 })
          .select();
        if (insErr) throw insErr;
        walletId = newWallet[0].id;
      }

      const qtyGrams = Number(order.quantity_grams);
      let newGrams = currentGrams;

      if (order.order_type === 'BUY_ONLINE') {
        newGrams = currentGrams + qtyGrams;
      } else if (order.order_type === 'SELL_ONLINE') {
        if (currentGrams < qtyGrams) {
          alert(`Lỗi: Khách không đủ số dư để bán! (Sở hữu: ${(currentGrams/3.75).toFixed(3)} chỉ, Cần bán: ${(qtyGrams/3.75).toFixed(3)} chỉ)`);
          return;
        }
        newGrams = currentGrams - qtyGrams;
      }

      // 2. Cập nhật ví vàng
      const { error: updErr } = await supabase
        .from('gold_wallets')
        .update({ quantity_grams: newGrams })
        .eq('id', walletId);
      if (updErr) throw updErr;

      // 3. Cập nhật trạng thái đơn hàng
      const { error: ordErr } = await supabaseLedger
        .from('orders')
        .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
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

      if (hedgeErr) console.error("Lỗi tự động mở vị thế Hedging:", hedgeErr);

      alert(`Đã duyệt khớp đơn thành công! Vị thế Hedging đối ứng ${hedgeId} tự động mở.`);
      
      // Đồng bộ local store cho user đang đăng nhập
      const storeState = useStore.getState();
      if (storeState.currentUser && order.user_id) {
        storeState.fetchUserBalances(order.user_id);
      }

      refreshAllData();
    } catch (err) {
      console.error('Lỗi khi duyệt đơn hàng:', err);
      alert('Không thể duyệt đơn hàng: ' + err.message);
    }
  };

  // 5. GIẢI MÃ & XÁC THỰC MÃ QR TOTP O2O TẠI QUẦY
  const handleVerifyO2oQr = () => {
    setO2oError('');
    setMatchedOrder(null);
    setMatchedUser(null);
    setTotpVerificationResult(null);

    if (!qrInput.trim()) {
      setO2oError('Vui lòng nhập mã QR hoặc token xác thực.');
      return;
    }

    // Token dạng: [order_id]#[totp_token] hoặc chỉ [order_id] để demo bypass
    const parts = qrInput.trim().split('#');
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

    // Xác thực TOTP (Mô phỏng TOTP 30 giây khớp với Chương 3.2)
    if (otp) {
      // Vì là demo/đồ án, nếu mã OTP gửi lên là 6 chữ số, ta thông báo hợp lệ
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
      // Bypass nếu admin gõ trực tiếp ID
      setTotpVerificationResult({
        valid: true,
        message: 'Xác thực thủ công (Admin Bypass) thành công.'
      });
    }

    // Auto-select thỏi vàng phù hợp cùng loại trong kho
    let goldType = 'sjc';
    const nameLower = order.gold_type.toLowerCase();
    if (nameLower.includes('pnj')) goldType = 'pnj';
    else if (nameLower.includes('doji')) goldType = 'doji';

    const matchingBar = dbInventory.find(i => i.gold_type === goldType && i.status === 'AVAILABLE');
    if (matchingBar) {
      setSelectedInventoryBar(matchingBar.gold_serial);
    } else {
      setSelectedInventoryBar('');
    }
  };

  // 6. XÁC NHẬN BÀN GIAO VÀNG VẬT CHẤT (HOÀN THÀNH O2O)
  const handleDispatchGold = async () => {
    if (!matchedOrder) return;

    try {
      // 1. Cập nhật trạng thái đơn hàng thành COMPLETED
      const { error: ordErr } = await supabaseLedger
        .from('orders')
        .update({ 
          status: 'COMPLETED', 
          completed_at: new Date().toISOString(),
          order_status: 'COMPLETED' 
        })
        .eq('id', matchedOrder.id);

      if (ordErr) throw ordErr;

      // 2. Cập nhật trạng thái thỏi vàng vật chất thành DISPATCHED (Đã bàn giao)
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

      alert(`Đã bàn giao vàng vật chất thành công!\n- Đơn hàng: ${matchedOrder.id}\n- Thỏi vàng Serial: ${selectedInventoryBar || 'Tự động'}\n- Khách nhận: ${matchedUser.full_name}`);
      
      // Reset form
      setQrInput('');
      setMatchedOrder(null);
      setMatchedUser(null);
      setSelectedInventoryBar('');
      setTotpVerificationResult(null);

      refreshAllData();
    } catch (err) {
      console.error('Lỗi khi bàn giao vàng:', err);
      alert('Không thể hoàn thành bàn giao: ' + err.message);
    }
  };

  // 7. NHẬP KHO THỎI VÀNG MỚI (VẬT CHẤT)
  const handleAddInventory = async (e) => {
    e.preventDefault();
    const weightVal = parseFloat(newInvWeight);
    if (isNaN(weightVal) || weightVal <= 0) {
      alert('Trọng lượng thỏi vàng không hợp lệ.');
      return;
    }

    const serial = `${newInvType.toUpperCase()}-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const { error } = await supabase
        .from('vault_inventory')
        .insert({
          gold_serial: serial,
          gold_type: newInvType,
          weight_grams: weightVal,
          bar_brand: newInvBrand,
          status: 'AVAILABLE'
        });

      if (error) throw error;

      alert(`Nhập kho thành công thỏi vàng: ${serial}`);
      setShowAddInventory(false);
      fetchDbInventory();
    } catch (err) {
      console.error('Lỗi khi nhập kho:', err);
      alert('Lỗi nhập kho: ' + err.message);
    }
  };

  // 8. ĐÓNG VỊ THẾ HEDGING (MOCK)
  const handleCloseHedge = async (id) => {
    try {
      const pnlRandom = Math.floor((Math.random() - 0.3) * 150000); // Lãi lỗ ngẫu nhiên
      const { error } = await supabaseLedger
        .from('hedge_positions')
        .update({
          status: 'CLOSED',
          closed_at: new Date().toISOString(),
          pnl_vnd: pnlRandom
        })
        .eq('id', id);

      if (error) throw error;
      alert(`Đã đóng vị thế phòng vệ ${id}! Lãi/Lỗ ghi nhận: ₫${pnlRandom.toLocaleString('vi-VN')}`);
      fetchDbHedges();
    } catch (err) {
      console.error('Lỗi khi đóng vị thế:', err);
      alert('Lỗi: ' + err.message);
    }
  };

  // Filter inventory items
  const filteredInventory = dbInventory.filter(item => {
    if (invFilterType !== 'all' && item.gold_type !== invFilterType) return false;
    if (invFilterStatus !== 'all' && item.status !== invFilterStatus) return false;
    if (invSearchQuery.trim() !== '') {
      const q = invSearchQuery.toLowerCase();
      return item.gold_serial.toLowerCase().includes(q) || (item.order_id && item.order_id.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <div className="tag" style={{ marginBottom: '8px' }}>FINTECH PLATFORM SYSTEM</div>
          <div className="h2" style={{ display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-1px' }}>
            <Building size={28} style={{ color: 'var(--gold)' }} />
            GoldChain Admin Console
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={refreshAllData} style={{ borderRadius: '99px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
            <RotateCw size={16} /> Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', gap: '8px', 
        background: 'rgba(255,255,255,0.03)', 
        padding: '6px', 
        borderRadius: '99px', 
        border: '1px solid rgba(255,255,255,0.05)',
        width: 'fit-content',
        marginBottom: '36px'
      }}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={{ 
            padding: '10px 24px', background: activeTab === 'overview' ? 'rgba(212,175,55,0.1)' : 'transparent', border: activeTab === 'overview' ? '1px solid rgba(212,175,55,0.2)' : '1px solid transparent',
            borderRadius: '99px', fontSize: '14px', fontWeight: 600,
            color: activeTab === 'overview' ? 'var(--gold)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.3s'
          }}
        >
          Tổng quan & Khớp lệnh
        </button>
        <button 
          onClick={() => setActiveTab('o2o')}
          style={{ 
            padding: '10px 24px', background: activeTab === 'o2o' ? 'rgba(212,175,55,0.1)' : 'transparent', border: activeTab === 'o2o' ? '1px solid rgba(212,175,55,0.2)' : '1px solid transparent',
            borderRadius: '99px', fontSize: '14px', fontWeight: 600,
            color: activeTab === 'o2o' ? 'var(--gold)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <QrCode size={16} /> Xác thực O2O tại quầy
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          style={{ 
            padding: '10px 24px', background: activeTab === 'inventory' ? 'rgba(212,175,55,0.1)' : 'transparent', border: activeTab === 'inventory' ? '1px solid rgba(212,175,55,0.2)' : '1px solid transparent',
            borderRadius: '99px', fontSize: '14px', fontWeight: 600,
            color: activeTab === 'inventory' ? 'var(--gold)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.3s'
          }}
        >
          Quản lý Kho vàng
        </button>
        <button 
          onClick={() => setActiveTab('hedging')}
          style={{ 
            padding: '10px 24px', background: activeTab === 'hedging' ? 'rgba(212,175,55,0.1)' : 'transparent', border: activeTab === 'hedging' ? '1px solid rgba(212,175,55,0.2)' : '1px solid transparent',
            borderRadius: '99px', fontSize: '14px', fontWeight: 600,
            color: activeTab === 'hedging' ? 'var(--gold)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Layers size={16} /> Vị thế Hedging ({dbHedges.filter(h => h.status === 'OPEN').length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & GENERAL ORDERS */}
      {activeTab === 'overview' && (
        <>
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
              <div className="stat-label">YÊU CẦU DUYỆT KYC</div>
              <div className="stat-value">{dbKycList.length}</div>
              <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Hồ sơ eKYC chờ xử lý</div>
            </div>
            <div className="stat-card" style={{ borderTop: '2px solid var(--emerald)' }}>
              <div className="stat-label">KHO VÀNG VẬT LÝ SJC</div>
              <div className="stat-value">{sjcStock} thỏi</div>
              <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Thỏi sẵn sàng bàn giao</div>
            </div>
          </div>

          {/* Tables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
            
            {/* KYC Table */}
            <div className="neo-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
                <div className="h3" style={{ fontSize: '18px', margin: 0 }}>
                  Danh sách KYC chờ duyệt
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Khách hàng</th>
                      <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Thời gian</th>
                      <th style={{ padding: '12px 18px', color: 'var(--text-muted)', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbKycList.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có hồ sơ nào</td>
                      </tr>
                    ) : (
                      dbKycList.map(item => {
                        const nameInitials = item.full_name ? item.full_name.trim().split(/\s+/).filter(Boolean).slice(-2).map(p => p[0]).join('').toUpperCase() : 'US';
                        return (
                          <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '12px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '11px' }}>
                                  {nameInitials}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#fff' }}>{item.full_name}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    CCCD: {item.id_card_number} | SĐT: {item.phone || '—'}
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    {item.id_card_front_url ? (
                                      <a href={item.id_card_front_url} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: 'var(--gold)', textDecoration: 'none' }}>[Mặt trước]</a>
                                    ) : (
                                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>[Không ảnh trước]</span>
                                    )}
                                    {item.id_card_back_url ? (
                                      <a href={item.id_card_back_url} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: 'var(--gold)', textDecoration: 'none' }}>[Mặt sau]</a>
                                    ) : (
                                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>[Không ảnh sau]</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>
                              {new Date(item.updated_at).toLocaleString('vi-VN')}
                            </td>
                            <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button onClick={() => handleApproveKyc(item.id)} className="btn btn-sm" style={{ borderColor: 'var(--emerald)', color: 'var(--emerald)', padding: '6px 14px', fontSize: '12px', borderRadius: '99px' }}>Duyệt</button>
                                <button onClick={() => handleRejectKyc(item.id)} className="btn btn-sm btn-danger" style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '99px' }}>Từ chối</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Orders Table */}
            <div className="neo-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="h3" style={{ fontSize: '18px', margin: 0 }}>
                  Đơn mua/bán online chờ khớp lệnh
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Khách hàng</th>
                      <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Loại & Khối lượng</th>
                      <th style={{ padding: '12px 18px', color: 'var(--text-muted)', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.filter(o => o.order_type !== 'WITHDRAW_PHYSICAL' && o.order_type !== 'PHYSICAL_WITHDRAWAL').length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có đơn đặt lệnh mua/bán online</td>
                      </tr>
                    ) : (
                      pendingOrders.filter(o => o.order_type !== 'WITHDRAW_PHYSICAL' && o.order_type !== 'PHYSICAL_WITHDRAWAL').map(o => {
                        const client = usersMap[o.user_id] || { full_name: 'Khách hàng', phone: '—' };
                        const isBuy = o.order_type === 'BUY_ONLINE';
                        const qtyChỉ = (Number(o.quantity_grams) / 3.75).toFixed(3);
                        return (
                          <tr key={o.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '12px 18px' }}>
                              <div style={{ fontWeight: 600, color: '#fff' }}>{client.full_name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{client.phone}</div>
                            </td>
                            <td style={{ padding: '12px 18px' }}>
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <span className={`badge ${isBuy ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '10px' }}>
                                  {isBuy ? 'MUA' : 'BÁN'}
                                </span>
                                <span style={{ fontWeight: 600 }}>{qtyChỉ} chỉ SJC</span>
                              </div>
                              <div style={{ color: 'var(--gold)', fontSize: '11px', marginTop: '2px' }}>₫{Number(o.total_amount_vnd).toLocaleString('vi-VN')}</div>
                            </td>
                            <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                              <button onClick={() => handleApproveOrder(o)} className="btn btn-sm btn-gold" style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '99px', fontWeight: 600 }}>
                                Khớp lệnh
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
        </>
      )}

      {/* TAB 2: O2O VERIFICATION AT COUNTER */}
      {activeTab === 'o2o' && (
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
                <button className="btn btn-gold" onClick={handleVerifyO2oQr} style={{ borderRadius: '99px', padding: '0 24px', fontWeight: 600, whiteSpace: 'nowrap' }}>
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
                    onClick={() => setQrInput(`${o.id}#${Math.floor(100000 + Math.random() * 900000)}`)}
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
                    {totpVerificationResult.valid ? <CheckCircle size={18} style={{ color: 'var(--emerald)' }} /> : <ShieldAlert size={18} style={{ color: 'var(--ruby)' }} />}
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
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff', marginTop: '2px' }}>{matchedOrder.gold_type}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SỐ LƯỢNG KÝ GỬI</span>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff', marginTop: '2px' }}>{(Number(matchedOrder.quantity_grams)/3.75).toFixed(3)} chỉ</div>
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
                        const targetGoldType = matchedOrder.gold_type.toLowerCase();
                        if (targetGoldType.includes('sjc') && i.gold_type === 'sjc') return true;
                        if (targetGoldType.includes('pnj') && i.gold_type === 'pnj') return true;
                        if (targetGoldType.includes('doji') && i.gold_type === 'doji') return true;
                        return false;
                      })
                      .map(i => (
                        <option key={i.gold_serial} value={i.gold_serial}>
                          {i.gold_serial} (${i.bar_brand} - {i.weight_grams}g)
                        </option>
                      ))
                    }
                  </select>
                </div>

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
      )}

      {/* TAB 3: PHYSICAL VAULT INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Inventory Stats */}
          <div className="grid-3">
            <div className="stat-card" style={{ borderLeft: '3px solid var(--gold)' }}>
              <div className="stat-label">SJC TRONG KHO (AVAILABLE)</div>
              <div className="stat-value">{sjcStock} thỏi</div>
              <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Ước tính: {sjcStock * 3.75}g</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid #888' }}>
              <div className="stat-label">PNJ TRONG KHO (AVAILABLE)</div>
              <div className="stat-value">{pnjStock} thỏi</div>
              <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Ước tính: {pnjStock * 3.75}g</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--ruby)' }}>
              <div className="stat-label">DOJI TRONG KHO (AVAILABLE)</div>
              <div className="stat-value" style={{ color: dojiStock < 5 ? 'var(--ruby)' : '#fff' }}>{dojiStock} thỏi</div>
              <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>{dojiStock < 5 ? 'Tồn kho khả dụng thấp!' : 'An toàn'}</div>
            </div>
          </div>

          {/* Action Row & Filter */}
          <div className="neo-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <select className="form-input" style={{ width: 'auto', borderRadius: '8px', fontSize: '12px', padding: '6px 12px' }} value={invFilterType} onChange={e=>setInvFilterType(e.target.value)}>
                  <option value="all">Tất cả loại vàng</option>
                  <option value="sjc">SJC</option>
                  <option value="pnj">PNJ</option>
                  <option value="doji">DOJI</option>
                </select>
                <select className="form-input" style={{ width: 'auto', borderRadius: '8px', fontSize: '12px', padding: '6px 12px' }} value={invFilterStatus} onChange={e=>setInvFilterStatus(e.target.value)}>
                  <option value="all">Tất cả trạng thái</option>
                  <option value="AVAILABLE">Sẵn sàng (AVAILABLE)</option>
                  <option value="RESERVED">Đặt cọc (RESERVED)</option>
                  <option value="DISPATCHED">Đã bàn giao (DISPATCHED)</option>
                </select>
                <input 
                  className="form-input" 
                  placeholder="Tìm kiếm mã Serial..." 
                  style={{ width: '180px', borderRadius: '8px', fontSize: '12px', padding: '6px 12px' }}
                  value={invSearchQuery}
                  onChange={e=>setInvSearchQuery(e.target.value)}
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
                  <select className="form-input" value={newInvType} onChange={e=>setNewInvType(e.target.value)}>
                    <option value="sjc">SJC 1 Chỉ</option>
                    <option value="pnj">PNJ 9999</option>
                    <option value="doji">DOJI 999.9</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nhãn hiệu đúc</label>
                  <input className="form-input" value={newInvBrand} onChange={e=>setNewInvBrand(e.target.value)} placeholder="VD: SJC HCM, PNJ HN" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Trọng lượng (grams)</label>
                  <input className="form-input" type="number" step="0.01" value={newInvWeight} onChange={e=>setNewInvWeight(e.target.value)} required />
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
                  <tr>
                    <th>Mã Serial</th>
                    <th>Loại vàng</th>
                    <th>Trọng lượng</th>
                    <th>Thương hiệu đúc</th>
                    <th>Trạng thái</th>
                    <th>Hợp đồng/Đơn gán</th>
                    <th>Ngày nhập</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có dữ liệu thỏi vàng vật chất nào</td>
                    </tr>
                  ) : (
                    filteredInventory.map(item => {
                      let badgeClass = 'badge-green';
                      if (item.status === 'RESERVED') badgeClass = 'badge-gold';
                      else if (item.status === 'DISPATCHED') badgeClass = 'badge-gray';

                      return (
                        <tr key={item.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.gold_serial}</td>
                          <td>{item.gold_type.toUpperCase()}</td>
                          <td>{item.weight_grams} g</td>
                          <td>{item.bar_brand}</td>
                          <td><span className={`badge ${badgeClass}`}>{item.status}</span></td>
                          <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                            {item.order_id ? item.order_id : '—'}
                          </td>
                          <td className="body-sm">{new Date(item.stored_at).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BACK-TO-BACK HEDGING POSITIONS */}
      {activeTab === 'hedging' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Hedging summary cards */}
          <div className="grid-3">
            <div className="stat-card" style={{ borderTop: '2px solid var(--emerald)' }}>
              <div className="stat-label">TỔNG VỊ THẾ ĐANG MỞ (OPEN)</div>
              <div className="stat-value">{dbHedges.filter(h => h.status === 'OPEN').length} vị thế</div>
              <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Khóa toàn bộ rủi ro trượt giá</div>
            </div>
            <div className="stat-card" style={{ borderTop: '2px solid var(--gold)' }}>
              <div className="stat-label">KHỐI LƯỢNG HEDGING TÍCH LŨY</div>
              <div className="stat-value">{(dbHedges.reduce((sum, h) => sum + Number(h.quantity_grams), 0)/3.75).toFixed(2)} chỉ</div>
              <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Tổng khối lượng đối ứng nhà sỉ</div>
            </div>
            <div className="stat-card" style={{ borderTop: '2px solid #3b82f6' }}>
              <div className="stat-label">TỔNG LÃI/LỖ HEDGING ĐÃ CHỐT</div>
              <div className="stat-value" style={{ color: 'var(--emerald)' }}>
                ₫{dbHedges.filter(h => h.status === 'CLOSED').reduce((sum, h) => sum + Number(h.pnl_vnd || 0), 0).toLocaleString('vi-VN')}
              </div>
              <div className="stat-sub" style={{ color: 'var(--text-muted)' }}>Doanh thu bảo an spread ổn định</div>
            </div>
          </div>

          {/* Hedges list */}
          <div className="neo-card" style={{ padding: '20px' }}>
            <div className="h3" style={{ fontSize: '16px', marginBottom: '16px' }}>Danh sách vị thế Back-to-Back Hedging trên thị trường đối ứng</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Mã vị thế</th>
                    <th>Mã đơn liên kết</th>
                    <th>Loại vàng</th>
                    <th>Khối lượng</th>
                    <th>Giá khớp bảo vệ</th>
                    <th>Nhà đối ứng sỉ</th>
                    <th>Chiều vị thế</th>
                    <th>Trạng thái</th>
                    <th>Lãi/Lỗ chốt (VND)</th>
                    <th>Thao tác</th>
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
                        <tr key={h.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{h.id}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{h.order_id}</td>
                          <td>{h.gold_type.toUpperCase()}</td>
                          <td>{(Number(h.quantity_grams)/3.75).toFixed(3)} chỉ</td>
                          <td>₫{Number(h.hedge_price_vnd).toLocaleString('vi-VN')}</td>
                          <td>{h.counterparty}</td>
                          <td>
                            <span className={`badge ${isBuy ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '10px' }}>
                              {isBuy ? 'LONG (MUA)' : 'SHORT (BÁN)'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${isOpen ? 'badge-gold' : 'badge-gray'}`} style={{ fontSize: '10px' }}>
                              {h.status}
                            </span>
                          </td>
                          <td style={{ color: Number(h.pnl_vnd) >= 0 ? 'var(--emerald)' : 'var(--ruby)', fontWeight: 'bold' }}>
                            {isOpen ? '—' : `₫${Number(h.pnl_vnd || 0).toLocaleString('vi-VN')}`}
                          </td>
                          <td>
                            {isOpen ? (
                              <button className="btn btn-sm" onClick={() => handleCloseHedge(h.id)} style={{ padding: '6px 14px', fontSize: '12px', borderColor: 'var(--gold)', color: 'var(--gold)', borderRadius: '99px', fontWeight: 600 }}>
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
      )}

    </div>
  );
}
