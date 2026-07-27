import React, { useState } from 'react';
import Swal from 'sweetalert2';
import useStore from '../store/useStore';

export default function Dca() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const plans = useStore(state => state.dcaPlans);
  const prices = useStore(state => state.goldPrices);
  const createDcaPlan = useStore(state => state.createDcaPlan);
  const pauseDcaPlan = useStore(state => state.pauseDcaPlan);
  const resumeDcaPlan = useStore(state => state.resumeDcaPlan);
  const cancelDcaPlan = useStore(state => state.cancelDcaPlan);

  // Form State
  const priceKeys = Object.keys(prices);
  const [goldType, setGoldType] = useState(priceKeys[0] || 'SJ9999');
  const [amount, setAmount] = useState('1000000');
  const [frequency, setFrequency] = useState('Hàng tháng');
  const [day, setDay] = useState('Ngày 1');

  const [executionTime, setExecutionTime] = useState('09:00');
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calculate aggregated stats
  const totalAccumulated = plans.reduce((acc, p) => acc + (p.status === 'running' ? parseFloat(p.amount_vnd || 0) : 0), 0);
  const firstSellPrice = priceKeys.length > 0 ? (prices[priceKeys[0]]?.sell || 148000000) : 148000000;
  const avgGoldEstimate = (totalAccumulated / firstSellPrice).toFixed(6);

  const toggleDate = (dateStr) => {
    setSelectedDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon = 0

    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    const weeks = [];
    while (days.length) weeks.push(days.splice(0, 7));

    return (
      <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button className="btn" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} style={{ padding: '6px 12px' }}>&lt;</button>
          <div style={{ fontWeight: 'bold', color: 'var(--gold)' }}>Tháng {month + 1}, {year}</div>
          <button className="btn" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} style={{ padding: '6px 12px' }}>&gt;</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d}</div>)}
        </div>
        <div>
          {weeks.map((week, wIdx) => (
            <div key={wIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px' }}>
              {week.map((dateObj, dIdx) => {
                if (!dateObj) return <div key={`empty-${dIdx}`}></div>;
                const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                const isSelected = selectedDates.includes(dateStr);
                return (
                  <div
                    key={dateStr}
                    onClick={() => toggleDate(dateStr)}
                    style={{
                      padding: '8px 0', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                      background: isSelected ? 'var(--gold-gradient)' : 'rgba(255,255,255,0.05)',
                      color: isSelected ? '#000' : '#fff', fontWeight: isSelected ? 600 : 400
                    }}
                  >
                    {dateObj.getDate()}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleSave = () => {
    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt < 100000) {
      Swal.fire('Lỗi', 'Số tiền tích lũy tối thiểu là ₫100.000', 'error');
      return;
    }
    let finalExecutionDay = day;
    if (frequency === 'Tùy chỉnh (Chọn ngày)') {
      if (selectedDates.length === 0) {
        Swal.fire('Lỗi', 'Vui lòng chọn ít nhất một ngày trên lịch', 'error');
        return;
      }
      finalExecutionDay = `${executionTime}|${selectedDates.sort().join(',')}`;
    } else {
      finalExecutionDay = `${executionTime}|${day}`;
    }
    
    createDcaPlan(goldType, amt, frequency, finalExecutionDay);
    setShowCreateForm(false);
    Swal.fire('Thành công', 'Đã tạo kế hoạch DCA tích lũy vàng định kỳ mới!', 'success');
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-muted)' }}>Chọn Loại Vàng</label>
              <select className="form-input" value={goldType} onChange={(e) => setGoldType(e.target.value)} style={{ borderRadius: '12px', padding: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                {Object.keys(prices).map(key => (
                  <option key={key} value={key} style={{ background: '#272729', color: '#fff' }}>{prices[key].name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Số Tiền Tích Lũy / Kỳ</label>
              <input className="form-input" type="number" placeholder="₫1.000.000" min="100000" step="100000" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ borderRadius: '12px', padding: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-muted)' }}>Tần Suất / Kiểu mua</label>
              <select className="form-input" value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ borderRadius: '12px', padding: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                <option value="Hàng tuần" style={{ background: '#272729', color: '#fff' }}>Hàng tuần</option>
                <option value="Hàng tháng" style={{ background: '#272729', color: '#fff' }}>Hàng tháng</option>
                <option value="Tùy chỉnh (Chọn ngày)" style={{ background: '#272729', color: '#fff' }}>Tùy chỉnh (Chọn ngày)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--gold)' }}>Giờ thực hiện</label>
              <input type="time" className="form-input" value={executionTime} onChange={(e) => setExecutionTime(e.target.value)} style={{ borderRadius: '12px', padding: '14px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.3)', color: '#fff' }} />
            </div>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            {frequency === 'Tùy chỉnh (Chọn ngày)' ? (
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--text-muted)' }}>Bảng lịch thực hiện kép (Click để chọn nhiều ngày)</label>
                {renderCalendar()}
              </div>
            ) : (
              <div className="form-group" style={{ maxWidth: '300px' }}>
                <label className="form-label" style={{ color: 'var(--text-muted)' }}>Ngày kích hoạt tự động</label>
                <select className="form-input" value={day} onChange={(e) => setDay(e.target.value)} style={{ borderRadius: '12px', padding: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                  {frequency === 'Hàng tuần' ? (
                    <>
                      <option value="Thứ Hai">Thứ Hai</option>
                      <option value="Thứ Tư">Thứ Tư</option>
                      <option value="Thứ Sáu">Thứ Sáu</option>
                    </>
                  ) : (
                    <>
                      <option value="Ngày 1">Ngày 1</option>
                      <option value="Ngày 15">Ngày 15</option>
                      <option value="Ngày 28">Ngày 28</option>
                    </>
                  )}
                </select>
              </div>
            )}
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
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px' }}>TỔNG TIỀN DỰ KIẾN (CHẠY 1 KỲ)</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>₫{totalAccumulated.toLocaleString('vi-VN')}</div>
          <div style={{ fontSize: '13px', color: 'var(--emerald)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i className="ti ti-trending-up"></i> +{avgGoldEstimate} chỉ SJC (Ước tính)
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', marginTop: '16px', overflow: 'hidden' }}>
            <div style={{ width: '0%', height: '100%', background: 'var(--gold-gradient)' }}></div>
          </div>
          <div className="body-sm" style={{ marginTop: '6px', color: 'var(--text-muted)' }}>Chi tiết trong Báo cáo tháng này</div>
        </div>
        <div className="card" style={{ borderRadius: '24px', background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px' }}>GIẢM RỦI RO (DCA)</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--emerald)', marginTop: '8px' }}>---</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Hệ thống đang thu thập dữ liệu giá</div>
        </div>
        <div className="card" style={{ borderRadius: '24px', background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px' }}>KẾ HOẠCH ACTIVE</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>{plans.filter(p => p.status === 'running').length}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Giao dịch tự động bởi Hệ Thống AI</div>
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
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>LOẠI VÀNG</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{prices[p.gold_type]?.name || p.gold_type?.toUpperCase()}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>SỐ TIỀN / KỲ</div><div style={{ fontSize: '16px', fontWeight: 600 }}>₫{parseFloat(p.amount_vnd).toLocaleString('vi-VN')}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>TẦN SUẤT</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{p.frequency}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>NGÀY CHẠY</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{p.execution_day}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>TRẠNG THÁI DB</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{p.status}</div></div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {isRunning ? (
                    <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '99px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', fontWeight: 600, border: '1px solid rgba(16,185,129,0.2)' }}>Đang chạy</span>
                  ) : (
                    <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '99px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>Đã tạm dừng</span>
                  )}
                  
                  {isRunning ? (
                    <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '99px' }} onClick={() => { pauseDcaPlan(p.id); Swal.fire('Thông báo', 'Kế hoạch tích lũy đã tạm dừng.', 'info'); }}>Tạm dừng</button>
                  ) : (
                    <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '99px', background: 'var(--bg-main)', color: 'var(--gold)', border: '1px solid var(--gold)' }} onClick={() => { resumeDcaPlan(p.id); Swal.fire('Thông báo', 'Kế hoạch tích lũy đã hoạt động trở lại.', 'success'); }}>Kích hoạt</button>
                  )}
                  
                  <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '99px', color: 'var(--ruby)', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239,68,68,0.05)' }} onClick={async () => { const res = await Swal.fire({title: 'Xác nhận hủy', text: 'Bạn có chắc chắn muốn hủy kế hoạch tích lũy này không?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy'}); if (res.isConfirmed) { cancelDcaPlan(p.id); Swal.fire('Đã hủy', 'Đã hủy kế hoạch tích lũy khỏi hệ thống.', 'success'); } }}>Huỷ</button>
                </div>
              </div>
              
              <div className="divider" style={{ margin: '20px 0', borderTop: '1px dashed rgba(255,255,255,0.1)' }}></div>
              
              <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                 <p><i className="ti ti-history" style={{ fontSize: '20px', marginBottom: '8px' }}></i></p>
                 Dữ liệu các lần thực thi giao dịch được tính toán bởi Worker và hiển thị chi tiết tại màn hình <b>Lịch sử Giao dịch</b>.
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
