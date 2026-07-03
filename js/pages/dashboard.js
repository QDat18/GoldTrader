import store from '../store.js';

export const pageDashboard = {
  render() {
    const user = store.state.currentUser;
    const prices = store.state.goldPrices;
    const balances = store.state.goldBalances;
    const wallet = store.state.walletBalance;

    // Calculate real-time portfolio values
    const sjcValue = balances.sjc * prices.sjc.sell;
    const pnjValue = balances.pnj * prices.pnj.sell;
    const dojiValue = balances.doji * prices.doji.sell;
    const totalGoldValue = sjcValue + pnjValue + dojiValue;
    const totalInvested = 60000000; // Mock total invested
    const pnlVal = totalGoldValue - totalInvested;
    const pnlPercent = (pnlVal / totalInvested) * 100;
    const pnlSign = pnlVal >= 0 ? '+' : '';
    const pnlClass = pnlVal >= 0 ? 'price-up' : 'price-dn';

    // Get last 3 transactions
    const recentTxns = store.state.transactions.slice(0, 3);
    const txnRows = recentTxns.map(txn => {
      const typeBadge = txn.type === 'buy'
        ? '<span class="badge badge-green">Mua</span>'
        : (txn.type === 'dca' ? '<span class="badge badge-gold">DCA</span>' : '<span class="badge badge-red">Bán</span>');
      return `
        <tr>
          <td>${typeBadge}</td>
          <td>${txn.goldTypeName}</td>
          <td>${txn.quantity.toFixed(2)} chỉ</td>
          <td>₫${txn.total.toLocaleString('vi-VN')}</td>
          <td class="body-sm">${txn.time}</td>
        </tr>
      `;
    }).join('');

    // Dynamic KYC Banner
    let kycBannerHtml = '';
    if (user.kycStatus === 'pending') {
      kycBannerHtml = `
        <div style="background:var(--gold-pale);border:0.5px solid var(--gold);padding:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:13px;color:#7A5A10;font-weight:500">
              <i class="ti ti-clock" style="font-size:15px;vertical-align:-2px;margin-right:6px"></i>
              Hồ sơ KYC đang chờ phê duyệt
            </div>
            <div style="font-size:12px;color:#7A5A10;margin-top:4px">Yêu cầu xác thực tài khoản của bạn đang được Admin xem xét. Bạn có thể sang Admin Panel để tự duyệt nhanh.</div>
          </div>
          <a href="#admin" class="btn btn-sm btn-gold" style="text-decoration:none">Tới duyệt KYC</a>
        </div>
      `;
    } else if (user.kycStatus === 'rejected') {
      kycBannerHtml = `
        <div style="background:var(--red-bg);border:0.5px solid var(--red);padding:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:13px;color:var(--red);font-weight:500">
              <i class="ti ti-alert-triangle" style="font-size:15px;vertical-align:-2px;margin-right:6px"></i>
              Hồ sơ KYC bị từ chối
            </div>
            <div style="font-size:12px;color:var(--red);margin-top:4px">CCCD bị mờ hoặc không hợp lệ. Vui lòng cung cấp lại thông tin để tiếp tục giao dịch.</div>
          </div>
          <a href="#register" class="btn btn-sm btn-danger" style="text-decoration:none">Cập nhật KYC</a>
        </div>
      `;
    } else if (user.kycStatus === 'verified') {
      kycBannerHtml = `
        <div style="background:var(--green-bg);border:0.5px solid var(--green);padding:14px;margin-bottom:20px">
          <div style="font-size:13px;color:var(--green);font-weight:500">
            <i class="ti ti-shield-check" style="font-size:15px;vertical-align:-2px;margin-right:6px"></i>
            Tài khoản đã xác minh (KYC Verified)
          </div>
          <div style="font-size:12px;color:var(--green);margin-top:4px">Tài khoản của bạn đã được xác minh toàn diện. Bạn đã được phép rút vàng thật tại quầy O2O.</div>
        </div>
      `;
    }

    return `
      <div style="padding:24px">
        ${kycBannerHtml}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div class="h2">Tổng quan danh mục</div>
          <div class="body-sm">Cập nhật: Vừa xong</div>
        </div>
        <div class="wallet-balance">
          <div class="label" style="color:var(--gray-400);margin-bottom:6px">TỔNG GIÁ TRỊ VÀNG HIỆN TẠI</div>
          <div style="font-size:32px;font-weight:500;color:var(--gold)">₫${totalGoldValue.toLocaleString('vi-VN')}</div>
          <div style="display:flex;gap:20px;margin-top:12px">
            <div>
              <div class="label" style="color:var(--gray-400)">TỔNG ĐẦU TƯ</div>
              <div style="font-size:14px;color:var(--white);margin-top:2px">₫${totalInvested.toLocaleString('vi-VN')}</div>
            </div>
            <div>
              <div class="label" style="color:var(--gray-400)">LÃI / LỖ</div>
              <div style="font-size:14px;margin-top:2px" class="${pnlClass}">
                ${pnlSign}₫${pnlVal.toLocaleString('vi-VN')} (${pnlSign}${pnlPercent.toFixed(2)}%)
              </div>
            </div>
            <div>
              <div class="label" style="color:var(--gray-400)">SỐ DƯ VÍ</div>
              <div style="font-size:14px;color:var(--white);margin-top:2px">₫${wallet.toLocaleString('vi-VN')}</div>
            </div>
          </div>
        </div>
        <div class="grid-4" style="margin-bottom:16px">
          <div class="stat-card">
            <div class="stat-label">SJC 1 CHỈ</div>
            <div class="stat-value">${balances.sjc.toFixed(2)} chỉ</div>
            <div class="stat-sub price-up">+12.4% so với giá vốn</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">PNJ 9999</div>
            <div class="stat-value">${balances.pnj.toFixed(2)} chỉ</div>
            <div class="stat-sub price-up">+8.7% so với giá vốn</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">DOJI 999.9</div>
            <div class="stat-value">${balances.doji.toFixed(2)} chỉ</div>
            <div class="stat-sub" style="color:var(--gray-400)">Chưa có số dư</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Giá vốn TB (SJC)</div>
            <div class="stat-value" style="font-size:16px">₫7.780.000</div>
            <div class="stat-sub" style="color:var(--gray-400)">Giá hiện tại: ₫${prices.sjc.sell.toLocaleString('vi-VN')}</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="card">
            <div class="h3" style="margin-bottom:12px">Biến động giá trị danh mục (30 ngày)</div>
            <div class="chart-placeholder" style="height:200px">[ Biểu đồ Line Chart — Giá trị ví theo thời gian ]</div>
          </div>
          <div class="card">
            <div class="h3" style="margin-bottom:12px">Giao dịch gần nhất</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Vàng</th>
                  <th>Số lượng</th>
                  <th>Giá trị</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                ${txnRows.length > 0 ? txnRows : '<tr><td colspan="5" style="text-align:center;color:var(--gray-400);">Chưa có giao dịch nào</td></tr>'}
              </tbody>
            </table>
            <a href="#history" class="btn" style="width:100%;margin-top:12px;font-size:13px;text-decoration:none">Xem toàn bộ lịch sử</a>
          </div>
        </div>
      </div>
    `;
  },
  init(container) {
    // Buttons inside dashboard are static router links or navbar triggers
  }
};
