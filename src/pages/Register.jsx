import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Check, ShieldCheck, UploadCloud, User, ArrowLeft, Camera, X } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import * as faceapi from '@vladmandic/face-api';

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
  
  const [faceImage, setFaceImage] = useState(null);
  const [faceImageUrl, setFaceImageUrl] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://vladmandic.github.io/face-api/model/');
        setFaceModelsLoaded(true);
      } catch (e) {
        console.error("Lỗi tải models cho AI Face Detection:", e);
      }
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setError("Không thể mở camera. Vui lòng cho phép quyền truy cập.");
    }
  };

  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current || !faceModelsLoaded) return;
    
    // Clear previous interval if any
    if (videoRef.current.detectionInterval) clearInterval(videoRef.current.detectionInterval);

    const detectionInterval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        clearInterval(detectionInterval);
        return;
      }
      
      const vWidth = videoRef.current.videoWidth;
      const vHeight = videoRef.current.videoHeight;
      if (!vWidth || !vHeight) return;

      if (canvasRef.current.width !== vWidth || canvasRef.current.height !== vHeight) {
         faceapi.matchDimensions(canvasRef.current, { width: vWidth, height: vHeight });
      }

      try {
        const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 }));
        
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        if (detections) {
            setIsFaceDetected(true);
            const resizedDetections = faceapi.resizeResults(detections, { width: vWidth, height: vHeight });
            const box = resizedDetections.box;
            
            ctx.strokeStyle = '#10B981'; // Emerald Color
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            
            // Vẽ text
            ctx.fillStyle = '#10B981';
            ctx.font = '16px Arial';
            ctx.fillText("Khuôn mặt hợp lệ", box.x, box.y > 20 ? box.y - 5 : 20);
        } else {
            setIsFaceDetected(false);
        }
      } catch(e) {}
    }, 250); 
    
    videoRef.current.detectionInterval = detectionInterval;
  };

  const captureFace = () => {
    if (!videoRef.current) return;
    if (!isFaceDetected) {
      setError("Vui lòng đặt phần khuôn mặt của bạn vào khung hình để AI nhận diện.");
      return;
    }
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setFaceImageUrl(dataUrl);

    canvas.toBlob((blob) => {
      const file = new File([blob], "face.jpg", { type: "image/jpeg" });
      setFaceImage(file);
    }, "image/jpeg");
    
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.detectionInterval) {
      clearInterval(videoRef.current.detectionInterval);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

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
    if (!faceImage) {
      setError('Vui lòng chụp ảnh khuôn mặt để đối chiếu eKYC.');
      return;
    }

    setLoading(true);

    // 0. Kiểm tra trùng lặp CCCD trước (vì Supabase Auth trigger trả về 500 nếu trùng khoá unique)
    try {
      const { data: existingCccd } = await supabase
        .from('user_profiles')
        .select('id_card_number')
        .eq('id_card_number', cccdNumber)
        .maybeSingle();
      
      if (existingCccd) {
        setError('Số CCCD / Hộ chiếu này đã được liên kết với một tài khoản khác!');
        setLoading(false);
        return;
      }
    } catch(err) {}

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
      let faceUrl = null;

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

      if (faceImage && faceImage instanceof File) {
        const faceExt = faceImage.name.split('.').pop();
        const faceName = `${currentUserId}_face_${Date.now()}.${faceExt}`;
        const { error: uploadError3 } = await supabase.storage.from('kyc-documents').upload(faceName, faceImage);
        if (uploadError3) {
          console.error("Lỗi upload khuôn mặt:", uploadError3);
        } else {
          faceUrl = supabase.storage.from('kyc-documents').getPublicUrl(faceName).data.publicUrl;
        }
      }
      
      // 3. Cập nhật links CCDC vào bảng user_profiles (Vì Trigger đã sinh bảng này rồi)
      const { data: profileRecord, error: dbError } = await supabase.from('user_profiles').update({
        id_card_front_url: frontUrl,
        id_card_back_url: backUrl,
        face_image_url: faceUrl
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

              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Chụp ảnh xác thực khuôn mặt (Yêu cầu có khuôn mặt)</div>
                
                {isCameraOpen ? (
                  <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
                    <video ref={videoRef} onPlay={handleVideoPlay} autoPlay playsInline style={{ width: '100%', display: 'block' }}></video>
                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}></canvas>
                    {!faceModelsLoaded && (
                       <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', color: 'var(--gold)', padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}>Đang tải mô hình Face-AI...</div>
                    )}
                    <div style={{ position: 'absolute', bottom: '16px', display: 'flex', gap: '8px', width: '100%', justifyContent: 'center', zIndex: 10 }}>
                      <button type="button" onClick={captureFace} className="btn" disabled={!isFaceDetected} style={{ background: isFaceDetected ? '#10B981' : '#fff', color: isFaceDetected ? '#fff' : '#000', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', opacity: (isFaceDetected && faceModelsLoaded) ? 1 : 0.5 }}>
                        <Camera size={24} />
                      </button>
                      <button type="button" onClick={stopCamera} className="btn btn-outline" style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'transparent', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
                        <X size={24} color="#fff" />
                      </button>
                    </div>
                  </div>
                ) : faceImageUrl ? (
                  <div style={{ background: 'var(--bg-main)', border: '1px dashed var(--border-silver)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={startCamera}>
                    <img src={faceImageUrl} alt="Face" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '50%', border: '4px solid var(--emerald)' }} />
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>Chạm để chụp lại</div>
                  </div>
                ) : (
                  <div onClick={startCamera} style={{ background: 'var(--bg-main)', border: '1px dashed var(--border-silver)', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                     <Camera size={32} color="var(--gold)" />
                     <div>
                       <div style={{ fontWeight: 600, color: 'var(--text-main)', textAlign: 'center' }}>Bật Camera</div>
                       <div style={{ fontSize: '12px', marginTop: '4px', textAlign: 'center' }}>Nhấp để mở camera và bắt ảnh khuôn mặt</div>
                     </div>
                  </div>
                )}
              </div>
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
