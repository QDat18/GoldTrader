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
import Admin from './pages/Admin';
import Login from './pages/Login';
import Notifications from './pages/Notifications';
import Register from './pages/Register';
import { supabase } from './supabaseClient';
import useStore from './store/useStore';

// We will create these layout and page components next
const Placeholder = ({ title }) => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>{title}</h2>
    <p>Component is being converted to React...</p>
  </div>
);

function App() {
  const [loadingSession, setLoadingSession] = useState(true);
  const currentUser = useStore(state => state.currentUser);
  const setCurrentUser = useStore(state => state.setCurrentUser);
  const logout = useStore(state => state.logout);
  const fetchGoldPrices = useStore(state => state.fetchGoldPrices);
  const fetchUserBalances = useStore(state => state.fetchUserBalances);
  const fetchNotifications = useStore(state => state.fetchNotifications);

  useEffect(() => {
    // Tải giá vàng ban đầu từ Supabase và cập nhật định kỳ mỗi 30 giây
    fetchGoldPrices();
    const interval = setInterval(fetchGoldPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchGoldPrices]);

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

        if (dbUser) {
          setCurrentUser({
            id: dbUser.id,
            name: dbUser.full_name,
            phone: dbUser.phone,
            email: authUser.email,
            cccd: dbUser.id_card_number,
            role: (authUser.email === 'admin@goldchain.vn') ? 'admin' : (dbUser.role || 'guest'),
            kycStep: dbUser.kyc_status === 'VERIFIED' ? 3 : 2,
            kycStatus: dbUser.kyc_status?.toLowerCase() || 'pending'
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

          // Đồng bộ số dư vàng của người dùng từ CSDL vào Zustand Store
          await fetchUserBalances(dbUser.id);
          // Tải thông báo từ CSDL
          await fetchNotifications(dbUser.id);
        } else {
          // Fallback nếu chưa kịp tạo bản ghi ở user_profiles
          setCurrentUser({
            name: authUser.user_metadata?.full_name || 'Người dùng mới',
            phone: authUser.user_metadata?.phone || '',
            email: authUser.email,
            cccd: '',
            role: (authUser.email === 'admin@goldchain.vn') ? 'admin' : (authUser.user_metadata?.role || 'guest'),
            kycStep: 2,
            kycStatus: 'pending'
          });
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin hồ sơ:", err);
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

    return () => {
      subscription.unsubscribe();
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
            currentUser.email ? (
              currentUser.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
            ) : (
              <Home />
            )
          } />
          
          {/* User Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/dca" element={<Dca />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/order" element={<Placeholder title="Order Details" />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<BlankLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<UserLayout />}>
          <Route path="/admin" element={currentUser.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
          <Route path="/inventory" element={<Placeholder title="Inventory Management" />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
