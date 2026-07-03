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
  const switchUserRole = useStore(state => state.switchUserRole);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Check if it's a mock admin bypass for testing (like in the old code)
    if (email === 'admin@goldchain.vn' && password === 'admin') {
      switchUserRole('admin');
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
      setError(error.message);
      setLoading(false);
      return;
    }

    // Success login
    // Depending on your Supabase users table, we might need to fetch the role
    // For now, we default to 'user'
    switchUserRole('user');
    navigate('/dashboard');
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
                type="text" 
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
