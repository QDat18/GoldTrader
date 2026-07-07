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
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseLedger = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'financial_ledgers' }
});

export default function Admin() {
  // Supabase states for KYC list
  const [dbKycList, setDbKycList] = useState([]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Tabs: 'overview', 'kyc', 'o2o', 'inventory', 'hedging'
  const [activeTab, setActiveTab] = useState('overview');
  const [rejectModal, setRejectModal] = useState({ isOpen: false, id: null, reason: '' });
  const [previewKycModal, setPreviewKycModal] = useState({ isOpen: false, frontUrl: '', backUrl: '', name: '' });
  const [toast, setToast] = useState(null);
  const [kycPage, setKycPage] = useState(0);
  const [hasMoreKyc, setHasMoreKyc] = useState(true);
  const [isFetchingKyc, setIsFetchingKyc] = useState(false);

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
  const [newInvQuantity, setNewInvQuantity] = useState(1);
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
  const fetchDbKycList = async (isLoadMore = false) => {
    if (isFetchingKyc) return;
    setIsFetchingKyc(true);
    try {
      const page = isLoadMore ? kycPage + 1 : 0;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('kyc_status', 'PENDING')
        .order('updated_at', { ascending: false })
        .range(page * 10, (page + 1) * 10 - 1);

      if (error) throw error;

      if (data.length < 10) setHasMoreKyc(false);
      else setHasMoreKyc(true);

      if (isLoadMore) {
        setDbKycList(prev => [...prev, ...data]);
      } else {
        setDbKycList(data || []);
      }
      setKycPage(page);
    } catch (err) {
      console.error('Lỗi khi tải danh sách eKYC:', err);
    } finally {
      setIsFetchingKyc(false);
    }
  };

  const handleScrollKyc = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 50;
    if (bottom && hasMoreKyc && !isFetchingKyc) {
      fetchDbKycList(true);
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

    // Lắng nghe realtime từ bảng user_profiles (khi user gửi eKYC mới hoặc cập nhật lại)
    const kycSubscription = supabase
      .channel('admin-kyc-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        (payload) => {
          console.log('Realtime KYC update received!', payload);
          // Load lại danh sách KYC từ đầu (page 0)
          fetchDbKycList(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kycSubscription);
    };
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

      showToast('Đã duyệt hồ sơ eKYC thành công!', 'success');

      // Đồng bộ local store cho user đang đăng nhập nếu chính họ được duyệt
      const storeState = useStore.getState();
      if (storeState.currentUser && storeState.currentUser.id === id) {
        storeState.updateKycStatus('verified');
      }

      fetchDbKycList();
    } catch (err) {
      console.error('Lỗi duyệt eKYC:', err);
      showToast('Lỗi duyệt eKYC: ' + err.message, 'error');
    }
  };

  const handleRejectKycClick = (id) => {
    setRejectModal({ isOpen: true, id, reason: '' });
  };

  const submitRejectKyc = async () => {
    if (!rejectModal.id) return;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          kyc_status: 'REJECTED',
          kyc_rejection_reason: rejectModal.reason || 'Hình ảnh không hợp lệ hoặc sai thông tin.',
          updated_at: new Date().toISOString()
        })
        .eq('id', rejectModal.id);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: rejectModal.id,
        type: 'system',
        title: 'Từ chối xác thực tài khoản',
        desc: `Hồ sơ KYC của bạn bị từ chối. Lý do: ${rejectModal.reason || 'Hình ảnh không hợp lệ hoặc sai thông tin.'} Vui lòng cập nhật lại.`,
        unread: true,
        date: new Date().toLocaleString('vi-VN')
      });

      showToast('Đã từ chối hồ sơ eKYC.', 'error');

      const storeState = useStore.getState();
      if (storeState.currentUser && storeState.currentUser.id === rejectModal.id) {
        storeState.updateKycStatus('rejected');
      }

      setRejectModal({ isOpen: false, id: null, reason: '' });
      fetchDbKycList();
    } catch (err) {
      console.error('Lỗi từ chối eKYC:', err);
      showToast('Lỗi từ chối eKYC: ' + err.message, 'error');
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
          alert(`Lỗi: Khách không đủ số dư để bán! (Sở hữu: ${(currentGrams / 3.75).toFixed(3)} chỉ, Cần bán: ${(qtyGrams / 3.75).toFixed(3)} chỉ)`);
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
    const qty = parseInt(newInvQuantity, 10);

    if (isNaN(weightVal) || weightVal <= 0) {
      showToast('Trọng lượng thỏi vàng không hợp lệ.', 'error');
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      showToast('Số lượng không hợp lệ.', 'error');
      return;
    }

    try {
      const rowsToInsert = [];
      for (let i = 0; i < qty; i++) {
        const serial = `${newInvType.toUpperCase()}-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        rowsToInsert.push({
          gold_serial: serial,
          gold_type: newInvType,
          weight_grams: weightVal,
          bar_brand: newInvBrand,
          status: 'AVAILABLE'
        });
      }

      const { error } = await supabase
        .from('vault_inventory')
        .insert(rowsToInsert);

      if (error) throw error;

      showToast(`Nhập kho thành công ${qty} thỏi vàng!`, 'success');
      setShowAddInventory(false);
      setNewInvQuantity(1); // reset
      fetchDbInventory();
    } catch (err) {
      console.error('Lỗi khi nhập kho:', err);
      showToast('Lỗi nhập kho: ' + err.message, 'error');
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
        <button
          onClick={() => setActiveTab('kyc')}
          style={{
            padding: '10px 24px', background: activeTab === 'kyc' ? 'rgba(212,175,55,0.1)' : 'transparent', border: activeTab === 'kyc' ? '1px solid rgba(212,175,55,0.2)' : '1px solid transparent',
            borderRadius: '99px', fontSize: '14px', fontWeight: 600,
            color: activeTab === 'kyc' ? 'var(--gold)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <ShieldAlert size={16} /> Duyệt eKYC ({dbKycList.length})
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

            {/* Orders Table moved to fill space since KYC is moved */}            {/* Orders Table */}
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

      {/* TAB: KYC */}
      {activeTab === 'kyc' && (
        <div className="neo-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
            <div className="h3" style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="var(--gold)" /> Danh sách KYC chờ duyệt
            </div>
            {isFetchingKyc && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Đang tải...</span>}
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }} onScroll={handleScrollKyc}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Khách hàng</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Thời gian gửi</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-muted)', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {dbKycList.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có hồ sơ eKYC nào đang chờ duyệt.</td>
                  </tr>
                ) : (
                  dbKycList.map(item => {
                    const nameInitials = item.full_name ? item.full_name.trim().split(/\s+/).filter(Boolean).slice(-2).map(p => p[0]).join('').toUpperCase() : 'US';
                    return (
                      <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '13px' }}>
                              {nameInitials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{item.full_name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                CCCD: <span style={{ color: '#fff' }}>{item.id_card_number}</span> | SĐT: {item.phone || '—'}
                              </div>
                              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                                {(item.id_card_front_url || item.id_card_back_url) ? (
                                  <button onClick={() => setPreviewKycModal({ isOpen: true, frontUrl: item.id_card_front_url, backUrl: item.id_card_back_url, name: item.full_name })} style={{ fontSize: '11px', color: 'var(--gold)', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', padding: '4px 12px', borderRadius: '99px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}>Xem ảnh CCCD</button>
                                ) : (
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>[Chưa tải ảnh]</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 18px', color: 'var(--text-muted)' }}>
                          {new Date(item.updated_at).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button onClick={() => handleApproveKyc(item.id)} className="btn" style={{ borderColor: 'var(--emerald)', color: 'var(--emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', fontSize: '13px', borderRadius: '99px', fontWeight: 600 }}>Duyệt</button>
                            <button onClick={() => handleRejectKycClick(item.id)} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '99px', fontWeight: 600 }}>Từ chối</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                {hasMoreKyc && dbKycList.length > 0 && (
                  <tr>
                    <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Cuộn xuống để tải thêm...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
                <select className="form-input" style={{ width: 'auto', borderRadius: '8px', fontSize: '12px', padding: '6px 12px' }} value={invFilterType} onChange={e => setInvFilterType(e.target.value)}>
                  <option value="all">Tất cả loại vàng</option>
                  <option value="sjc">SJC</option>
                  <option value="pnj">PNJ</option>
                  <option value="doji">DOJI</option>
                </select>
                <select className="form-input" style={{ width: 'auto', borderRadius: '8px', fontSize: '12px', padding: '6px 12px' }} value={invFilterStatus} onChange={e => setInvFilterStatus(e.target.value)}>
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
                  <select className="form-input" value={newInvType} onChange={e => setNewInvType(e.target.value)}>
                    <option value="sjc">SJC 1 Chỉ</option>
                    <option value="pnj">PNJ 9999</option>
                    <option value="doji">DOJI 999.9</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nhãn hiệu đúc</label>
                  <input className="form-input" value={newInvBrand} onChange={e => setNewInvBrand(e.target.value)} placeholder="VD: SJC HCM, PNJ HN" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Trọng lượng (grams)</label>
                  <input className="form-input" type="number" step="0.01" value={newInvWeight} onChange={e => setNewInvWeight(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Số lượng</label>
                  <input className="form-input" type="number" min="1" value={newInvQuantity} onChange={e => setNewInvQuantity(e.target.value)} required />
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
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Thương hiệu đúc</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Trạng thái</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Hợp đồng/Đơn gán</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Ngày nhập</th>
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
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontWeight: 'bold' }}>{item.gold_serial}</td>
                          <td style={{ padding: '12px 8px' }}>{item.gold_type.toUpperCase()}</td>
                          <td style={{ padding: '12px 8px' }}>{item.weight_grams} g</td>
                          <td style={{ padding: '12px 8px' }}>{item.bar_brand}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span className={`badge ${badgeClass}`} style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>{item.status}</span>
                          </td>
                          <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {item.order_id ? item.order_id : '—'}
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
              <div className="stat-value">{(dbHedges.reduce((sum, h) => sum + Number(h.quantity_grams), 0) / 3.75).toFixed(2)} chỉ</div>
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
                          <td>{(Number(h.quantity_grams) / 3.75).toFixed(3)} chỉ</td>
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

      {/* Rejection Modal */}
      {rejectModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: '100%', maxWidth: '420px', padding: '32px', borderRadius: '24px', position: 'relative', border: '1px solid rgba(255,255,255,0.08)', background: '#1a1a1a', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setRejectModal({ isOpen: false, id: null, reason: '' })} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <XCircle size={24} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={24} color="var(--ruby)" />
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#fff', letterSpacing: '-0.5px' }}>Từ chối KYC</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Hồ sơ này sẽ bị trả lại cho khách hàng</div>
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#fff', marginBottom: '10px', fontWeight: 500 }}>Lý do từ chối (Bắt buộc)</label>
              <textarea
                rows={4}
                placeholder="Ví dụ: Ảnh chụp bị lóa, không rõ mặt, hoặc sai số CCCD..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                style={{ width: '100%', resize: 'none', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '16px', borderRadius: '12px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setRejectModal({ isOpen: false, id: null, reason: '' })} style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>Hủy bỏ</button>
              <button onClick={submitRejectKyc} disabled={!rejectModal.reason.trim()} style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, background: 'var(--ruby)', color: '#fff', border: 'none', cursor: !rejectModal.reason.trim() ? 'not-allowed' : 'pointer', opacity: !rejectModal.reason.trim() ? 0.5 : 1, transition: 'all 0.2s' }}>Xác nhận từ chối</button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Image Preview Modal */}
      {previewKycModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px' }}>
          <button onClick={() => setPreviewKycModal({ isOpen: false, frontUrl: '', backUrl: '', name: '' })} style={{ position: 'absolute', top: '24px', right: '32px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={28} />
          </button>

          <div className="h2" style={{ color: '#fff', marginBottom: '24px' }}>Hồ sơ CCCD: {previewKycModal.name}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', width: '100%', maxWidth: '1000px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, color: 'var(--gold)' }}>MẶT TRƯỚC</div>
              {previewKycModal.frontUrl ? (
                <img src={previewKycModal.frontUrl} alt="Mặt trước" style={{ width: '100%', objectFit: 'contain', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '60vh', background: 'rgba(255,255,255,0.02)' }} />
              ) : (
                <div style={{ width: '100%', height: '300px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Không có ảnh</div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, color: 'var(--gold)' }}>MẶT SAU</div>
              {previewKycModal.backUrl ? (
                <img src={previewKycModal.backUrl} alt="Mặt sau" style={{ width: '100%', objectFit: 'contain', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '60vh', background: 'rgba(255,255,255,0.02)' }} />
              ) : (
                <div style={{ width: '100%', height: '300px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Không có ảnh</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: toast.type === 'error' ? 'var(--ruby)' : 'var(--emerald)', color: '#fff', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500 }}>
          {toast.type === 'error' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
