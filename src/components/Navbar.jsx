import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Bell, ChevronDown, LogOut } from 'lucide-react';

export function UserNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = location.pathname.substring(1) || 'home';
  
  const user = useStore((state) => state.currentUser);
  const walletBalance = useStore((state) => state.walletBalance);
  const notifications = useStore((state) => state.notifications);
  const switchUserRole = useStore((state) => state.switchUserRole);
  const depositMoney = useStore((state) => state.depositMoney);
  
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

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    switchUserRole(newRole);
    if (newRole === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
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
        {user.role !== 'guest' && <Link to="/dashboard" className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}>Tổng quan</Link>}
        <Link to="/trade" className={`nav-link ${activePage === 'trade' ? 'active' : ''}`}>Giao dịch</Link>
        {user.role !== 'guest' && <Link to="/dca" className={`nav-link ${activePage === 'dca' ? 'active' : ''}`}>Tích lũy DCA</Link>}
        {user.role !== 'guest' && <Link to="/history" className={`nav-link ${activePage === 'history' ? 'active' : ''}`}>Lịch sử</Link>}
        {user.role === 'admin' && <Link to="/admin" className="nav-link" style={{color: 'var(--ruby)'}}>Admin Panel</Link>}
      </div>

      <div className="nav-actions">
        {user.role === 'guest' ? (
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
            
            <div style={{display:'flex', alignItems:'center', gap:'8px', background:'var(--bg-main)', padding:'4px 12px', borderRadius:'20px', border:'var(--border-silver)'}}>
              <div style={{width: 24, height: 24, borderRadius:'50%', background:'var(--gold-gradient)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--bg-main)', fontSize: 12, fontWeight:'bold'}}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <select 
                value={user.role} 
                onChange={handleRoleChange}
                style={{background: 'transparent', color: 'var(--text-main)', border: 'none', outline: 'none', fontSize: '13px', cursor: 'pointer', appearance: 'none', paddingRight: '12px'}}
              >
                <option value="user" style={{background: 'var(--bg-card)'}}>Vai trò: Khách</option>
                <option value="admin" style={{background: 'var(--bg-card)'}}>Vai trò: Admin</option>
                <option value="guest" style={{background: 'var(--bg-card)'}}>Đăng xuất</option>
              </select>
              <ChevronDown size={14} style={{marginLeft: '-10px', color: 'var(--text-muted)', pointerEvents:'none'}} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
