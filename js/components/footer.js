export function renderFooter() {
  return `
    <div class="footer">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="logo">
            <div class="logo-mark"><span>G</span></div>
            <span class="logo-text" style="color:var(--white)">GOLD<em>CHAIN</em></span>
          </div>
          <p>Nền tảng giao dịch vàng O2O uy tín — mua bán, tích lũy và rút vàng vật chất an toàn.</p>
        </div>
        <div class="footer-col">
          <h4>SẢN PHẨM</h4>
          <a href="#trade">Mua vàng online</a>
          <a href="#dca">Tích lũy DCA</a>
          <a>Gửi giữ hộ</a>
          <a href="#trade">Bảng giá</a>
        </div>
        <div class="footer-col">
          <h4>PHÁP LÝ</h4>
          <a>Điều khoản giao dịch</a>
          <a>Chính sách bảo mật</a>
          <a>Hướng dẫn sử dụng</a>
          <a>Phí & biểu giá</a>
        </div>
        <div class="footer-col">
          <h4>HỖ TRỢ</h4>
          <a>Hotline: 1800-6789</a>
          <a>Email: cs@goldchain.vn</a>
          <a>Facebook</a>
          <a>Zalo OA</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span style="font-size:12px">© 2024 GoldChain JSC. Giấy phép NHNN số 123/GP-NHNN</span>
        <div style="display:flex;gap:12px">
          <span style="font-size:12px;color:var(--gray-400)">Được bảo vệ bởi SSL 256-bit</span>
        </div>
      </div>
    </div>
  `;
}
