import React from 'react';
import { MapPin } from 'lucide-react';

export default function O2OGuide() {
  return (
    <div className="neo-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
      <div className="h3" style={{ marginBottom: '24px', letterSpacing: '-0.5px', fontSize: '20px' }}>Quy trình nhận vàng vật chất</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, position: 'relative' }}>
        <div style={{ position: 'absolute', left: '15px', top: '30px', bottom: '30px', width: '2px', background: 'linear-gradient(180deg, var(--gold) 0%, rgba(212,175,55,0) 100%)', zIndex: 0 }}></div>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: '13px', fontWeight: 700, flexShrink: 0, boxShadow: '0 0 15px rgba(212,175,55,0.2)' }}>
            1
          </div>
          <div style={{ paddingTop: '4px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Mua tích lũy trực tuyến</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Sử dụng số dư ví VND để mua vàng trực tuyến theo giá chốt niêm yết trên bảng trực tuyến bất kỳ lúc nào.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid rgba(212,175,55,0.5)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
            2
          </div>
          <div style={{ paddingTop: '4px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Tạo hợp đồng & Hóa đơn số</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Hệ thống tự động sinh Hợp đồng điện tử ký số và mã QR xác thực. Mức độ bảo mật đa lớp chuẩn ngân hàng.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
            3
          </div>
          <div style={{ paddingTop: '4px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Nhận vàng vật chất tại tiệm</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Đến mạng lưới cửa hàng của chúng tôi, xuất trình mã QR cá nhân cùng CCCD để nhận được vàng thật 100%.
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ padding: '8px', background: 'rgba(212,175,55,0.1)', borderRadius: '8px' }}>
           <MapPin size={20} color="var(--gold)" />
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          <strong style={{ color: '#fff', display: 'block' }}>Địa chỉ quầy giao dịch chính</strong>
          Trụ sở khối GoldChain, Q.1, TP. Hồ Chí Minh
        </span>
      </div>
    </div>
  );
}
