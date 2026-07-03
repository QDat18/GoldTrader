import React from 'react';
import useStore from '../store/useStore';

export default function Ticker() {
  const prices = useStore((state) => state.goldPrices);

  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        {/* Render multiple times to make the marquee smooth and continuous */}
        {[1, 2, 3].map((set) => (
          <React.Fragment key={set}>
            <div className="ticker-item">
              <span className="ticker-name">SJC 1 CHỈ</span>
              <span className="ticker-price">{prices.sjc.sell.toLocaleString('vi-VN')}</span>
              <span className={`ticker-change ${prices.sjc.up ? 'up' : 'dn'}`}>
                {prices.sjc.up ? '▲' : '▼'} {prices.sjc.change}
              </span>
            </div>
            <div className="ticker-item">
              <span className="ticker-name">SJC 10 CHỈ</span>
              <span className="ticker-price">{(prices.sjc.sell * 10).toLocaleString('vi-VN')}</span>
              <span className={`ticker-change ${prices.sjc.up ? 'up' : 'dn'}`}>
                {prices.sjc.up ? '▲' : '▼'} {prices.sjc.change}
              </span>
            </div>
            <div className="ticker-item">
              <span className="ticker-name">PNJ 9999</span>
              <span className="ticker-price">{prices.pnj.sell.toLocaleString('vi-VN')}</span>
              <span className={`ticker-change ${prices.pnj.up ? 'up' : 'dn'}`}>
                {prices.pnj.up ? '▲' : '▼'} {prices.pnj.change}
              </span>
            </div>
            <div className="ticker-item">
              <span className="ticker-name">DOJI 999.9</span>
              <span className="ticker-price">{prices.doji.sell.toLocaleString('vi-VN')}</span>
              <span className={`ticker-change ${prices.doji.up ? 'up' : 'dn'}`}>
                {prices.doji.up ? '▲' : '▼'} {prices.doji.change}
              </span>
            </div>
            <div className="ticker-item">
              <span className="ticker-name">XAU/USD</span>
              <span className="ticker-price">2,318.40</span>
              <span className="ticker-change up">▲ +0.18%</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
