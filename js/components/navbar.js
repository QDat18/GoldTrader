import store from '../store.js';

export function renderUserNavbar(activePage) {
  const user = store.state.currentUser;
  const walletStr = store.state.walletBalance.toLocaleString('vi-VN');
  const unreadCount = store.state.notifications.filter(n => n.unread).length;
  const notifDot = unreadCount > 0 ? `<span class="notification-dot"></span>` : '';

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
        <div style="font-size:13px;color:var(--gray-400)">Số dư: <span style="color:var(--black);font-weight:500">₫${walletStr}</span></div>
        <button class="btn-gold btn" id="nav-btn-deposit">+ Nạp tiền</button>
        <div class="avatar" id="user-avatar-menu" style="cursor:pointer" title="Click để đổi vai trò">${user.name.split(' ').map(n=>n[0]).join('')}</div>
        <select id="role-quick-switcher" style="padding: 4px; font-size: 11px; border: 0.5px solid var(--gray-200); background: #fff; cursor: pointer;">
          <option value="user" ${user.role === 'user' ? 'selected' : ''}>Vai: Khách</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Vai: Admin</option>
        </select>
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
        <select id="role-quick-switcher" style="padding: 4px; font-size: 11px; border: 0.5px solid var(--gray-200); background: #fff; cursor: pointer;">
          <option value="user" ${user.role === 'user' ? 'selected' : ''}>Vai: Khách</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Vai: Admin</option>
        </select>
      </div>
    </div>
  `;
}

export function setupNavbarEvents(container) {
  // Deposit button click
  const depositBtn = container.querySelector('#nav-btn-deposit');
  if (depositBtn) {
    depositBtn.addEventListener('click', () => {
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
    });
  }

  // Quick role switcher
  const roleSwitcher = container.querySelectorAll('#role-quick-switcher');
  roleSwitcher.forEach(select => {
    select.addEventListener('change', (e) => {
      const newRole = e.target.value;
      store.switchUserRole(newRole);
      if (newRole === 'admin') {
        window.location.hash = '#admin';
      } else {
        window.location.hash = '#dashboard';
      }
    });
  });
}
