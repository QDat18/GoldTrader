import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <div className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link to="/" className="logo">
            <div className="logo-mark"><span>G</span></div>
            <span className="logo-text" style={{color: 'var(--white)'}}>GOLD<em>CHAIN</em></span>
          </Link>
          <p>Nền tảng giao dịch vàng O2O uy tín — mua bán, tích lũy và rút vàng vật chất an toàn.</p>
        </div>
        <div className="footer-col">
          <h4>SẢN PHẨM</h4>
          <Link to="/trade">Mua vàng online</Link>
          <Link to="/dca">Tích lũy DCA</Link>
          <Link to="#">Gửi giữ hộ</Link>
          <Link to="/prices">Bảng giá</Link>
        </div>
        <div className="footer-col">
          <h4>PHÁP LÝ</h4>
          <Link to="/terms">Điều khoản giao dịch</Link>
          <Link to="/privacy">Chính sách bảo mật</Link>
          <Link to="/guide">Hướng dẫn sử dụng</Link>
          <Link to="/fees">Phí & biểu giá</Link>
        </div>
        <div className="footer-col">
          <h4>HỖ TRỢ</h4>
          <a href="tel:18006789">Hotline: 1800-6789</a>
          <a href="mailto:cs@goldchain.vn">Email: cs@goldchain.vn</a>
          <a href="https://web.facebook.com/tanloc240105" target="_blank" rel="noreferrer">Facebook</a>
          <a href="https://zalo.me/18006789" target="_blank" rel="noreferrer">Zalo OA</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span style={{fontSize: '12px'}}>© 2024 GoldChain JSC. Giấy phép NHNN số 123/GP-NHNN</span>
        <div style={{display: 'flex', gap: '12px'}}>
          <span style={{fontSize: '12px', color: 'var(--gray-400)'}}>Được bảo vệ bởi SSL 256-bit</span>
        </div>
      </div>
    </div>
  );
}
