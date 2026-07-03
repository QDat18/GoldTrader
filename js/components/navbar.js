import store from '../store.js';

function getInitials(name = '') {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map(part => part[0])
    .join('');

  return initials || 'GC';
}

function getKycMeta(status) {
  switch (status) {
    case 'verified':
      return { label: 'KYC đã duyệt', color: 'var(--emerald)', bg: 'rgba(16,185,129,0.12)' };
    case 'rejected':
      return { label: 'KYC bị từ chối', color: 'var(--ruby)', bg: 'rgba(239,68,68,0.12)' };
    case 'pending':
      return { label: 'KYC đang duyệt', color: 'var(--gold)', bg: 'rgba(212,175,55,0.12)' };
    default:
      return { label: 'Chưa xác minh', color: 'var(--text-muted)', bg: 'rgba(156,163,175,0.12)' };
  }
}

function maskId(value = '') {
  if (!value) return 'Chưa cập nhật';
  if (value.length <= 4) return value;
  return `${'*'.repeat(Math.max(value.length - 4, 0))}${value.slice(-4)}`;
}

export function renderUserNavbar(activePage) {
  const user = store.state.currentUser;
  const walletStr = store.state.walletBalance.toLocaleString('vi-VN');
  const unreadCount = store.state.notifications.filter(n => n.unread).length;
  const notifDot = unreadCount > 0 ? `<span class="notification-dot"></span>` : '';
  const initials = getInitials(user.name);
  const kycMeta = getKycMeta(user.kycStatus);

  return `
    <div class="nav-bar">
      <a href="#home" class="logo">
        <div class="logo-mark"><span>G</span></div>
        <span class="logo-text">GOLD<em>CHAIN</em></span>
      </a>
      <div class="nav-links">
        <a href="#home" class="nav-link ${activePage === 'home' ? 'active' : ''}">Trang chủ</a>
        ${user.role === 'admin' ? '<a href="#admin" class="nav-link" style="color:var(--red)">Admin Panel</a>' : ''}
        <a href="#dashboard" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">Tổng quan</a>
        <a href="#trade" class="nav-link ${activePage === 'trade' ? 'active' : ''}">Giao dịch</a>
        <a href="#dca" class="nav-link ${activePage === 'dca' ? 'active' : ''}">Tích lũy DCA</a>
        <a href="#history" class="nav-link ${activePage === 'history' ? 'active' : ''}">Lịch sử</a>
      </div>
      <div class="nav-actions">
        <a href="#notifications" class="btn" style="position:relative; padding: 7px 12px;">
          <i class="ti ti-bell" style="font-size:16px"></i>
          ${notifDot}
        </a>
        <div style="position:relative">
          <button id="user-tools-trigger" type="button" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.24);border-radius:9999px;padding:7px 12px;cursor:pointer;color:var(--text-main);min-width:230px;text-align:left">
            <span class="avatar" style="width:32px;height:32px;font-size:12px;background:var(--gold-gradient);color:var(--bg-main);flex-shrink:0">${initials}</span>
            <span style="display:block;min-width:0;flex:1">
              <span style="display:flex;align-items:center;gap:7px;min-width:0">
                <span style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${user.name}</span>
                <span style="font-size:10px;color:${kycMeta.color};background:${kycMeta.bg};border-radius:9999px;padding:2px 7px;white-space:nowrap">${kycMeta.label}</span>
              </span>
              <span style="display:block;font-size:11px;color:var(--text-muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">₫${walletStr} · ${user.email}</span>
            </span>
            <i class="ti ti-chevron-down" style="font-size:14px;color:var(--text-muted)"></i>
          </button>
          <div id="account-menu-overlay" style="display:none;position:fixed;inset:0;z-index:98"></div>
          <div id="user-tools-menu" style="display:none;position:absolute;top:calc(100% + 10px);right:0;width:318px;background:rgba(18,18,18,0.98);border:1px solid rgba(212,175,55,0.24);border-radius:16px;box-shadow:0 18px 45px rgba(0,0,0,0.42);padding:12px;z-index:99;color:var(--text-main)">
            <div style="padding:12px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);margin-bottom:6px">
              <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
                <span class="avatar" style="width:42px;height:42px;font-size:13px;background:var(--gold-gradient);color:var(--bg-main);flex-shrink:0">${initials}</span>
                <div style="min-width:0">
                  <div style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${user.name}</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${user.email}</div>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div style="padding:9px;border-radius:10px;background:rgba(0,0,0,0.22)"><div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">Số dư ví</div><div style="font-size:12px;color:var(--gold);font-weight:700">₫${walletStr}</div></div>
                <div style="padding:9px;border-radius:10px;background:rgba(0,0,0,0.22)"><div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">Xác minh</div><div style="font-size:12px;color:${kycMeta.color};font-weight:700">${kycMeta.label}</div></div>
                <div style="padding:9px;border-radius:10px;background:rgba(0,0,0,0.22)"><div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">Điện thoại</div><div style="font-size:12px;font-weight:600">${user.phone || 'Chưa cập nhật'}</div></div>
                <div style="padding:9px;border-radius:10px;background:rgba(0,0,0,0.22)"><div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">CCCD</div><div style="font-size:12px;font-weight:600">${maskId(user.cccd)}</div></div>
              </div>
            </div>
            <a href="#dashboard" class="account-tool-link"><i class="ti ti-layout-dashboard"></i>Tổng quan tài sản</a>
            <a href="#trade" class="account-tool-link"><i class="ti ti-chart-candle"></i>Giao dịch vàng</a>
            <a href="#dca" class="account-tool-link"><i class="ti ti-wallet"></i>Tích lũy DCA</a>
            <a href="#history" class="account-tool-link"><i class="ti ti-history"></i>Lịch sử giao dịch</a>
            <a href="#notifications" class="account-tool-link"><i class="ti ti-bell"></i>Thông báo ${unreadCount > 0 ? `(${unreadCount})` : ''}</a>
            <button class="account-tool-link" type="button" data-account-action="deposit"><i class="ti ti-plus"></i>Nạp tiền vào ví</button>
            <button class="account-tool-link" type="button" data-account-action="profile"><i class="ti ti-user"></i>Thông tin cá nhân</button>
            ${user.role === 'admin' ? '<a href="#admin" class="account-tool-link"><i class="ti ti-shield-check"></i>Công cụ quản trị</a>' : ''}
            <div style="height:1px;background:rgba(255,255,255,0.08);margin:6px 0"></div>
            <button class="account-tool-link danger" type="button" data-account-action="logout"><i class="ti ti-logout"></i>Đăng xuất</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderAdminNavbar(activePage) {
  const user = store.state.currentUser;
  const unreadCount = store.state.notifications.filter(n => n.unread).length;
  const notifDot = unreadCount > 0 ? `<span style="position:absolute;top:2px;right:2px;width:6px;height:6px;background:var(--red);border-radius:50%"></span>` : '';

  return `
    <div class="nav-bar">
      <a href="#admin" class="logo">
        <div class="logo-mark"><span>G</span></div>
        <span class="logo-text">GOLD<em>CHAIN</em> <span style="font-size:11px;color:var(--gray-400);font-weight:400;margin-left:4px">Admin</span></span>
      </a>
      <div class="nav-links">
        <a href="#home" class="nav-link">Về User Site</a>
        <a href="#admin" class="nav-link ${activePage === 'admin' ? 'active' : ''}">Tổng quan</a>
        <a href="#inventory" class="nav-link ${activePage === 'inventory' ? 'active' : ''}">Kho vàng vật lý</a>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <a href="#notifications" class="btn-sm" style="position:relative; display: inline-block; padding: 4px 8px; text-decoration:none; color:inherit;">
          <i class="ti ti-bell" style="font-size:15px"></i>
          ${notifDot}
        </a>
        <div class="avatar">AD</div>
        <span style="font-size:13px;color:var(--gray-400)">Administrator</span>
      </div>
    </div>
  `;
}

export function setupNavbarEvents(container) {
  const runDeposit = () => {
    const amount = prompt('Nhập số tiền muốn nạp vào ví (VNĐ):', '5000000');
    if (amount) {
      const val = parseInt(amount.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(val) && val > 0) {
        store.depositMoney(val);
        alert(`Nạp thành công ₫${val.toLocaleString('vi-VN')} vào ví.`);
      } else {
        alert('Số tiền không hợp lệ.');
      }
    }
  };

  const depositBtn = container.querySelector('#nav-btn-deposit');
  if (depositBtn) {
    depositBtn.addEventListener('click', runDeposit);
  }

  const toolsTrigger = container.querySelector('#user-tools-trigger');
  const toolsMenu = container.querySelector('#user-tools-menu');
  const toolsOverlay = container.querySelector('#account-menu-overlay');

  const closeToolsMenu = () => {
    if (toolsMenu) toolsMenu.style.display = 'none';
    if (toolsOverlay) toolsOverlay.style.display = 'none';
  };

  if (toolsTrigger && toolsMenu && toolsOverlay) {
    toolsTrigger.addEventListener('click', () => {
      const isOpen = toolsMenu.style.display === 'block';
      toolsMenu.style.display = isOpen ? 'none' : 'block';
      toolsOverlay.style.display = isOpen ? 'none' : 'block';
    });
    toolsOverlay.addEventListener('click', closeToolsMenu);
    toolsMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeToolsMenu);
    });
  }

  container.querySelectorAll('[data-account-action="deposit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeToolsMenu();
      runDeposit();
    });
  });

  container.querySelectorAll('[data-account-action="profile"]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeToolsMenu();
      const user = store.state.currentUser;
      const kycMeta = getKycMeta(user.kycStatus);
      alert(`Thông tin cá nhân:\nHọ tên: ${user.name}\nSĐT: ${user.phone || 'Chưa cập nhật'}\nEmail: ${user.email}\nCCCD: ${user.cccd || 'Chưa cập nhật'}\nTrạng thái KYC: ${kycMeta.label}`);
    });
  });

  container.querySelectorAll('[data-account-action="logout"]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeToolsMenu();
      window.location.hash = '#login';
    });
  });
}
  }
}
