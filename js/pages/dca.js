import store from '../store.js';

export const pageDca = {
  showCreateForm: false,

  render() {
    const plans = store.state.dcaPlans;
    const prices = store.state.goldPrices;

    // Calculate aggregated stats
    const totalAccumulated = plans.reduce((acc, p) => acc + (p.status === 'running' ? p.amount : 0), 13000000);
    const avgGoldEstimate = (totalAccumulated / prices.sjc.sell).toFixed(2);

    const plansListHtml = plans.map(p => {
      const isRunning = p.status === 'running';
      const statusBadge = isRunning
        ? '<span class="badge badge-green">Đang chạy</span>'
        : '<span class="badge badge-gray">Đã tạm dừng</span>';

      const actionButton = isRunning
        ? `<button class="btn btn-sm btn-pause" data-id="${p.id}">Tạm dừng</button>`
        : `<button class="btn btn-sm btn-resume" data-id="${p.id}" style="background:var(--black);color:var(--gold);border-color:var(--black);">Kích hoạt</button>`;

      return `
        <div class="card" style="margin-bottom:12px;padding:16px; border-left: 3px solid ${isRunning ? 'var(--gold)' : 'var(--gray-300)'}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="display:flex;gap:16px; flex-wrap: wrap;">
              <div><div class="label">LOẠI VÀNG</div><div style="font-size:15px;font-weight:500;margin-top:4px">${p.goldTypeName}</div></div>
              <div><div class="label">SỐ TIỀN / KỲ</div><div style="font-size:15px;font-weight:500;margin-top:4px">₫${p.amount.toLocaleString('vi-VN')}</div></div>
              <div><div class="label">TẦN SUẤT</div><div style="font-size:15px;font-weight:500;margin-top:4px">${p.frequency}</div></div>
              <div><div class="label">NGÀY CHẠY</div><div style="font-size:15px;font-weight:500;margin-top:4px">${p.day}</div></div>
              <div><div class="label">ĐÃ THỰC HIỆN</div><div style="font-size:15px;font-weight:500;margin-top:4px">${p.executedCount} lần</div></div>
              <div><div class="label">GIÁ VỐN TB</div><div style="font-size:15px;font-weight:500;margin-top:4px;color:var(--gold)">₫${p.avgPrice.toLocaleString('vi-VN')}</div></div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              ${statusBadge}
              ${actionButton}
              <button class="btn btn-sm btn-cancel btn-danger" data-id="${p.id}">Huỷ</button>
            </div>
          </div>
          <div class="divider" style="margin:12px 0"></div>
          <div class="h3" style="margin-bottom:8px;font-size:13px">Lịch sử thực hiện gần nhất</div>
          <table class="table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Số tiền</th>
                <th>Số lượng</th>
                <th>Giá mua</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>01/01/2025</td>
                <td>₫${p.amount.toLocaleString('vi-VN')}</td>
                <td>${(p.amount / prices.sjc.sell).toFixed(4)} chỉ</td>
                <td>₫${prices.sjc.sell.toLocaleString('vi-VN')}</td>
                <td><span class="badge badge-green">Thành công</span></td>
              </tr>
              <tr>
                <td>01/12/2024</td>
                <td>₫${p.amount.toLocaleString('vi-VN')}</td>
                <td>${(p.amount / 8500000).toFixed(4)} chỉ</td>
                <td>₫8.500.000</td>
                <td><span class="badge badge-green">Thành công</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    // Dynamic New Plan Form
    const createFormHtml = this.showCreateForm ? `
      <div class="card" style="margin-bottom:20px; border: 1px solid var(--gold); padding:24px">
        <div class="h3" style="margin-bottom:16px">Tạo kế hoạch tích lũy định kỳ mới</div>
        <div class="grid-4">
          <div class="form-group">
            <label class="form-label">Chọn Loại Vàng</label>
            <select class="form-input" id="dca-gold-type">
              <option value="sjc">SJC 1 Chỉ</option>
              <option value="pnj">PNJ 9999</option>
              <option value="doji">DOJI 999.9</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Số Tiền Tích Lũy / Kỳ</label>
            <input class="form-input" id="dca-amount" type="number" placeholder="₫1.000.000" min="100000" step="100000" value="1000000">
          </div>
          <div class="form-group">
            <label class="form-label">Tần Suất</label>
            <select class="form-input" id="dca-frequency">
              <option value="Hàng tuần">Hàng tuần</option>
              <option value="Hàng tháng" selected>Hàng tháng</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ngày thực hiện</label>
            <select class="form-input" id="dca-day">
              <option value="Thứ Hai">Thứ Hai (Hàng tuần)</option>
              <option value="Ngày 1" selected>Ngày 1 (Hàng tháng)</option>
              <option value="Ngày 15">Ngày 15 (Hàng tháng)</option>
            </select>
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px">
          <button class="btn" id="btn-dca-cancel">Hủy</button>
          <button class="btn btn-gold" id="btn-dca-save">Kích hoạt kế hoạch</button>
        </div>
      </div>
    ` : '';

    return `
      <div style="padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
          <div>
            <div class="tag" style="margin-bottom:6px">TÍCH LŨY TỰ ĐỘNG</div>
            <div class="h2">Kế hoạch DCA</div>
            <p class="body-sm" style="margin-top:4px">Mua vàng định kỳ, tự động trung bình giá — không cần theo dõi thị trường</p>
          </div>
          <button class="btn-gold btn" id="btn-toggle-create" style="flex-shrink:0">
            ${this.showCreateForm ? 'Đóng form' : '+ Tạo kế hoạch mới'}
          </button>
        </div>

        ${createFormHtml}

        <div class="grid-3" style="margin-bottom:24px">
          <div class="card" style="border-left:2px solid var(--gold);padding-left:18px">
            <div class="stat-label">TỔNG ĐÃ TÍCH LŨY</div>
            <div class="stat-value">₫${totalAccumulated.toLocaleString('vi-VN')}</div>
            <div class="stat-sub price-up">+${avgGoldEstimate} chỉ SJC (Ước tính)</div>
            <div class="progress-bar" style="margin-top:10px"><div class="progress-fill" style="width:58%"></div></div>
            <div class="body-sm" style="margin-top:4px">58% mục tiêu năm (10 chỉ)</div>
          </div>
          <div class="card">
            <div class="stat-label">GIẢM RỦI RO</div>
            <div class="stat-value" style="color:var(--green)">-12.4%</div>
            <div class="stat-sub" style="color:var(--gray-400)">So với mua một lần tại đỉnh</div>
          </div>
          <div class="card">
            <div class="stat-label">LẦN THỰC HIỆN TIẾP</div>
            <div class="stat-value" style="font-size:16px">01/02/2025</div>
            <div class="stat-sub" style="color:var(--gray-400)">Còn 12 ngày · Hàng tháng</div>
          </div>
        </div>

        <div class="h3" style="margin-bottom:12px">Kế hoạch đang hoạt động</div>
        <div id="dca-plans-list">
          ${plansListHtml.length > 0 ? plansListHtml : '<div class="card" style="text-align:center;color:var(--gray-400);padding:24px">Chưa có kế hoạch tích lũy nào đang hoạt động</div>'}
        </div>
      </div>
    `;
  },

  init(container) {
    // Toggle form display
    const toggleCreateBtn = container.querySelector('#btn-toggle-create');
    if (toggleCreateBtn) {
      toggleCreateBtn.addEventListener('click', () => {
        this.showCreateForm = !this.showCreateForm;
        store.notify();
      });
    }

    // Save DCA plan
    const saveDcaBtn = container.querySelector('#btn-dca-save');
    const cancelDcaBtn = container.querySelector('#btn-dca-cancel');
    if (saveDcaBtn) {
      saveDcaBtn.addEventListener('click', () => {
        const goldType = container.querySelector('#dca-gold-type').value;
        const amount = parseInt(container.querySelector('#dca-amount').value, 10);
        const frequency = container.querySelector('#dca-frequency').value;
        const day = container.querySelector('#dca-day').value;

        if (isNaN(amount) || amount < 100000) {
          alert('Số tiền tích lũy tối thiểu là ₫100.000');
          return;
        }

        store.createDcaPlan(goldType, amount, frequency, day);
        this.showCreateForm = false;
        store.notify();
        alert('Đã tạo kế hoạch DCA tích lũy vàng định kỳ mới!');
      });
    }
    if (cancelDcaBtn) {
      cancelDcaBtn.addEventListener('click', () => {
        this.showCreateForm = false;
        store.notify();
      });
    }

    // Pause/Resume/Cancel event delegations
    container.querySelectorAll('.btn-pause').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'), 10);
        store.pauseDcaPlan(id);
        alert('Kế hoạch tích lũy đã tạm dừng.');
      });
    });

    container.querySelectorAll('.btn-resume').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'), 10);
        store.resumeDcaPlan(id);
        alert('Kế hoạch tích lũy đã hoạt động trở lại.');
      });
    });

    container.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (confirm('Bạn có chắc chắn muốn hủy kế hoạch tích lũy này không?')) {
          const id = parseInt(e.target.getAttribute('data-id'), 10);
          store.cancelDcaPlan(id);
          alert('Đã hủy kế hoạch tích lũy.');
        }
      });
    });
  }
};
