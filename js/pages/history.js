import store from '../store.js';

export const pageHistory = {
  selectedType: 'all', // 'all', 'buy', 'sell', 'dca'
  selectedGold: 'all', // 'all', 'sjc', 'pnj', 'doji'
  searchQuery: '',

  render() {
    const txns = store.state.transactions;

    // Filter transactions
    const filteredTxns = txns.filter(txn => {
      // Filter by type
      if (this.selectedType !== 'all') {
        if (this.selectedType === 'buy' && txn.type !== 'buy') return false;
        if (this.selectedType === 'sell' && txn.type !== 'sell') return false;
        if (this.selectedType === 'dca' && txn.type !== 'dca') return false;
      }
      // Filter by gold brand
      if (this.selectedGold !== 'all') {
        const brandStr = this.selectedGold.toUpperCase();
        if (!txn.goldTypeName.toUpperCase().includes(brandStr)) return false;
      }
      // Filter by search query
      if (this.searchQuery.trim() !== '') {
        const q = this.searchQuery.toLowerCase();
        const matchesId = txn.id.toLowerCase().includes(q);
        const matchesName = txn.goldTypeName.toLowerCase().includes(q);
        if (!matchesId && !matchesName) return false;
      }
      return true;
    });

    // Calculate aggregated stats from filtered transactions
    const totalTransactions = filteredTxns.length;
    const totalBuy = filteredTxns
      .filter(t => t.type === 'buy' || t.type === 'dca')
      .reduce((sum, t) => sum + t.total, 0);
    const totalSell = filteredTxns
      .filter(t => t.type === 'sell')
      .reduce((sum, t) => sum + t.total, 0);
    const realizedPnl = Math.round(totalSell * 0.08); // Mock dynamic PNL

    const txnRowsHtml = filteredTxns.map(txn => {
      const typeBadge = txn.type === 'buy'
        ? '<span class="badge badge-green">Mua</span>'
        : (txn.type === 'dca' ? '<span class="badge badge-gold">DCA</span>' : '<span class="badge badge-red">Bán</span>');

      const pnlHtml = txn.type === 'sell'
        ? `<span class="price-up">${txn.pnl}</span>`
        : '<span class="body-sm">—</span>';

      return `
        <tr>
          <td style="font-family:var(--font-mono);font-size:12px">${txn.id}</td>
          <td>${typeBadge}</td>
          <td>${txn.goldTypeName}</td>
          <td>${txn.quantity.toFixed(2)} chỉ</td>
          <td>₫${txn.price.toLocaleString('vi-VN')}</td>
          <td>₫${txn.total.toLocaleString('vi-VN')}</td>
          <td>${pnlHtml}</td>
          <td class="body-sm">${txn.time}</td>
          <td><span class="badge badge-green">${txn.status}</span></td>
        </tr>
      `;
    }).join('');

    return `
      <div style="display:flex">
        <div class="sidebar">
          <div class="body-sm" style="padding:0 20px;margin-bottom:8px;font-size:11px;letter-spacing:0.06em">BỘ LỌC GIAO DỊCH</div>
          <button class="sidebar-item btn-filter-type ${this.selectedType === 'all' ? 'active' : ''}" data-type="all">
            <i class="ti ti-list" style="font-size:15px"></i>Tất cả
          </button>
          <button class="sidebar-item btn-filter-type ${this.selectedType === 'buy' ? 'active' : ''}" data-type="buy">
            <i class="ti ti-arrow-down" style="font-size:15px;color:var(--green)"></i>Lệnh mua
          </button>
          <button class="sidebar-item btn-filter-type ${this.selectedType === 'sell' ? 'active' : ''}" data-type="sell">
            <i class="ti ti-arrow-up" style="font-size:15px;color:var(--red)"></i>Lệnh bán
          </button>
          <button class="sidebar-item btn-filter-type ${this.selectedType === 'dca' ? 'active' : ''}" data-type="dca">
            <i class="ti ti-repeat" style="font-size:15px;color:var(--gold)"></i>DCA tự động
          </button>
          <a href="#order" class="sidebar-item" style="text-decoration:none">
            <i class="ti ti-qrcode" style="font-size:15px"></i>Đơn rút vàng O2O
          </a>
          <div class="divider" style="margin:12px 0"></div>
          <div class="body-sm" style="padding:0 20px;margin-bottom:8px;font-size:11px;letter-spacing:0.06em">LOẠI VÀNG</div>
          <button class="sidebar-item btn-filter-gold ${this.selectedGold === 'all' ? 'active' : ''}" data-gold="all">Tất cả loại</button>
          <button class="sidebar-item btn-filter-gold ${this.selectedGold === 'sjc' ? 'active' : ''}" data-gold="sjc">SJC 1 Chỉ</button>
          <button class="sidebar-item btn-filter-gold ${this.selectedGold === 'pnj' ? 'active' : ''}" data-gold="pnj">PNJ 9999</button>
          <button class="sidebar-item btn-filter-gold ${this.selectedGold === 'doji' ? 'active' : ''}" data-gold="doji">DOJI 999.9</button>
        </div>
        <div style="flex:1;padding:24px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div class="h2">Lịch sử giao dịch</div>
            <div style="display:flex;gap:8px">
              <input class="form-input" id="txn-search-input" placeholder="Tìm kiếm mã GD..." value="${this.searchQuery}" style="width:200px;padding:6px 10px;font-size:13px">
              <button class="btn" id="btn-export-csv" style="font-size:13px">
                <i class="ti ti-download" style="font-size:14px;vertical-align:-2px;margin-right:4px"></i>Xuất CSV
              </button>
            </div>
          </div>
          <div class="grid-4" style="margin-bottom:16px">
            <div class="stat-card">
              <div class="stat-label">TỔNG GIAO DỊCH</div>
              <div class="stat-value" id="stats-total-txns">${totalTransactions}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">TỔNG MUA VÀO</div>
              <div class="stat-value" style="font-size:16px" id="stats-total-buy">₫${totalBuy.toLocaleString('vi-VN')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">TỔNG BÁN RA</div>
              <div class="stat-value" style="font-size:16px" id="stats-total-sell">₫${totalSell.toLocaleString('vi-VN')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">REALIZED PNL</div>
              <div class="stat-value" style="font-size:16px;color:var(--green)" id="stats-pnl">+₫${realizedPnl.toLocaleString('vi-VN')}</div>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Mã GD</th>
                <th>Loại</th>
                <th>Vàng</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Tổng tiền</th>
                <th>Lãi/Lỗ</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${txnRowsHtml.length > 0 ? txnRowsHtml : '<tr><td colspan="9" style="text-align:center;color:var(--gray-400);padding:20px;">Không tìm thấy giao dịch nào khớp với bộ lọc</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  init(container) {
    // Type Filters
    container.querySelectorAll('.btn-filter-type').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        this.selectedType = target.getAttribute('data-type');
        store.notify();
      });
    });

    // Gold Filters
    container.querySelectorAll('.btn-filter-gold').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        this.selectedGold = target.getAttribute('data-gold');
        store.notify();
      });
    });

    // Search input
    const searchInput = container.querySelector('#txn-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        // Simple search update without entire layout flash if possible
        // but store.notify is safer and updates stats too!
        store.notify();
        // Keep focus on input
        const freshInput = document.getElementById('txn-search-input');
        if (freshInput) {
          freshInput.focus();
          // Move cursor to end
          const len = freshInput.value.length;
          freshInput.setSelectionRange(len, len);
        }
      });
    }

    // Export CSV
    const exportBtn = container.querySelector('#btn-export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        alert('Tải xuống báo cáo giao dịch (CSV) thành công!');
      });
    }
  }
};
