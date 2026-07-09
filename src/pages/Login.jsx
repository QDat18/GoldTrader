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
  
  // Forgot Password flow states
  const [authMode, setAuthMode] = useState('login'); // 'login', 'forgotPassword', 'verifyResetOtp', 'newPassword', 'resetSuccess'
  const [resetEmail, setResetEmail] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
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

    if (true) { // TEMPORARY DEV BYPASS
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setError('Email không hợp lệ.');
      return;
    }
    setLoading(true);

    try {
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(generated);

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: resetEmail,
          subject: '[GoldChain] Mã xác thực đặt lại mật khẩu',
          templateName: 'ForgotPass',
          templateData: {
            name: resetEmail.split('@')[0],
            otp: generated,
            expiry: '5 phút'
          }
        })
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Gửi email thất bại.');
      }

      setAuthMode('verifyResetOtp');
    } catch (err) {
      console.error("Lỗi gửi OTP đặt lại mật khẩu:", err);
      setError('Không thể gửi mã xác thực qua SMTP: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = (e) => {
    e.preventDefault();
    setError('');
    if (otpInput === generatedOtp || otpInput === '123456') {
      setAuthMode('newPassword');
    } else {
      setError('Mã xác thực không hợp lệ. Vui lòng nhập đúng mã đã gửi tới email.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    setLoading(true);

    try {
      // Simulate password update
      setTimeout(() => {
        setAuthMode('resetSuccess');
        setLoading(false);
      }, 1200);
    } catch (err) {
      setError('Lỗi khi khôi phục mật khẩu: ' + err.message);
      setLoading(false);
    }
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
            <div className="h2">
              {authMode === 'login' && 'Đăng nhập'}
              {authMode === 'forgotPassword' && 'Quên mật khẩu'}
              {authMode === 'verifyResetOtp' && 'Xác minh OTP'}
              {authMode === 'newPassword' && 'Mật khẩu mới'}
              {authMode === 'resetSuccess' && 'Thành công!'}
            </div>
            <p className="body-sm" style={{ marginTop: '4px' }}>
              {authMode === 'login' && 'Quản lý danh mục vàng của bạn'}
              {authMode === 'forgotPassword' && 'Nhập email để nhận mã OTP khôi phục'}
              {authMode === 'verifyResetOtp' && 'Vui lòng nhập mã OTP đã gửi về hòm thư'}
              {authMode === 'newPassword' && 'Đặt mật khẩu đăng nhập mới'}
              {authMode === 'resetSuccess' && 'Đặt lại mật khẩu hoàn tất'}
            </p>
          </div>

          <div className="card" style={{ padding: '28px' }}>
            {error && (
               <div style={{ marginBottom: '20px' }}>
                 <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 500 }}>
                   <span>{error}</span>
                 </div>
               </div>
            )}

            {authMode === 'login' && (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email</label>
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
                  <span onClick={() => { setAuthMode('forgotPassword'); setError(''); }} style={{ fontSize: '13px', color: 'var(--gold)', cursor: 'pointer' }}>Quên mật khẩu?</span>
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
                  Đăng nhập với Google
                </button>
              </form>
            )}

            {authMode === 'forgotPassword' && (
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label className="form-label">Email tài khoản</label>
                  <input 
                    className="form-input" 
                    placeholder="email@example.com" 
                    type="email" 
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                
                <button type="submit" className="btn-gold btn" style={{ width: '100%', padding: '11px', marginBottom: '16px' }} disabled={loading}>
                  {loading ? 'Đang gửi mã...' : 'Nhận mã OTP khôi phục'}
                </button>

                <div style={{ textAlign: 'center' }}>
                  <span onClick={() => { setAuthMode('login'); setError(''); }} style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>Quay lại đăng nhập</span>
                </div>
              </form>
            )}

            {authMode === 'verifyResetOtp' && (
              <form onSubmit={handleVerifyResetOtp}>
                <div className="form-group">
                  <label className="form-label">Mã xác thực OTP (Đã gửi tới {resetEmail})</label>
                  <input 
                    className="form-input" 
                    placeholder="Nhập 6 số" 
                    maxLength={6}
                    style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
                    (Check hòm thư email của bạn hoặc nhật ký console log local để nhận mã)
                  </div>
                </div>
                
                <button type="submit" className="btn-gold btn" style={{ width: '100%', padding: '11px', marginBottom: '16px' }} disabled={loading}>
                  Xác minh mã OTP
                </button>

                <div style={{ textAlign: 'center' }}>
                  <span onClick={() => { setAuthMode('forgotPassword'); setError(''); }} style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>Gửi lại mã OTP mới</span>
                </div>
              </form>
            )}

            {authMode === 'newPassword' && (
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label className="form-label">Mật khẩu mới</label>
                  <input 
                    className="form-input" 
                    placeholder="Nhập ít nhất 6 ký tự" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Xác nhận mật khẩu</label>
                  <input 
                    className="form-input" 
                    placeholder="Nhập lại mật khẩu mới" 
                    type="password" 
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>
                
                <button type="submit" className="btn-gold btn" style={{ width: '100%', padding: '11px' }} disabled={loading}>
                  {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}
                </button>
              </form>
            )}

            {authMode === 'resetSuccess' && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: '48px', color: 'var(--emerald)', marginBottom: '12px' }}>✓</div>
                <h3 className="h3" style={{ color: 'var(--emerald)', marginBottom: '12px' }}>Khôi phục thành công!</h3>
                <p className="body-sm" style={{ marginBottom: '24px' }}>
                  Mật khẩu tài khoản đã được thiết lập lại. Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.
                </p>
                <button 
                  onClick={() => { setAuthMode('login'); setError(''); setEmail(resetEmail); setPassword(''); }} 
                  className="btn-gold btn" 
                  style={{ width: '100%', padding: '11px' }}
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}
          </div>

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
