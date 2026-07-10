import React, { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { supabase } from '../supabaseClient';
import { AreaChart, Eye, LayoutGrid } from 'lucide-react';

import { createClient } from '@supabase/supabase-js';

const supabaseLedger = supabase.schema('financial_ledgers');

export default function Prices() {
  const goldPrices = useStore((state) => state.goldPrices);
  const fetchGoldPrices = useStore((state) => state.fetchGoldPrices);
  
  const [selectedKey, setSelectedKey] = useState('SJL1L10'); // Default selected product
  const [activeTab, setActiveTab] = useState('detail'); // 'detail' or 'chart'
  const [timeframe, setTimeframe] = useState('1M'); // '1H', '1D', '1W', '1M'
  const [historyData, setHistoryData] = useState([]); // Raw historical snapshots
  const [chartData, setChartData] = useState([]); // Candle bucketed data
  const [expandedDays, setExpandedDays] = useState({}); // Expanded date groups
  const [loading, setLoading] = useState(false);

  // SVG Chart zoom states
  const [zoomLevel, setZoomLevel] = useState(1);

  console.log("🖥️ Prices component rendering, goldPrices keys:", Object.keys(goldPrices || {}), "selectedKey:", selectedKey);

  // 1. Tải giá vàng hiện tại định kỳ
  useEffect(() => {
    fetchGoldPrices();
  }, [fetchGoldPrices]);

  const activeItem = goldPrices[selectedKey] || { name: 'SJC 9999', key: 'SJL1L10', buy: 146000000, sell: 149000000, change: '▲ +0.00%', up: true, diff: 3000000 };

  // 2. Tải lịch sử giá vàng chi tiết cho sản phẩm đang hoạt động
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabaseLedger
          .from('gold_price_snapshots')
          .select('*')
          .eq('source', selectedKey)
          .order('recorded_at', { ascending: true }); // Sắp xếp theo trình tự thời gian cũ -> mới

        console.log("📥 Prices: fetchHistory success, count =", data?.length, "for key =", selectedKey);
        if (error) throw error;
        setHistoryData(data || []);
      } catch (err) {
        console.error("❌ Prices: Lỗi khi tải lịch sử bảng giá:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [selectedKey]);

  // 3. Phân chia dữ liệu nến cho Chart khi chọn Tab Đồ thị
  useEffect(() => {
    if (historyData.length === 0) return;

    let T = 5; // số phút gộp mặc định
    let startTime = new Date();
    if (timeframe === '1H') {
      T = 5;
      startTime.setHours(startTime.getHours() - 1);
    } else if (timeframe === '1D') {
      T = 48; // ~30 nến / ngày
      startTime.setDate(startTime.getDate() - 1);
    } else if (timeframe === '1W') {
      T = 240; // 42 nến / tuần
      startTime.setDate(startTime.getDate() - 7);
    } else if (timeframe === '1M') {
      T = 1440; // 30 nến / tháng (1 nến/ngày)
      startTime.setDate(startTime.getDate() - 30);
    }

    // Lọc các bản ghi theo mốc thời gian lọc
    const filteredData = historyData.filter(row => new Date(row.recorded_at) >= startTime);

    if (filteredData.length >= 5) {
      // Gộp dữ liệu theo thời gian (bucketKey)
      const bucketKeyOf = (dateStr, minutes) => {
        const d = new Date(dateStr);
        if (minutes === 1440) {
          return d.toISOString().substring(0, 10);
        }
        const ms = d.getTime();
        const bucketMs = Math.floor(ms / (minutes * 60 * 1000)) * (minutes * 60 * 1000);
        return new Date(bucketMs).toISOString();
      };

      const groups = {};
      const groupKeys = [];
      for (const row of filteredData) {
        const key = bucketKeyOf(row.recorded_at, T);
        if (!groups[key]) {
          groups[key] = [];
          groupKeys.push(key);
        }
        groups[key].push(row);
      }

      const candles = [];
      for (let idx = 0; idx < groupKeys.length; idx++) {
        const key = groupKeys[idx];
        const rows = groups[key];
        
        const close = Number(rows[rows.length - 1].buy_price_vnd);
        
        let open = Number(rows[0].buy_price_vnd);
        if (idx > 0) {
          const prevKey = groupKeys[idx - 1];
          const prevRows = groups[prevKey];
          open = Number(prevRows[prevRows.length - 1].buy_price_vnd);
        }

        const buyPrices = rows.map(r => Number(r.buy_price_vnd));
        const sellPrices = rows.map(r => Number(r.sell_price_vnd));
        
        const low = Math.min(...buyPrices);
        const high = Math.max(...sellPrices);
        const volume = Math.floor(100 * rows.length + Math.random() * 900);

        const dateObj = new Date(key);
        let label = '';
        if (timeframe === '1H' || timeframe === '1D') {
          label = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } else {
          label = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        }

        candles.push({ label, open, high, low, close, volume });
      }
      setChartData(candles);
    } else {
      // Mock Candles Fallback
      const currentVal = activeTab === 'sell' ? activeItem.buy : activeItem.sell;
      const candlesLimit = timeframe === '1H' ? 15 : timeframe === '1D' ? 30 : timeframe === '1W' ? 50 : 80;
      const mock = [];
      let prev = currentVal * 0.98;
      const now = new Date();
      for (let i = 0; i < candlesLimit; i++) {
        const open = prev;
        const progress = i / (candlesLimit - 1);
        const close = open + (currentVal * 0.0006) + (Math.random() - 0.5) * (currentVal * 0.006);
        const high = Math.max(open, close) + (currentVal * 0.002 * Math.random());
        const low = Math.min(open, close) - (currentVal * 0.002 * Math.random());
        const volume = Math.floor(150 + Math.random() * 850);

        let stepMin = 5;
        if (timeframe === '1D') stepMin = 60;
        else if (timeframe === '1W') stepMin = 240;
        else if (timeframe === '1M') stepMin = 720;

        const dateObj = new Date(now.getTime() - (candlesLimit - i - 1) * stepMin * 60 * 1000);
        let label = '';
        if (timeframe === '1H' || timeframe === '1D') {
          label = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } else {
          label = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        }
        mock.push({ label, open, high, low, close, volume });
        prev = close;
      }
      setChartData(mock);
    }
  }, [historyData, timeframe, activeItem]);

  // 4. Tổ chức dữ liệu Lịch sử (Detail Tab) chi tiết
  // Tính toán biến động so với bản ghi trước trong DB
  const enrichedSnapshots = [];
  for (let i = 0; i < historyData.length; i++) {
    const row = historyData[i];
    const buy = Number(row.buy_price_vnd);
    const sell = Number(row.sell_price_vnd);
    
    let changeBuyVal = 0;
    let changeSellVal = 0;
    if (i > 0) {
      changeBuyVal = buy - Number(historyData[i - 1].buy_price_vnd);
      changeSellVal = sell - Number(historyData[i - 1].sell_price_vnd);
    }
    
    enrichedSnapshots.push({
      ...row,
      buy,
      sell,
      changeBuyVal,
      changeSellVal
    });
  }

  // Đảo ngược danh sách để các ngày gần nhất đứng đầu
  const chronologicalReversed = [...enrichedSnapshots].reverse();

  // Nhóm các hàng theo ngày YYYY-MM-DD
  const dateGroups = {};
  const groupOrder = [];

  chronologicalReversed.forEach((row) => {
    const vnTime = new Date(new Date(row.recorded_at).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const ymd = `${vnTime.getFullYear()}-${String(vnTime.getMonth() + 1).padStart(2, '0')}-${String(vnTime.getDate()).padStart(2, '0')}`;
    if (!dateGroups[ymd]) {
      dateGroups[ymd] = {
        ymd,
        displayDate: `${String(vnTime.getDate()).padStart(2, '0')}/${String(vnTime.getMonth() + 1).padStart(2, '0')}`, // "DD/MM"
        rows: []
      };
      groupOrder.push(ymd);
    }
    dateGroups[ymd].rows.push(row);
  });

  const toggleDay = (ymd) => {
    setExpandedDays(prev => ({
      ...prev,
      [ymd]: !prev[ymd]
    }));
  };

  // Hàm vẽ các phần tử biểu đồ nến (SVG Chart elements)
  const renderChartElements = () => {
    const width = 600;
    const height = 220;
    const padding = 20;

    const visibleCount = Math.max(5, Math.floor(chartData.length / zoomLevel));
    const visibleData = chartData.slice(chartData.length - visibleCount);

    if (visibleData.length === 0) return null;

    const buyPrices = visibleData.map(d => d.close);
    const highs = visibleData.map(d => d.high);
    const lows = visibleData.map(d => d.low);
    const maxVolume = Math.max(...visibleData.map(d => d.volume)) || 1;

    // Phân tích chỉ số trung bình động MA (9) và MA (21)
    const ma9Values = [];
    const ma21Values = [];
    for (let i = 0; i < visibleData.length; i++) {
      const slice9 = visibleData.slice(Math.max(0, i - 8), i + 1);
      const avg9 = slice9.reduce((sum, d) => sum + d.close, 0) / slice9.length;
      ma9Values.push(avg9);

      const slice21 = visibleData.slice(Math.max(0, i - 20), i + 1);
      const avg21 = slice21.reduce((sum, d) => sum + d.close, 0) / slice21.length;
      ma21Values.push(avg21);
    }

    const minP = Math.min(...lows, ...ma9Values, ...ma21Values);
    const maxP = Math.max(...highs, ...ma9Values, ...ma21Values);
    const range = maxP - minP || 1;

    const candleWidth = Math.max(3, Math.floor((width - padding * 2) / visibleData.length) - 6);

    const ma9Points = [];
    const ma21Points = [];

    const nodes = visibleData.map((d, i) => {
      const x = padding + (i / (visibleData.length - 1)) * (width - padding * 2);
      const yOpen = height - padding - ((d.open - minP) / range) * (height - padding * 2);
      const yClose = height - padding - ((d.close - minP) / range) * (height - padding * 2);
      const yHigh = height - padding - ((d.high - minP) / range) * (height - padding * 2);
      const yLow = height - padding - ((d.low - minP) / range) * (height - padding * 2);

      const isGreen = d.close >= d.open;
      const color = isGreen ? 'var(--emerald)' : 'var(--ruby)';
      const bodyHeight = Math.max(2, Math.abs(yOpen - yClose));
      const bodyY = Math.min(yOpen, yClose);

      const yMa9 = height - padding - ((ma9Values[i] - minP) / range) * (height - padding * 2);
      const yMa21 = height - padding - ((ma21Values[i] - minP) / range) * (height - padding * 2);
      ma9Points.push(`${x.toFixed(1)},${yMa9.toFixed(1)}`);
      ma21Points.push(`${x.toFixed(1)},${yMa21.toFixed(1)}`);

      const volHeight = (d.volume / maxVolume) * 35;
      const volY = height - padding - volHeight;

      const step = Math.ceil(visibleData.length / 5);
      const showLabel = i % step === 0 || i === visibleData.length - 1;

      return (
        <g key={i}>
          <rect x={x - candleWidth / 2} y={volY} width={candleWidth} height={volHeight} fill={color} opacity="0.18" rx="0.5" />
          <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.5" />
          <rect x={x - candleWidth / 2} y={bodyY} width={candleWidth} height={bodyHeight} fill={color} stroke={color} strokeWidth="1" rx="1" />
          {showLabel && (
            <text x={x} y={height - 2} fill="rgba(255, 255, 255, 0.4)" fontSize="9" textAnchor="middle">{d.label}</text>
          )}
        </g>
      );
    });

    return (
      <>
        {nodes}
        {ma9Points.length > 1 && <path d={`M ${ma9Points.join(' L ')}`} fill="none" stroke="#F59E0B" strokeWidth="1.2" opacity="0.8" />}
        {ma21Points.length > 1 && <path d={`M ${ma21Points.join(' L ')}`} fill="none" stroke="#EC4899" strokeWidth="1.2" opacity="0.8" />}
      </>
    );
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(4, prev + 0.25));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(1, prev - 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  // Mảng key của sản phẩm hỗ trợ để hiển thị danh sách
  const goldListKeys = [
    "SJL1L10", "SJ9999", "BTSJC", "BT9999NTT", "DOHNL", "DOHCML", "DOJINHTV", "PQHNVM", "PQHN24NTT", "VNGSJC", "VIETTINMSJC"
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', color: 'var(--text-main)' }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--gold)', margin: 0, letterSpacing: '0.5px' }}>Bảng Giá Vàng Trực Tuyến</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Dữ liệu tự động đồng bộ từ thị trường mỗi 5 phút một lần</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* PHẦN 1: BẢNG NIÊM YẾT GIÁ THỊ TRƯỜNG */}
        <div className="neo-card" style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '12px 16px' }}>Loại vàng</th>
                  <th style={{ padding: '12px 16px' }}>Mua vào</th>
                  <th style={{ padding: '12px 16px' }}>Bán ra</th>
                  <th style={{ padding: '12px 16px' }}>Xu hướng</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {goldListKeys.map((key) => {
                  const item = goldPrices[key];
                  if (!item) return null;

                  const isSelected = selectedKey === key;
                  
                  // Tính toán biến động để xem icon tăng/giảm ở danh sách cha
                  const buyVal = item.buy;
                  const sellVal = item.sell;
                  
                  const buyChange = item.buyChange || 0;
                  const sellChange = item.sellChange || 0;

                  // Xu hướng
                  let trendText = "Ổn định";
                  let trendColor = "gray";
                  if (buyChange > 0 || sellChange > 0) {
                    trendText = "Tăng";
                    trendColor = "var(--emerald)";
                  } else if (buyChange < 0 || sellChange < 0) {
                    trendText = "Giảm";
                    trendColor = "var(--ruby)";
                  }

                  const timeStr = item.recordedAt 
                    ? new Date(item.recordedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' +
                      new Date(item.recordedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
                    : "00:00 09/07";

                  return (
                    <React.Fragment key={key}>
                      <tr 
                        onClick={() => {
                          if (isSelected) {
                            setSelectedKey(null);
                          } else {
                            setSelectedKey(key);
                            setExpandedDays({}); // Reset expand
                          }
                        }}
                        style={{ 
                          cursor: 'pointer', 
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: isSelected ? 'rgba(212,175,55,0.05)' : 'transparent',
                          transition: '0.15s ease background'
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                      >
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: '600', color: isSelected ? 'var(--gold)' : '#fff', fontSize: '14px' }}>{item.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{key}</div>
                        </td>
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: '700', fontSize: '15px' }}>{buyVal.toLocaleString('vi-VN')}₫</div>
                          <div style={{ fontSize: '11px', color: buyChange > 0 ? 'var(--emerald)' : buyChange < 0 ? 'var(--ruby)' : 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                            {buyChange > 0 ? `↑ +${buyChange.toLocaleString('vi-VN')}` : buyChange < 0 ? `↓ -${Math.abs(buyChange).toLocaleString('vi-VN')}` : '-'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: '700', fontSize: '15px' }}>{sellVal.toLocaleString('vi-VN')}₫</div>
                          <div style={{ fontSize: '11px', color: sellChange > 0 ? 'var(--emerald)' : sellChange < 0 ? 'var(--ruby)' : 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                            {sellChange > 0 ? `↑ +${sellChange.toLocaleString('vi-VN')}` : sellChange < 0 ? `↓ -${Math.abs(sellChange).toLocaleString('vi-VN')}` : '-'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 500,
                            padding: '3px 8px', 
                            borderRadius: '12px', 
                            background: trendText === 'Tăng' ? 'rgba(16,185,129,0.12)' : trendText === 'Giảm' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
                            color: trendColor
                          }}>
                            {trendText}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {timeStr}
                        </td>
                      </tr>

                      {isSelected && (
                        <tr>
                          <td colSpan={5} style={{ padding: '0px', background: '#050507', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                            <div style={{ padding: '20px' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
                                <div>
                                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gold)', margin: 0 }}>Lịch sử giá {activeItem.name}</h3>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Biểu đồ phân tích kỹ thuật và bảng chi tiết giao dịch khớp lệnh</div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setActiveTab('chart'); }}
                                    style={{ 
                                      display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', transition: '0.2s all',
                                      background: activeTab === 'chart' ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.02)',
                                      color: activeTab === 'chart' ? 'var(--gold)' : 'var(--text-muted)',
                                      border: activeTab === 'chart' ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)'
                                    }}
                                  >
                                    <AreaChart size={14} /> Chart
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setActiveTab('detail'); }}
                                    style={{ 
                                      display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', transition: '0.2s all',
                                      background: activeTab === 'detail' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
                                      color: activeTab === 'detail' ? '#3b82f6' : 'var(--text-muted)',
                                      border: activeTab === 'detail' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)'
                                    }}
                                  >
                                    <Eye size={14} /> Detail
                                  </button>
                                </div>
                              </div>

                              {loading ? (
                                <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                  Đang tải dữ liệu lịch sử giá vàng...
                                </div>
                              ) : activeTab === 'chart' ? (
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      {['1H', '1D', '1W', '1M'].map((tf) => (
                                        <button 
                                          key={tf} 
                                          onClick={(e) => { e.stopPropagation(); setTimeframe(tf); }}
                                          style={{ 
                                            fontSize: '11px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)',
                                            background: timeframe === tf ? 'var(--gold)' : 'rgba(255,255,255,0.02)',
                                            color: timeframe === tf ? '#000' : 'var(--text-main)'
                                          }}
                                        >
                                          {tf}
                                        </button>
                                      ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                      <button className="btn" onClick={(e) => { e.stopPropagation(); handleZoomIn(); }} style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255,255,255,0.02)' }}>🔍+</button>
                                      <button className="btn" onClick={(e) => { e.stopPropagation(); handleZoomOut(); }} style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255,255,255,0.02)' }}>🔍-</button>
                                      <button className="btn" onClick={(e) => { e.stopPropagation(); handleResetZoom(); }} style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255,255,255,0.02)' }}>↺</button>
                                    </div>
                                  </div>

                                  <div style={{ height: '220px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {chartData.length > 0 ? (
                                      <svg width="100%" height="100%" viewBox="0 0 600 220" preserveAspectRatio="none">
                                        {renderChartElements()}
                                      </svg>
                                    ) : (
                                      <div style={{ color: 'var(--text-muted)' }}>Đang tạo biểu đồ...</div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ overflowX: 'auto' }}>
                                  <table className="table" style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                      <tr style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <th style={{ padding: '8px 12px' }}>Ngày</th>
                                        <th style={{ padding: '8px 12px' }}>Mua vào</th>
                                        <th style={{ padding: '8px 12px' }}>Bán ra</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Cập nhật</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {groupOrder.map((ymd, idx) => {
                                        const group = dateGroups[ymd];
                                        const isExpanded = expandedDays[ymd] !== undefined ? expandedDays[ymd] : (idx === 0);
                                        const hasSubRows = group.rows.length > 1;

                                        const latestRow = group.rows[0];

                                        let parentChangeBuy = 0;
                                        let parentChangeSell = 0;
                                        if (idx < groupOrder.length - 1) {
                                          const prevDayGroup = dateGroups[groupOrder[idx + 1]];
                                          const lastPrevDayRow = prevDayGroup.rows[0];
                                          parentChangeBuy = latestRow.buy - lastPrevDayRow.buy;
                                          parentChangeSell = latestRow.sell - lastPrevDayRow.sell;
                                        }

                                        const latestUpdateStr = new Date(latestRow.recorded_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + group.displayDate;

                                        return (
                                          <React.Fragment key={ymd}>
                                            <tr 
                                              onClick={(e) => { e.stopPropagation(); if (hasSubRows) toggleDay(ymd); }}
                                              style={{ 
                                                background: 'rgba(255,255,255,0.01)', 
                                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                cursor: hasSubRows ? 'pointer' : 'default'
                                              }}
                                            >
                                              <td style={{ padding: '12px 12px', fontWeight: '600', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {hasSubRows && (
                                                  <span style={{ fontSize: '10px', transition: '0.15s ease transform', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
                                                )}
                                                <span>{group.displayDate}</span>
                                              </td>
                                              <td style={{ padding: '12px 12px' }}>
                                                <div style={{ fontWeight: '500' }}>{latestRow.buy.toLocaleString('vi-VN')}₫</div>
                                                <div style={{ fontSize: '10px', color: parentChangeBuy > 0 ? 'var(--emerald)' : parentChangeBuy < 0 ? 'var(--ruby)' : 'var(--text-muted)', marginTop: '2px' }}>
                                                  {parentChangeBuy > 0 ? `↑ +${parentChangeBuy.toLocaleString('vi-VN')}` : parentChangeBuy < 0 ? `↓ -${Math.abs(parentChangeBuy).toLocaleString('vi-VN')}` : '-'}
                                                </div>
                                              </td>
                                              <td style={{ padding: '12px 12px' }}>
                                                <div style={{ fontWeight: '500' }}>{latestRow.sell.toLocaleString('vi-VN')}₫</div>
                                                <div style={{ fontSize: '10px', color: parentChangeSell > 0 ? 'var(--emerald)' : parentChangeSell < 0 ? 'var(--ruby)' : 'var(--text-muted)', marginTop: '2px' }}>
                                                  {parentChangeSell > 0 ? `↑ +${parentChangeSell.toLocaleString('vi-VN')}` : parentChangeSell < 0 ? `↓ -${Math.abs(parentChangeSell).toLocaleString('vi-VN')}` : '-'}
                                                </div>
                                              </td>
                                              <td style={{ padding: '12px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                                                {latestUpdateStr}
                                              </td>
                                            </tr>

                                            {hasSubRows && isExpanded && group.rows.map((row) => {
                                              const subTime = new Date(row.recorded_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                              
                                              let changeCode = './.';
                                              if (row.changeBuyVal > 0 && row.changeSellVal > 0) changeCode = '+/+';
                                              else if (row.changeBuyVal < 0 && row.changeSellVal < 0) changeCode = '-/-';
                                              else if (row.changeBuyVal !== 0 || row.changeSellVal !== 0) changeCode = '+/-';

                                              return (
                                                <tr 
                                                  key={row.id} 
                                                  style={{ 
                                                    background: 'rgba(255,255,255,0.002)', 
                                                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                                                    color: 'rgba(255,255,255,0.6)'
                                                  }}
                                                >
                                                  <td style={{ padding: '10px 12px 10px 24px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                                                    {subTime}
                                                  </td>
                                                  <td style={{ padding: '10px 12px' }}>
                                                    <div>{Number(row.buy_price_vnd).toLocaleString('vi-VN')}₫</div>
                                                    <div style={{ fontSize: '9px', color: row.changeBuyVal > 0 ? 'var(--emerald)' : row.changeBuyVal < 0 ? 'var(--ruby)' : 'var(--text-muted)' }}>
                                                      {row.changeBuyVal > 0 ? `↑ +${Number(row.changeBuyVal).toLocaleString('vi-VN')}` : row.changeBuyVal < 0 ? `↓ -${Math.abs(Number(row.changeBuyVal)).toLocaleString('vi-VN')}` : '-'}
                                                    </div>
                                                  </td>
                                                  <td style={{ padding: '10px 12px' }}>
                                                    <div>{Number(row.sell_price_vnd).toLocaleString('vi-VN')}₫</div>
                                                    <div style={{ fontSize: '9px', color: row.changeSellVal > 0 ? 'var(--emerald)' : row.changeSellVal < 0 ? 'var(--ruby)' : 'var(--text-muted)' }}>
                                                      {row.changeSellVal > 0 ? `↑ +${Number(row.changeSellVal).toLocaleString('vi-VN')}` : row.changeSellVal < 0 ? `↓ -${Math.abs(Number(row.changeSellVal)).toLocaleString('vi-VN')}` : '-'}
                                                    </div>
                                                  </td>
                                                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: changeCode === '+/+' ? 'var(--emerald)' : changeCode === '-/-' ? 'var(--ruby)' : 'var(--text-muted)' }}>
                                                    {changeCode}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </React.Fragment>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
