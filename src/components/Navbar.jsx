import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import {
  Bell,
  CandlestickChart,
  ChevronDown,
  History,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  ShieldCheck,
  User,
  Wallet,
  X
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const getInitials = (name = '') => {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('');

  return initials || 'GC';
};

const getKycMeta = (status) => {
  switch (status) {
    case 'verified':
      return { label: 'KYC đã duyệt', color: 'var(--emerald)', bg: 'rgba(16, 185, 129, 0.12)' };
    case 'rejected':
      return { label: 'KYC bị từ chối', color: 'var(--ruby)', bg: 'rgba(239, 68, 68, 0.12)' };
    case 'pending':
      return { label: 'KYC đang duyệt', color: 'var(--gold)', bg: 'rgba(212, 175, 55, 0.12)' };
    default:
      return { label: 'Chưa xác minh', color: 'var(--text-muted)', bg: 'rgba(156, 163, 175, 0.12)' };
  }
};

const maskId = (value = '') => {
  if (!value) return 'Chưa cập nhật';
  if (value.length <= 4) return value;
  return `${'*'.repeat(Math.max(value.length - 4, 0))}${value.slice(-4)}`;
};

export function UserNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = location.pathname.substring(1) || 'home';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('5000000');

  const user = useStore((state) => state.currentUser);
  const walletBalance = useStore((state) => state.walletBalance);
  const notifications = useStore((state) => state.notifications);
  const depositMoney = useStore((state) => state.depositMoney);
  const logout = useStore((state) => state.logout);

  const walletStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(walletBalance);
  const unreadCount = notifications.filter((n) => n.unread).length;
  const isLoggedIn = Boolean(user.email);
  const kycMeta = getKycMeta(user.kycStatus);
  const initials = getInitials(user.name);

  const submitDeposit = () => {
    const val = parseInt(depositAmount.toString().replace(/[^0-9]/g, ''), 10);
    if (!Number.isNaN(val) && val > 0) {
      depositMoney(val);
      alert(`Nạp thành công ${val.toLocaleString('vi-VN')} đ vào ví.`);
      setIsDepositModalOpen(false);
      setDepositAmount('5000000');
    } else {
      alert('Số tiền không hợp lệ.');
    }
  };

  const goTo = (path) => {
    setDropdownOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    logout();
    navigate('/login');
  };

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '11px 12px',
    border: 'none',
    background: 'transparent',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '13px',
    color: 'var(--text-main)',
    transition: 'background 0.2s',
  };

  const onItemEnter = (event) => {
    event.currentTarget.style.background = 'rgba(255,255,255,0.06)';
  };

  const onItemLeave = (event) => {
    event.currentTarget.style.background = 'transparent';
  };

  return (
    <>
      <div className="nav-bar">
        <Link to="/" className="logo">
          <div className="logo-mark"><span>G</span></div>
          <span className="logo-text">GOLD<em>CHAIN</em></span>
        </Link>

        <div className="nav-links">
          {isLoggedIn && user.role === 'admin' ? (
            <>
              <Link to="/admin" className={`nav-link ${activePage === 'admin' ? 'active' : ''}`}>Trung tâm Quản trị</Link>
              <Link to="/admin" className="nav-link">Quản lý Đơn hàng</Link>
              <Link to="/admin" className="nav-link">Kho quỹ & Hedging</Link>
            </>
          ) : (
            <>
              {!isLoggedIn && <Link to="/" className={`nav-link ${activePage === 'home' || activePage === '' ? 'active' : ''}`}>Trang chủ</Link>}
              {isLoggedIn && <Link to="/dashboard" className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}>Tổng quan</Link>}
              <Link to="/trade" className={`nav-link ${activePage === 'trade' ? 'active' : ''}`}>Giao dịch</Link>
              {isLoggedIn && <Link to="/dca" className={`nav-link ${activePage === 'dca' ? 'active' : ''}`}>Tích lũy DCA</Link>}
              {isLoggedIn && <Link to="/history" className={`nav-link ${activePage === 'history' ? 'active' : ''}`}>Lịch sử</Link>}
            </>
          )}
        </div>

        <div className="nav-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!isLoggedIn ? (
            <>
              <Link to="/login" className="btn btn-outline" style={{ textDecoration: 'none' }}>Đăng nhập</Link>
              <Link to="/register" className="btn btn-gold" style={{ textDecoration: 'none' }}>Đăng ký</Link>
            </>
          ) : (
            <>
              <Link to="/notifications" style={{ position: 'relative', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center' }}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 8, height: 8, background: 'var(--ruby)', borderRadius: '50%' }} />
                )}
              </Link>

              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '8px 12px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(212, 175, 55, 0.24)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    minWidth: '238px',
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-main)', fontSize: 12, fontWeight: 'bold', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {user.name || 'Khách hàng GoldChain'}
                        {user.role === 'admin' && (
                          <ShieldCheck size={14} style={{ color: '#3b82f6' }} />
                        )}
                      </span>
                      {user.role === 'admin' ? (
                        <span style={{ fontSize: '10px', color: '#fff', background: '#3b82f6', borderRadius: '9999px', padding: '2px 7px', whiteSpace: 'nowrap', fontWeight: 600 }}>Quản trị hệ thống</span>
                      ) : (
                        <span style={{ fontSize: '10px', color: kycMeta.color, background: kycMeta.bg, borderRadius: '9999px', padding: '2px 7px', whiteSpace: 'nowrap' }}>{kycMeta.label}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.role === 'admin' ? `AD-${user.id?.substring(0, 5).toUpperCase() || '001'} · ${user.email}` : `${walletStr} · ${user.email}`}
                    </div>
                  </div>
                  <ChevronDown size={15} style={{ color: 'var(--text-muted)', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      onClick={() => setDropdownOpen(false)}
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        right: 0,
                        width: '318px',
                        background: 'rgba(18, 18, 18, 0.98)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(212, 175, 55, 0.24)',
                        borderRadius: '16px',
                        boxShadow: '0 18px 45px rgba(0, 0, 0, 0.42)',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        zIndex: 1000,
                      }}
                    >
                      <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-main)', fontSize: 13, fontWeight: 'bold', flexShrink: 0 }}>
                            {initials}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {user.name}
                              {user.role === 'admin' && (
                                <ShieldCheck size={14} style={{ color: '#3b82f6' }} />
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {user.role === 'admin' ? (
                            <>
                              <div style={{ padding: '9px', borderRadius: '10px', background: 'rgba(0,0,0,0.22)', gridColumn: 'span 2' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Vai trò hệ thống</div>
                                <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 700 }}>QUẢN TRỊ VIÊN CẤP CAO</div>
                              </div>
                              <div style={{ padding: '9px', borderRadius: '10px', background: 'rgba(0,0,0,0.22)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Trạng thái</div>
                                <div style={{ fontSize: '12px', color: 'var(--emerald)', fontWeight: 700 }}>Online</div>
                              </div>
                              <div style={{ padding: '9px', borderRadius: '10px', background: 'rgba(0,0,0,0.22)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Mã nhân viên</div>
                                <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 700 }}>AD-{user.id?.substring(0, 5).toUpperCase() || '001'}</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ padding: '9px', borderRadius: '10px', background: 'rgba(0,0,0,0.22)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Số dư ví</div>
                                <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 700 }}>{walletStr}</div>
                              </div>
                              <div style={{ padding: '9px', borderRadius: '10px', background: 'rgba(0,0,0,0.22)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Xác minh</div>
                                <div style={{ fontSize: '12px', color: kycMeta.color, fontWeight: 700 }}>{kycMeta.label}</div>
                              </div>
                              <div style={{ padding: '9px', borderRadius: '10px', background: 'rgba(0,0,0,0.22)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Điện thoại</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>{user.phone || 'Chưa cập nhật'}</div>
                              </div>
                              <div style={{ padding: '9px', borderRadius: '10px', background: 'rgba(0,0,0,0.22)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>CCCD</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>{maskId(user.cccd)}</div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {user.role === 'admin' ? (
                        <>
                          <button type="button" onClick={() => goTo('/admin')} style={menuItemStyle} onMouseEnter={onItemEnter} onMouseLeave={onItemLeave}>
                            <ShieldCheck size={16} style={{ color: '#3b82f6' }} />
                            Bàn làm việc Admin
                          </button>
                          <button type="button" onClick={() => goTo('/notifications')} style={menuItemStyle} onMouseEnter={onItemEnter} onMouseLeave={onItemLeave}>
                            <Bell size={16} style={{ color: 'var(--gold)' }} />
                            Thông báo hệ thống {unreadCount > 0 ? `(${unreadCount})` : ''}
                          </button>
                          <button type="button" onClick={() => goTo('/profile')} style={menuItemStyle} onMouseEnter={onItemEnter} onMouseLeave={onItemLeave}>
                            <User size={16} style={{ color: 'var(--gold)' }} />
                            Thông tin cá nhân
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => goTo('/dashboard')} style={menuItemStyle} onMouseEnter={onItemEnter} onMouseLeave={onItemLeave}>
                            <LayoutDashboard size={16} style={{ color: 'var(--gold)' }} />
                            Tổng quan tài sản
                          </button>
                          <button type="button" onClick={() => goTo('/trade')} style={menuItemStyle} onMouseEnter={onItemEnter} onMouseLeave={onItemLeave}>
                            <CandlestickChart size={16} style={{ color: 'var(--gold)' }} />
                            Giao dịch vàng
                          </button>
                          <button type="button" onClick={() => goTo('/dca')} style={menuItemStyle} onMouseEnter={onItemEnter} onMouseLeave={onItemLeave}>
                            <Wallet size={16} style={{ color: 'var(--gold)' }} />
                            Tích lũy DCA
                          </button>
                          <button type="button" onClick={() => goTo('/history')} style={menuItemStyle} onMouseEnter={onItemEnter} onMouseLeave={onItemLeave}>
                            <History size={16} style={{ color: 'var(--gold)' }} />
                            Lịch sử giao dịch
                          </button>
                          <button type="button" onClick={() => goTo('/notifications')} style={menuItemStyle} onMouseEnter={onItemEnter} onMouseLeave={onItemLeave}>
                            <Bell size={16} style={{ color: 'var(--gold)' }} />
                            Thông báo {unreadCount > 0 ? `(${unreadCount})` : ''}
                          </button>
                          <button type="button" onClick={() => { setDropdownOpen(false); setIsDepositModalOpen(true); }} style={menuItemStyle} onMouseEnter={onItemEnter} onMouseLeave={onItemLeave}>
                            <PlusCircle size={16} style={{ color: 'var(--gold)' }} />
                            Nạp tiền vào ví
                          </button>
                          <button
                            type="button"
                            onClick={() => goTo('/profile')}
                            style={menuItemStyle}
                            onMouseEnter={onItemEnter}
                            onMouseLeave={onItemLeave}
                          >
                            <User size={16} style={{ color: 'var(--gold)' }} />
                            Thông tin cá nhân
                          </button>
                        </>
                      )}

                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

                      <button
                        type="button"
                        onClick={handleLogout}
                        style={{ ...menuItemStyle, color: 'var(--ruby)' }}
                        onMouseEnter={(event) => { event.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                        onMouseLeave={onItemLeave}
                      >
                        <LogOut size={15} />
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
      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>Nạp tiền vào ví</div>
              <button onClick={() => setIsDepositModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Số dư hiện tại</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold)' }}>{walletStr}</div>
                </div>
                <Wallet size={24} color="var(--gold)" style={{ opacity: 0.5 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Chọn hoặc nhập số tiền (VNĐ)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  {[1000000, 5000000, 10000000, 20000000, 50000000, 100000000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount.toString())}
                      style={{
                        padding: '12px 8px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                        background: depositAmount === amount.toString() ? 'var(--gold-gradient)' : 'rgba(255,255,255,0.05)',
                        color: depositAmount === amount.toString() ? '#000' : 'var(--text-main)',
                        border: depositAmount === amount.toString() ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer'
                      }}
                    >
                      {new Intl.NumberFormat('vi-VN').format(amount)}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={depositAmount ? new Intl.NumberFormat('vi-VN').format(depositAmount.toString().replace(/[^0-9]/g, '')) : ''}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setDepositAmount(val);
                  }}
                  className="form-input"
                  placeholder="Nhập số tiền khác..."
                  style={{ background: 'rgba(0,0,0,0.2)', fontSize: '18px', fontWeight: 600, letterSpacing: '1px' }}
                />
              </div>

              <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>Miễn phí nạp tiền</span>. Hỗ trợ tất cả các ngân hàng nội địa. Tiền sẽ được cộng ngay lập tức vào ví của bạn.
              </div>
            </div>

            <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '12px' }}>
              <button className="btn" onClick={() => setIsDepositModalOpen(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '99px', padding: '14px', fontSize: '15px' }}>
                Hủy
              </button>
              <button className="btn btn-gold" onClick={submitDeposit} style={{ flex: 2, borderRadius: '99px', padding: '14px', fontSize: '15px', fontWeight: 700, boxShadow: '0 8px 16px rgba(212,175,55,0.2)' }}>
                Xác nhận nạp tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
