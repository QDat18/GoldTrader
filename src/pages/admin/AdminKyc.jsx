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
  const [selectedKycId, setSelectedKycId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };



  const handleScrollKyc = (e) => {
    // Scroll disabled, since whole list loads instantly
  };

  const handleApproveKyc = async (id) => {
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

  const handleRejectClick = (id) => {
    setRejectId(id);
    setRejectReason('');
  };

  const submitRejectKyc = async () => {
    if (!rejectId) return;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          kyc_status: 'REJECTED',
          kyc_rejection_reason: rejectReason || 'Hình ảnh không hợp lệ hoặc sai thông tin.',
          updated_at: new Date().toISOString()
        })
        .eq('id', rejectId);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: rejectId,
        type: 'system',
        title: 'Từ chối xác thực tài khoản',
        desc: `Hồ sơ KYC của bạn bị từ chối. Lý do: ${rejectReason || 'Hình ảnh không hợp lệ hoặc sai thông tin.'} Vui lòng cập nhật lại.`,
        unread: true,
        date: new Date().toLocaleString('vi-VN')
      });

      showToast('Đã từ chối hồ sơ eKYC.', 'error');

      const storeState = useStore.getState();
      if (storeState.currentUser && storeState.currentUser.id === rejectId) {
        storeState.updateKycStatus('rejected');
      }

      setRejectId(null);
      setRejectReason('');
      if (selectedKycId === rejectId) {
        setSelectedKycId(null);
      }
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
  }, [fetchAdminKycList]);

  return (
    <>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '24px', height: 'calc(100vh - 120px)' }}>

              {/* CỘT TRÁI - DANH SÁCH KYC */}
              <div className="neo-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={20} color="var(--gold)" />
                  <div className="h3" style={{ fontSize: '18px', margin: 0 }}>Hồ sơ KYC chờ duyệt ({dbKycList.length})</div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {dbKycList.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Không có hồ sơ nào chờ duyệt.
                    </div>
                  ) : (
                    dbKycList.map(item => {
                      const nameInitials = item.full_name ? item.full_name.trim().split(/\s+/).filter(Boolean).slice(-2).map(p => p[0]).join('').toUpperCase() : 'US';
                      const isSelected = selectedKycId === item.id;

                      return (
                        <div
                          key={item.id}
                          onClick={() => { setSelectedKycId(item.id); setRejectId(null); }}
                          style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid rgba(255,255,255,0.02)',
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(212,175,55,0.08)' : 'transparent',
                            borderLeft: isSelected ? '4px solid var(--gold)' : '4px solid transparent',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: isSelected ? 'var(--gold-gradient)' : '#222', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: isSelected ? '#000' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                              {nameInitials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: isSelected ? 'var(--gold)' : '#fff', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.full_name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Ngày update: <span style={{ color: '#aaa' }}>{new Date(item.updated_at).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* CỘT PHẢI - CHI TIẾT DUYỆT */}
              <div style={{ height: '100%', overflowY: 'auto' }}>
                {selectedKycId ? (() => {
                  const selectedItem = dbKycList.find(i => i.id === selectedKycId);
                  if (!selectedItem) return <div className="neo-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text)' }}>Không tìm thấy thông tin.</div>;

                  const hasImages = !!(selectedItem.id_card_front_url || selectedItem.id_card_back_url);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="neo-card" style={{ padding: '24px' }}>
                        <div className="h3" style={{ fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                          Chi tiết & Đối chiếu hồ sơ
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '32px' }}>
                          {/* Thông tin nhập từ người dùng */}
                          <div style={{ background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '16px' }}>THÔNG TIN ĐÃ NHẬP</div>

                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>HỌ VÀ TÊN</div>
                              <div style={{ fontSize: '15px', color: '#fff', fontWeight: 500 }}>{selectedItem.full_name}</div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>SỐ CCCD</div>
                              <div style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold', letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums' }}>{selectedItem.id_card_number}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>SỐ ĐIỆN THOẠI LÀM VIỆC</div>
                              <div style={{ fontSize: '15px', color: '#fff', fontWeight: 500 }}>{selectedItem.phone || '—'}</div>
                            </div>
                          </div>

                          {/* Ảnh giấy tờ */}
                          <div>
                            <div style={{ fontSize: '13px', color: 'var(--emerald)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '16px' }}>ẢNH CUNG CẤP (ĐỐI CHIẾU)</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>MẶT TRƯỚC</div>
                                {selectedItem.id_card_front_url ? (
                                  <img
                                    src={selectedItem.id_card_front_url}
                                    alt="Front"
                                    style={{ width: '100%', height: '160px', objectFit: 'contain', borderRadius: '12px', background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
                                  />
                                ) : (
                                  <div style={{ border: '1px dashed rgba(255,255,255,0.1)', height: '160px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Thiếu ảnh</div>
                                )}
                              </div>
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>MẶT SAU</div>
                                {selectedItem.id_card_back_url ? (
                                  <img
                                    src={selectedItem.id_card_back_url}
                                    alt="Back"
                                    style={{ width: '100%', height: '160px', objectFit: 'contain', borderRadius: '12px', background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
                                  />
                                ) : (
                                  <div style={{ border: '1px dashed rgba(255,255,255,0.1)', height: '160px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Thiếu ảnh</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hành động */}
                        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px' }}>
                          {rejectId === selectedItem.id ? (
                            <div style={{ flex: 1, background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                              <div style={{ fontSize: '14px', color: 'var(--ruby)', fontWeight: 600, marginBottom: '12px' }}>Bạn đang từ chối hồ sơ này</div>
                              <input
                                autoFocus
                                className="form-input"
                                placeholder="Nhập lý do từ chối (VD: Ảnh mờ, sai số CCCD...)"
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                style={{ marginBottom: '12px', background: '#0a0a0a' }}
                              />
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={submitRejectKyc} disabled={!rejectReason.trim()} className="btn btn-danger" style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 600 }}>Xác nhận Từ chối</button>
                                <button onClick={() => setRejectId(null)} className="btn btn-outline" style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 600 }}>Hủy thao tác</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApproveKyc(selectedItem.id)}
                                disabled={!hasImages}
                                className="btn btn-gold"
                                style={{ flex: 1, padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', background: hasImages ? 'var(--emerald)' : 'rgba(255,255,255,0.05)', color: hasImages ? '#fff' : 'var(--text-muted)', boxShadow: hasImages ? '0 10px 20px rgba(16,185,129,0.2)' : 'none' }}
                              >
                                Phê duyệt hồ sơ (Tích xanh)
                              </button>
                              <button
                                onClick={() => handleRejectClick(selectedItem.id)}
                                className="btn"
                                style={{ padding: '16px 32px', borderRadius: '12px', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--ruby)', background: 'rgba(239, 68, 68, 0.05)' }}
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="neo-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                    <ShieldAlert size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                    <div style={{ fontSize: '16px', fontWeight: 500 }}>Chọn một hồ sơ bên trái để xem chi tiết</div>
                  </div>
                )}
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
          </>
  );
  }
