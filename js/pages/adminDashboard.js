import store from '../store.js';

export const pageAdminDashboard = {
  render() {
    const kycList = store.state.kycSubmissions;
    const orders = store.state.orders;
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const inventory = store.state.inventory;

    // Calculate admin dashboard metrics
    const totalSjcInStock = inventory
      .filter(item => item.goldType === 'sjc' && (item.status === 'available' || item.status === 'pending'))
      .length;

    // Build KYC rows
    const kycRowsHtml = kycList.map(sub => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="avatar" style="width:26px;height:26px;font-size:11px">${sub.avatar}</div>
            <span>${sub.name}</span>
          </div>
        </td>
        <td class="body-sm">${sub.time}</td>
        <td class="body-sm">${sub.type}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn-sm badge-green btn-kyc-approve" data-id="${sub.id}" style="border:0.5px solid var(--green);cursor:pointer;">Duyệt</button>
            <button class="btn-sm btn-danger btn-kyc-reject" data-id="${sub.id}" style="cursor:pointer;">Từ chối</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Build pending orders rows
    const orderRowsHtml = pendingOrders.map(o => `
      <tr>
        <td style="font-family:var(--font-mono);font-size:11px">${o.id.substring(0, 12)}...</td>
        <td>Khách hàng An</td>
        <td>${o.goldTypeName} × ${o.quantity} chỉ</td>
        <td><span class="badge badge-gold">Chờ nhận</span></td>
      </tr>
    `).join('');

    return `
      <div style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div>
            <div class="tag" style="margin-bottom:6px">VẬN HÀNH HỆ THỐNG</div>
            <div class="h2">Admin Dashboard</div>
          </div>
          <div style="display:flex;gap:8px">
            <select class="form-input" style="width:auto;padding:6px 10px;font-size:12px">
              <option>Hôm nay</option>
              <option>7 ngày</option>
              <option>30 ngày</option>
            </select>
            <button class="btn" style="font-size:12px">
              <i class="ti ti-download" style="font-size:13px;vertical-align:-2px;margin-right:4px"></i>Xuất báo cáo
            </button>
          </div>
        </div>

        <div class="grid-4" style="margin-bottom:16px">
          <div class="stat-card" style="border-top:2px solid var(--gold)">
            <div class="stat-label">DOANH THU HÔM NAY</div>
            <div class="stat-value gold-text">₫124.500.000</div>
            <div class="stat-sub price-up">▲ +18.4% so hôm qua</div>
          </div>
          <div class="stat-card" style="border-top:2px solid var(--black)">
            <div class="stat-label">TỔNG ĐƠN HÀNG</div>
            <div class="stat-value">${orders.length}</div>
            <div class="stat-sub" style="color:var(--gray-400)">Đang chờ nhận: <span style="color:var(--gold);font-weight:500">${pendingOrders.length}</span></div>
          </div>
          <div class="stat-card" style="border-top:2px solid #185FA5">
            <div class="stat-label">YÊU CẦU DUYỆT KYC</div>
            <div class="stat-value">${kycList.length}</div>
            <div class="stat-sub" style="color:var(--gray-400)">Hồ sơ chờ xử lý</div>
          </div>
          <div class="stat-card" style="border-top:2px solid var(--green)">
            <div class="stat-label">KHO VÀNG VẬT LÝ SJC</div>
            <div class="stat-value">${totalSjcInStock} chỉ</div>
            <div class="stat-sub" style="color:var(--gray-400)">Số thỏi có sẵn</div>
            <div class="progress-bar"><div class="progress-fill" style="width:69%"></div></div>
          </div>
        </div>

        <div class="grid-2" style="margin-bottom:16px">
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <div class="h3">Doanh thu theo ngày (7 ngày)</div>
            </div>
            <div class="chart-placeholder" style="height:180px">[ Bar Chart — Doanh thu chênh lệch Spread theo ngày ]</div>
          </div>
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <div class="h3">Cơ cấu giao dịch</div>
            </div>
            <div class="chart-placeholder" style="height:110px">[ Pie Chart — Mua / Bán / DCA / Rút vàng ]</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px">
              <div style="font-size:12px;display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:var(--green);display:inline-block"></span>Mua: 58%</div>
              <div style="font-size:12px;display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:var(--red);display:inline-block"></span>Bán: 22%</div>
              <div style="font-size:12px;display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:var(--gold);display:inline-block"></span>DCA: 14%</div>
              <div style="font-size:12px;display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:var(--gray-300);display:inline-block"></span>Rút: 6%</div>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <div class="h3">KYC chờ duyệt <span class="badge badge-red" style="font-size:11px;margin-left:6px">${kycList.length}</span></div>
              <button class="btn-sm">Xem tất cả</button>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Nộp lúc</th>
                  <th>Loại giấy tờ</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                ${kycRowsHtml.length > 0 ? kycRowsHtml : '<tr><td colspan="4" style="text-align:center;color:var(--gray-400);padding:14px;">Không có hồ sơ KYC nào chờ duyệt</td></tr>'}
              </tbody>
            </table>
          </div>
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <div class="h3">Đơn chờ nhận vàng <span class="badge badge-gold" style="margin-left:6px">${pendingOrders.length}</span></div>
              <button class="btn-sm">Xem tất cả</button>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Loại vàng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                ${orderRowsHtml.length > 0 ? orderRowsHtml : '<tr><td colspan="4" style="text-align:center;color:var(--gray-400);padding:14px;">Không có đơn hàng nào chờ nhận</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  init(container) {
    // Approve KYC button click listener
    container.querySelectorAll('.btn-kyc-approve').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const submission = store.state.kycSubmissions.find(s => s.id === id);
        if (submission) {
          store.approveKyc(id);
          alert(`Đã duyệt hồ sơ KYC của khách hàng: ${submission.name}`);
        }
      });
    });

    // Reject KYC button click listener
    container.querySelectorAll('.btn-kyc-reject').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const submission = store.state.kycSubmissions.find(s => s.id === id);
        if (submission) {
          store.rejectKyc(id);
          alert(`Đã từ chối hồ sơ KYC của khách hàng: ${submission.name}`);
        }
      });
    });
  }
};
