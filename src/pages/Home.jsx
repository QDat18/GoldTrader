import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore';
import { TrendingUp, TrendingDown, UserPlus, Fingerprint, Wallet, CandlestickChart, ShieldCheck } from 'lucide-react';

const LiveMiniChart = () => {
  const [price, setPrice] = useState(2318.40);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPrice(prev => {
        const change = (Math.random() - 0.4) * 2; // slightly biased to go up
        return Number((prev + change).toFixed(2));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{background: 'var(--bg-card)', padding: '16px 24px', borderRadius: '12px', border: 'var(--border-gold)', width: 'fit-content', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 20px rgba(212,175,55,0.15)'}}>
      <svg width="48" height="32" viewBox="0 0 48 32">
        <rect x="0" y="16" width="6" height="16" rx="2" fill="var(--emerald)">
          <animate attributeName="y" values="16; 8; 16" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="height" values="16; 24; 16" dur="1.2s" repeatCount="indefinite" />
        </rect>
        <rect x="10" y="8" width="6" height="24" rx="2" fill="var(--emerald)">
          <animate attributeName="y" values="8; 18; 8" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="height" values="24; 14; 24" dur="1.5s" repeatCount="indefinite" />
        </rect>
        <rect x="20" y="12" width="6" height="20" rx="2" fill="var(--emerald)">
          <animate attributeName="y" values="12; 4; 12" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="height" values="20; 28; 20" dur="1.8s" repeatCount="indefinite" />
        </rect>
        <rect x="30" y="20" width="6" height="12" rx="2" fill="var(--emerald)">
          <animate attributeName="y" values="20; 10; 20" dur="1.3s" repeatCount="indefinite" />
          <animate attributeName="height" values="12; 22; 12" dur="1.3s" repeatCount="indefinite" />
        </rect>
        <rect x="40" y="6" width="6" height="26" rx="2" fill="var(--gold)">
          <animate attributeName="y" values="6; 16; 6" dur="2s" repeatCount="indefinite" />
          <animate attributeName="height" values="26; 16; 26" dur="2s" repeatCount="indefinite" />
        </rect>
      </svg>
      <div>
        <div style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px'}}>XAU/USD Live</div>
        <div style={{fontSize: '20px', fontWeight: 'bold', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px'}}>
          ${price.toLocaleString('en-US', {minimumFractionDigits: 2})} 
          <span style={{fontSize:'12px', color: 'var(--emerald)', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px'}}>▲ +0.18%</span>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const prices = useStore(state => state.goldPrices);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '80px' }}>
      
      {/* SECTION 1: HERO */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '48px', minHeight: '85vh', padding: '0 32px', alignItems: 'center', marginTop: '40px' }}>
        
        {/* Left: Value Proposition */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="tag" style={{ marginBottom: '24px', alignSelf: 'flex-start' }}>NỀN TẢNG VÀNG SỐ O2O</div>
          <h1 className="h1" style={{ marginBottom: '24px', fontSize: '56px' }}>
            Tích lũy vàng thông minh<br />
            <span className="gold-text">từ 100.000đ</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginBottom: '40px', maxWidth: '540px', lineHeight: '1.8' }}>
            Mua &mdash; tích lũy &mdash; rút vàng thật tại quầy. Giá khớp lệnh theo thời gian thực, bảo mật tuyệt đối với công nghệ Blockchain. Không cần đến tiệm để đặt lệnh.
          </p>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/register" className="btn btn-gold" style={{padding: '16px 40px', fontSize: '16px', fontWeight: 'bold'}}>Bắt đầu miễn phí</Link>
            <Link to="/trade" className="btn btn-outline" style={{padding: '16px 40px', fontSize: '16px'}}>Xem bảng giá</Link>
          </div>
        </div>

        {/* Right: Live Trading Board */}
        <div className="neo-card" style={{ background: '#050505', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', border: '1px solid rgba(212, 175, 55, 0.15)', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <h3 className="h3 gold-text" style={{ fontSize: '14px', letterSpacing: '0.1em' }}>BÁO GIÁ TRỰC TIẾP</h3>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--emerald)' }}>
              <span style={{ width: '8px', height: '8px', background: 'var(--emerald)', borderRadius: '50%', boxShadow: '0 0 8px var(--emerald)' }}></span> Live
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
            {['sjc_1l', 'sjc_1c', 'sjc_nhan', 'sjc_trangsuc', 'doji_hn', 'doji_hcm', 'pnj_hn', 'pnj_hcm'].map((key) => {
              const item = prices[key];
              if (!item) return null;
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', transition: '0.3s', border: '1px solid rgba(255,255,255,0.03)' }} className="hover-highlight">
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: item.up ? 'var(--emerald)' : 'var(--ruby)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {item.change}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', color: 'var(--emerald)', fontWeight: '500' }}>Mua: ₫{item.sell.toLocaleString('vi-VN')}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Bán: ₫{item.buy.toLocaleString('vi-VN')}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <Link to="/trade" className="btn" style={{ width: '100%', padding: '16px', marginTop: '8px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            Giao dịch ngay
          </Link>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS (Timeline) */}
      <section style={{ padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div className="tag" style={{ marginBottom: '16px' }}>QUY TRÌNH</div>
          <h2 className="h2">Chỉ 4 bước đơn giản</h2>
          <p className="body-sm" style={{ marginTop: '12px' }}>Tham gia hệ sinh thái giao dịch vàng an toàn nhất Việt Nam chỉ trong vài phút.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', position: 'relative' }}>
          {/* Connector Line */}
          <div style={{ position: 'absolute', top: '40px', left: '12%', right: '12%', height: '2px', background: 'var(--border-gold)', zIndex: 0 }}></div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 0 20px rgba(212,175,55,0.2)' }}>
              <UserPlus size={32} color="var(--gold)" />
            </div>
            <h3 className="h3" style={{ marginBottom: '12px' }}>1. Đăng ký</h3>
            <p className="body-sm">Tạo tài khoản miễn phí trong 30 giây bằng Email hoặc Số điện thoại.</p>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 0 20px rgba(212,175,55,0.2)' }}>
              <Fingerprint size={32} color="var(--gold)" />
            </div>
            <h3 className="h3" style={{ marginBottom: '12px' }}>2. Xác thực eKYC</h3>
            <p className="body-sm">Bảo mật tài khoản bằng CCCD để mở khóa các tính năng nạp/rút.</p>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 0 20px rgba(212,175,55,0.2)' }}>
              <Wallet size={32} color="var(--gold)" />
            </div>
            <h3 className="h3" style={{ marginBottom: '12px' }}>3. Nạp tiền</h3>
            <p className="body-sm">Nạp VND vào ví GoldChain miễn phí qua VietQR 24/7.</p>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 0 20px rgba(212,175,55,0.2)' }}>
              <CandlestickChart size={32} color="var(--gold)" />
            </div>
            <h3 className="h3" style={{ marginBottom: '12px' }}>4. Giao dịch</h3>
            <p className="body-sm">Bắt đầu mua vàng tích lũy chỉ từ 0.01 chỉ, và chốt lời dễ dàng.</p>
          </div>
        </div>
      </section>

      {/* SECTION 4: TRUST & SECURITY */}
      <section style={{ padding: '60px 32px', background: 'rgba(212, 175, 55, 0.03)', borderTop: 'var(--border-silver)', borderBottom: 'var(--border-silver)', marginTop: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
          
          <div>
            <h2 className="h2" style={{ marginBottom: '20px' }}>An toàn. Minh bạch. <br/><span className="gold-text">Được tin dùng.</span></h2>
            <p className="body-sm" style={{ marginBottom: '32px', fontSize: '16px', lineHeight: '1.8' }}>
              Tại GoldChain, mọi giao dịch mua bán đều được ghi nhận bằng Hợp đồng điện tử (Smart Contract) trên nền tảng Blockchain. Dữ liệu của bạn được mã hóa chuẩn quân đội (AES-256), đảm bảo tiền và vàng của bạn luôn trong tầm kiểm soát tuyệt đối.
            </p>
            <div style={{ display: 'flex', gap: '32px' }}>
              <div>
                <div className="h1 gold-text" style={{ fontSize: '36px', marginBottom: '4px' }}>12.400+</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Khách hàng</div>
              </div>
              <div>
                <div className="h1 gold-text" style={{ fontSize: '36px', marginBottom: '4px' }}>đ482B</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Khối lượng GD</div>
              </div>
              <div>
                <div className="h1 gold-text" style={{ fontSize: '36px', marginBottom: '4px' }}>99.9%</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Uptime</div>
              </div>
            </div>
          </div>

          <div className="neo-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center', padding: '40px' }}>
            <ShieldCheck size={48} color="var(--emerald)" />
            <h3 className="h3">Bảo chứng tài sản vật lý 1:1</h3>
            <p className="body-sm" style={{ maxWidth: '300px' }}>
              Mỗi chỉ vàng số (Digital Gold) của bạn luôn được bảo chứng bằng 1 chỉ vàng vật lý tương ứng lưu trữ tại các két an toàn đối tác của SJC, PNJ.
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <div style={{ padding: '8px 16px', border: '1px solid var(--border-silver)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>Vietcombank</div>
              <div style={{ padding: '8px 16px', border: '1px solid var(--border-silver)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>Techcombank</div>
              <div style={{ padding: '8px 16px', border: '1px solid var(--border-silver)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>SJC Partner</div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
