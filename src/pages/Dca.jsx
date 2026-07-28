import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import useStore from '../store/useStore';

const PlanExecutions = ({ planId }) => {
  const [executions, setExecutions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showTable, setShowTable] = React.useState(false);

  React.useEffect(() => {
    if (showTable) {
      import('../supabaseClient').then(({ supabase }) => {
        supabase.schema('financial_ledgers').from('dca_executions')
          .select('*')
          .eq('plan_id', planId)
          .order('executed_at', { ascending: false })
          .limit(10)
          .then(({ data }) => {
            if (data) setExecutions(data);
            setLoading(false);
          });
      });
    }
  }, [planId, showTable]);

  if (!showTable) {
    return (
      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <button className="btn" onClick={() => setShowTable(true)} style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '99px', padding: '8px 24px' }}>
          <i className="ti ti-list-details" style={{ marginRight: '6px' }}></i> Xem các giao dịch của kế hoạch này
        </button>
      </div>
    );
  }

  if (loading) return <div style={{textAlign: 'center', color: 'var(--text-muted)'}}>Đang tải dữ liệu...</div>;
  if (!executions.length) return <div style={{textAlign: 'center', color: 'var(--text-muted)'}}>Chưa có lần chạy nào. Giao dịch sẽ hiện ở đây khi Bot đến giờ.</div>;

  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '4px', overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: 'var(--text-muted)', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
            <th style={{ padding: '12px 16px' }}>Thời gian</th>
            <th style={{ padding: '12px 16px' }}>Mã Chạy</th>
            <th style={{ padding: '12px 16px' }}>KL Vàng Mua</th>
            <th style={{ padding: '12px 16px' }}>Đơn giá Mua</th>
            <th style={{ padding: '12px 16px' }}>Tổng chi (VND)</th>
            <th style={{ padding: '12px 16px' }}>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {executions.map(ex => (
            <tr key={ex.id} style={{ borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px 16px' }}>{new Date(ex.executed_at).toLocaleString('vi-VN')}</td>
              <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{ex.id.split('-')[1] || ex.id.substring(0, 8)}</td>
              <td style={{ padding: '12px 16px', color: 'var(--gold)', fontWeight: 600 }}>+{Number(ex.quantity_grams).toFixed(4)} chỉ</td>
              <td style={{ padding: '12px 16px' }}>{Number(ex.unit_price_vnd).toLocaleString('vi-VN')}đ</td>
              <td style={{ padding: '12px 16px', color: 'var(--ruby)' }}>-{Number(ex.amount_vnd).toLocaleString('vi-VN')}đ</td>
              <td style={{ padding: '12px 16px' }}>
                {ex.status === 'SUCCESS' ? <span style={{ color: 'var(--emerald)' }}><i className="ti ti-check"></i> OK</span> : <span style={{ color: 'var(--ruby)' }}><i className="ti ti-x"></i> Failed</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default function Dca() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  const plans = useStore(state => state.dcaPlans);
  const prices = useStore(state => state.goldPrices);
  const createDcaPlan = useStore(state => state.createDcaPlan);
  const pauseDcaPlan = useStore(state => state.pauseDcaPlan);
  const resumeDcaPlan = useStore(state => state.resumeDcaPlan);
  const cancelDcaPlan = useStore(state => state.cancelDcaPlan);
  const archiveDcaPlan = useStore(state => state.archiveDcaPlan);

  // Form State
  const priceKeys = Object.keys(prices);
  const [goldType, setGoldType] = useState(priceKeys[0] || 'SJ9999');
  const [amount, setAmount] = useState('1000000');
  const [frequency, setFrequency] = useState('Hàng tháng');
  const [day, setDay] = useState('Ngày 1');

  const [executionTime, setExecutionTime] = useState('09:00');
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [storeStock, setStoreStock] = useState({});

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const { supabase } = await import('../supabaseClient');
        const { data, error } = await supabase
          .from('vault_inventory')
          .select('gold_type, weight_grams')
          .eq('status', 'AVAILABLE');

        if (!error && data) {
          const weights = {};
          priceKeys.forEach(k => { weights[k] = 0; });
          data.forEach(item => {
            const key = item.gold_type;
            const w = Number(item.weight_grams) || 0;
            if (weights[key] !== undefined) {
              weights[key] += w;
            } else {
              const typeLower = key.toLowerCase();
              if (typeLower.includes('sjc')) weights['SJL1L10'] = (weights['SJL1L10'] || 0) + w;
              else if (typeLower.includes('pnj')) weights['PQHNVM'] = (weights['PQHNVM'] || 0) + w;
            }
          });
          setStoreStock(weights);
        }
      } catch(err) {
        console.error(err);
      }
    };
    fetchStock();
  }, [priceKeys.length]); // trigger once roughly when prices load

  // Auto-select first in-stock item
  useEffect(() => {
    const availableKeys = priceKeys.filter(k => storeStock[k] > 0);
    if (availableKeys.length > 0 && (!storeStock[goldType] || storeStock[goldType] <= 0)) {
      setGoldType(availableKeys[0]);
    }
  }, [storeStock, priceKeys, goldType]);

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

    if (prices[goldType] && storeStock[goldType] !== undefined) {
      const estimatedChi = amt / prices[goldType].buy;
      const stockChi = storeStock[goldType] / 3.75;
      if (estimatedChi > stockChi) {
        Swal.fire('Quá hạn mức', `Kho vàng hiện tại chỉ còn ${stockChi.toFixed(2)} chỉ, không đủ để đáp ứng khối lượng dự kiến (${estimatedChi.toFixed(2)} chỉ) của mức vốn này. Vui lòng giảm số tiền tích lũy hoặc chọn mã vàng khác.`, 'error');
        return;
      }
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
                {Object.keys(prices).filter(k => storeStock[k] > 0).length > 0 ? (
                  Object.keys(prices).filter(k => storeStock[k] > 0).map(key => (
                    <option key={key} value={key} style={{ background: '#272729', color: '#fff' }}>
                      {prices[key].name} (Còn kho: {(storeStock[key] / 3.75).toFixed(2)} chỉ)
                    </option>
                  ))
                ) : (
                  <option disabled style={{ background: '#272729', color: '#999' }}>Tất cả các sản phẩm đang tạm hết hạn</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Số Tiền Tích Lũy / Kỳ</label>
              <input className="form-input" type="number" placeholder="₫1.000.000" min="100000" step="100000" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ borderRadius: '12px', padding: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }} />
              {amount && !isNaN(amount) && prices[goldType] && storeStock[goldType] !== undefined && (() => {
                const estAmt = (parseFloat(amount) / prices[goldType].buy);
                const stockAmt = storeStock[goldType] / 3.75;
                const isOver = estAmt > stockAmt;
                return (
                  <div style={{ fontSize: '12px', color: isOver ? 'var(--ruby)' : 'var(--emerald)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className={isOver ? "ti ti-alert-triangle" : "ti ti-chart-arrows-vertical"}></i>
                    Ước tính mua được: <b>{estAmt.toFixed(4)}</b> chỉ 
                    {isOver && " (Vượt quá số dư kho)"}
                  </div>
                );
              })()}
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="h3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-list-check" style={{ color: 'var(--gold)' }}></i>
          {showArchived ? 'Các kế hoạch đã hủy (Lưu trữ)' : 'Kế hoạch đang hoạt động'}
        </div>
        <button 
          className="btn" 
          onClick={() => setShowArchived(!showArchived)}
          style={{ fontSize: '14px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', borderRadius: '99px', padding: '6px 16px', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {showArchived ? 'Quay lại danh sách' : 'Xem lịch sử kế hoạch'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {plans.filter(p => showArchived ? (p.status === 'CANCELLED' || p.status === 'ARCHIVED') : (p.status !== 'CANCELLED' && p.status !== 'ARCHIVED')).length > 0 ? plans.filter(p => showArchived ? (p.status === 'CANCELLED' || p.status === 'ARCHIVED') : (p.status !== 'CANCELLED' && p.status !== 'ARCHIVED')).map(p => {
          const isRunning = p.status === 'running' || p.status === 'ACTIVE';
          const isCancelled = p.status === 'CANCELLED';
          const isCompleted = p.status === 'COMPLETED';
          const isArchived = p.status === 'ARCHIVED';
          
          return (
            <div key={p.id} className="card" style={{ borderRadius: '20px', padding: '24px', background: 'rgba(30,30,30,0.5)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', opacity: isCancelled ? 0.6 : 1 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: isRunning ? 'var(--gold-gradient)' : (isCompleted ? 'var(--emerald)' : (isCancelled ? 'var(--ruby)' : 'var(--text-muted)')) }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>LOẠI VÀNG</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{prices[p.gold_type]?.name || p.gold_type?.toUpperCase()}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>SỐ T.CHƯƠNG TRÌNH</div><div style={{ fontSize: '16px', fontWeight: 600 }}>₫{parseFloat(p.amount_vnd || p.amount_vnd_per_cycle).toLocaleString('vi-VN')} / kỳ</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>TẦN SUẤT</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{p.frequency}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>TIẾN ĐỘ THỰC THI</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{p.total_executions || 0} kỳ</div></div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {isRunning ? (
                    <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '99px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', fontWeight: 600, border: '1px solid rgba(16,185,129,0.2)' }}>Đang chạy</span>
                  ) : isCompleted ? (
                    <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '99px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontWeight: 600, border: '1px solid rgba(56,189,248,0.2)' }}>Hoàn Thành</span>
                  ) : isCancelled ? (
                    <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '99px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--ruby)', fontWeight: 600, border: '1px solid rgba(239,68,68,0.2)' }}>Đã hủy</span>
                  ) : isArchived ? (
                    <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '99px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>Lưu trữ</span>
                  ) : (
                    <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '99px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>Đã tạm dừng</span>
                  )}
                  
                  {isCompleted && (
                    <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '99px', background: 'var(--emerald)', color: '#000', fontWeight: 600 }} onClick={() => { archiveDcaPlan(p.id); Swal.fire('Lưu trữ thành công', 'Kế hoạch đã được cất vào lịch sử lưu trữ.', 'success'); }}>Thêm vào lịch sử</button>
                  )}
                  {isRunning && (
                    <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '99px' }} onClick={() => { pauseDcaPlan(p.id); Swal.fire('Thông báo', 'Kế hoạch tích lũy đã tạm dừng.', 'info'); }}>Tạm dừng</button>
                  )}
                  {(!isRunning && !isCancelled && !isCompleted && !isArchived) && (
                    <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '99px', background: 'var(--bg-main)', color: 'var(--gold)', border: '1px solid var(--gold)' }} onClick={() => { resumeDcaPlan(p.id); Swal.fire('Thông báo', 'Kế hoạch tích lũy đã hoạt động trở lại.', 'success'); }}>Kích hoạt lại</button>
                  )}
                  
                  {(!isCancelled && !isCompleted && !isArchived) && (
                    <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '99px', color: 'var(--ruby)', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239,68,68,0.05)' }} onClick={async () => { const res = await Swal.fire({title: 'Xác nhận hủy', text: 'Bạn có chắc chắn muốn hủy kế hoạch tích lũy này không?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy'}); if (res.isConfirmed) { cancelDcaPlan(p.id); Swal.fire('Đã hủy', 'Đã hủy kế hoạch tích lũy vào khu vực lưu trữ.', 'success'); } }}>Huỷ</button>
                  )}
                </div>
              </div>
              
              <div className="divider" style={{ margin: '20px 0', borderTop: '1px dashed rgba(255,255,255,0.1)' }}></div>
              
              <PlanExecutions planId={p.id} />
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
