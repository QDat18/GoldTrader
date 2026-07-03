import store from '../store.js';

export const pageInventory = {
  selectedGoldFilter: 'all',
  selectedStatusFilter: 'all',
  searchQuery: '',

  render() {
    const inventory = store.state.inventory;

    // Helper functions to get stats
    const getStats = (goldType) => {
      const items = inventory.filter(i => i.goldType === goldType);
      const total = items.filter(i => i.status !== 'shipped').length;
      const available = items.filter(i => i.status === 'available').length;
      const pending = items.filter(i => i.status === 'pending').length;
      return { total, available, pending };
    };

    const sjcStats = getStats('sjc');
    const pnjStats = getStats('pnj');
    const dojiStats = getStats('doji');

    // Filter inventory list
    const filteredInventory = inventory.filter(item => {
      if (this.selectedGoldFilter !== 'all' && item.goldType !== this.selectedGoldFilter) return false;
      if (this.selectedStatusFilter !== 'all' && item.status !== this.selectedStatusFilter) return false;
      if (this.searchQuery.trim() !== '') {
        const q = this.searchQuery.toLowerCase();
        if (!item.serial.toLowerCase().includes(q) && !item.orderId.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const inventoryRowsHtml = filteredInventory.map(item => {
      let statusBadge = '';
      if (item.status === 'available') {
        statusBadge = '<span class="badge badge-green">Khả dụng</span>';
      } else if (item.status === 'pending') {
        statusBadge = '<span class="badge badge-gold">Đặt cọc</span>';
      } else {
        statusBadge = '<span class="badge badge-gray">Đã xuất</span>';
      }

      return `
        <tr>
          <td style="font-family:var(--font-mono);font-size:12px">${item.serial}</td>
          <td>${item.goldTypeName}</td>
          <td>${item.weight}</td>
          <td>${item.brand}</td>
          <td>${statusBadge}</td>
          <td style="font-family:var(--font-mono);font-size:11px">${item.orderId === '—' ? '—' : `<a href="#order?id=${item.orderId}">${item.orderId.substring(0,12)}...</a>`}</td>
          <td class="body-sm">${item.date}</td>
          <td><button class="btn-sm btn-view-detail" data-serial="${item.serial}">Chi tiết</button></td>
        </tr>
      `;
    }).join('');

    return `
      <div style="display:flex">
        <div class="sidebar">
          <span class="si-label">QUẢN LÝ KHO</span>
          <button class="si active"><i class="ti ti-building-warehouse" style="font-size:15px"></i>Tổng quan kho</button>
          <button class="si" id="btn-quick-import"><i class="ti ti-plus" style="font-size:15px"></i>Nhập kho nhanh</button>
          <button class="si"><i class="ti ti-arrow-up" style="font-size:15px"></i>Xuất kho</button>
          <button class="si"><i class="ti ti-list-details" style="font-size:15px"></i>Danh sách thỏi</button>
          <div class="divider"></div>
          <span class="si-label">KIỂM TRA KHO</span>
          <button class="si"><i class="ti ti-clipboard-check" style="font-size:15px"></i>Kiểm kê định kỳ</button>
          <button class="si" style="color:var(--red)"><i class="ti ti-alert-triangle" style="font-size:15px"></i>Cảnh báo tồn kho</button>
        </div>

        <div style="flex:1;padding:20px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
            <div>
              <div class="tag" style="margin-bottom:6px">KHO VẬT CHẤT</div>
              <div class="h2">Quản lý kho vàng</div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn" style="font-size:12px" id="btn-export-inv">
                <i class="ti ti-download" style="font-size:13px;vertical-align:-2px;margin-right:4px"></i>Xuất CSV
              </button>
              <button class="btn-gold btn" id="btn-add-stock" style="font-size:12px">
                <i class="ti ti-plus" style="font-size:13px;vertical-align:-2px;margin-right:4px"></i>Nhập kho mới
              </button>
            </div>
          </div>

          <div class="grid-3" style="margin-bottom:16px">
            <div class="stat-card" style="border-top:2px solid var(--gold)">
              <div class="stat-label">SJC — TỔNG TỒN KHO</div>
              <div class="stat-value">${sjcStats.total} thỏi</div>
              <div class="divider" style="margin:8px 0"></div>
              <div style="display:flex;justify-content:space-between;font-size:12px">
                <span class="body-sm">Khả dụng</span>
                <span style="color:var(--green);font-weight:500">${sjcStats.available} thỏi</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:4px">
                <span class="body-sm">Đặt cọc (Orders)</span>
                <span style="color:var(--gold);font-weight:500">${sjcStats.pending} thỏi</span>
              </div>
              <div class="progress-bar" style="margin-top:8px">
                <div class="progress-fill" style="width: ${sjcStats.total > 0 ? (sjcStats.available / sjcStats.total) * 100 : 0}%"></div>
              </div>
            </div>

            <div class="stat-card" style="border-top:2px solid var(--gray-400)">
              <div class="stat-label">PNJ 9999 — TỒN KHO</div>
              <div class="stat-value">${pnjStats.total} thỏi</div>
              <div class="divider" style="margin:8px 0"></div>
              <div style="display:flex;justify-content:space-between;font-size:12px">
                <span class="body-sm">Khả dụng</span>
                <span style="color:var(--green);font-weight:500">${pnjStats.available} thỏi</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:4px">
                <span class="body-sm">Đặt cọc</span>
                <span style="color:var(--gold);font-weight:500">${pnjStats.pending} thỏi</span>
              </div>
              <div class="progress-bar" style="margin-top:8px">
                <div class="progress-fill" style="width: ${pnjStats.total > 0 ? (pnjStats.available / pnjStats.total) * 100 : 0}%"></div>
              </div>
            </div>

            <div class="stat-card" style="border-top:2px solid var(--red)">
              <div class="stat-label">DOJI 999.9 — TỒN KHO</div>
              <div class="stat-value" style="color:${dojiStats.total < 3 ? 'var(--red)' : 'inherit'}">${dojiStats.total} thỏi</div>
              <div class="divider" style="margin:8px 0"></div>
              <div style="display:flex;justify-content:space-between;font-size:12px">
                <span class="body-sm">Khả dụng</span>
                <span style="color:var(--green);font-weight:500">${dojiStats.available} thỏi</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:4px">
                <span class="body-sm">Đặt cọc</span>
                <span style="color:var(--gold);font-weight:500">${dojiStats.pending} thỏi</span>
              </div>
              ${dojiStats.available <= 1 ? `
                <div class="warn-box" style="margin-top:8px;padding:6px 10px">
                  <i class="ti ti-alert-triangle" style="font-size:13px;vertical-align:-2px;margin-right:4px"></i>Tồn kho khả dụng thấp — cần nhập thêm
                </div>
              ` : ''}
            </div>
          </div>

          <div class="h3" style="margin-bottom:10px">Danh sách thỏi vàng trong kho</div>
          <div style="display:flex;gap:8px;margin-bottom:12px">
            <select class="form-input" id="filter-gold" style="width:auto;padding:6px 10px;font-size:12px">
              <option value="all" ${this.selectedGoldFilter === 'all' ? 'selected' : ''}>Tất cả loại vàng</option>
              <option value="sjc" ${this.selectedGoldFilter === 'sjc' ? 'selected' : ''}>SJC</option>
              <option value="pnj" ${this.selectedGoldFilter === 'pnj' ? 'selected' : ''}>PNJ</option>
              <option value="doji" ${this.selectedGoldFilter === 'doji' ? 'selected' : ''}>DOJI</option>
            </select>
            <select class="form-input" id="filter-status" style="width:auto;padding:6px 10px;font-size:12px">
              <option value="all" ${this.selectedStatusFilter === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
              <option value="available" ${this.selectedStatusFilter === 'available' ? 'selected' : ''}>Khả dụng</option>
              <option value="pending" ${this.selectedStatusFilter === 'pending' ? 'selected' : ''}>Đã đặt cọc</option>
              <option value="shipped" ${this.selectedStatusFilter === 'shipped' ? 'selected' : ''}>Đã xuất kho</option>
            </select>
            <input class="form-input" id="inv-search" placeholder="Tìm serial thỏi vàng..." value="${this.searchQuery}" style="width:180px;padding:6px 10px;font-size:12px">
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Serial</th>
                <th>Loại vàng</th>
                <th>Trọng lượng</th>
                <th>Nhãn hiệu</th>
                <th>Trạng thái</th>
                <th>Đơn đặt gán</th>
                <th>Ngày nhập</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              ${inventoryRowsHtml.length > 0 ? inventoryRowsHtml : '<tr><td colspan="8" style="text-align:center;color:var(--gray-400);padding:20px;">Không có thỏi vàng nào trong bộ lọc</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  init(container) {
    // Dropdown filters
    container.querySelector('#filter-gold').addEventListener('change', (e) => {
      this.selectedGoldFilter = e.target.value;
      store.notify();
    });

    container.querySelector('#filter-status').addEventListener('change', (e) => {
      this.selectedStatusFilter = e.target.value;
      store.notify();
    });

    // Search bar
    const searchEl = container.querySelector('#inv-search');
    searchEl.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      store.notify();
      const freshSearch = document.getElementById('inv-search');
      if (freshSearch) {
        freshSearch.focus();
        const len = freshSearch.value.length;
        freshSearch.setSelectionRange(len, len);
      }
    });

    // Add stock item click listener
    const addStockBtn = container.querySelector('#btn-add-stock');
    const quickImportBtn = container.querySelector('#btn-quick-import');

    const handleImport = () => {
      const goldType = prompt('Nhập loại vàng cần nhập kho (sjc / pnj / doji):', 'sjc');
      if (!goldType) return;
      const typeLower = goldType.toLowerCase().trim();
      if (typeLower !== 'sjc' && typeLower !== 'pnj' && typeLower !== 'doji') {
        alert('Loại vàng nhập vào không hợp lệ (phải là sjc, pnj hoặc doji).');
        return;
      }

      const brand = prompt('Nhập nhãn hiệu/nhà sản xuất:', typeLower === 'sjc' ? 'SJC HCM' : (typeLower === 'pnj' ? 'PNJ HN' : 'DOJI HN'));
      if (!brand) return;

      store.addInventoryItem(typeLower, brand);
      alert(`Đã nhập 1 thỏi vàng ${typeLower.toUpperCase()} mới thành công vào kho.`);
    };

    if (addStockBtn) addStockBtn.addEventListener('click', handleImport);
    if (quickImportBtn) quickImportBtn.addEventListener('click', handleImport);

    // Detail item alert
    container.querySelectorAll('.btn-view-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const serial = e.target.getAttribute('data-serial');
        const item = store.state.inventory.find(i => i.serial === serial);
        if (item) {
          alert(`CHI TIẾT THỎI VÀNG\n- Mã Serial: ${item.serial}\n- Loại: ${item.goldTypeName}\n- Trọng lượng: ${item.weight}\n- Xuất xứ: ${item.brand}\n- Trạng thái: ${item.status}\n- Đơn hàng liên kết: ${item.orderId}\n- Ngày nhập kho: ${item.date}`);
        }
      });
    });

    // Export CSV alert
    const exportBtn = container.querySelector('#btn-export-inv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        alert('Tải xuống báo cáo kiểm kê kho vàng (CSV) thành công!');
      });
    }
  }
};
