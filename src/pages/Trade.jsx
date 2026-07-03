import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

export default function Trade() {
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'sell'
  const [selectedGold, setSelectedGold] = useState('sjc');
  const [qty, setQty] = useState('');
  const [amount, setAmount] = useState('');
  const [timer, setTimer] = useState(60);

  const navigate = useNavigate();
  const prices = useStore((state) => state.goldPrices);
  const balances = useStore((state) => state.goldBalances);
  const wallet = useStore((state) => state.walletBalance);
  const buyGold = useStore((state) => state.buyGold);
  const sellGold = useStore((state) => state.sellGold);
  const updateGoldPrice = useStore((state) => state.updateGoldPrice);

  const currentPrice = activeTab === 'buy' ? prices[selectedGold].sell : prices[selectedGold].buy;
  const currentGoldBalance = balances[selectedGold];

  useEffect(() => {
    // 60-second timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // Timer resets, simulate a small price fluctuation
          const change = (Math.random() - 0.5) * 5000;
          updateGoldPrice('sjc', Math.round(prices.sjc.sell + change), Math.round(prices.sjc.buy + change));
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [prices.sjc.sell, prices.sjc.buy, updateGoldPrice]);

  const handleQtyChange = (e) => {
    const val = e.target.value;
    setQty(val);
    if (val && !isNaN(val) && parseFloat(val) > 0) {
      const total = parseFloat(val) * currentPrice;
      setAmount(Math.round(total));
    } else {
      setAmount('');
    }
    // Reset timer on input change to give user 60s
    setTimer(60);
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    if (val && !isNaN(val) && parseFloat(val) >= 100000) {
      const q = parseFloat(val) / currentPrice;
      setQty(q.toFixed(4));
    } else {
      setQty('');
    }
    setTimer(60);
  };

  const handleSelectGold = (gold) => {
    setSelectedGold(gold);
    setQty('');
    setAmount('');
    setTimer(60);
  };

  const handleSubmit = () => {
    const q = parseFloat(qty);
    if (isNaN(q) || q <= 0) return;

    try {
      if (activeTab === 'buy') {
        const orderId = buyGold(selectedGold, q, currentPrice);
        alert('Mua vàng thành công! Đã tạo hóa đơn điện tử O2O.');
        // Currently no order details page yet in react, so we might just go to dashboard
        navigate('/dashboard'); 
      } else {
        sellGold(selectedGold, q, currentPrice);
        alert('Bán vàng thành công! Tiền đã được cộng vào số dư ví của bạn.');
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const isSubmitDisabled = !qty || isNaN(parseFloat(qty)) || parseFloat(qty) <= 0 || (!amount || parseFloat(amount) < 100000 && activeTab === 'buy');
  const totalValue = amount ? parseInt(amount, 10) : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 0, minHeight: '520px', background: 'var(--bg-main)' }}>
      <div style={{ padding: '20px', borderRight: '1px solid var(--border-silver)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div className="h3">Biểu đồ giá {prices[selectedGold].name}</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn" style={{ fontSize: '12px', padding: '4px 10px' }}>1H</button>
            <button className="btn" style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--bg-card)', color: 'var(--gold)', borderColor: 'var(--gold)' }}>1D</button>
            <button className="btn" style={{ fontSize: '12px', padding: '4px 10px' }}>1W</button>
            <button className="btn" style={{ fontSize: '12px', padding: '4px 10px' }}>1M</button>
          </div>
        </div>
        <div className="chart-placeholder" style={{ height: '260px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-silver)', borderRadius: '12px' }}>
          [ Biểu đồ Candlestick — Giá vàng theo khung thời gian ]
        </div>
        <div className="divider" style={{ margin: '20px 0' }}></div>
        <div className="h3" style={{ marginBottom: '10px' }}>Bảng giá tất cả loại vàng</div>
        <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-silver)', color: 'var(--text-muted)', fontSize: '12px' }}>
              <th style={{ padding: '8px' }}>Loại vàng</th>
              <th style={{ padding: '8px' }}>Giá mua</th>
              <th style={{ padding: '8px' }}>Giá bán</th>
              <th style={{ padding: '8px' }}>Chênh lệch</th>
              <th style={{ padding: '8px' }}>Biến động 24h</th>
              <th style={{ padding: '8px' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {['sjc', 'pnj', 'doji'].map((key) => {
              const item = prices[key];
              const isSelected = selectedGold === key;
              return (
                <tr key={key} style={{ cursor: 'pointer', background: isSelected ? 'rgba(212, 175, 55, 0.05)' : 'transparent', borderBottom: '1px solid var(--border-silver)' }} onClick={() => handleSelectGold(key)}>
                  <td style={{ padding: '12px 8px', fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: '12px 8px', color: 'var(--ruby)' }}>₫{item.buy.toLocaleString('vi-VN')}</td>
                  <td style={{ padding: '12px 8px', color: 'var(--emerald)' }}>₫{item.sell.toLocaleString('vi-VN')}</td>
                  <td style={{ padding: '12px 8px', fontSize: '13px' }}>₫{item.diff.toLocaleString('vi-VN')}</td>
                  <td style={{ padding: '12px 8px', color: item.up ? 'var(--emerald)' : 'var(--ruby)' }}>{item.change}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <button className="btn btn-gold" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={(e) => { e.stopPropagation(); handleSelectGold(key); }}>
                      Chọn
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div style={{ padding: '20px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: 0, marginBottom: '16px' }}>
          <button onClick={() => { setActiveTab('buy'); setQty(''); setAmount(''); setTimer(60); }} className="btn" style={{ flex: 1, borderRadius: '8px 0 0 8px', background: activeTab === 'buy' ? 'var(--gold-gradient)' : 'transparent', color: activeTab === 'buy' ? 'var(--bg-main)' : 'var(--text-main)', border: activeTab === 'buy' ? 'none' : '1px solid var(--border-silver)' }}>Mua vào</button>
          <button onClick={() => { setActiveTab('sell'); setQty(''); setAmount(''); setTimer(60); }} className="btn" style={{ flex: 1, borderRadius: '0 8px 8px 0', background: activeTab === 'sell' ? 'var(--gold-gradient)' : 'transparent', color: activeTab === 'sell' ? 'var(--bg-main)' : 'var(--text-main)', border: activeTab === 'sell' ? 'none' : '1px solid var(--border-silver)', borderLeft: 'none' }}>Bán ra</button>
        </div>
        
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Loại vàng</label>
          <select className="form-input" value={selectedGold} onChange={(e) => handleSelectGold(e.target.value)} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-silver)', borderRadius: '8px', color: 'var(--text-main)' }}>
            <option value="sjc" style={{ background: 'var(--bg-card)' }}>SJC 1 Chỉ — ₫{prices.sjc.sell.toLocaleString('vi-VN')}/chỉ</option>
            <option value="pnj" style={{ background: 'var(--bg-card)' }}>PNJ 9999 — ₫{prices.pnj.sell.toLocaleString('vi-VN')}/chỉ</option>
            <option value="doji" style={{ background: 'var(--bg-card)' }}>DOJI 999.9 — ₫{prices.doji.sell.toLocaleString('vi-VN')}/chỉ</option>
          </select>
        </div>
        
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Số lượng (chỉ)</label>
          <input className="form-input" placeholder="0.00" type="number" step="0.01" min="0.01" value={qty} onChange={handleQtyChange} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-silver)', borderRadius: '8px', color: 'var(--text-main)' }} />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {activeTab === 'buy'
              ? `Số dư ví khả dụng: ₫${wallet.toLocaleString('vi-VN')}`
              : `Sở hữu khả dụng: ${currentGoldBalance.toFixed(2)} chỉ`}
          </div>
        </div>
        
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Số tiền (VNĐ)</label>
          <input className="form-input" placeholder="0" type="number" step="1000" value={amount} onChange={handleAmountChange} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-silver)', borderRadius: '8px', color: 'var(--text-main)' }} />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Tối thiểu ₫100.000</div>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-silver)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Giá khóa (60 giây)</span>
            <span style={{ color: 'var(--gold)', fontWeight: 600 }}>₫{currentPrice.toLocaleString('vi-VN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Phí giao dịch</span>
            <span>₫0 (miễn phí)</span>
          </div>
          <div style={{ height: '1px', background: 'var(--border-silver)', marginBottom: '12px' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600 }}>
            <span>{activeTab === 'buy' ? 'Tổng thanh toán' : 'Tổng nhận về'}</span>
            <span>₫{totalValue.toLocaleString('vi-VN')}</span>
          </div>
        </div>
        
        <div style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-clock" style={{ fontSize: '18px', color: 'var(--gold)' }}></i>
          <div style={{ fontSize: '13px', color: 'var(--gold)' }}>
            Giá được khóa trong <span style={{ fontWeight: 600, fontSize: '14px' }}>{timer}</span> giây
          </div>
        </div>
        
        <button className="btn btn-gold" onClick={handleSubmit} disabled={isSubmitDisabled} style={{ width: '100%', padding: '14px', fontSize: '14px', fontWeight: 600, opacity: isSubmitDisabled ? 0.5 : 1 }}>
          Xác nhận {activeTab === 'buy' ? 'mua' : 'bán'} {totalValue > 0 ? `— ₫${totalValue.toLocaleString('vi-VN')}` : ''}
        </button>
        
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
          {activeTab === 'buy'
            ? 'Lệnh mua sẽ tạo hóa đơn điện tử và mã QR nhận vàng'
            : 'Lệnh bán sẽ khấu trừ số dư vàng và cộng tiền vào ví'}
        </p>
      </div>
    </div>
  );
}
