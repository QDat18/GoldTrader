import React, { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import { supabase } from '../../supabaseClient';
import { ShieldAlert, XCircle } from 'lucide-react';

export default function AdminKyc() {
  const dbKycList = useStore(state => state.adminKycList);
  const fetchAdminKycList = useStore(state => state.fetchAdminKycList);
  
  const [kycPage, setKycPage] = useState(0);
  const [hasMoreKyc, setHasMoreKyc] = useState(false); // all elements loaded instantly via global list
  const [isFetchingKyc, setIsFetchingKyc] = useState(false);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, id: null, reason: '' });
  const [previewKycModal, setPreviewKycModal] = useState({ isOpen: false, frontUrl: '', backUrl: '', name: '' });
  const [toast, setToast] = useState(null);
  const [viewedKycIds, setViewedKycIds] = useState([]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };



  const handleScrollKyc = (e) => {
    // Scroll disabled, since whole list loads instantly
  };

  const handleApproveKyc = async (id) => {
    // Kiểm tra xem admin đã mở ảnh CCCD của khách hàng này chưa
    const targetUser = dbKycList.find(item => item.id === id);
    const hasImages = targetUser && (targetUser.id_card_front_url || targetUser.id_card_back_url);
    if (hasImages && !viewedKycIds.includes(id)) {
      showToast('Bạn phải xem hình ảnh CCCD trước khi duyệt eKYC!', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          kyc_status: 'VERIFIED',
          kyc_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role: 'user'
        })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: id,
        type: 'system',
        title: 'Xác thực tài khoản thành công',
        desc: 'Hồ sơ KYC của bạn đã được duyệt. Tài khoản hiện đã có tick xanh (Verified).',
        unread: true,
        date: new Date().toLocaleString('vi-VN')
      });

      showToast('Đã duyệt hồ sơ eKYC thành công!', 'success');

      // Đồng bộ local store cho user đang đăng nhập nếu chính họ được duyệt
      const storeState = useStore.getState();
      if (storeState.currentUser && storeState.currentUser.id === id) {
        storeState.updateKycStatus('verified');
      }


    } catch (err) {
      console.error('Lỗi phê duyệt eKYC:', err);
      showToast('Lỗi phê duyệt: ' + err.message, 'error');
    }
  };

  const handleRejectKycClick = (id) => {
    setRejectModal({ isOpen: true, id, reason: '' });
  };

  const submitRejectKyc = async () => {
    if (!rejectModal.id) return;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          kyc_status: 'REJECTED',
          kyc_rejection_reason: rejectModal.reason || 'Hình ảnh không hợp lệ hoặc sai thông tin.',
          updated_at: new Date().toISOString()
        })
        .eq('id', rejectModal.id);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: rejectModal.id,
        type: 'system',
        title: 'Từ chối xác thực tài khoản',
        desc: `Hồ sơ KYC của bạn bị từ chối. Lý do: ${rejectModal.reason || 'Hình ảnh không hợp lệ hoặc sai thông tin.'} Vui lòng cập nhật lại.`,
        unread: true,
        date: new Date().toLocaleString('vi-VN')
      });

      showToast('Đã từ chối hồ sơ eKYC.', 'error');

      const storeState = useStore.getState();
      if (storeState.currentUser && storeState.currentUser.id === rejectModal.id) {
        storeState.updateKycStatus('rejected');
      }

      setRejectModal({ isOpen: false, id: null, reason: '' });
      fetchAdminKycList();
    } catch (err) {
      console.error('Lỗi từ chối eKYC:', err);
      showToast('Lỗi từ chối eKYC: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    // Lắng nghe realtime từ bảng user_profiles
    const kycSubscription = supabase
      .channel('admin-kyc-changes-sub')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        (payload) => {
          console.log('Realtime KYC update received in split page!', payload);
          fetchAdminKycList();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kycSubscription);
    };
  }, []);

  return (
    <>
      <div className="neo-card" style={{ padding: '0', overflow: 'hidden' }}>
        
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
          <div className="h3" style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="var(--gold)" /> Danh sách KYC chờ duyệt
          </div>

        </div>
        <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }} onScroll={handleScrollKyc}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Khách hàng</th>
                <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Thời gian gửi</th>
                <th style={{ padding: '12px 18px', color: 'var(--text-muted)', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dbKycList.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có hồ sơ eKYC nào đang chờ duyệt.</td>
                </tr>
              ) : (
                dbKycList.map(item => {
                  const nameInitials = item.full_name ? item.full_name.trim().split(/\s+/).filter(Boolean).slice(-2).map(p => p[0]).join('').toUpperCase() : 'US';
                  const hasImages = !!(item.id_card_front_url || item.id_card_back_url);
                  const isViewed = viewedKycIds.includes(item.id);
                  const approveDisabled = hasImages && !isViewed;

                  return (
                    <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '13px' }}>
                            {nameInitials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{item.full_name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              CCCD: <span style={{ color: '#fff' }}>{item.id_card_number}</span> | SĐT: {item.phone || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 18px', color: 'var(--text-muted)' }}>
                        {new Date(item.updated_at).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          {hasImages ? (
                            <button 
                              onClick={() => {
                                setPreviewKycModal({ isOpen: true, frontUrl: item.id_card_front_url, backUrl: item.id_card_back_url, name: item.full_name });
                                if (!viewedKycIds.includes(item.id)) {
                                  setViewedKycIds(prev => [...prev, item.id]);
                                }
                              }} 
                              style={{ 
                                borderColor: 'var(--gold)', 
                                color: 'var(--gold)', 
                                background: 'rgba(212,175,55,0.1)', 
                                border: '1px solid rgba(212,175,55,0.2)',
                                padding: '8px 16px', 
                                fontSize: '13px', 
                                borderRadius: '99px', 
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              Xem CCCD
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '8px' }}>Chưa tải ảnh</span>
                          )}
                          <button 
                            onClick={() => handleApproveKyc(item.id)} 
                            disabled={approveDisabled}
                            className="btn" 
                            style={{ 
                              borderColor: approveDisabled ? 'rgba(255,255,255,0.1)' : 'var(--emerald)', 
                              color: approveDisabled ? 'var(--text-muted)' : 'var(--emerald)', 
                              background: approveDisabled ? 'rgba(255,255,255,0.02)' : 'rgba(16, 185, 129, 0.1)', 
                              padding: '8px 16px', 
                              fontSize: '13px', 
                              borderRadius: '99px', 
                              fontWeight: 600,
                              cursor: approveDisabled ? 'not-allowed' : 'pointer',
                              opacity: approveDisabled ? 0.5 : 1
                            }}
                          >
                            Duyệt
                          </button>
                          <button onClick={() => handleRejectKycClick(item.id)} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '99px', fontWeight: 600 }}>Từ chối</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {hasMoreKyc && dbKycList.length > 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Cuộn xuống để tải thêm...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 10000,
          background: toast.type === 'success' ? 'var(--emerald)' : 'var(--ruby)',
          color: '#fff', padding: '16px 24px', borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)', fontWeight: 600, fontSize: '14px',
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: '100%', maxWidth: '420px', padding: '32px', borderRadius: '24px', position: 'relative', border: '1px solid rgba(255,255,255,0.08)', background: '#1a1a1a', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setRejectModal({ isOpen: false, id: null, reason: '' })} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <XCircle size={24} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={24} color="var(--ruby)" />
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#fff', letterSpacing: '-0.5px' }}>Từ chối KYC</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Hồ sơ này sẽ bị trả lại cho khách hàng</div>
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#fff', marginBottom: '10px', fontWeight: 500 }}>Lý do từ chối (Bắt buộc)</label>
              <textarea
                rows={4}
                placeholder="Ví dụ: Ảnh chụp bị lóa, không rõ mặt, hoặc sai số CCCD..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                style={{ width: '100%', resize: 'none', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '16px', borderRadius: '12px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setRejectModal({ isOpen: false, id: null, reason: '' })} style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>Hủy bỏ</button>
              <button onClick={submitRejectKyc} disabled={!rejectModal.reason.trim()} style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, background: 'var(--ruby)', color: '#fff', border: 'none', cursor: !rejectModal.reason.trim() ? 'not-allowed' : 'pointer', opacity: !rejectModal.reason.trim() ? 0.5 : 1, transition: 'all 0.2s' }}>Xác nhận từ chối</button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Image Preview Modal */}
      {previewKycModal.isOpen && (
        <div 
          onClick={() => setPreviewKycModal({ isOpen: false, frontUrl: '', backUrl: '', name: '' })}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px', cursor: 'pointer' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ width: '100%', maxWidth: '1000px', background: 'rgba(30,30,30,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', cursor: 'default' }}
          >
            <button 
              onClick={() => setPreviewKycModal({ isOpen: false, frontUrl: '', backUrl: '', name: '' })} 
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            >
              <XCircle size={24} />
            </button>

            <div className="h2" style={{ color: '#fff', marginBottom: '24px', textAlign: 'center', letterSpacing: '-0.5px' }}>Hồ sơ CCCD: {previewKycModal.name}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.05em', fontSize: '13px' }}>MẶT TRƯỚC</div>
                {previewKycModal.frontUrl ? (
                  <img src={previewKycModal.frontUrl} alt="Mặt trước" style={{ width: '100%', height: 'auto', maxHeight: '50vh', objectFit: 'contain', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }} />
                ) : (
                  <div style={{ width: '100%', height: '300px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.1)' }}>Không có ảnh</div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.05em', fontSize: '13px' }}>MẶT SAU</div>
                {previewKycModal.backUrl ? (
                  <img src={previewKycModal.backUrl} alt="Mặt sau" style={{ width: '100%', height: 'auto', maxHeight: '50vh', objectFit: 'contain', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }} />
                ) : (
                  <div style={{ width: '100%', height: '300px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.1)' }}>Không có ảnh</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
