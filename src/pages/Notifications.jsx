import React, { useState } from 'react';
import useStore from '../store/useStore';
import { Bell, CreditCard, CheckCircle, Trash2, MailOpen, AlertCircle } from 'lucide-react';

export default function Notifications() {
  const notifications = useStore((state) => state.notifications);
  const markAllNotificationsAsRead = useStore((state) => state.markAllNotificationsAsRead);
  const markNotificationAsRead = useStore((state) => state.markNotificationAsRead);
  const clearAllNotifications = useStore((state) => state.clearAllNotifications);

  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'unread', 'transaction', 'system'

  // Lọc thông báo
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return n.unread;
    if (activeFilter === 'transaction') return n.type === 'transaction';
    if (activeFilter === 'system') return n.type === 'system';
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'transaction':
        return <CreditCard size={20} color="var(--gold)" />;
      case 'system':
        return <AlertCircle size={20} color="#3b82f6" />;
      default:
        return <Bell size={20} color="var(--text-muted)" />;
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto', minHeight: 'calc(100vh - 120px)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div className="h2">Thông báo của bạn</div>
          <div className="body-sm" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Cập nhật các hoạt động giao dịch và hệ thống</div>
        </div>
        
        {notifications.length > 0 && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-outline" 
              onClick={markAllNotificationsAsRead}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 16px', borderRadius: '8px' }}
            >
              <MailOpen size={14} /> Đọc tất cả
            </button>
            <button 
              className="btn" 
              onClick={clearAllNotifications}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--ruby)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              <Trash2 size={14} /> Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
        {['all', 'unread', 'transaction', 'system'].map((f) => {
          let label = 'Tất cả';
          if (f === 'unread') label = 'Chưa đọc';
          if (f === 'transaction') label = 'Giao dịch';
          if (f === 'system') label = 'Hệ thống';

          const count = f === 'all' ? notifications.length :
                        f === 'unread' ? notifications.filter(n => n.unread).length :
                        notifications.filter(n => n.type === f).length;

          const isActive = activeFilter === f;

          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                color: isActive ? 'var(--gold)' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              {label}
              <span style={{ 
                fontSize: '11px', 
                background: isActive ? 'var(--gold)' : 'rgba(255,255,255,0.06)', 
                color: isActive ? '#000' : 'var(--text-muted)',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 'bold'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: '64px 32px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px' }}>
            <Bell size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.4 }} />
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Không có thông báo nào trong mục này</div>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationAsRead(n.id)}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '20px',
                background: n.unread ? 'rgba(212, 175, 55, 0.03)' : 'rgba(255,255,255,0.01)',
                border: n.unread ? '1px solid rgba(212, 175, 55, 0.15)' : '1px solid rgba(255,255,255,0.04)',
                borderRadius: '12px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease',
                transform: 'translateY(0)'
              }}
              className="hover-card"
            >
              {/* Unread Indicator dot */}
              {n.unread && (
                <span style={{ 
                  position: 'absolute', 
                  top: '20px', 
                  right: '20px', 
                  width: '8px', 
                  height: '8px', 
                  background: 'var(--gold)', 
                  borderRadius: '50%',
                  boxShadow: '0 0 8px var(--gold)' 
                }}></span>
              )}

              {/* Icon Container */}
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: n.unread ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.03)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {getIcon(n.type)}
              </div>

              {/* Text content */}
              <div style={{ flex: 1, paddingRight: '20px' }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: n.unread ? 700 : 600, 
                  color: n.unread ? '#fff' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {n.title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.5' }}>
                  {n.desc}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
                  {n.date || n.time}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
