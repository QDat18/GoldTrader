import React, { useState } from 'react';
import useStore from '../store/useStore';
import { supabase } from '../supabaseClient';
import { ShieldCheck, Mail, Phone, CreditCard, Clock, CheckCircle2, AlertCircle, Edit2, Save, X, Lock, Smartphone, UploadCloud, Link as LinkIcon } from 'lucide-react';
import { ethers } from 'ethers';

export default function Profile() {
  const user = useStore((state) => state.currentUser);
  const updateProfile = useStore((state) => state.updateProfile);
  const updateKycStatus = useStore((state) => state.updateKycStatus);

  const [walletAddress, setWalletAddress] = useState(user.walletAddress || '');
  const [isConnecting, setIsConnecting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    cccd: user.cccd || '',
  });

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = () => {
    updateProfile(editForm);
    setIsEditing(false);
    showToast('Cập nhật thông tin thành công!', 'success');
  };

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      showToast('Vui lòng cài đặt ví MetaMask!', 'error');
      return;
    }
    
    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        // Cập nhật LocalStorage thay vì CSDL
        window.localStorage.setItem('meta_wallet', accounts[0]);
        updateProfile({ walletAddress: accounts[0] });
        showToast('Kết nối ví thành công!', 'success');
      }
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi kết nối ví MetaMask', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const [reUploadFront, setReUploadFront] = useState(null);
  const [reUploadBack, setReUploadBack] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleStartKyc = async () => {
    if (user.kycStatus === 'rejected' || user.kycStatus === 'unverified') {
      if (!reUploadFront || !reUploadBack) {
         showToast('Vui lòng tải lên đầy đủ 2 mặt CCCD', 'error');
         return;
      }
      setIsUploading(true);
      try {
        const isReupload = user.kycStatus === 'rejected';
        const frontName = `${user.id}_front_${isReupload ? 'reupload_' : ''}${Date.now()}.png`;
        const backName = `${user.id}_back_${isReupload ? 'reupload_' : ''}${Date.now()}.png`;
        
        const { error: fErr } = await supabase.storage.from('kyc-documents').upload(frontName, reUploadFront);
        if (fErr) throw fErr;
        
        const { error: bErr } = await supabase.storage.from('kyc-documents').upload(backName, reUploadBack);
        if (bErr) throw bErr;
        
        const { data: fData } = supabase.storage.from('kyc-documents').getPublicUrl(frontName);
        const { data: bData } = supabase.storage.from('kyc-documents').getPublicUrl(backName);

        const { error: dbErr } = await supabase
          .from('user_profiles')
          .update({
            kyc_status: 'PENDING',
            id_card_front_url: fData.publicUrl,
            id_card_back_url: bData.publicUrl,
            kyc_rejection_reason: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (dbErr) throw dbErr;

        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'system',
          title: isReupload ? 'Hồ sơ KYC đã được gửi lại' : 'Hồ sơ KYC đã được gửi',
          desc: isReupload 
            ? 'Bạn đã cập nhật và gửi lại hồ sơ eKYC. Vui lòng chờ quản trị viên phê duyệt.' 
            : 'Yêu cầu định danh điện tử của bạn đã được gửi thành công. Vui lòng chờ quản trị viên phê duyệt.',
          unread: true,
          date: new Date().toLocaleString('vi-VN')
        });

        updateKycStatus('pending');
        updateProfile({ kycRejectionReason: '' });
        showToast(
          isReupload 
            ? 'Hồ sơ của bạn đã được gửi lại. Vui lòng chờ Quản trị viên kiểm duyệt.' 
            : 'Hồ sơ của bạn đã được gửi. Vui lòng chờ Quản trị viên kiểm duyệt.', 
          'success'
        );
        
        setReUploadFront(null);
        setReUploadBack(null);
      } catch (err) {
        showToast('Lỗi tải lên: ' + err.message, 'error');
      } finally {
        setIsUploading(false);
      }
    } else {
      updateKycStatus('pending');
      showToast('Hồ sơ của bạn đã được gửi đi. Vui lòng chờ Quản trị viên kiểm duyệt.', 'success');
    }
  };

  const handleChangePassword = () => {
    setIsPasswordModalOpen(true);
  };

  const submitChangePassword = async () => {
    if (!pwdForm.old || !pwdForm.new || !pwdForm.confirm) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      showToast('Mật khẩu mới không khớp', 'error');
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: pwdForm.new
      });
      if (error) throw error;
      
      showToast('Đổi mật khẩu thành công!', 'success');
      setIsPasswordModalOpen(false);
      setPwdForm({ old: '', new: '', confirm: '' });
    } catch (err) {
      console.error("Lỗi khi thay đổi mật khẩu:", err);
      showToast('Lỗi đổi mật khẩu: ' + err.message, 'error');
    }
  };

  const getKycStatusConfig = (status) => {
    switch (status) {
      case 'verified':
        return { icon: <CheckCircle2 size={24} color="var(--emerald)" />, text: 'Đã xác minh (Level 3)', color: 'var(--emerald)', desc: 'Tài khoản của bạn đã được xác minh toàn diện. Bạn có thể giao dịch và rút vàng vật lý tự do.' };
      case 'rejected':
        return { icon: <AlertCircle size={24} color="var(--ruby)" />, text: 'Bị từ chối', color: 'var(--ruby)', desc: 'Hồ sơ KYC của bạn không hợp lệ. Vui lòng kiểm tra lại thông tin và ảnh chụp giấy tờ.' };
      case 'pending':
        return { icon: <Clock size={24} color="var(--gold)" />, text: 'Đang chờ duyệt (Level 2)', color: 'var(--gold)', desc: 'Hồ sơ của bạn đang được Quản trị viên kiểm tra. Quá trình này có thể mất từ 1-2 ngày làm việc.' };
      default:
        return { icon: <AlertCircle size={24} color="var(--text-muted)" />, text: 'Chưa xác minh (Level 1)', color: 'var(--text-muted)', desc: 'Bạn chỉ có thể xem giá vàng. Vui lòng hoàn tất KYC để có thể thực hiện giao dịch.' };
    }
  };

  const kycConfig = getKycStatusConfig(user.kycStatus);
  const avatarLetter = user.name ? user.name.split(' ').slice(-1)[0].charAt(0).toUpperCase() : 'G';

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1000px', margin: '0 auto', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <div className="h2">Hồ sơ cá nhân</div>
          <div className="body-sm" style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Quản lý thông tin định danh và bảo mật tài khoản</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Profile Info Card */}
        <div className="card" style={{ padding: '32px', borderRadius: '24px', background: 'linear-gradient(145deg, rgba(30,30,35,0.9) 0%, rgba(20,20,24,0.9) 100%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px' }}>
            <div style={{ 
              width: '90px', height: '90px', borderRadius: '50%', 
              background: 'var(--gold-gradient)', 
              boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: '#000', fontSize: '36px', fontWeight: 'bold' 
            }}>
              {avatarLetter}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{user.name || 'Khách hàng'}</div>
              <div style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>
                {user.role === 'admin' ? 'Quản trị viên hệ thống' : (user.role === 'user' ? 'Thành viên GoldChain' : 'Khách hàng (Guest)')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Email - Always Readonly */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} color="var(--text-muted)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBotto: '4px' }}>Địa chỉ Email</div>
                <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>{user.email || 'Chưa cập nhật'}</div>
              </div>
              <Lock size={16} color="var(--text-muted)" style={{ opacity: 0.5 }} />
            </div>

            {/* Web3 Wallet */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: walletAddress ? '1px solid var(--emerald)' : '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: walletAddress ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LinkIcon size={20} color={walletAddress ? "var(--emerald)" : "var(--text-muted)"} />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Ví Token Web3 (Nhận Vàng RWA)</div>
                {walletAddress ? (
                  <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--emerald)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{walletAddress.substring(0, 6)}...{walletAddress.slice(-4)}</div>
                ) : (
                  <button onClick={handleConnectWallet} disabled={isConnecting} className="btn" style={{ padding: '4px 12px', background: 'rgba(212,175,55,0.1)', color: 'var(--gold)', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                    {isConnecting ? 'Đang kết nối...' : '+ Kết Nối MetaMask'}
                  </button>
                )}
              </div>
            </div>

            {/* Name - Editable */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: isEditing ? 'rgba(212,175,55,0.05)' : 'rgba(0,0,0,0.2)', borderRadius: '16px', border: isEditing ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.03)', transition: 'all 0.3s' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: isEditing ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Edit2 size={20} color={isEditing ? 'var(--gold)' : 'var(--text-muted)'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Họ và tên</div>
                {isEditing ? (
                  <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="form-input" style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', height: 'auto', fontSize: '16px' }} />
                ) : (
                  <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>{user.name || 'Chưa cập nhật'}</div>
                )}
              </div>
            </div>

            {/* Phone - Editable */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: isEditing ? 'rgba(212,175,55,0.05)' : 'rgba(0,0,0,0.2)', borderRadius: '16px', border: isEditing ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.03)', transition: 'all 0.3s' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: isEditing ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={20} color={isEditing ? 'var(--gold)' : 'var(--text-muted)'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Số điện thoại</div>
                {isEditing ? (
                  <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="form-input" style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', height: 'auto', fontSize: '16px' }} />
                ) : (
                  <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>{user.phone || 'Chưa cập nhật'}</div>
                )}
              </div>
            </div>

            {/* CCCD - Always Readonly */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={20} color="var(--text-muted)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>CCCD / Hộ chiếu</div>
                <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>{user.cccd || 'Chưa cập nhật'}</div>
              </div>
              <Lock size={16} color="var(--text-muted)" style={{ opacity: 0.5 }} />
            </div>
          </div>
          
          <div style={{ marginTop: '40px' }}>
            {isEditing ? (
              <div style={{ display: 'flex', gap: '16px' }}>
                <button className="btn" onClick={() => setIsEditing(false)} style={{ flex: 1, borderRadius: '99px', padding: '16px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <X size={20} />
                  Hủy
                </button>
                <button className="btn btn-gold" onClick={handleSave} style={{ flex: 2, borderRadius: '99px', padding: '16px', fontSize: '15px', fontWeight: 700, display: 'flex', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(212,175,55,0.3)' }}>
                  <Save size={20} color="#000" />
                  Lưu thay đổi
                </button>
              </div>
            ) : (
              <button className="btn" onClick={() => { setEditForm({ name: user.name, phone: user.phone, cccd: user.cccd }); setIsEditing(true); }} style={{ width: '100%', borderRadius: '99px', padding: '16px', background: 'rgba(255,255,255,0.9)', color: '#000', fontSize: '15px', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <Edit2 size={20} />
                Chỉnh sửa thông tin
              </button>
            )}
          </div>
        </div>

        {/* Right Column: KYC and Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* KYC Status Card */}
          {user.role !== 'admin' && (
            <div className="card" style={{ padding: '32px', borderRadius: '24px', background: 'linear-gradient(145deg, rgba(30,30,30,0.8) 0%, rgba(15,15,15,0.8) 100%)', border: `1px solid ${kycConfig.color}40`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: kycConfig.color, filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <ShieldCheck size={28} color={kycConfig.color} />
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Định danh điện tử (eKYC)</div>
            </div>
            
            <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${kycConfig.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {kycConfig.icon}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: kycConfig.color }}>
                  {kycConfig.text}
                </div>
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
                {kycConfig.desc}
              </div>
            </div>

            {(user.kycStatus === 'unverified' || user.kycStatus === 'rejected') && (
              <div style={{ marginTop: '24px' }}>
                {user.kycStatus === 'rejected' && (
                  <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--ruby)', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', color: '#fff', lineHeight: '1.5' }}>
                    <span style={{ color: 'var(--ruby)', fontWeight: 600 }}>Lý do từ chối:</span><br/>
                    <span style={{ color: 'rgba(255,255,255,0.9)' }}>{user.kycRejectionReason || 'Vui lòng kiểm tra lại hình ảnh và thông tin.'}</span>
                  </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if(e.target.files && e.target.files[0]) setReUploadFront(e.target.files[0]); }} />
                    <UploadCloud size={24} color={reUploadFront ? 'var(--emerald)' : 'var(--text-muted)'} style={{ marginBottom: '12px' }} />
                    <div style={{ fontSize: '13px', color: reUploadFront ? 'var(--emerald)' : '#fff', fontWeight: 600, textAlign: 'center' }}>{reUploadFront ? 'Đã chọn ảnh trước' : 'Tải lên mặt trước'}</div>
                  </label>
                  
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if(e.target.files && e.target.files[0]) setReUploadBack(e.target.files[0]); }} />
                    <UploadCloud size={24} color={reUploadBack ? 'var(--emerald)' : 'var(--text-muted)'} style={{ marginBottom: '12px' }} />
                    <div style={{ fontSize: '13px', color: reUploadBack ? 'var(--emerald)' : '#fff', fontWeight: 600, textAlign: 'center' }}>{reUploadBack ? 'Đã chọn ảnh sau' : 'Tải lại mặt sau'}</div>
                  </label>
                </div>

                <button disabled={isUploading} className="btn btn-gold" onClick={handleStartKyc} style={{ width: '100%', borderRadius: '99px', padding: '16px', fontSize: '15px', fontWeight: 700, boxShadow: '0 8px 16px rgba(212,175,55,0.2)' }}>
                  {isUploading ? 'Đang gửi...' : (user.kycStatus === 'rejected' ? 'Gửi lại hồ sơ KYC' : 'Gửi yêu cầu xác minh')}
                </button>
              </div>
            )}
          </div>
          )}

          {/* Security Card */}
          <div className="card" style={{ padding: '32px', borderRadius: '24px', background: 'rgba(25,25,25,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>Bảo mật tài khoản</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Lock size={20} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Mật khẩu đăng nhập</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Bảo vệ tài khoản của bạn</div>
                </div>
              </div>
              <button className="btn" onClick={handleChangePassword} style={{ borderRadius: '99px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                Đổi mật khẩu
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Smartphone size={20} color={is2FAEnabled ? 'var(--emerald)' : 'var(--text-muted)'} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Xác thực 2 yếu tố (2FA)</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Dùng Google Authenticator</div>
                </div>
              </div>
              <button 
                className="btn" 
                onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                style={{ 
                  borderRadius: '99px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, 
                  background: is2FAEnabled ? 'rgba(16, 185, 129, 0.1)' : 'transparent', 
                  color: is2FAEnabled ? 'var(--emerald)' : 'var(--gold)', 
                  border: is2FAEnabled ? '1px solid var(--emerald)' : '1px solid var(--gold)' 
                }}
              >
                {is2FAEnabled ? 'Đã bật' : 'Bật 2FA'}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '400px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div className="h3" style={{ margin: 0 }}>Đổi mật khẩu</div>
              <button onClick={() => setIsPasswordModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  value={pwdForm.old} 
                  onChange={e => setPwdForm({...pwdForm, old: e.target.value})}
                  className="form-input" 
                  placeholder="Nhập mật khẩu hiện tại"
                  style={{ background: 'rgba(0,0,0,0.2)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Mật khẩu mới</label>
                <input 
                  type="password" 
                  value={pwdForm.new} 
                  onChange={e => setPwdForm({...pwdForm, new: e.target.value})}
                  className="form-input" 
                  placeholder="Nhập mật khẩu mới"
                  style={{ background: 'rgba(0,0,0,0.2)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Xác nhận mật khẩu mới</label>
                <input 
                  type="password" 
                  value={pwdForm.confirm} 
                  onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})}
                  className="form-input" 
                  placeholder="Nhập lại mật khẩu mới"
                  style={{ background: 'rgba(0,0,0,0.2)' }}
                />
              </div>
            </div>
            
            <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setIsPasswordModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '99px', padding: '10px 20px' }}>
                Hủy
              </button>
              <button className="btn btn-gold" onClick={submitChangePassword} style={{ borderRadius: '99px', padding: '10px 20px', fontWeight: 600 }}>
                Xác nhận đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
