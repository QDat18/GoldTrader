import store from '../store.js';

export const pageOrder = {
  qrInterval: null,

  render() {
    const orders = store.state.orders;

    // Get order ID from hash parameters (e.g. #order?id=ORD-123)
    const hash = window.location.hash;
    let orderId = null;
    if (hash.includes('?')) {
      const params = new URLSearchParams(hash.split('?')[1]);
      orderId = params.get('id');
    }

    // Find the requested order, or fall back to the most recent order
    let order = orders.find(o => o.id === orderId);
    if (!order && orders.length > 0) {
      order = orders[0];
    }

    if (!order) {
      return `
        <div style="padding:48px; text-align:center;">
          <div class="h2">Không tìm thấy đơn hàng</div>
          <p class="body-sm" style="margin-top:10px">Bạn chưa thực hiện đơn đặt mua vàng O2O nào hoặc mã đơn hàng không tồn tại.</p>
          <a href="#trade" class="btn btn-gold" style="margin-top:20px; text-decoration:none">Tới Giao dịch ngay</a>
        </div>
      `;
    }

    const isPending = order.status === 'pending';
    const isCompleted = order.status === 'completed';

    // Build timeline HTML
    const timelineHtml = order.timeline.map((t, idx) => {
      const isDone = t.done;
      const dotClass = isDone ? 'timeline-dot done' : 'timeline-dot';
      const textStyle = isDone ? '' : 'color:var(--gray-400)';
      return `
        <div class="timeline-item">
          <div class="${dotClass}"></div>
          <div>
            <div style="font-size:13px;font-weight:500; ${textStyle}">${t.title}</div>
            <div class="body-sm">${t.time ? t.time + ' — ' : ''}${t.desc}</div>
          </div>
        </div>
      `;
    }).join('');

    // List completed orders
    const completedOrders = orders.filter(o => o.status === 'completed');
    const completedRowsHtml = completedOrders.map(o => `
      <tr>
        <td style="font-family:var(--font-mono);font-size:12px">${o.id}</td>
        <td>${o.goldTypeName}</td>
        <td>${o.quantity.toFixed(2)} chỉ</td>
        <td>₫${o.totalAmount.toLocaleString('vi-VN')}</td>
        <td class="body-sm">Chi nhánh Q1</td>
        <td><span class="badge badge-green">Đã nhận</span></td>
      </tr>
    `).join('');

    return `
      <div style="display:grid;grid-template-columns:1fr 340px;gap:0;min-height:540px">
        <div style="padding:24px;border-right:0.5px solid var(--gray-200)">
          <div class="h2" style="margin-bottom:4px">Đơn hàng O2O</div>
          <p class="body-sm" style="margin-bottom:20px">Xuất trình mã QR động tại quầy để nhận vàng vật chất</p>

          <div style="margin-bottom: 24px;">
            <div class="h3" style="margin-bottom:12px">Danh sách đơn hàng</div>
            <div style="display:flex; gap:8px; margin-bottom:16px;">
              ${orders.map(o => `
                <a href="#order?id=${o.id}" class="btn btn-sm ${o.id === order.id ? 'btn-gold' : ''}" style="text-decoration:none">
                  ${o.id.substring(0, 12)}...
                </a>
              `).join('')}
            </div>
          </div>

          <div class="h3" style="margin-bottom:12px">Chi tiết đơn đang chọn</div>
          <div class="card" style="border-left:2px solid var(--gold);padding-left:18px;margin-bottom:24px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
              <div>
                <div style="font-family:var(--font-mono);font-size:12px;color:var(--gray-400)">Mã đơn: ${order.id}</div>
                <div style="font-size:16px;font-weight:500;margin-top:4px">${order.goldTypeName} × ${order.quantity} chỉ</div>
                <div style="font-size:13px;color:var(--gray-400);margin-top:2px">
                  ₫${order.totalAmount.toLocaleString('vi-VN')} · Đặt lúc ${order.createdAt}
                </div>
              </div>
              <span class="badge ${isPending ? 'badge-gold' : 'badge-green'}" style="font-size:12px">
                ${isPending ? 'Chờ nhận tại quầy' : 'Đã nhận vàng'}
              </span>
            </div>
            <div class="order-timeline">
              ${timelineHtml}
            </div>
          </div>

          <div class="h3" style="margin-bottom:12px">Đơn đã hoàn tất gần đây</div>
          <table class="table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Loại vàng</th>
                <th>Số lượng</th>
                <th>Tổng tiền</th>
                <th>Chi nhánh</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${completedRowsHtml.length > 0 ? completedRowsHtml : '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:14px;">Chưa có đơn hàng nào hoàn tất</td></tr>'}
            </tbody>
          </table>
        </div>

        <div style="padding:24px;background:var(--gray-50)">
          <div class="h3" style="margin-bottom:4px">Mã QR xác thực nhận vàng</div>
          <p class="body-sm" style="margin-bottom:20px">Đơn hàng: ${order.id}</p>
          <div style="background:var(--white);border:0.5px solid var(--gray-200);padding:20px;text-align:center;margin-bottom:12px">
            <div class="qr-box"><div class="qr-inner"></div></div>
            <div style="margin-top:12px"><span class="badge badge-gold">Mã động — đổi sau mỗi 30 giây</span></div>
            <div style="margin-top:8px;display:flex;align-items:center;justify-content:center;gap:6px">
              <div style="font-size:13px;color:var(--gray-400)">Hết hạn sau:</div>
              <div style="font-size:18px;font-weight:500;color:var(--gold)" id="qrtimer">00:30</div>
            </div>
          </div>
          <div style="background:var(--white);border:0.5px solid var(--gray-200);padding:14px;margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span class="body-sm">Khách hàng</span>
              <span style="font-size:13px;font-weight:500">Nguyễn Văn An</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span class="body-sm">CCCD</span>
              <span style="font-size:13px">001234567890</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span class="body-sm">Loại vàng</span>
              <span style="font-size:13px;font-weight:500">${order.goldTypeName}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span class="body-sm">Số lượng</span>
              <span style="font-size:13px;font-weight:500">${order.quantity} chỉ</span>
            </div>
          </div>
          <div style="background:var(--gold-pale);border:0.5px solid var(--gold);padding:10px 12px;font-size:12px;color:#7A5A10">
            <i class="ti ti-shield-check" style="font-size:14px;vertical-align:-2px;margin-right:4px" aria-hidden="true"></i>
            Xuất trình QR + CCCD vật lý tại quầy. Nhân viên sẽ đối chiếu thông tin trước khi bàn giao vàng.
          </div>
        </div>
      </div>
    `;
  },

  init(container) {
    this.startQR(container);
  },

  startQR(container) {
    this.stopQR();
    let s = 30;
    const timerEl = container.querySelector('#qrtimer');
    const fmt = v => '00:' + String(v).padStart(2, '0');
    if (timerEl) timerEl.textContent = fmt(s);

    this.qrInterval = setInterval(() => {
      s--;
      if (s < 0) s = 30;
      const el = container.querySelector('#qrtimer');
      if (el) el.textContent = fmt(s);
    }, 1000);
  },

  stopQR() {
    if (this.qrInterval) {
      clearInterval(this.qrInterval);
      this.qrInterval = null;
    }
  },

  destroy() {
    this.stopQR();
  }
};
