import React, { useState } from 'react';
import useStore from '../store/useStore';
import { ShieldCheck, Mail, Phone, CreditCard, Clock, CheckCircle2, AlertCircle, Edit2, Save, X, Lock, Smartphone } from 'lucide-react';

export default function Profile() {
  const user = useStore((state) => state.currentUser);
  const updateProfile = useStore((state) => state.updateProfile);
  const updateKycStatus = useStore((state) => state.updateKycStatus);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    cccd: user.cccd || '',
  });

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });

  const handleSave = () => {
    updateProfile(editForm);
    setIsEditing(false);
    alert('Cập nhật thông tin thành công!');
  };

  const handleStartKyc = () => {
    updateKycStatus('pending');
    useStore.getState().submitKyc({ name: user.name, avatar: avatarLetter });
    alert('Hồ sơ của bạn đã được gửi đi. Vui lòng chờ Quản trị viên kiểm duyệt.');
  };

  const handleChangePassword = () => {
    setIsPasswordModalOpen(true);
  };

  const submitChangePassword = () => {
    if (!pwdForm.old || !pwdForm.new || !pwdForm.confirm) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      alert('Mật khẩu mới không khớp');
      return;
    }
    alert('Đổi mật khẩu thành công!');
    setIsPasswordModalOpen(false);
    setPwdForm({ old: '', new: '', confirm: '' });
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
                Thành viên GoldChain
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
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Địa chỉ Email</div>
                <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>{user.email || 'Chưa cập nhật'}</div>
              </div>
              <Lock size={16} color="var(--text-muted)" style={{ opacity: 0.5 }} />
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

            {user.kycStatus === 'unverified' && (
              <button className="btn btn-gold" onClick={handleStartKyc} style={{ marginTop: '24px', width: '100%', borderRadius: '99px', padding: '16px', fontSize: '15px', fontWeight: 700, boxShadow: '0 8px 16px rgba(212,175,55,0.2)' }}>
                Bắt đầu xác minh ngay
              </button>
            )}
            
            {user.kycStatus === 'rejected' && (
              <button className="btn" onClick={handleStartKyc} style={{ marginTop: '24px', width: '100%', borderRadius: '99px', padding: '16px', fontSize: '15px', fontWeight: 700, background: 'var(--ruby)', color: '#fff' }}>
                Gửi lại hồ sơ
              </button>
            )}
          </div>

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

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>Đổi mật khẩu</div>
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
