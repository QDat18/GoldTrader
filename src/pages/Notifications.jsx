import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { supabase } from '../supabaseClient';
import { MailOpen, Check, Trash2, Download, BellRing, Link as LinkIcon, Smartphone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'transaction', 'system'
  const [selectedNotifId, setSelectedNotifId] = useState(null);

  const notifications = useStore(state => state.notifications);
  const markAllNotificationsRead = useStore(state => state.markAllNotificationsRead);
  const deleteNotification = useStore(state => state.deleteNotification);



  // Filter logic
  const filteredNotifs = notifications.filter(n => {
    if (filterTab === 'transaction' && n.type !== 'transaction' && n.type !== 'dca') return false;
    if (filterTab === 'system' && n.type !== 'account' && n.type !== 'price' && n.type !== 'order') return false;
    return true;
  });

  // Select first available if none selected
  const selectedNotif = notifications.find(n => n.id === selectedNotifId) || filteredNotifs[0];

  useEffect(() => {
    if (selectedNotif && selectedNotif.unread) {
      // Mark as read after 1 second of viewing
      const timer = setTimeout(() => {
        useStore.setState(state => ({
          notifications: state.notifications.map(n => 
            n.id === selectedNotif.id ? { ...n, unread: false } : n
          )
        }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedNotif]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'transaction': return { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', text: 'Giao dịch' };
      case 'dca': return { bg: 'var(--gold-gradient)', color: '#000', text: 'DCA' };
      case 'price': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', text: 'Cảnh báo giá' };
      case 'account': return { bg: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold)', text: 'Tài khoản' };
      default: return { bg: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', text: 'Hệ thống' };
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="tag" style={{ marginBottom: '8px' }}>REALTIME UPDATES</div>
          <div className="h2" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            Hộp thư đến
            {unreadCount > 0 && <span style={{ padding: '4px 10px', background: 'var(--ruby)', color: '#fff', fontSize: '14px', borderRadius: '99px', fontWeight: 600 }}>{unreadCount} mới</span>}
          </div>
        </div>
        <button className="btn btn-outline" onClick={() => markAllNotificationsRead()} style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '99px', padding: '10px 16px' }}>
          <Check size={16} /> Đánh dấu đọc tất cả
        </button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', minHeight: 0 }}>
        
        {/* Left Column: List */}
        <div className="neo-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
            {['all', 'transaction', 'system'].map(tab => (
              <button
                key={tab}
                onClick={() => { setFilterTab(tab); setSelectedNotifId(null); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: filterTab === tab ? 'var(--gold-gradient)' : 'rgba(255,255,255,0.03)',
                  color: filterTab === tab ? '#000' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                {tab === 'all' ? 'Tất cả' : (tab === 'transaction' ? 'Giao dịch' : 'Hệ thống')}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredNotifs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <BellRing size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              filteredNotifs.map(n => {
                const badge = getBadgeStyle(n.type);
                const isSelected = selectedNotif?.id === n.id;
                return (
                  <div
                    key={n.id}
                    onClick={() => setSelectedNotifId(n.id)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(212,175,55,0.05)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--gold)' : '3px solid transparent',
                      display: 'flex',
                      gap: '12px',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.unread ? 'var(--ruby)' : 'transparent', marginTop: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div style={{ fontWeight: n.unread ? 700 : 500, color: n.unread ? '#fff' : 'var(--text-main)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {n.title}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '8px' }}>{n.time}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {n.desc}
                      </div>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: badge.bg, color: badge.color }}>
                        {badge.text}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
          
          <div className="neo-card" style={{ flexShrink: 0 }}>
            {!selectedNotif ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <MailOpen size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p>Chọn một thông báo để xem chi tiết</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, ...getBadgeStyle(selectedNotif.type) }}>
                        {selectedNotif.type.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedNotif.date}</span>
                    </div>
                    <div className="h2" style={{ fontSize: '24px', marginBottom: '8px' }}>{selectedNotif.title}</div>
                    <div style={{ fontSize: '15px', color: 'var(--text-main)', lineHeight: 1.5 }}>{selectedNotif.desc}</div>
                  </div>
                  <button 
                    onClick={() => { deleteNotification(selectedNotif.id); setSelectedNotifId(null); }}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--ruby)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                    title="Xóa thông báo"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {selectedNotif.goldTypeName && (
                  <>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '24px 0' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>SẢN PHẨM</div>
                        <div style={{ fontWeight: 600 }}>{selectedNotif.goldTypeName}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>SỐ LƯỢNG</div>
                        <div style={{ fontWeight: 600 }}>{selectedNotif.qty}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>ĐƠN GIÁ</div>
                        <div style={{ fontWeight: 600, color: 'var(--gold)' }}>{selectedNotif.price}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>TỔNG TIỀN</div>
                        <div style={{ fontWeight: 600 }}>{selectedNotif.total}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {selectedNotif.orderId && (
                        <button className="btn btn-gold" style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <LinkIcon size={16} /> Xem đơn hàng
                        </button>
                      )}
                      <button className="btn btn-outline" style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <Download size={16} /> Tải hóa đơn PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="neo-card">
            <div className="h3" style={{ fontSize: '18px', marginBottom: '20px' }}>Cài đặt nhận thông báo</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Giao dịch mua/bán</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Báo cáo ngay khi lệnh khớp thành công</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    <Smartphone size={14} /> App
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    <Mail size={14} /> Email
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Lệnh DCA tự động</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Thông báo kết quả sau mỗi kỳ thanh toán</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    <Smartphone size={14} /> App
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    <Mail size={14} /> Tắt
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Cảnh báo biến động</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Khi giá vàng thay đổi &gt; 2% trong ngày</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    <Smartphone size={14} /> App
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    <Mail size={14} /> Email
                  </span>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
