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
  const [showTokenLogin, setShowTokenLogin] = useState(false);
  const [inputAccessToken, setInputAccessToken] = useState('');
  const [inputRefreshToken, setInputRefreshToken] = useState('');
  
  const navigate = useNavigate();
  const setCurrentUser = useStore(state => state.setCurrentUser);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Check if it's a mock admin bypass for testing (like in the old code)
    if (email === 'admin@goldchain.vn' && password === 'admin') {
      setCurrentUser({
        name: 'Quản trị viên',
        phone: '0900 000 000',
        email: 'admin@goldchain.vn',
        cccd: '111222333444',
        role: 'admin',
        kycStep: 3,
        kycStatus: 'verified'
      });
      navigate('/admin');
      return;
    }

    setLoading(true);
    
    // Connect to Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      // Dev Bypass: Cho phép bypass nếu tài khoản chưa được tạo thật trên Supabase
      if (error.message.includes('Invalid login credentials') || error.status === 400 || error.message.includes('User not found')) {
        console.warn("Bypassed Supabase Auth for Dev Demo.");
        setCurrentUser({
          name: 'Nguyễn Văn An',
          phone: '0912 345 678',
          email: email || 'an.nguyen@goldchain.vn',
          cccd: '001234567890',
          role: 'user',
          kycStep: 2,
          kycStatus: 'pending'
        });
        navigate('/dashboard');
        setLoading(false);
        return;
      }
      
      setError(error.message);
      setLoading(false);
      return;
    }

    // Success login -> Fetch user details from public.user_profiles
    try {
      const { data: dbUser, error: dbError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (dbUser) {
        setCurrentUser({
          name: dbUser.full_name,
          phone: dbUser.phone,
          email: data.user.email,
          cccd: dbUser.id_card_number,
          role: dbUser.role || 'guest',
          kycStep: dbUser.kyc_status === 'VERIFIED' ? 3 : 2,
          kycStatus: dbUser.kyc_status?.toLowerCase() || 'pending'
        });
      } else {
        // Fallback metadata
        setCurrentUser({
          name: data.user.user_metadata?.full_name || 'Người dùng mới',
          phone: data.user.user_metadata?.phone || '',
          email: data.user.email,
          cccd: '',
          role: data.user.user_metadata?.role || 'guest',
          kycStep: 2,
          kycStatus: 'pending'
        });
      }
    } catch (dbErr) {
      console.error("Lỗi khi tải thông tin người dùng từ DB:", dbErr);
      setCurrentUser({
        name: data.user.user_metadata?.full_name || 'Người dùng mới',
        phone: data.user.user_metadata?.phone || '',
        email: data.user.email,
        cccd: '',
        role: data.user.user_metadata?.role || 'guest',
        kycStep: 2,
        kycStatus: 'pending'
      });
    }

    navigate('/dashboard');
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
        setError(error.message);
        setLoading(false);
        return;
      }

      // Success login -> Fetch user details from public.user_profiles
      const { data: dbUser, error: dbError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (dbUser) {
        setCurrentUser({
          name: dbUser.full_name,
          phone: dbUser.phone,
          email: data.user.email,
          cccd: dbUser.id_card_number,
          role: dbUser.role || 'guest',
          kycStep: dbUser.kyc_status === 'VERIFIED' ? 3 : 2,
          kycStatus: dbUser.kyc_status?.toLowerCase() || 'pending'
        });
      } else {
        setCurrentUser({
          name: data.user.user_metadata?.full_name || 'Người dùng mới',
          phone: data.user.user_metadata?.phone || '',
          email: data.user.email,
          cccd: '',
          role: data.user.user_metadata?.role || 'guest',
          kycStep: 2,
          kycStatus: 'pending'
        });
      }
      navigate('/dashboard');
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

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span 
                onClick={() => setShowTokenLogin(!showTokenLogin)} 
                style={{ fontSize: '12px', color: 'var(--gold)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {showTokenLogin ? 'Ẩn đăng nhập bằng Token' : 'Đăng nhập nhanh bằng Access Token (Dev)'}
              </span>
            </div>

            {showTokenLogin && (
              <div style={{ marginTop: '16px', background: 'var(--gray-50)', padding: '16px', border: '1px solid var(--gray-200)', borderRadius: '8px', textAlign: 'left' }}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--gray-500)' }}>Access Token</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Dán access_token vào đây..." 
                    value={inputAccessToken}
                    onChange={(e) => setInputAccessToken(e.target.value)}
                    style={{ fontSize: '12px', height: '60px', resize: 'vertical' }}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--gray-500)' }}>Refresh Token (Tùy chọn)</label>
                  <input 
                    className="form-input" 
                    placeholder="Nhập refresh_token" 
                    value={inputRefreshToken}
                    onChange={(e) => setInputRefreshToken(e.target.value)}
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <button type="button" onClick={handleTokenLogin} className="btn-gold btn" style={{ width: '100%', padding: '8px', fontSize: '13px' }} disabled={loading || !inputAccessToken}>
                  {loading ? 'Đang xác thực...' : 'Đăng nhập bằng Token'}
                </button>
              </div>
            )}
          </form>

          {error && (
             <div style={{ textAlign: 'center', marginTop: '16px' }}>
               <div style={{ background: 'var(--red-bg)', border: '0.5px solid var(--red)', padding: '10px 14px', fontSize: '12px', color: 'var(--red)', marginBottom: '12px' }}>
                 <i className="ti ti-alert-circle" style={{ fontSize: '14px', verticalAlign: '-2px', marginRight: '6px' }}></i>
                 {error}
               </div>
             </div>
          )}
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
