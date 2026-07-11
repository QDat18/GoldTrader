import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserLayout from './layouts/UserLayout';
import BlankLayout from './layouts/BlankLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Trade from './pages/Trade';
import Dca from './pages/Dca';
import History from './pages/History';
import Profile from './pages/Profile';
import AdminLayout from './pages/admin/AdminLayout';
import AdminKyc from './pages/admin/AdminKyc';
import AdminOrders from './pages/admin/AdminOrders';
import AdminO2o from './pages/admin/AdminO2o';
import AdminInventory from './pages/admin/AdminInventory';
import AdminHedging from './pages/admin/AdminHedging';
import Login from './pages/Login';
import Notifications from './pages/Notifications';
import Register from './pages/Register';
import Prices from './pages/Prices';
import TradingTerms from './pages/TradingTerms';
import PrivacyPolicy from './pages/PrivacyPolicy';
import UsageGuide from './pages/UsageGuide';
import FeesAndPricing from './pages/FeesAndPricing';
import { supabase } from './supabaseClient';
import useStore from './store/useStore';

const VALID_ROLES = ['guest', 'user', 'admin'];

const normalizeRole = (role) => (
  VALID_ROLES.includes(role) ? role : 'guest'
);

const createFallbackUser = (authUser) => ({
  id: authUser.id,
  name: authUser.user_metadata?.full_name || 'Người dùng mới',
  phone: authUser.user_metadata?.phone || '',
  email: authUser.email,
  cccd: '',
  role: 'guest',
  kycStep: 2,
  kycStatus: 'pending',
  kycRejectionReason: ''
});

// We will create these layout and page components next
const Placeholder = ({ title }) => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>{title}</h2>
    <p>Component is being converted to React...</p>
  </div>
);

const AdminOnly = ({ currentUser, children }) => {
  if (!currentUser?.email) return <Navigate to="/login" replace />;
  return currentUser.role === 'admin' ? children : <Navigate to="/" replace />;
};

const CustomerOnly = ({ currentUser, children }) => {
  if (!currentUser?.email) return <Navigate to="/login" replace />;
  return currentUser.role === 'admin' ? <Navigate to="/admin" replace /> : children;
};

const NonAdminOnly = ({ currentUser, children }) => (
  currentUser?.role === 'admin' ? <Navigate to="/admin" replace /> : children
);

