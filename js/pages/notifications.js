import store from '../store.js';

export const pageNotifications = {
  selectedNotifId: 1, // Default selected notification id
  filterTab: 'all', // 'all', 'transaction', 'system'

  render() {
    const notifications = store.state.notifications;

    // Filter notifications list
    const filteredNotifs = notifications.filter(n => {
      if (this.filterTab === 'transaction' && n.type !== 'transaction' && n.type !== 'dca') return false;
      if (this.filterTab === 'system' && n.type !== 'account' && n.type !== 'price' && n.type !== 'order') return false;
      return true;
    });

    // Find the currently selected notification
    let selectedNotif = notifications.find(n => n.id === this.selectedNotifId);
    if (!selectedNotif && filteredNotifs.length > 0) {
      selectedNotif = filteredNotifs[0];
    }

    const unreadCount = notifications.filter(n => n.unread).length;

    // Left Column List HTML
    const listHtml = filteredNotifs.map(n => {
      const isUnread = n.unread;
      const isSelected = selectedNotif && n.id === selectedNotif.id;

      let badgeClass = 'badge-gray';
      let badgeText = 'Hệ thống';
      if (n.type === 'transaction') { badgeClass = 'badge-green'; badgeText = 'Giao dịch'; }
      else if (n.type === 'dca') { badgeClass = 'badge-gold'; badgeText = 'DCA'; }
      else if (n.type === 'price') { badgeClass = 'badge-blue'; badgeText = 'Cảnh báo giá'; }
      else if (n.type === 'account') { badgeClass = 'badge-gold'; badgeText = 'Tài khoản'; }
      else if (n.type === 'order') { badgeClass = 'badge-gray'; badgeText = 'Đơn hàng'; }

      return `
        <div class="notif-item ${isUnread ? 'unread' : ''}" data-id="${n.id}" style="${isSelected ? 'background:var(--gray-50);' : ''}">
          <div class="notif-dot ${isUnread ? 'unread' : 'read'}"></div>
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div style="font-size:13px;font-weight:500; color: ${isUnread ? 'var(--black)' : 'var(--gray-400)'}">${n.title}</div>
              <span style="font-size:11px;color:var(--gray-400)">${n.time}</span>
            </div>
            <div class="body-sm" style="margin-top:2px">${n.desc}</div>
            <span class="badge ${badgeClass}" style="font-size:10px;margin-top:4px">${badgeText}</span>
          </div>
        </div>
      `;
    }).join('');

    // Right Column Detail HTML
    let detailHtml = `
      <div style="text-align:center; padding:48px; color:var(--gray-400);">
        <i class="ti ti-mail-opened" style="font-size:48px;"></i>
        <div style="margin-top:12px; font-size:14px;">Chọn một thông báo ở cột bên trái để xem chi tiết.</div>
      </div>
    `;

    if (selectedNotif) {
      let extraDetailsHtml = '';
      if (selectedNotif.goldTypeName) {
        extraDetailsHtml = `
          <div class="divider"></div>
          <div class="grid-2" style="gap:10px">
            <div><div class="label">LOẠI VÀNG</div><div style="font-size:14px;font-weight:500;margin-top:3px">${selectedNotif.goldTypeName}</div></div>
            <div><div class="label">SỐ LƯỢNG</div><div style="font-size:14px;font-weight:500;margin-top:3px">${selectedNotif.qty}</div></div>
            <div><div class="label">ĐƠN GIÁ KHÓA</div><div style="font-size:14px;font-weight:500;margin-top:3px;color:var(--gold)">${selectedNotif.price}</div></div>
            <div><div class="label">TỔNG THANH TOÁN</div><div style="font-size:14px;font-weight:500;margin-top:3px">${selectedNotif.total}</div></div>
          </div>
          <div class="divider"></div>
          <div style="display:flex;gap:10px">
            ${selectedNotif.orderId ? `<a href="#order?id=${selectedNotif.orderId}" class="btn-gold btn" style="font-size:12px; text-decoration:none;">Xem đơn hàng O2O</a>` : ''}
            <button class="btn" id="btn-notif-pdf" style="font-size:12px">Tải hóa đơn PDF</button>
          </div>
        `;
      }

      detailHtml = `
        <div style="background:var(--white);border:0.5px solid var(--gold);padding:20px;margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <span class="badge badge-green">${selectedNotif.type.toUpperCase()}</span>
                <span style="font-size:11px;color:var(--gray-300)">${selectedNotif.date}</span>
              </div>
              <div class="h3">${selectedNotif.title}</div>
              <div class="body-sm" style="margin-top:6px">${selectedNotif.desc}</div>
            </div>
            <button class="btn-sm btn-danger" id="btn-delete-notif" data-id="${selectedNotif.id}">Xoá</button>
          </div>
          ${extraDetailsHtml}
        </div>
      `;
    }

    return `
      <div style="display:grid;grid-template-columns:300px 1fr;min-height:600px">
        <div style="border-right:0.5px solid var(--gray-200);padding:16px 0; background: var(--white);">
          <div style="padding:0 16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
            <div class="h3">Thông báo (${unreadCount} mới)</div>
            <button class="btn-sm" id="btn-read-all" style="font-size:11px">Đọc tất cả</button>
          </div>
          <div style="padding:0 16px;margin-bottom:10px;display:flex;gap:4px">
            <button class="btn-sm btn-tab-notif ${this.filterTab === 'all' ? 'cur' : ''}" data-tab="all" style="font-size:11px">Tất cả</button>
            <button class="btn-sm btn-tab-notif ${this.filterTab === 'transaction' ? 'cur' : ''}" data-tab="transaction" style="font-size:11px">Giao dịch</button>
            <button class="btn-sm btn-tab-notif ${this.filterTab === 'system' ? 'cur' : ''}" data-tab="system" style="font-size:11px">Hệ thống</button>
          </div>

          <div id="notifs-list-container">
            ${listHtml.length > 0 ? listHtml : '<div style="padding:24px;text-align:center;color:var(--gray-400);font-size:12px">Không có thông báo nào</div>'}
          </div>
        </div>

        <div style="padding:24px" id="notif-detail-container">
          ${detailHtml}
          
          <div class="h3" style="margin-bottom:12px">Cài đặt thông báo</div>
          <div class="card">
            <div style="display:flex;flex-direction:column;gap:0">
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:0.5px solid var(--gray-200)">
                <div><div style="font-size:13px;font-weight:500">Giao dịch mua/bán thành công</div><div class="body-sm">Thông báo ngay khi lệnh khớp</div></div>
                <div style="display:flex;gap:8px"><span class="badge badge-green" style="font-size:11px">App</span><span class="badge badge-green" style="font-size:11px">Email</span></div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:0.5px solid var(--gray-200)">
                <div><div style="font-size:13px;font-weight:500">DCA tự động thực hiện</div><div class="body-sm">Thông báo sau mỗi kỳ DCA</div></div>
                <div style="display:flex;gap:8px"><span class="badge badge-green" style="font-size:11px">App</span><span class="badge badge-gray" style="font-size:11px">Email tắt</span></div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:0.5px solid var(--gray-200)">
                <div><div style="font-size:13px;font-weight:500">Cảnh báo biến động giá</div><div class="body-sm">Khi giá thay đổi &gt; 2% trong 1 giờ</div></div>
                <div style="display:flex;gap:8px"><span class="badge badge-green" style="font-size:11px">App</span><span class="badge badge-green" style="font-size:11px">Email</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  init(container) {
    // Select notification click handler
    container.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        this.selectedNotifId = id;

        // Mark read
        const notif = store.state.notifications.find(n => n.id === id);
        if (notif && notif.unread) {
          notif.unread = false;
        }
        store.notify();
      });
    });

    // Mark all read button
    const readAllBtn = container.querySelector('#btn-read-all');
    if (readAllBtn) {
      readAllBtn.addEventListener('click', () => {
        store.markAllNotificationsRead();
        alert('Đã đánh dấu đọc toàn bộ thông báo.');
      });
    }

    // Filter tab clicks
    container.querySelectorAll('.btn-tab-notif').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.filterTab = tab;
        // Auto select first item in new tab
        this.selectedNotifId = null;
        store.notify();
      });
    });

    // Delete single notification
    const deleteBtn = container.querySelector('#btn-delete-notif');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        store.deleteNotification(id);
        alert('Đã xóa thông báo thành công.');
      });
    }

    // Download PDF invoice
    const pdfBtn = container.querySelector('#btn-notif-pdf');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        alert('Đang tải hóa đơn giao dịch PDF...');
      });
    }
  }
};
