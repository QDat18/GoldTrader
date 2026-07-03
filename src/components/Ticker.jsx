import React from 'react';
import useStore from '../store/useStore';

export default function Ticker() {
  const prices = useStore((state) => state.goldPrices);

  const goldKeys = [
    'sjc_1l',
    'sjc_1c',
    'sjc_nhan',
    'sjc_trangsuc',
    'doji_hn',
    'doji_hcm',
    'pnj_hn',
    'pnj_hcm'
  ];

  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        {/* Render multiple times to make the marquee smooth and continuous */}
        {[1, 2, 3].map((set) => (
          <React.Fragment key={set}>
            {goldKeys.map((key) => {
              const item = prices[key];
              if (!item) return null;
              
              // Loại bỏ ký tự mũi tên trùng lặp trong chuỗi change nếu có
              const cleanChange = item.change ? item.change.replace(/[▲▼]\s*/g, '') : '0.00%';
              const isUp = item.up;
              
              return (
                <div className="ticker-item" key={`${key}-${set}`}>
                  <span className="ticker-name">{item.name.toUpperCase()}</span>
                  <span className="ticker-price">₫{item.sell.toLocaleString('vi-VN')}</span>
                  <span className={`ticker-change ${isUp ? 'up' : 'dn'}`}>
                    {isUp ? '▲' : '▼'} {cleanChange}
                  </span>
                </div>
              );
            })}
            
            {/* Tỷ giá vàng thế giới tham khảo */}
            <div className="ticker-item" key={`xau-usd-${set}`}>
              <span className="ticker-name">XAU/USD (THẾ GIỚI)</span>
              <span className="ticker-price">2,318.40</span>
              <span className="ticker-change up">▲ 0.18%</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
