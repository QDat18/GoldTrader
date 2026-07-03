import store from '../store.js';

export const pageTrade = {
  activeTab: 'buy', // 'buy' or 'sell'
  selectedGold: 'sjc', // 'sjc', 'pnj', 'doji'
  timerInterval: null,

  render() {
    const prices = store.state.goldPrices;
    const balances = store.state.goldBalances;
    const wallet = store.state.walletBalance;
    const currentPrice = this.activeTab === 'buy' ? prices[this.selectedGold].sell : prices[this.selectedGold].buy;
    const currentGoldBalance = balances[this.selectedGold];

    return `
      <div style="display:grid;grid-template-columns:1fr 340px;gap:0;min-height:520px">
        <div style="padding:20px;border-right:0.5px solid var(--gray-200)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div class="h3" id="chart-title">Biểu đồ giá ${prices[this.selectedGold].name}</div>
            <div style="display:flex;gap:4px">
              <button class="btn" style="font-size:12px;padding:4px 10px">1H</button>
              <button class="btn" style="font-size:12px;padding:4px 10px;background:var(--black);color:var(--gold);border-color:var(--black)">1D</button>
              <button class="btn" style="font-size:12px;padding:4px 10px">1W</button>
              <button class="btn" style="font-size:12px;padding:4px 10px">1M</button>
            </div>
          </div>
          <div class="chart-placeholder" style="height:260px">[ Biểu đồ Candlestick — Giá vàng theo khung thời gian ]</div>
          <div class="divider"></div>
          <div class="h3" style="margin-bottom:10px">Bảng giá tất cả loại vàng</div>
          <table class="table" id="prices-table">
            <thead>
              <tr>
                <th>Loại vàng</th>
                <th>Giá mua</th>
                <th>Giá bán</th>
                <th>Chênh lệch</th>
                <th>Biến động 24h</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr data-gold="sjc" style="cursor:pointer; ${this.selectedGold === 'sjc' ? 'background:var(--gray-50)' : ''}">
                <td style="font-weight:500">SJC 1 Chỉ</td>
                <td class="price-dn">₫${prices.sjc.buy.toLocaleString('vi-VN')}</td>
                <td class="price-up">₫${prices.sjc.sell.toLocaleString('vi-VN')}</td>
                <td class="body-sm">₫${prices.sjc.diff.toLocaleString('vi-VN')}</td>
                <td class="price-up">${prices.sjc.change}</td>
                <td><button class="btn-gold btn btn-select-gold" data-gold="sjc" style="font-size:12px;padding:4px 12px">Chọn</button></td>
              </tr>
              <tr data-gold="pnj" style="cursor:pointer; ${this.selectedGold === 'pnj' ? 'background:var(--gray-50)' : ''}">
                <td style="font-weight:500">PNJ 9999</td>
                <td class="price-dn">₫${prices.pnj.buy.toLocaleString('vi-VN')}</td>
                <td class="price-up">₫${prices.pnj.sell.toLocaleString('vi-VN')}</td>
                <td class="body-sm">₫${prices.pnj.diff.toLocaleString('vi-VN')}</td>
                <td class="price-dn">${prices.pnj.change}</td>
                <td><button class="btn-gold btn btn-select-gold" data-gold="pnj" style="font-size:12px;padding:4px 12px">Chọn</button></td>
              </tr>
              <tr data-gold="doji" style="cursor:pointer; ${this.selectedGold === 'doji' ? 'background:var(--gray-50)' : ''}">
                <td style="font-weight:500">DOJI 999.9</td>
                <td class="price-dn">₫${prices.doji.buy.toLocaleString('vi-VN')}</td>
                <td class="price-up">₫${prices.doji.sell.toLocaleString('vi-VN')}</td>
                <td class="body-sm">₫${prices.doji.diff.toLocaleString('vi-VN')}</td>
                <td class="price-up">${prices.doji.change}</td>
                <td><button class="btn-gold btn btn-select-gold" data-gold="doji" style="font-size:12px;padding:4px 12px">Chọn</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="padding:20px; background: var(--white);">
          <div style="display:flex;gap:0;margin-bottom:16px">
            <button id="tab-buy" class="btn" style="flex:1; ${this.activeTab === 'buy' ? 'background:var(--black);color:var(--gold);border-color:var(--black);' : ''}">Mua vào</button>
            <button id="tab-sell" class="btn" style="flex:1; ${this.activeTab === 'sell' ? 'background:var(--black);color:var(--gold);border-color:var(--black);' : ''}">Bán ra</button>
          </div>
          <div class="form-group">
            <label class="form-label">Loại vàng</label>
            <select class="form-input" id="select-gold-type">
              <option value="sjc" ${this.selectedGold === 'sjc' ? 'selected' : ''}>SJC 1 Chỉ — ₫${prices.sjc.sell.toLocaleString('vi-VN')}/chỉ</option>
              <option value="pnj" ${this.selectedGold === 'pnj' ? 'selected' : ''}>PNJ 9999 — ₫${prices.pnj.sell.toLocaleString('vi-VN')}/chỉ</option>
              <option value="doji" ${this.selectedGold === 'doji' ? 'selected' : ''}>DOJI 999.9 — ₫${prices.doji.sell.toLocaleString('vi-VN')}/chỉ</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Số lượng (chỉ)</label>
            <input class="form-input" id="input-qty" placeholder="0.00" type="number" step="0.01" min="0.01">
            <div class="form-hint" id="available-info">
              ${this.activeTab === 'buy'
                ? `Số dư ví khả dụng: ₫${wallet.toLocaleString('vi-VN')}`
                : `Sở hữu khả dụng: ${currentGoldBalance.toFixed(2)} chỉ`}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Số tiền (VNĐ)</label>
            <input class="form-input" id="input-amount" placeholder="0" type="number" step="1000">
            <div class="form-hint">Tối thiểu ₫100.000</div>
          </div>
          <div style="background:var(--gray-50);padding:12px;margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
              <span class="body-sm">Giá khóa (60 giây)</span>
              <span style="color:var(--gold);font-weight:500" id="locked-price">₫${currentPrice.toLocaleString('vi-VN')}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
              <span class="body-sm">Phí giao dịch</span>
              <span>₫0 (miễn phí)</span>
            </div>
            <div class="divider" style="margin:8px 0"></div>
            <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:500">
              <span id="label-total-payment">${this.activeTab === 'buy' ? 'Tổng thanh toán' : 'Tổng nhận về'}</span>
              <span id="val-total-payment">₫0</span>
            </div>
          </div>
          <div style="background:var(--gold-pale);border:0.5px solid var(--gold);padding:8px 12px;margin-bottom:12px;display:flex;align-items:center;gap:8px">
            <div style="font-size:13px;color:#7A5A10">
              <i class="ti ti-clock" style="font-size:14px;vertical-align:-2px;margin-right:4px"></i>Giá được khóa trong <span style="font-weight:500" id="timer">60</span> giây
            </div>
          </div>
          <button class="btn-gold btn" id="btn-submit-order" style="width:100%;padding:11px" disabled>
            Xác nhận ${this.activeTab === 'buy' ? 'mua' : 'bán'}
          </button>
          <p class="body-sm" style="text-align:center;margin-top:10px" id="order-hint">
            ${this.activeTab === 'buy'
              ? 'Lệnh mua sẽ tạo hóa đơn điện tử và mã QR nhận vàng'
              : 'Lệnh bán sẽ khấu trừ số dư vàng và cộng tiền vào ví'}
          </p>
        </div>
      </div>
    `;
  },

  init(container) {
    this.startTimer(container);

    const selectGold = container.querySelector('#select-gold-type');
    const inputQty = container.querySelector('#input-qty');
    const inputAmount = container.querySelector('#input-amount');
    const valTotal = container.querySelector('#val-total-payment');
    const btnSubmit = container.querySelector('#btn-submit-order');
    const tabBuy = container.querySelector('#tab-buy');
    const tabSell = container.querySelector('#tab-sell');

    const updateCalculations = (changedInput) => {
      const prices = store.state.goldPrices;
      const price = this.activeTab === 'buy' ? prices[this.selectedGold].sell : prices[this.selectedGold].buy;

      if (changedInput === 'qty') {
        const qty = parseFloat(inputQty.value);
        if (!isNaN(qty) && qty > 0) {
          const total = qty * price;
          inputAmount.value = Math.round(total);
          valTotal.textContent = `₫${Math.round(total).toLocaleString('vi-VN')}`;
          btnSubmit.disabled = false;
          btnSubmit.textContent = `Xác nhận ${this.activeTab === 'buy' ? 'mua' : 'bán'} — ₫${Math.round(total).toLocaleString('vi-VN')}`;
        } else {
          inputAmount.value = '';
          valTotal.textContent = '₫0';
          btnSubmit.disabled = true;
          btnSubmit.textContent = `Xác nhận ${this.activeTab === 'buy' ? 'mua' : 'bán'}`;
        }
      } else {
        const amt = parseFloat(inputAmount.value);
        if (!isNaN(amt) && amt >= 100000) {
          const qty = amt / price;
          inputQty.value = qty.toFixed(4);
          valTotal.textContent = `₫${Math.round(amt).toLocaleString('vi-VN')}`;
          btnSubmit.disabled = false;
          btnSubmit.textContent = `Xác nhận ${this.activeTab === 'buy' ? 'mua' : 'bán'} — ₫${Math.round(amt).toLocaleString('vi-VN')}`;
        } else {
          inputQty.value = '';
          valTotal.textContent = '₫0';
          btnSubmit.disabled = true;
          btnSubmit.textContent = `Xác nhận ${this.activeTab === 'buy' ? 'mua' : 'bán'}`;
        }
      }
    };

    // Table rows select
    container.querySelectorAll('#prices-table tbody tr').forEach(row => {
      row.addEventListener('click', (e) => {
        const gold = row.getAttribute('data-gold');
        this.selectedGold = gold;
        selectGold.value = gold;
        this.updateStateUI(container);
      });
    });

    // Dropdown change
    selectGold.addEventListener('change', (e) => {
      this.selectedGold = e.target.value;
      this.updateStateUI(container);
    });

    // Inputs change
    inputQty.addEventListener('input', () => updateCalculations('qty'));
    inputAmount.addEventListener('input', () => updateCalculations('amount'));

    // Switch Tabs
    tabBuy.addEventListener('click', () => {
      this.activeTab = 'buy';
      this.updateStateUI(container);
    });

    tabSell.addEventListener('click', () => {
      this.activeTab = 'sell';
      this.updateStateUI(container);
    });

    // Submit Order
    btnSubmit.addEventListener('click', () => {
      const qty = parseFloat(inputQty.value);
      const amt = parseFloat(inputAmount.value);
      const prices = store.state.goldPrices;
      const price = this.activeTab === 'buy' ? prices[this.selectedGold].sell : prices[this.selectedGold].buy;

      if (isNaN(qty) || qty <= 0) return;

      try {
        if (this.activeTab === 'buy') {
          // Perform purchase
          const orderId = store.buyGold(this.selectedGold, qty, price);
          alert('Mua vàng thành công! Đã tạo hóa đơn điện tử O2O.');
          window.location.hash = `#order?id=${orderId}`;
        } else {
          // Perform sell
          store.sellGold(this.selectedGold, qty, price);
          alert('Bán vàng thành công! Tiền đã được cộng vào số dư ví của bạn.');
          window.location.hash = '#dashboard';
        }
      } catch (err) {
        alert(err.message);
      }
    });
  },

  updateStateUI(container) {
    const prices = store.state.goldPrices;
    const balances = store.state.goldBalances;
    const wallet = store.state.walletBalance;

    const currentPrice = this.activeTab === 'buy' ? prices[this.selectedGold].sell : prices[this.selectedGold].buy;
    const currentGoldBalance = balances[this.selectedGold];

    // Highlight row in table
    container.querySelectorAll('#prices-table tbody tr').forEach(row => {
      const gold = row.getAttribute('data-gold');
      if (gold === this.selectedGold) {
        row.style.background = 'var(--gray-50)';
      } else {
        row.style.background = 'transparent';
      }
    });

    // Select input value
    container.querySelector('#select-gold-type').value = this.selectedGold;

    // Tab buttons styles
    const tabBuy = container.querySelector('#tab-buy');
    const tabSell = container.querySelector('#tab-sell');
    if (this.activeTab === 'buy') {
      tabBuy.style.background = 'var(--black)';
      tabBuy.style.color = 'var(--gold)';
      tabBuy.style.borderColor = 'var(--black)';
      tabSell.style.background = 'var(--white)';
      tabSell.style.color = 'var(--black)';
      tabSell.style.borderColor = 'var(--gray-200)';
    } else {
      tabSell.style.background = 'var(--black)';
      tabSell.style.color = 'var(--gold)';
      tabSell.style.borderColor = 'var(--black)';
      tabBuy.style.background = 'var(--white)';
      tabBuy.style.color = 'var(--black)';
      tabBuy.style.borderColor = 'var(--gray-200)';
    }

    // Update labels & hints
    container.querySelector('#chart-title').textContent = `Biểu đồ giá ${prices[this.selectedGold].name}`;
    container.querySelector('#locked-price').textContent = `₫${currentPrice.toLocaleString('vi-VN')}`;
    container.querySelector('#label-total-payment').textContent = this.activeTab === 'buy' ? 'Tổng thanh toán' : 'Tổng nhận về';
    container.querySelector('#available-info').textContent = this.activeTab === 'buy'
      ? `Số dư ví khả dụng: ₫${wallet.toLocaleString('vi-VN')}`
      : `Sở hữu khả dụng: ${currentGoldBalance.toFixed(2)} chỉ`;
    container.querySelector('#btn-submit-order').textContent = `Xác nhận ${this.activeTab === 'buy' ? 'mua' : 'bán'}`;
    container.querySelector('#order-hint').textContent = this.activeTab === 'buy'
      ? 'Lệnh mua sẽ tạo hóa đơn điện tử và mã QR nhận vàng'
      : 'Lệnh bán sẽ khấu trừ số dư vàng và cộng tiền vào ví';

    // Clear inputs and values
    container.querySelector('#input-qty').value = '';
    container.querySelector('#input-amount').value = '';
    container.querySelector('#val-total-payment').textContent = '₫0';
    container.querySelector('#btn-submit-order').disabled = true;

    // Reset price lock timer
    this.resetTimer(container);
  },

  startTimer(container) {
    this.stopTimer();
    let s = 60;
    const timerSpan = container.querySelector('#timer');
    if (timerSpan) timerSpan.textContent = s;

    this.timerInterval = setInterval(() => {
      s--;
      if (s < 0) {
        s = 60;
        // Mock a tiny price fluctuation on timer reset
        const prices = store.state.goldPrices;
        const change = (Math.random() - 0.5) * 5000;
        prices.sjc.sell = Math.round(prices.sjc.sell + change);
        prices.sjc.buy = Math.round(prices.sjc.buy + change);
        store.notify();

        // Update locked price UI
        const currentPrice = this.activeTab === 'buy' ? prices[this.selectedGold].sell : prices[this.selectedGold].buy;
        const lockedPriceEl = container.querySelector('#locked-price');
        if (lockedPriceEl) lockedPriceEl.textContent = `₫${currentPrice.toLocaleString('vi-VN')}`;
      }
      const el = container.querySelector('#timer');
      if (el) el.textContent = s;
    }, 1000);
  },

  resetTimer(container) {
    this.startTimer(container);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  destroy() {
    this.stopTimer();
  }
};
