import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setCurrentUser = useStore(state => state.setCurrentUser);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    // Connect to Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      let friendlyMessage = 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.';
      if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
        friendlyMessage = 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
      } else if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
        friendlyMessage = 'Tài khoản chưa được xác thực email. Vui lòng kiểm tra hộp thư để kích hoạt.';
      } else if (error.message.includes('User not found') || error.message.includes('user_not_found')) {
        friendlyMessage = 'Tài khoản không tồn tại trên hệ thống.';
      } else if (error.message.includes('Too many requests') || error.status === 429) {
        friendlyMessage = 'Yêu cầu quá nhiều lần. Vui lòng đợi một lát rồi thử lại.';
      } else {
        friendlyMessage = error.message;
      }
      setError(friendlyMessage);
      setLoading(false);
      return;
    }

    // Success login -> Fetch user details from public.user_profiles
    let resolvedRole = 'guest';
    try {
      const { data: dbUser, error: dbError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (dbUser) {
        resolvedRole = dbUser.role || 'guest';
        setCurrentUser({
          id: dbUser.id,
          name: dbUser.full_name,
          phone: dbUser.phone,
          email: data.user.email,
          cccd: dbUser.id_card_number,
          role: resolvedRole,
          kycStep: dbUser.kyc_status === 'VERIFIED' ? 3 : 2,
          kycStatus: dbUser.kyc_status?.toLowerCase() || 'pending',
          kycRejectionReason: dbUser.kyc_rejection_reason || ''
        });
      } else {
        // Fallback metadata
        resolvedRole = data.user.email === 'admin@goldchain.vn' ? 'admin' : (data.user.user_metadata?.role || 'guest');
        setCurrentUser({
          id: data.user.id,
          name: data.user.user_metadata?.full_name || 'Người dùng mới',
          phone: data.user.user_metadata?.phone || '',
          email: data.user.email,
          cccd: '',
          role: resolvedRole,
          kycStep: 2,
          kycStatus: 'pending'
        });
      }
    } catch (dbErr) {
      console.error("Lỗi khi tải thông tin người dùng từ DB:", dbErr);
      resolvedRole = data.user.email === 'admin@goldchain.vn' ? 'admin' : (data.user.user_metadata?.role || 'guest');
      setCurrentUser({
        id: data?.user?.id || 'guest-id',
        name: data?.user?.user_metadata?.full_name || 'Người dùng mới',
        phone: data?.user?.user_metadata?.phone || '',
        email: data?.user?.email,
        cccd: '',
        role: resolvedRole,
        kycStep: 2,
        kycStatus: 'pending'
      });
    }

    if (resolvedRole === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleTokenLogin = async (e) => {
    e.preventDefault();
    if (!inputAccessToken) return;
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: inputAccessToken,
        refresh_token: inputRefreshToken || ''
      });

      if (error) {
        setError('Token xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.');
        setLoading(false);
        return;
      }

      // Success login -> Fetch user details from public.user_profiles
      let resolvedRole = 'guest';
      const { data: dbUser, error: dbError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (dbUser) {
        resolvedRole = dbUser.role || 'guest';
        setCurrentUser({
          id: dbUser.id,
          name: dbUser.full_name,
          phone: dbUser.phone,
          email: data.user.email,
          cccd: dbUser.id_card_number,
          role: resolvedRole,
          kycStep: dbUser.kyc_status === 'VERIFIED' ? 3 : 2,
          kycStatus: dbUser.kyc_status?.toLowerCase() || 'pending',
          kycRejectionReason: dbUser.kyc_rejection_reason || ''
        });
      } else {
        resolvedRole = data.user.email === 'admin@goldchain.vn' ? 'admin' : (data.user.user_metadata?.role || 'guest');
        setCurrentUser({
          id: data.user.id,
          name: data.user.user_metadata?.full_name || 'Người dùng mới',
          phone: data.user.user_metadata?.phone || '',
          email: data.user.email,
          cccd: '',
          role: resolvedRole,
          kycStep: 2,
          kycStatus: 'pending'
        });
      }
      
      if (resolvedRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (dbErr) {
      console.error("Lỗi khi tải thông tin người dùng từ DB:", dbErr);
      setError('Token không hợp lệ hoặc đã hết hạn.');
    }
    setLoading(false);
  };
  return (
    <>
      <div className="nav-bar">
        <Link to="/" className="logo">
          <div className="logo-mark"><span>G</span></div>
          <span className="logo-text">GOLD<em>CHAIN</em></span>
        </Link>
        <div></div>
        <div className="nav-actions">
          <span className="body-sm">Chưa có tài khoản?</span>
          <Link to="/register" className="btn-gold btn" style={{ textDecoration: 'none' }}>Đăng ký</Link>
        </div>
      </div>

      <div style={{ minHeight: '560px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', padding: '40px 24px', flex: 1 }}>
        <div style={{ width: '380px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div className="logo" style={{ justifyContent: 'center', marginBottom: '12px' }}>
              <div className="logo-mark"><span>G</span></div>
              <span className="logo-text">GOLD<em>CHAIN</em></span>
            </div>
            <div className="h2">Đăng nhập</div>
            <p className="body-sm" style={{ marginTop: '4px' }}>Quản lý danh mục vàng của bạn</p>
          </div>

          <form className="card" style={{ padding: '28px' }} onSubmit={handleLogin}>
            {error && (
               <div style={{ marginBottom: '20px' }}>
                 <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 500 }}>
                   <i className="ti ti-alert-circle" style={{ fontSize: '18px' }}></i>
                   <span>{error}</span>
                 </div>
               </div>
            )}
            <div className="form-group">
              <label className="form-label">Email / Số điện thoại</label>
              <input 
                className="form-input" 
                placeholder="email@example.com" 
                type="email" 
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className="form-input" 
                  placeholder="Nhập mật khẩu" 
                  type={showPassword ? "text" : "password"} 
                  style={{ paddingRight: '40px' }} 
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-300)', fontSize: '16px', cursor: 'pointer' }}
                >
                  <i className={`ti ti-${showPassword ? 'eye-off' : 'eye'}`}></i>
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <span style={{ fontSize: '13px', color: 'var(--gold)', cursor: 'pointer' }}>Quên mật khẩu?</span>
            </div>
            
            <button type="submit" className="btn-gold btn" style={{ width: '100%', padding: '11px' }} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
            
            <div className="divider" style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '0.5px', background: 'var(--gray-200)' }}></div>
              <span className="body-sm">hoặc</span>
              <div style={{ flex: 1, height: '0.5px', background: 'var(--gray-200)' }}></div>
            </div>
            
            <button type="button" className="btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}>
              <i className="ti ti-brand-google" style={{ fontSize: '16px' }}></i> Đăng nhập với Google
            </button>


          </form>

        </div>
      </div>

      <div className="footer" style={{ padding: '20px 24px', marginTop: 'auto' }}>
        <div className="footer-bottom" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <span style={{ fontSize: '12px' }}>© 2024 GoldChain JSC</span>
          <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>Chính sách bảo mật · Điều khoản</span>
        </div>
      </div>
    </>
  );
}
