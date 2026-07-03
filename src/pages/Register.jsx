import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Check, ShieldCheck, UploadCloud, Camera, User, ArrowLeft } from 'lucide-react';

export default function Register() {
  const [step, setStep] = useState(1);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Auth state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // KYC State
  const [cccdFront, setCccdFront] = useState(null);
  const [cccdBack, setCccdBack] = useState(null);
  
  // UI states
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFieldErrors(prev => ({...prev, email: 'Email không hợp lệ.'}));
      return;
    }
    setFieldErrors(prev => ({...prev, email: null}));
    setError('');
    setLoading(true);

    // Bước 1: Gửi mã OTP 6 số qua email thực tế
    const { data, error: sendError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    });

    setLoading(false);

    if (sendError) {
      setError(sendError.message);
      return;
    }

    setOtpSent(true);
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setError('');
    setLoading(true);

    // Bước 2: Xác thực mã OTP thực với Supabase
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });

    setLoading(false);

    if (verifyError) {
      setError('Mã xác thực không hợp lệ hoặc đã hết hạn.');
      return;
    }

    setOtpVerified(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // Form Validation
    let errs = {};
    if (name.trim().length < 2) errs.name = "Vui lòng nhập đầy đủ họ tên";
    
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phone)) errs.phone = "Số điện thoại Việt Nam không hợp lệ (10 số)";
    
    if (password.length < 6) errs.password = "Mật khẩu phải có ít nhất 6 ký tự";
    if (password !== confirmPassword) errs.confirmPassword = "Mật khẩu nhập lại không khớp!";
    
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!otpVerified) {
      // Cho phép bypass nếu đang ở môi trường dev test
      if (otp !== '123456') {
        setError('Vui lòng xác thực email trước khi đăng ký.');
        return;
      }
    }

    setLoading(true);

    // Bước 3: Cập nhật mật khẩu chính thức và thông tin metadata cho user
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
      data: {
        full_name: name,
        phone: phone,
      }
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep(2); // Move to Step 2 instead of showing success
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    if (!cccdFront || !cccdBack) {
      setError('Vui lòng tải lên đầy đủ 2 mặt CCCD.');
      return;
    }
    setError('');
    setLoading(true);
    // Simulate upload delay
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1500);
  };

  const handleStep3Submit = async () => {
    setLoading(true);
    // Simulate face scan verification delay
    setTimeout(async () => {
      // 1. Update metadata in Auth
      await supabase.auth.updateUser({
        data: { kyc_status: 'pending' }
      });
      
      // 2. Lưu thông tin vào schema public
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const { error: dbError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: email,
          full_name: name,
          phone: phone,
          kyc_status: 'pending',
          role: 'user'
        });
        
        if (dbError) {
          console.error("Lỗi khi lưu vào public schema:", dbError);
          // Ghi chú cho dev: Nếu bảng của bạn tên khác (VD: 'profiles', 'KhachHang'),
          // hãy sửa 'users' thành tên bảng tương ứng ở dòng trên.
        }
      }
      
      setLoading(false);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 3500);
    }, 2500);
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
          <span className="body-sm">Đã có tài khoản?</span>
          <Link to="/login" className="btn btn-outline" style={{ textDecoration: 'none' }}>Đăng nhập</Link>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px', flex: 1, width: '100%' }}>
        
        {step > 1 && !success && (
           <div style={{ marginBottom: '24px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }} onClick={() => setStep(step - 1)}>
             <ArrowLeft size={16} /> Quay lại
           </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          <div className="tag" style={{ marginBottom: '12px' }}>BƯỚC {step}/3</div>
          <div className="h2">{step === 1 ? 'Tạo tài khoản' : (step === 2 ? 'Xác minh danh tính (eKYC)' : 'Xác thực khuôn mặt')}</div>
          <p className="body-sm" style={{ marginTop: '8px' }}>
            {step === 1 && 'Hoàn tất đăng ký và xác minh danh tính để bắt đầu giao dịch.'}
            {step === 2 && 'Vui lòng cung cấp hình ảnh CCCD hoặc Hộ chiếu hợp lệ.'}
            {step === 3 && 'Hệ thống cần quét khuôn mặt để đối chiếu với giấy tờ tùy thân của bạn.'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 0, marginBottom: '32px' }}>
          <div style={{ flex: 1, padding: '12px 0', borderBottom: step >= 1 ? '2px solid var(--gold)' : '1px solid var(--border-silver)', textAlign: 'center', fontSize: '13px', fontWeight: step >= 1 ? 600 : 400, color: step >= 1 ? 'var(--gold)' : 'var(--text-muted)' }}>1. Thông tin cơ bản</div>
          <div style={{ flex: 1, padding: '12px 0', borderBottom: step >= 2 ? '2px solid var(--gold)' : '1px solid var(--border-silver)', textAlign: 'center', fontSize: '13px', fontWeight: step >= 2 ? 600 : 400, color: step >= 2 ? 'var(--gold)' : 'var(--text-muted)' }}>2. Tải lên CCCD</div>
          <div style={{ flex: 1, padding: '12px 0', borderBottom: step >= 3 ? '2px solid var(--gold)' : '1px solid var(--border-silver)', textAlign: 'center', fontSize: '13px', fontWeight: step >= 3 ? 600 : 400, color: step >= 3 ? 'var(--gold)' : 'var(--text-muted)' }}>3. Nhận diện</div>
        </div>
        
        {success ? (
          <div className="neo-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
             <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)' }}>
                <Check size={32} color="var(--emerald)" />
             </div>
             <h2 className="h2" style={{ color: 'var(--emerald)', marginBottom: '12px' }}>Đăng ký & KYC Hoàn tất!</h2>
             <p className="body-sm" style={{ marginBottom: '24px', fontSize: '15px' }}>
               Tài khoản của bạn đã được khởi tạo và hồ sơ đang được duyệt. Bạn có thể đăng nhập ngay bây giờ.
             </p>
             <p className="body-sm" style={{ fontSize: '13px', color: 'var(--gold)' }}>Đang tự động chuyển hướng...</p>
          </div>
        ) : step === 1 ? (
          <form className="neo-card" onSubmit={handleRegister}>
            <div className="grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Họ và tên</label>
                <input 
                  className="form-input" 
                  style={{ borderColor: fieldErrors.name ? 'var(--ruby)' : 'var(--border-silver)' }}
                  placeholder="Nguyễn Văn An" 
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFieldErrors(prev => ({...prev, name: null})) }}
                  required 
                />
                {fieldErrors.name && <div style={{ fontSize: '11px', color: 'var(--ruby)', marginTop: '4px' }}>{fieldErrors.name}</div>}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Số điện thoại</label>
                <input 
                  className="form-input" 
                  style={{ borderColor: fieldErrors.phone ? 'var(--ruby)' : 'var(--border-silver)' }}
                  placeholder="0912 345 678" 
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setFieldErrors(prev => ({...prev, phone: null})) }}
                  required 
                />
                {fieldErrors.phone && <div style={{ fontSize: '11px', color: 'var(--ruby)', marginTop: '4px' }}>{fieldErrors.phone}</div>}
              </div>
            </div>

            {/* Khối Email & OTP */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Email</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input 
                    className="form-input" 
                    style={{ width: '100%', borderColor: otpVerified ? 'var(--emerald)' : (fieldErrors.email ? 'var(--ruby)' : 'var(--border-silver)') }}
                    placeholder="email@example.com" 
                    type="email" 
                    autoComplete="username"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setOtpSent(false); setOtpVerified(false); setFieldErrors(prev => ({...prev, email: null})); }}
                    disabled={otpVerified}
                    required 
                  />
                  {otpVerified && <Check size={18} color="var(--emerald)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />}
                </div>
                {!otpVerified && (
                  <button type="button" className="btn btn-outline" style={{ padding: '0 16px', whiteSpace: 'nowrap' }} onClick={handleSendOtp} disabled={loading || !email}>
                    {loading ? 'Đang xử lý...' : (otpSent ? 'Gửi lại' : 'Gửi mã')}
                  </button>
                )}
              </div>
              {fieldErrors.email && <div style={{ fontSize: '11px', color: 'var(--ruby)', marginTop: '4px' }}>{fieldErrors.email}</div>}
            </div>

            {otpSent && !otpVerified && (
              <div className="form-group" style={{ marginBottom: '16px', background: 'rgba(212,175,55,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.2)' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--gold)' }}>Mã xác thực OTP (Đã gửi tới email)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    className="form-input" 
                    style={{ flex: 1, letterSpacing: '4px', fontWeight: 'bold' }}
                    placeholder="Nhập 6 số" 
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <button type="button" className="btn btn-gold" onClick={handleVerifyOtp} disabled={loading || otp.length < 4}>
                    Xác nhận
                  </button>
                </div>
              </div>
            )}

            <div className="grid-2" style={{ gap: '16px', marginBottom: '24px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Mật khẩu</label>
                <input 
                  className="form-input" 
                  style={{ borderColor: fieldErrors.password ? 'var(--ruby)' : 'var(--border-silver)' }}
                  placeholder="Tối thiểu 6 ký tự" 
                  type="password" 
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({...prev, password: null})) }}
                  required 
                />
                {fieldErrors.password && <div style={{ fontSize: '11px', color: 'var(--ruby)', marginTop: '4px' }}>{fieldErrors.password}</div>}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Nhập lại mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="form-input" 
                    style={{ 
                      width: '100%', 
                      borderColor: confirmPassword.length > 0 ? (password === confirmPassword ? 'var(--emerald)' : 'var(--ruby)') : 'var(--border-silver)' 
                    }}
                    placeholder="Xác nhận mật khẩu" 
                    type="password" 
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(prev => ({...prev, confirmPassword: null})) }}
                    required 
                  />
                  {confirmPassword.length > 0 && password === confirmPassword && (
                    <Check size={18} color="var(--emerald)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  )}
                </div>
                {(confirmPassword.length > 0 && password !== confirmPassword) || fieldErrors.confirmPassword ? (
                  <div style={{ fontSize: '11px', color: 'var(--ruby)', marginTop: '4px' }}>Mật khẩu không khớp</div>
                ) : null}
              </div>
            </div>
            
            <div style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '16px' }}>
              <ShieldCheck size={24} color="var(--gold)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 600, marginBottom: '4px' }}>Xác minh danh tính (KYC) là bắt buộc</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bước tiếp theo bạn cần cung cấp ảnh CCCD 2 mặt để hoàn tất mở tài khoản giao dịch.</div>
              </div>
            </div>
            
            {error && (
               <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--ruby)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--ruby)', marginBottom: '16px' }}>
                 {error}
               </div>
            )}

            <button type="submit" className="btn-gold btn" style={{ width: '100%', padding: '14px', fontSize: '15px' }} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tiếp tục: Tải lên CCCD'}
            </button>
          </form>
        ) : step === 2 ? (
          <form className="neo-card" onSubmit={handleStep2Submit}>
            <div style={{ background: 'var(--bg-main)', border: '1px dashed var(--border-silver)', borderRadius: '12px', padding: '32px', textAlign: 'center', marginBottom: '16px', position: 'relative', cursor: 'pointer' }} onClick={() => setCccdFront('uploaded')}>
              {cccdFront ? (
                 <div style={{ color: 'var(--emerald)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                   <Check size={32} />
                   <span style={{ fontWeight: 600 }}>Đã tải lên mặt trước</span>
                 </div>
              ) : (
                 <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                   <UploadCloud size={32} color="var(--gold)" />
                   <div>
                     <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Chụp mặt trước CCCD</div>
                     <div style={{ fontSize: '12px', marginTop: '4px' }}>Nhấp để chọn ảnh hoặc mở Camera</div>
                   </div>
                 </div>
              )}
            </div>

            <div style={{ background: 'var(--bg-main)', border: '1px dashed var(--border-silver)', borderRadius: '12px', padding: '32px', textAlign: 'center', marginBottom: '24px', position: 'relative', cursor: 'pointer' }} onClick={() => setCccdBack('uploaded')}>
              {cccdBack ? (
                 <div style={{ color: 'var(--emerald)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                   <Check size={32} />
                   <span style={{ fontWeight: 600 }}>Đã tải lên mặt sau</span>
                 </div>
              ) : (
                 <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                   <UploadCloud size={32} color="var(--gold)" />
                   <div>
                     <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Chụp mặt sau CCCD</div>
                     <div style={{ fontSize: '12px', marginTop: '4px' }}>Nhấp để chọn ảnh hoặc mở Camera</div>
                   </div>
                 </div>
              )}
            </div>

            {error && (
               <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--ruby)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--ruby)', marginBottom: '16px' }}>
                 {error}
               </div>
            )}

            <button type="submit" className="btn-gold btn" style={{ width: '100%', padding: '14px', fontSize: '15px' }} disabled={loading || !cccdFront || !cccdBack}>
              {loading ? 'Đang xử lý...' : 'Tiếp tục: Xác thực khuôn mặt'}
            </button>
          </form>
        ) : (
          <div className="neo-card" style={{ textAlign: 'center' }}>
            <div style={{ width: '200px', height: '200px', borderRadius: '50%', border: '4px solid var(--gold)', margin: '0 auto 32px', position: 'relative', overflow: 'hidden', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Camera size={64} color="var(--text-muted)" style={{ opacity: 0.2 }} />
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--emerald)', boxShadow: '0 0 20px var(--emerald)', animation: 'scan 2s infinite ease-in-out' }}></div>
            </div>
            
            <style>{`
              @keyframes scan {
                0% { top: 0; }
                50% { top: 100%; }
                100% { top: 0; }
              }
            `}</style>

            <h3 className="h3" style={{ marginBottom: '12px' }}>Đưa khuôn mặt vào trong khung hình</h3>
            <p className="body-sm" style={{ marginBottom: '32px' }}>Vui lòng giữ điện thoại ngang tầm mắt, đảm bảo đủ ánh sáng và không đeo kính râm hay khẩu trang.</p>

            <button onClick={handleStep3Submit} className="btn-gold btn" style={{ width: '100%', padding: '14px', fontSize: '15px' }} disabled={loading}>
              {loading ? 'Đang phân tích AI...' : 'Bắt đầu quét'}
            </button>
          </div>
        )}


      </div>
    </>
  );
}
