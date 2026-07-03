import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Bell, ChevronDown, LogOut, User, History, PlusCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export function UserNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = location.pathname.substring(1) || 'home';
  
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const user = useStore((state) => state.currentUser);
  const walletBalance = useStore((state) => state.walletBalance);
  const notifications = useStore((state) => state.notifications);
  const depositMoney = useStore((state) => state.depositMoney);
  const logout = useStore((state) => state.logout);
  
  const walletStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(walletBalance);
  const unreadCount = notifications.filter(n => n.unread).length;

  const handleDeposit = () => {
    const amount = prompt('Nhập số tiền muốn nạp vào ví (VNĐ):', '5000000');
    if (amount) {
      const val = parseInt(amount.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(val) && val > 0) {
        depositMoney(val);
        alert(`Nạp thành công ${val.toLocaleString('vi-VN')} đ vào ví.`);
      } else {
        alert('Số tiền không hợp lệ.');
      }
    }
  };

  return (
    <div className="nav-bar">
      <Link to="/" className="logo">
        <div className="logo-mark"><span>G</span></div>
        <span className="logo-text">GOLD<em>CHAIN</em></span>
      </Link>
      
      <div className="nav-links">
        <Link to="/" className={`nav-link ${activePage === 'home' || activePage === '' ? 'active' : ''}`}>Trang chủ</Link>
        {user.email && <Link to="/dashboard" className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}>Tổng quan</Link>}
        <Link to="/trade" className={`nav-link ${activePage === 'trade' ? 'active' : ''}`}>Giao dịch</Link>
        {user.email && <Link to="/dca" className={`nav-link ${activePage === 'dca' ? 'active' : ''}`}>Tích lũy DCA</Link>}
        {user.email && <Link to="/history" className={`nav-link ${activePage === 'history' ? 'active' : ''}`}>Lịch sử</Link>}
        {user.role === 'admin' && <Link to="/admin" className="nav-link" style={{color: 'var(--ruby)'}}>Admin Panel</Link>}
      </div>

      <div className="nav-actions">
        {!user.email ? (
          <>
            <Link to="/register" className="btn btn-gold">Bắt đầu ngay</Link>
          </>
        ) : (
          <>
            <Link to="/notifications" style={{position: 'relative', color: 'var(--gold)'}}>
              <Bell size={20} />
              {unreadCount > 0 && <span style={{position:'absolute', top:-2, right:-2, width:8, height:8, background:'var(--ruby)', borderRadius:'50%'}}></span>}
            </Link>
            
            <div style={{fontSize: '14px', color: 'var(--text-muted)'}}>
              Số dư: <span style={{color: 'var(--text-main)', fontWeight: 600}}>{walletStr}</span>
            </div>
            
            <button className="btn btn-gold" onClick={handleDeposit}>+ Nạp tiền</button>
            
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border-silver)', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-main)', fontSize: 12, fontWeight: 'bold' }}>
                  {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>{user.name || 'Tài khoản'}</span>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>

              {dropdownOpen && (
                <>
                  <div 
                    onClick={() => setDropdownOpen(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '200px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 1000
                  }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-100)', marginBottom: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                    </div>
                    
                    <button 
                      onClick={() => { setDropdownOpen(false); alert(`Thông tin cá nhân:\nHọ tên: ${user.name}\nSĐT: ${user.phone}\nEmail: ${user.email}\nCCCD: ${user.cccd || 'Chưa cập nhật'}`); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: 'var(--text-main)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <User size={16} style={{ color: 'var(--gold)' }} />
                      Thông tin cá nhân
                    </button>

                    <button 
                      onClick={() => { setDropdownOpen(false); navigate('/history'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: 'var(--text-main)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <History size={16} style={{ color: 'var(--gold)' }} />
                      Lịch sử giao dịch
                    </button>

                    <button 
                      onClick={() => { setDropdownOpen(false); handleDeposit(); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: 'var(--text-main)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <PlusCircle size={16} style={{ color: 'var(--gold)' }} />
                      Nạp tiền
                    </button>

                    <div style={{ height: '1px', background: 'var(--gray-100)', margin: '4px 0' }} />

                    <button 
                      onClick={async () => { setDropdownOpen(false); await supabase.auth.signOut(); logout(); navigate('/login'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: 'var(--ruby)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={16} />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