const AuthenticatedOnly = ({ currentUser, children }) => {
  if (!currentUser?.email) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const [loadingSession, setLoadingSession] = useState(true);
  const currentUser = useStore(state => state.currentUser);
  const setCurrentUser = useStore(state => state.setCurrentUser);
  const logout = useStore(state => state.logout);
  const fetchGoldPrices = useStore(state => state.fetchGoldPrices);
  const fetchUserBalances = useStore(state => state.fetchUserBalances);
  const fetchNotifications = useStore(state => state.fetchNotifications);
  const fetchTransactions = useStore(state => state.fetchTransactions);
  const isLoggedIn = Boolean(currentUser.email);
  const roleHomePath = currentUser.role === 'admin' ? '/admin' : '/dashboard';

  useEffect(() => {
    // Tải giá vàng ban đầu từ Supabase và cập nhật định kỳ mỗi 30 giây
    fetchGoldPrices();
    const interval = setInterval(fetchGoldPrices, 30000);

    let adminInterval;
    if (currentUser?.role === 'admin') {
      const fetchAllAdmin = () => {
        useStore.getState().fetchAdminKycList();
        useStore.getState().fetchAdminOrders();
        useStore.getState().fetchAdminInventory();
        useStore.getState().fetchAdminHedges();
      };
      fetchAllAdmin();
      adminInterval = setInterval(fetchAllAdmin, 15000);
    }

    return () => {
      clearInterval(interval);
      if (adminInterval) clearInterval(adminInterval);
    };
  }, [fetchGoldPrices, currentUser?.role]);

  useEffect(() => {
    // 1. Khởi tạo session ban đầu từ LocalStorage/Supabase
    const initSession = async () => {
      // Hỗ trợ đăng nhập nhanh bằng Access Token qua URL query hoặc hash parameters
      const urlParams = new URLSearchParams(window.location.search || window.location.hash.substring(1));
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');

      if (accessToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          if (data?.user) {
            await fetchAndSetUser(data.user);
            // Dọn sạch token trên URL để bảo mật
            window.history.replaceState({}, document.title, window.location.pathname);
            setLoadingSession(false);
            return;
          }
        } catch (tokenErr) {
          console.error("Lỗi thiết lập session từ url token:", tokenErr);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchAndSetUser(session.user);
      } else {
        logout();
      }
      setLoadingSession(false);
    };

    // 2. Tải thông tin hồ sơ chi tiết từ public.user_profiles
    const fetchAndSetUser = async (authUser) => {
      try {
        const { data: dbUser, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (dbUser) {
          setCurrentUser({
            id: dbUser.id,
            name: dbUser.full_name,
            phone: dbUser.phone,
            email: authUser.email,
            cccd: dbUser.id_card_number,
            role: normalizeRole(dbUser.role),
            kycStep: dbUser.kyc_status === 'VERIFIED' ? 3 : 2,
            kycStatus: dbUser.kyc_status?.toLowerCase() || 'pending',
            kycRejectionReason: dbUser.kyc_rejection_reason || ''
          });
 
          // Kiểm tra và khởi tạo các ví vàng trong CSDL nếu chưa có
          const { data: existingWallets, error: ewErr } = await supabase
            .from('gold_wallets')
            .select('*')
            .eq('user_id', dbUser.id);
          
          if (!ewErr && (!existingWallets || existingWallets.length === 0)) {
            await supabase.from('gold_wallets').insert([
              { user_id: dbUser.id, gold_type: 'sjc', quantity_grams: 0.0 },
              { user_id: dbUser.id, gold_type: 'pnj', quantity_grams: 0.0 },
              { user_id: dbUser.id, gold_type: 'doji', quantity_grams: 0.0 }
            ]);
          }
 
          // Đồng bộ số dư ví VND của người dùng từ CSDL vào Zustand Store
          const balanceVal = Number(dbUser.wallet_balance_vnd) || 0;
          localStorage.setItem('cached_wallet_balance', String(balanceVal));
          useStore.setState({ walletBalance: balanceVal });
          // Đồng bộ số dư vàng của người dùng từ CSDL vào Zustand Store
          await fetchUserBalances(dbUser.id);
          // Tải thông báo từ CSDL
          await fetchNotifications(dbUser.id);
          // Tải lịch sử giao dịch từ CSDL
          await fetchTransactions(dbUser.id);
        } else {
          // Fallback nếu chưa kịp tạo bản ghi ở user_profiles
          setCurrentUser(createFallbackUser(authUser));
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin hồ sơ:", err);
        setCurrentUser(createFallbackUser(authUser));
      }
    };

    initSession();

    // 3. Lắng nghe thay đổi trạng thái Auth hệ thống (Đăng nhập, đăng xuất, hết hạn token...)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchAndSetUser(session.user);
      } else {
        logout();
      }
    });

    // 4. Lắng nghe thông báo Realtime từ hệ thống
    const notifSubscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          // Chỉ thêm thông báo nếu đúng user_id của người đang đăng nhập
          const currentUserState = useStore.getState().currentUser;
          if (currentUserState?.id && payload.new.user_id === currentUserState.id) {
            useStore.getState().addNotification(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(notifSubscription);
    };
  }, [setCurrentUser, logout]);

  if (loadingSession) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#121212', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', color: 'var(--gold)', fontWeight: 600, letterSpacing: '2px' }}>GOLDCHAIN</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>Đang xác thực phiên đăng nhập...</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route element={<UserLayout />}>
          <Route path="/" element={
            isLoggedIn ? (
              <Navigate to={roleHomePath} replace />
            ) : (
              <Home />
            )
          } />
          
          {/* User Routes */}
          <Route path="/dashboard" element={<CustomerOnly currentUser={currentUser}><Dashboard /></CustomerOnly>} />
          <Route path="/trade" element={<NonAdminOnly currentUser={currentUser}><Trade /></NonAdminOnly>} />
          <Route path="/dca" element={<CustomerOnly currentUser={currentUser}><Dca /></CustomerOnly>} />
          <Route path="/history" element={<CustomerOnly currentUser={currentUser}><History /></CustomerOnly>} />
          <Route path="/profile" element={<AuthenticatedOnly currentUser={currentUser}><Profile /></AuthenticatedOnly>} />
          <Route path="/prices" element={<NonAdminOnly currentUser={currentUser}><Prices /></NonAdminOnly>} />
          <Route path="/terms" element={<TradingTerms />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/guide" element={<UsageGuide />} />
          <Route path="/fees" element={<FeesAndPricing />} />
          <Route path="/order" element={<CustomerOnly currentUser={currentUser}><Placeholder title="Order Details" /></CustomerOnly>} />
          <Route path="/notifications" element={<AuthenticatedOnly currentUser={currentUser}><Notifications /></AuthenticatedOnly>} />
        </Route>

        {/* Auth Routes */}
        <Route element={<BlankLayout />}>
          <Route path="/login" element={isLoggedIn ? <Navigate to={roleHomePath} replace /> : <Login />} />
          <Route path="/register" element={isLoggedIn ? <Navigate to={roleHomePath} replace /> : <Register />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<UserLayout />}>
          <Route path="/admin" element={<AdminOnly currentUser={currentUser}><AdminLayout /></AdminOnly>}>
            <Route index element={<Navigate to="/admin/kyc" replace />} />
            <Route path="kyc" element={<AdminKyc />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="o2o" element={<AdminO2o />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="hedging" element={<AdminHedging />} />
          </Route>
          <Route path="/inventory" element={<AdminOnly currentUser={currentUser}><Placeholder title="Inventory Management" /></AdminOnly>} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
