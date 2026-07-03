import store from '../store.js';

export const pageHome = {
  render() {
    const prices = store.state.goldPrices;
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;min-height:480px">
        <div style="padding:56px 48px 56px 24px;display:flex;flex-direction:column;justify-content:center">
          <div class="tag" style="margin-bottom:20px; align-self: flex-start;">NỀN TẢNG VÀNG SỐ O2O</div>
          <div class="h1" style="margin-bottom:16px">Tích lũy vàng<br>thông minh<br><span class="gold-accent">từ 100.000đ</span></div>
          <p class="body-sm" style="max-width:380px;margin-bottom:28px">Mua — tích lũy — rút vàng thật tại quầy. Giá thời gian thực, bảo mật blockchain, không cần đến tiệm để đặt lệnh.</p>
          <div style="display:flex;gap:12px">
            <a href="#register" class="btn-gold btn">Bắt đầu miễn phí</a>
            <a href="#trade" class="btn">Xem bảng giá</a>
          </div>
          <div style="display:flex;gap:24px;margin-top:32px">
            <div><div class="h3" style="color:var(--gold)">12.400+</div><div class="body-sm">Người dùng</div></div>
            <div style="width:0.5px;background:var(--gray-200)"></div>
            <div><div class="h3" style="color:var(--gold)">₫482B</div><div class="body-sm">Giá trị giao dịch</div></div>
            <div style="width:0.5px;background:var(--gray-200)"></div>
            <div><div class="h3" style="color:var(--gold)">99.9%</div><div class="body-sm">Uptime hệ thống</div></div>
          </div>
        </div>
        <div style="background:var(--black);display:flex;flex-direction:column;justify-content:center;padding:32px">
          <div style="color:var(--gold-light);font-size:11px;letter-spacing:0.08em;margin-bottom:16px">BÁO GIÁ TRỰC TIẾP</div>
          <div style="display:grid;gap:8px">
            <div style="background:var(--gray-800);padding:14px 16px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-size:13px;color:var(--white);font-weight:500">SJC 1 Chỉ</div>
                <div style="font-size:11px;color:var(--gray-400);margin-top:2px">Cập nhật: 14:22:05</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:14px;color:#F87171">Mua: ₫${prices.sjc.buy.toLocaleString('vi-VN')}</div>
                <div style="font-size:14px;color:#4ADE80;margin-top:2px">Bán: ₫${prices.sjc.sell.toLocaleString('vi-VN')}</div>
              </div>
            </div>
            <div style="background:var(--gray-800);padding:14px 16px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-size:13px;color:var(--white);font-weight:500">PNJ 9999</div>
                <div style="font-size:11px;color:var(--gray-400);margin-top:2px">Cập nhật: 14:22:05</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:14px;color:#F87171">Mua: ₫${prices.pnj.buy.toLocaleString('vi-VN')}</div>
                <div style="font-size:14px;color:#4ADE80;margin-top:2px">Bán: ₫${prices.pnj.sell.toLocaleString('vi-VN')}</div>
              </div>
            </div>
            <div style="background:var(--gray-800);padding:14px 16px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-size:13px;color:var(--white);font-weight:500">DOJI 999.9</div>
                <div style="font-size:11px;color:var(--gray-400);margin-top:2px">Cập nhật: 14:22:05</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:14px;color:#F87171">Mua: ₫${prices.doji.buy.toLocaleString('vi-VN')}</div>
                <div style="font-size:14px;color:#4ADE80;margin-top:2px">Bán: ₫${prices.doji.sell.toLocaleString('vi-VN')}</div>
              </div>
            </div>
          </div>
          <a href="#trade" class="btn-gold btn" style="margin-top:16px;width:100%; text-decoration:none;">Mua ngay</a>
        </div>
      </div>
      <div style="background:var(--gray-50);padding:40px 24px">
        <div style="text-align:center;margin-bottom:32px"><div class="tag" style="margin-bottom:10px">QUY TRÌNH</div><div class="h2">Chỉ 4 bước đơn giản</div></div>
        <div class="grid-4">
          <div class="card" style="text-align:center;padding:24px 16px">
            <div style="width:36px;height:36px;background:var(--black);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:14px;color:var(--gold);font-weight:500">01</div>
            <div class="h3" style="margin-bottom:8px">Đăng ký & KYC</div>
            <p class="body-sm">Xác minh CCCD, hoàn thành trong 5 phút</p>
          </div>
          <div class="card" style="text-align:center;padding:24px 16px">
            <div style="width:36px;height:36px;background:var(--black);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:14px;color:var(--gold);font-weight:500">02</div>
            <div class="h3" style="margin-bottom:8px">Nạp tiền</div>
            <p class="body-sm">Chuyển khoản ngân hàng, xác nhận tức thì</p>
          </div>
          <div class="card" style="text-align:center;padding:24px 16px">
            <div style="width:36px;height:36px;background:var(--black);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:14px;color:var(--gold);font-weight:500">03</div>
            <div class="h3" style="margin-bottom:8px">Mua / Tích lũy</div>
            <p class="body-sm">Đặt lệnh giá thực, DCA tự động hàng tháng</p>
          </div>
          <div class="card" style="text-align:center;padding:24px 16px">
            <div style="width:36px;height:36px;background:var(--black);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:14px;color:var(--gold);font-weight:500">04</div>
            <div class="h3" style="margin-bottom:8px">Rút vàng thật</div>
            <p class="body-sm">QR động, nhận tại quầy toàn quốc</p>
          </div>
        </div>
      </div>
    `;
  },
  init(container) {
    // No page-specific interactivity needed on home page
  }
};
