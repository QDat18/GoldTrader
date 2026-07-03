import store from '../store.js';

export function renderUserTicker() {
  const prices = store.state.goldPrices;
  return `
    <div class="ticker-bar">
      <div class="ticker-item">
        <span class="ticker-name">SJC 1 CHỈ</span>
        <span class="ticker-price">${prices.sjc.sell.toLocaleString('vi-VN')}</span>
        <span class="ticker-change up">▲ +0.34%</span>
      </div>
      <div class="ticker-item">
        <span class="ticker-name">SJC 10 CHỈ</span>
        <span class="ticker-price">${(prices.sjc.sell * 10).toLocaleString('vi-VN')}</span>
        <span class="ticker-change up">▲ +0.31%</span>
      </div>
      <div class="ticker-item">
        <span class="ticker-name">PNJ 9999</span>
        <span class="ticker-price">${prices.pnj.sell.toLocaleString('vi-VN')}</span>
        <span class="ticker-change dn">▼ -0.12%</span>
      </div>
      <div class="ticker-item">
        <span class="ticker-name">DOJI</span>
        <span class="ticker-price">${prices.doji.sell.toLocaleString('vi-VN')}</span>
        <span class="ticker-change up">▲ +0.22%</span>
      </div>
      <div class="ticker-item">
        <span class="ticker-name">XAU/USD</span>
        <span class="ticker-price">2,318.40</span>
        <span class="ticker-change up">▲ +0.18%</span>
      </div>
    </div>
  `;
}

export function renderAdminTicker() {
  const prices = store.state.goldPrices;
  return `
    <div class="ticker">
      <div style="display:flex;gap:6px;align-items:center">
        <span class="tk-name">SJC</span>
        <span class="tk-price">${prices.sjc.sell.toLocaleString('vi-VN')}</span>
        <span class="tk-up">▲ +0.34%</span>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <span class="tk-name">PNJ</span>
        <span class="tk-price">${prices.pnj.sell.toLocaleString('vi-VN')}</span>
        <span class="tk-dn">▼ -0.12%</span>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <span class="tk-name">Tổng GD hôm nay</span>
        <span class="tk-price">₫1.24B</span>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <span class="tk-name">User online</span>
        <span class="tk-price">342</span>
      </div>
    </div>
  `;
}
