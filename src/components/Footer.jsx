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
          <Link to="/trade">Bảng giá</Link>
        </div>
        <div className="footer-col">
          <h4>PHÁP LÝ</h4>
          <Link to="#">Điều khoản giao dịch</Link>
          <Link to="#">Chính sách bảo mật</Link>
          <Link to="#">Hướng dẫn sử dụng</Link>
          <Link to="#">Phí & biểu giá</Link>
        </div>
        <div className="footer-col">
          <h4>HỖ TRỢ</h4>
          <Link to="#">Hotline: 1800-6789</Link>
          <Link to="#">Email: cs@goldchain.vn</Link>
          <Link to="#">Facebook</Link>
          <Link to="#">Zalo OA</Link>
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
