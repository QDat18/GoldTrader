import React from 'react';
import useStore from '../store/useStore';

export default function Ticker() {
  const prices = useStore((state) => state.goldPrices);

  // Dynamic: Lấy toàn bộ key từ goldPrices thay vì fix cứng
  const goldKeys = Object.keys(prices);

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
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
