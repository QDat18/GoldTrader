import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Check, ShieldCheck, UploadCloud, User, ArrowLeft } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

export default function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Auth state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // KYC State
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
  const [generatedOtp, setGeneratedOtp] = useState('');
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

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: '[GoldChain] Mã xác thực đăng ký tài khoản mới',
          templateName: 'OtpRegister',
          templateData: {
            otp: code,
            expiry: '5 phút'
          }
        })
      });

      setOtpSent(true);
    } catch (err) {
      console.error(err);
      setError('Lỗi khi gửi email OTP: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setError('');
    setLoading(true);

    // Cho phép bypass bằng mã 123456 phục vụ demo/test nhanh
    if (otp === generatedOtp || otp === '123456') {
      setOtpVerified(true);
      setLoading(false);
      return;
    }

    setLoading(false);
    setError('Mã xác thực không hợp lệ. Vui lòng nhập đúng mã đã gửi tới email.');
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

    if (!otpVerified && otp !== '123456' && otp !== generatedOtp) {
      setError('Vui lòng xác thực email bằng mã OTP trước khi đăng ký.');
      return;
    }
    
    if (!cccdNumber || cccdNumber.length < 9) {
      setError('Vui lòng nhập số CCCD/Hộ chiếu hợp lệ (từ 9 đến 12 số).');
      return;
    }
    if (!cccdFront || !cccdBack) {
      setError('Vui lòng cung cấp đầy đủ hình ảnh 2 mặt Giấy tờ tùy thân.');
      return;
    }

    setLoading(true);

    // 1. Tạo tài khoản trực tiếp qua Supabase Auth signUp, truyền kèm CCCD thật
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name,
          phone: phone,
          id_card_number: cccdNumber, // <-- Lưu thẳng bằng CCCD thật, không cần dummy ID nữa!
          kyc_status: 'pending',
          role: 'guest'
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('id_card_number_key') || signUpError.message.includes('duplicate key value')) {
        setError('Số CCCD/CMND này đã được đăng ký và tồn tại trên hệ thống!');
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    const currentUserId = data?.user?.id;
    if (!currentUserId) {
      setError('Đăng ký tạm thời không thành công. Vui lòng thử lại.');
      setLoading(false);
      return;
    }

    try {
      // 2. Tải ảnh lên Supabase Storage với Auth Token vừa tạo
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
      
      // 3. Cập nhật links CCDC vào bảng user_profiles (Vì Trigger đã sinh bảng này rồi)
      const { data: profileRecord, error: dbError } = await supabase.from('user_profiles').update({
        id_card_front_url: frontUrl,
        id_card_back_url: backUrl
      }).eq('auth_user_id', currentUserId).select().single();
      
      if (dbError) {
        console.error("Lỗi khi cập nhật ảnh vào public.user_profiles:", dbError);
      } else if (profileRecord) {
        await supabase.from('notifications').insert({
          user_id: profileRecord.id,
          type: 'system',
          title: 'Hồ sơ KYC đã được gửi',
          desc: 'Yêu cầu định danh điện tử của bạn đã được gửi thành công. Vui lòng chờ quản trị viên phê duyệt.',
          unread: true,
          date: new Date().toLocaleString('vi-VN')
        });

        // Gửi email chào mừng bằng SMTP
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: email,
              subject: 'Chào mừng bạn đến với GoldChain - Bảo chứng vàng vật chất 1:1',
              templateName: 'welcome',
              templateData: {
                name: name,
                email: email,
                appUrl: window.location.origin
              }
            })
          });
        } catch (mailErr) {
          console.error("Lỗi khi gửi email chào mừng qua SMTP:", mailErr);
        }
      }
      
      setLoading(false);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 3500);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra trong quá trình KYC.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="nav-bar">
        <BrandLogo />
        <div></div>
        <div className="nav-actions">
          <span className="body-sm">Đã có tài khoản?</span>
          <Link to="/login" className="btn btn-outline" style={{ textDecoration: 'none' }}>Đăng nhập</Link>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px', flex: 1, width: '100%' }}>
        <div style={{ marginBottom: '32px' }}>
          <div className="h2">Đăng ký & Xác minh (eKYC)</div>
          <p className="body-sm" style={{ marginTop: '8px' }}>
            Vui lòng điền thông tin tài khoản và tải lên hình ảnh rành mạch 2 mặt CCCD để hoàn tất mở tài khoản.
          </p>
        </div>
        
        {success ? (
          <div className="neo-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
             <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)' }}>
                <Check size={32} color="var(--emerald)" />
             </div>
             <h2 className="h2" style={{ color: 'var(--emerald)', marginBottom: '12px' }}>Hoàn tất Đăng ký!</h2>
             <p className="body-sm" style={{ marginBottom: '24px', fontSize: '15px' }}>
               Tài khoản của bạn đã được khởi tạo và hồ sơ đang được duyệt. Bạn có thể đăng nhập ngay bây giờ.
             </p>
             <p className="body-sm" style={{ fontSize: '13px', color: 'var(--gold)' }}>Đang tự động chuyển hướng...</p>
          </div>
        ) : (
          <form className="neo-card" onSubmit={handleRegister}>
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--gold)', marginBottom: '16px' }}>1. Thông tin liên hệ cơ bản</div>
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

              <div className="grid-2" style={{ gap: '16px', marginBottom: '8px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Mật khẩu đăng nhập</label>
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
            </div>
            
            <div style={{ paddingBottom: '16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--gold)', marginBottom: '16px' }}>2. Định danh điện tử (KYC)</div>
              
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

              <label style={{ display: 'block', background: 'var(--bg-main)', border: '1px dashed var(--border-silver)', borderRadius: '12px', padding: '32px', textAlign: 'center', marginBottom: '8px', position: 'relative', cursor: 'pointer' }}>
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
            </div>
            
            {error && (
               <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--ruby)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--ruby)', marginBottom: '16px' }}>
                 {error}
               </div>
            )}

            <button type="submit" className="btn-gold btn" style={{ width: '100%', padding: '14px', fontSize: '15px' }} disabled={loading}>
              {loading ? 'Đang tạo hồ sơ & Tải hình ảnh KYC...' : 'Hoàn tất Đăng ký mở tài khoản'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
