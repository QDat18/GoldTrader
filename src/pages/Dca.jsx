import React, { useState } from 'react';
import useStore from '../store/useStore';

export default function Dca() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form State
  const [goldType, setGoldType] = useState('sjc');
  const [amount, setAmount] = useState('1000000');
  const [frequency, setFrequency] = useState('Hàng tháng');
  const [day, setDay] = useState('Ngày 1');

  const plans = useStore(state => state.dcaPlans);
  const prices = useStore(state => state.goldPrices);
  const createDcaPlan = useStore(state => state.createDcaPlan);
  const pauseDcaPlan = useStore(state => state.pauseDcaPlan);
  const resumeDcaPlan = useStore(state => state.resumeDcaPlan);
  const cancelDcaPlan = useStore(state => state.cancelDcaPlan);

  // Calculate aggregated stats
  const totalAccumulated = plans.reduce((acc, p) => acc + (p.status === 'running' ? p.amount : 0), 13000000);
  const avgGoldEstimate = (totalAccumulated / prices.sjc.sell).toFixed(2);

  const handleSave = () => {
    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt < 100000) {
      alert('Số tiền tích lũy tối thiểu là ₫100.000');
      return;
    }
    createDcaPlan(goldType, amt, frequency, day);
    setShowCreateForm(false);
    alert('Đã tạo kế hoạch DCA tích lũy vàng định kỳ mới!');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div className="tag" style={{ marginBottom: '6px' }}>TÍCH LŨY TỰ ĐỘNG</div>
          <div className="h2">Kế hoạch DCA</div>
          <p className="body-sm" style={{ marginTop: '4px' }}>Mua vàng định kỳ, tự động trung bình giá — không cần theo dõi thị trường</p>
        </div>
        <button className="btn-gold btn" onClick={() => setShowCreateForm(!showCreateForm)} style={{ flexShrink: 0 }}>
          {showCreateForm ? 'Đóng form' : '+ Tạo kế hoạch mới'}
        </button>
      </div>

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(145deg, rgba(30,30,30,0.8) 0%, rgba(20,20,20,0.9) 100%)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '20px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div className="h3" style={{ marginBottom: '24px', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ti ti-sparkles" style={{ fontSize: '20px' }}></i>
            Tạo kế hoạch tích lũy định kỳ mới
          </div>
          <div className="grid-4" style={{ gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-muted)' }}>Chọn Loại Vàng</label>
              <select className="form-input" value={goldType} onChange={(e) => setGoldType(e.target.value)} style={{ borderRadius: '12px', padding: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                <option value="sjc" style={{ background: '#272729', color: '#fff' }}>SJC 1 Chỉ</option>
                <option value="pnj" style={{ background: '#272729', color: '#fff' }}>PNJ 9999</option>
                <option value="doji" style={{ background: '#272729', color: '#fff' }}>DOJI 999.9</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Số Tiền Tích Lũy / Kỳ</label>
              <input className="form-input" type="number" placeholder="₫1.000.000" min="100000" step="100000" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ borderRadius: '12px', padding: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-muted)' }}>Tần Suất</label>
              <select className="form-input" value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ borderRadius: '12px', padding: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                <option value="Hàng tuần" style={{ background: '#272729', color: '#fff' }}>Hàng tuần</option>
                <option value="Hàng tháng" style={{ background: '#272729', color: '#fff' }}>Hàng tháng</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-muted)' }}>Ngày thực hiện</label>
              <select className="form-input" value={day} onChange={(e) => setDay(e.target.value)} style={{ borderRadius: '12px', padding: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                <option value="Thứ Hai" style={{ background: '#272729', color: '#fff' }}>Thứ Hai (Hàng tuần)</option>
                <option value="Ngày 1" style={{ background: '#272729', color: '#fff' }}>Ngày 1 (Hàng tháng)</option>
                <option value="Ngày 15" style={{ background: '#272729', color: '#fff' }}>Ngày 15 (Hàng tháng)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button className="btn" onClick={() => setShowCreateForm(false)} style={{ borderRadius: '99px', padding: '10px 24px' }}>Hủy</button>
            <button className="btn btn-gold" onClick={handleSave} style={{ borderRadius: '99px', padding: '10px 24px', background: 'var(--gold-gradient)', color: '#000', fontWeight: 600 }}>Kích hoạt kế hoạch</button>
          </div>
        </div>
      )}

      <div className="grid-3" style={{ marginBottom: '32px', gap: '20px' }}>
        <div className="card" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, rgba(30,30,30,0.6) 0%, rgba(20,20,20,0.8) 100%)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', padding: '24px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: 'var(--gold-gradient)' }}></div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px' }}>TỔNG ĐÃ TÍCH LŨY</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>₫{totalAccumulated.toLocaleString('vi-VN')}</div>
          <div style={{ fontSize: '13px', color: 'var(--emerald)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i className="ti ti-trending-up"></i> +{avgGoldEstimate} chỉ SJC (Ước tính)
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', marginTop: '16px', overflow: 'hidden' }}>
            <div style={{ width: '58%', height: '100%', background: 'var(--gold-gradient)' }}></div>
          </div>
          <div className="body-sm" style={{ marginTop: '6px', color: 'var(--text-muted)' }}>58% mục tiêu năm (10 chỉ)</div>
        </div>
        <div className="card" style={{ borderRadius: '24px', background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px' }}>GIẢM RỦI RO</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--emerald)', marginTop: '8px' }}>-12.4%</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>So với mua một lần tại đỉnh</div>
        </div>
        <div className="card" style={{ borderRadius: '24px', background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px' }}>LẦN THỰC HIỆN TIẾP</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>01/02/2026</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Còn 12 ngày · Hàng tháng</div>
        </div>
      </div>

      <div className="h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="ti ti-list-check" style={{ color: 'var(--gold)' }}></i>
        Kế hoạch đang hoạt động
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {plans.length > 0 ? plans.map(p => {
          const isRunning = p.status === 'running';
          return (
            <div key={p.id} className="card" style={{ borderRadius: '20px', padding: '24px', background: 'rgba(30,30,30,0.5)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: isRunning ? 'var(--gold-gradient)' : 'var(--text-muted)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>LOẠI VÀNG</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{p.goldTypeName}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>SỐ TIỀN / KỲ</div><div style={{ fontSize: '16px', fontWeight: 600 }}>₫{p.amount.toLocaleString('vi-VN')}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>TẦN SUẤT</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{p.frequency}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>NGÀY CHẠY</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{p.day}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>ĐÃ THỰC HIỆN</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{p.executedCount} lần</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>GIÁ VỐN TB</div><div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold)' }}>₫{p.avgPrice.toLocaleString('vi-VN')}</div></div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {isRunning ? (
                    <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '99px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', fontWeight: 600, border: '1px solid rgba(16,185,129,0.2)' }}>Đang chạy</span>
                  ) : (
                    <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '99px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>Đã tạm dừng</span>
                  )}
                  
                  {isRunning ? (
                    <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '99px' }} onClick={() => { pauseDcaPlan(p.id); alert('Kế hoạch tích lũy đã tạm dừng.'); }}>Tạm dừng</button>
                  ) : (
                    <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '99px', background: 'var(--bg-main)', color: 'var(--gold)', border: '1px solid var(--gold)' }} onClick={() => { resumeDcaPlan(p.id); alert('Kế hoạch tích lũy đã hoạt động trở lại.'); }}>Kích hoạt</button>
                  )}
                  
                  <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '99px', color: 'var(--ruby)', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239,68,68,0.05)' }} onClick={() => { if (window.confirm('Bạn có chắc chắn muốn hủy kế hoạch tích lũy này không?')) { cancelDcaPlan(p.id); alert('Đã hủy kế hoạch tích lũy.'); } }}>Huỷ</button>
                </div>
              </div>
              
              <div className="divider" style={{ margin: '20px 0', borderTop: '1px dashed rgba(255,255,255,0.1)' }}></div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-muted)' }}>Lịch sử thực hiện gần nhất</div>
              
              <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 500 }}>Ngày</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 500 }}>Số tiền</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 500 }}>Số lượng</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 500 }}>Giá mua</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 500 }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 8px' }}>01/01/2026</td>
                      <td style={{ padding: '12px 8px' }}>₫{p.amount.toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '12px 8px' }}>{(p.amount / prices.sjc.sell).toFixed(4)} chỉ</td>
                      <td style={{ padding: '12px 8px' }}>₫{prices.sjc.sell.toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '12px 8px' }}><span style={{ color: 'var(--emerald)', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>Thành công</span></td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px 8px' }}>01/12/2025</td>
                      <td style={{ padding: '12px 8px' }}>₫{p.amount.toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '12px 8px' }}>{(p.amount / 8500000).toFixed(4)} chỉ</td>
                      <td style={{ padding: '12px 8px' }}>₫8.500.000</td>
                      <td style={{ padding: '12px 8px' }}><span style={{ color: 'var(--emerald)', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>Thành công</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        }) : (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
            Chưa có kế hoạch tích lũy nào đang hoạt động
          </div>
        )}
      </div>
    </div>
  );
}
