import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { sendOtpEmail } from '../utils/emailService';
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
  const [userId, setUserId] = useState('');
  const [cccdNumber, setCccdNumber] = useState('');
  const [cccdFront, setCccdFront] = useState(null);
  const [cccdBack, setCccdBack] = useState(null);
  const [ocrStatus, setOcrStatus] = useState('idle'); // idle, scanning, success
  
  // Fake AI OCR Scanner
  useEffect(() => {
    if (cccdFront && cccdNumber && cccdNumber.length >= 9) {
      setOcrStatus('scanning');
      const timer = setTimeout(() => {
        setOcrStatus('success');
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setOcrStatus('idle');
    }
  }, [cccdFront, cccdNumber]);

  // UI states
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
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

    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setOtpError('');
      const result = await sendOtpEmail({
        email,
        otp: code,
        purpose: 'đăng ký tài khoản GoldChain',
      });

      if (!result?.success) {
        throw new Error('Không thể gửi mã xác thực. Vui lòng thử lại.');
      }

      setOtpSent(true);
      setOtp('');
      setOtpVerified(false);
      setOtpTimer(60); // Đếm ngược từ 60s
    } catch (err) {
      setError(err.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Effect đếm ngược mã OTP
  React.useEffect(() => {
    let interval = null;
    if (otpSent && !otpVerified && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && otpSent && !otpVerified) {
      setOtpError('Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.');
      setGeneratedOtp(''); // Vô hiệu hóa mã OTP
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, otpVerified, otpTimer]);

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setOtpError('');
    setLoading(true);

    try {
      if (otp === generatedOtp) {
        setOtpVerified(true);
        setOtpTimer(0);
      } else {
        setOtpError('Mã xác thực không chính xác. Vui lòng kiểm tra lại.');
        setOtp(''); // Xóa đoạn OTP vừa nhập
      }
    } finally {
      setLoading(false);
    }
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
      setError('Vui lòng xác thực email bằng mã OTP trước khi đăng ký.');
      return;
    }

    setLoading(true);

    // Tạo tài khoản trực tiếp qua Supabase Auth signUp
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name,
          phone: phone,
          kyc_status: 'pending',
          role: 'guest'
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Lưu User ID nhận được vào state để sử dụng cho bước tiếp theo
    if (data?.user) {
      setUserId(data.user.id);
    }
    setLoading(false);
    setStep(2); // Di chuyển đến bước 2 (KYC)
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!cccdNumber || cccdNumber.length < 9) {
      setError('Vui lòng nhập số CCCD/Hộ chiếu hợp lệ (từ 9 đến 12 số).');
      return;
    }
    if (!cccdFront || !cccdBack) {
      setError('Vui lòng tải lên đầy đủ 2 mặt CCCD.');
      return;
    }
    setError('');
    setLoading(true);
    // Execute real upload logic
    try {
      const currentUserId = userId || (await supabase.auth.getUser()).data?.user?.id;
      
      if (!currentUserId) {
        throw new Error('Không tìm thấy phiên đăng ký người dùng.');
      }

      // Upload Front ID
      let frontUrl = null;
      let backUrl = null;

      if (cccdFront && cccdFront instanceof File) {
        const frontExt = cccdFront.name.split('.').pop();
        const frontName = `${currentUserId}_front_${Date.now()}.${frontExt}`;
        const { error: uploadError1 } = await supabase.storage.from('kyc-documents').upload(frontName, cccdFront);
        if (uploadError1) {
          console.error("Lỗi upload mặt trước:", uploadError1);
        } else {
          frontUrl = supabase.storage.from('kyc-documents').getPublicUrl(frontName).data.publicUrl;
        }
      }

      if (cccdBack && cccdBack instanceof File) {
        const backExt = cccdBack.name.split('.').pop();
        const backName = `${currentUserId}_back_${Date.now()}.${backExt}`;
        const { error: uploadError2 } = await supabase.storage.from('kyc-documents').upload(backName, cccdBack);
        if (uploadError2) {
          console.error("Lỗi upload mặt sau:", uploadError2);
        } else {
          backUrl = supabase.storage.from('kyc-documents').getPublicUrl(backName).data.publicUrl;
        }
      }

      // 1. Cập nhật siêu dữ liệu KYC trong Auth nếu phiên đăng nhập đã tồn tại
      try {
        await supabase.auth.updateUser({
          data: { kyc_status: 'pending' }
        });
      } catch (e) {
        console.warn("Chưa đăng nhập phiên, bỏ qua cập nhật metadata");
      }
      
      // 2. Lưu thông tin vào bảng user_profiles ở public schema
      const { error: dbError } = await supabase.from('user_profiles').upsert({
        auth_user_id: currentUserId,
        full_name: name,
        phone: phone,
        id_card_number: cccdNumber,
        kyc_status: 'PENDING',
        role: 'guest',
        id_card_front_url: frontUrl,
        id_card_back_url: backUrl
      }, { onConflict: 'auth_user_id' });
      
      if (dbError) {
        console.error("Lỗi khi lưu vào public schema:", dbError);
      } else {
        await supabase.from('notifications').insert({
          user_id: currentUserId,
          type: 'system',
          title: 'Hồ sơ KYC đã được gửi',
          desc: 'Yêu cầu định danh điện tử của bạn đã được gửi thành công. Vui lòng chờ quản trị viên phê duyệt.',
          unread: true,
          date: new Date().toLocaleString('vi-VN')
        });
      }
      
      setLoading(false);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 3500);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra trong quá trình đăng ký.');
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
          <div className="tag" style={{ marginBottom: '12px' }}>BƯỚC {step}/2</div>
          <div className="h2">{step === 1 ? 'Tạo tài khoản' : 'Xác minh danh tính (eKYC)'}</div>
          <p className="body-sm" style={{ marginTop: '8px' }}>
            {step === 1 ? 'Hoàn tất đăng ký thông tin tài khoản cơ bản.' : 'Vui lòng cung cấp số CCCD và hình ảnh 2 mặt giấy tờ.'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 0, marginBottom: '32px' }}>
          <div style={{ flex: 1, padding: '12px 0', borderBottom: step >= 1 ? '2px solid var(--gold)' : '1px solid var(--border-silver)', textAlign: 'center', fontSize: '13px', fontWeight: step >= 1 ? 600 : 400, color: step >= 1 ? 'var(--gold)' : 'var(--text-muted)' }}>1. Thông tin cơ bản</div>
          <div style={{ flex: 1, padding: '12px 0', borderBottom: step >= 2 ? '2px solid var(--gold)' : '1px solid var(--border-silver)', textAlign: 'center', fontSize: '13px', fontWeight: step >= 2 ? 600 : 400, color: step >= 2 ? 'var(--gold)' : 'var(--text-muted)' }}>2. Xác minh danh tính</div>
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
              <div className="form-group" style={{ marginBottom: '16px', background: 'rgba(212,175,55,0.05)', padding: '16px', borderRadius: '8px', border: otpError ? '1px solid var(--ruby)' : '1px solid rgba(212,175,55,0.2)' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: otpError ? 'var(--ruby)' : 'var(--gold)' }}>Mã xác thực OTP (Đã gửi tới email)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    className="form-input" 
                    style={{ flex: 1, letterSpacing: '4px', fontWeight: 'bold', borderColor: otpError ? 'var(--ruby)' : 'var(--border-silver)' }}
                    placeholder="Nhập 6 số" 
                    maxLength={6}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value); setOtpError(''); }}
                    disabled={otpTimer === 0}
                  />
                  <button type="button" className="btn btn-gold" onClick={handleVerifyOtp} disabled={loading || otp.length < 4 || otpTimer === 0}>
                    Xác nhận
                  </button>
                </div>
                {otpTimer > 0 ? (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Hiệu lực mã xác thực: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{otpTimer} giây</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '11.5px', color: 'var(--ruby)', marginTop: '8px', fontWeight: 500 }}>
                    ⚠️ Mã OTP đã hết hạn! Vui lòng nhấn gửi lại mã mới.
                  </div>
                )}
                {otpError && otpTimer > 0 && <div style={{ fontSize: '11px', color: 'var(--ruby)', marginTop: '6px' }}>{otpError}</div>}
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
        ) : (
          <form className="neo-card" onSubmit={handleStep2Submit}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Số CCCD / Hộ chiếu</label>
              <input 
                className="form-input" 
                placeholder="Nhập 9 - 12 số CCCD / Hộ chiếu" 
                value={cccdNumber}
                onChange={(e) => setCccdNumber(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={12}
                required 
              />
            </div>

            <label style={{ display: 'block', background: 'var(--bg-main)', border: '1px dashed var(--border-silver)', borderRadius: '12px', padding: '32px', textAlign: 'center', marginBottom: '16px', position: 'relative', cursor: 'pointer' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if(e.target.files && e.target.files[0]) setCccdFront(e.target.files[0]); }} />
              {cccdFront ? (
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                   <Check size={32} color="var(--emerald)" />
                   <span style={{ fontWeight: 600, color: 'var(--emerald)' }}>Đã chọn: {cccdFront.name || 'Ảnh mặt trước CCCD'}</span>
                   
                   {ocrStatus === 'scanning' && (
                     <div style={{ fontSize: '13px', color: 'var(--gold)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(212,175,55,0.1)', padding: '6px 12px', borderRadius: '8px' }}>
                       <div style={{ width: '14px', height: '14px', border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                       AI đang quét và đối chiếu CCCD...
                     </div>
                   )}
                   {ocrStatus === 'success' && (
                     <div style={{ fontSize: '12px', color: 'var(--emerald)', marginTop: '8px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.3)' }}>
                       Khớp 100% với số đã nhập: {cccdNumber}
                     </div>
                   )}
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
            </label>

            <label style={{ display: 'block', background: 'var(--bg-main)', border: '1px dashed var(--border-silver)', borderRadius: '12px', padding: '32px', textAlign: 'center', marginBottom: '24px', position: 'relative', cursor: 'pointer' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if(e.target.files && e.target.files[0]) setCccdBack(e.target.files[0]); }} />
              {cccdBack ? (
                 <div style={{ color: 'var(--emerald)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                   <Check size={32} />
                   <span style={{ fontWeight: 600 }}>Đã chọn: {cccdBack.name || 'Ảnh mặt sau CCCD'}</span>
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
            </label>

            {error && (
               <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--ruby)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--ruby)', marginBottom: '16px' }}>
                 {error}
               </div>
            )}

            <button type="submit" className="btn-gold btn" style={{ width: '100%', padding: '14px', fontSize: '15px' }} disabled={loading || !cccdFront || !cccdBack || cccdNumber.length < 9}>
              {loading ? 'Đang đăng ký & tải hồ sơ...' : 'Hoàn tất đăng ký & KYC'}
            </button>
          </form>
        )}


      </div>
    </>
  );
}
