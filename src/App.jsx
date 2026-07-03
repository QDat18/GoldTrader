import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserLayout from './layouts/UserLayout';
import BlankLayout from './layouts/BlankLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
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
  const setCurrentUser = useStore(state => state.setCurrentUser);
  const logout = useStore(state => state.logout);

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
            return;
          }
        } catch (tokenErr) {
          console.error("Lỗi thiết lập session từ url token:", tokenErr);
        }
      }

      // Kiểm tra xem có phiên Mock Dev lưu trong LocalStorage không trước khi gọi getSession
      const mockSession = localStorage.getItem('goldchain_mock_session');
      if (mockSession) {
        try {
          const parsedUser = JSON.parse(mockSession);
          setCurrentUser(parsedUser);
          return;
        } catch (e) {
          localStorage.removeItem('goldchain_mock_session');
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchAndSetUser(session.user);
      } else {
        logout();
      }
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
            name: dbUser.full_name,
            phone: dbUser.phone,
            email: authUser.email,
            cccd: dbUser.id_card_number,
            role: dbUser.role || 'guest',
            kycStep: dbUser.kyc_status === 'VERIFIED' ? 3 : 2,
            kycStatus: dbUser.kyc_status?.toLowerCase() || 'pending'
          });
        } else {
          // Fallback nếu chưa kịp tạo bản ghi ở user_profiles
          setCurrentUser({
            name: authUser.user_metadata?.full_name || 'Người dùng mới',
            phone: authUser.user_metadata?.phone || '',
            email: authUser.email,
            cccd: '',
            role: authUser.user_metadata?.role || 'guest',
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
        // Có session thực, xóa session giả lập
        localStorage.removeItem('goldchain_mock_session');
        await fetchAndSetUser(session.user);
      } else {
        // Chỉ đăng xuất nếu không có Mock Dev Session trong LocalStorage
        if (!localStorage.getItem('goldchain_mock_session')) {
          logout();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setCurrentUser, logout]);

  return (
    <Router>
      <Routes>
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          
          {/* User Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trade" element={<Placeholder title="Trade (Buy/Sell)" />} />
          <Route path="/dca" element={<Placeholder title="DCA Plans" />} />
          <Route path="/history" element={<Placeholder title="Transaction History" />} />
          <Route path="/order" element={<Placeholder title="Order Details" />} />
          <Route path="/notifications" element={<Placeholder title="Notifications" />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<BlankLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<Placeholder title="Admin Dashboard" />} />
        <Route path="/inventory" element={<Placeholder title="Inventory Management" />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
