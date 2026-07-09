import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { supabase } from '../supabaseClient';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseLedger = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'financial_ledgers' }
});

export default function Trade() {
  const prices = useStore((state) => state.goldPrices);
  const walletBalance = useStore((state) => state.walletBalance);
  const goldBalances = useStore((state) => state.goldBalances);
  const depositMoney = useStore((state) => state.depositMoney);
  const fetchGoldPrices = useStore((state) => state.fetchGoldPrices);
  const fetchUserBalances = useStore((state) => state.fetchUserBalances);

  const [activeTab, setActiveTab] = useState('buy'); // 'buy', 'sell', 'withdraw'
  const [selectedGoldKey, setSelectedGoldKey] = useState('');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [timeframe, setTimeframe] = useState('1D'); // '1H', '1D', '1W', '1M'
  const [timeLeft, setTimeLeft] = useState(60);
  const [orderStatus, setOrderStatus] = useState({ show: false, success: true, message: '' });
  const [chartData, setChartData] = useState([]);
  const [visibleCount, setVisibleCount] = useState(24);

  // Kho hàng vật lý của cửa hàng - được lấy trực tiếp từ database
  const [storeStock, setStoreStock] = useState({ sjc: 0, pnj: 0, doji: 0 });

  const fetchStoreStock = async () => {
    try {
      const { data, error } = await supabase
        .from('vault_inventory')
        .select('gold_type, status');
      if (error) throw error;
      
      const counts = { sjc: 0, pnj: 0, doji: 0 };
      if (data) {
        data.forEach(item => {
          if (item.status === 'AVAILABLE') {
            const type = item.gold_type.toLowerCase();
            if (type.includes('sjc')) counts.sjc += 1;
            else if (type.includes('pnj')) counts.pnj += 1;
            else if (type.includes('doji')) counts.doji += 1;
          }
        });
      }
      setStoreStock(counts);
    } catch (err) {
      console.error('Lỗi khi tải kho cửa hàng từ database:', err);
    }
  };

  const timerRef = useRef(null);

  // 1. Đồng bộ giá từ database, tồn kho và khởi tạo đếm ngược
  useEffect(() => {
    fetchGoldPrices();
    fetchStoreStock();
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchGoldPrices();
          fetchStoreStock();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchGoldPrices]);

  // Auto-select key đầu tiên
  useEffect(() => {
    const keys = Object.keys(prices);
    if (keys.length > 0 && !selectedGoldKey) {
      setSelectedGoldKey(keys[0]);
    }
  }, [prices]);

  // 2. Tải lịch sử biến động giá vàng
  useEffect(() => {
    const fetchHistory = async () => {
      if (!prices[selectedGoldKey]) return;
      const source = selectedGoldKey; // source giờ là type_code (VD: SJL1L10)
      const activeItem = prices[selectedGoldKey];
      
      let limit = 40;
      if (timeframe === '1H') limit = 15;
      else if (timeframe === '1D') limit = 30;
      else if (timeframe === '1W') limit = 50;
      else if (timeframe === '1M') limit = 80;

      try {
        const { data, error } = await supabaseLedger
          .from('gold_price_snapshots')
          .select('*')
          .eq('source', source)
          .eq('gold_type', activeItem.name)
          .order('recorded_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        if (data && data.length > 2) {
          const sorted = [...data].reverse();
          const candles = [];
          for (let i = 0; i < sorted.length; i++) {
            const close = Number(sorted[i].buy_price_vnd);
            const open = i > 0 ? Number(sorted[i - 1].buy_price_vnd) : close * (0.998 + Math.random() * 0.004);
            const diff = Math.abs(close - open);
            const maxVal = Math.max(open, close);
            const minVal = Math.min(open, close);
            
            const high = maxVal + (diff * 0.3) + (close * 0.001 * Math.random());
            const low = minVal - (diff * 0.3) - (close * 0.001 * Math.random());
            const volume = Math.floor(100 + Math.random() * 900);

            const dateObj = new Date(sorted[i].recorded_at);
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
          const currentPrice = activeTab === 'sell' ? activeItem.buy : activeItem.sell;
          const mockCandles = [];
          let prevClose = currentPrice * 0.98;
          const now = new Date();
          
          for (let i = 0; i < limit; i++) {
            const open = prevClose;
            const progress = i / (limit - 1);
            const trend = progress * (currentPrice * 0.018);
            const noise = (Math.random() - 0.5) * (currentPrice * 0.006);
            let close = open + (currentPrice * 0.0006) + noise;
            
            if (i === limit - 1) close = currentPrice;

            const maxVal = Math.max(open, close);
            const minVal = Math.min(open, close);
            const high = maxVal + (currentPrice * 0.002 * Math.random());
            const low = minVal - (currentPrice * 0.002 * Math.random());
            const volume = Math.floor(150 + Math.random() * 850);

            let timeStepMinutes = 5;
            if (timeframe === '1D') timeStepMinutes = 60;
            else if (timeframe === '1W') timeStepMinutes = 240;
            else if (timeframe === '1M') timeStepMinutes = 720;

            const mockDate = new Date(now.getTime() - (limit - i - 1) * timeStepMinutes * 60 * 1000);
            let label = '';
            if (timeframe === '1H' || timeframe === '1D') {
              label = mockDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            } else {
              label = mockDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            }

            mockCandles.push({ label, open, high, low, close, volume });
            prevClose = close;
          }
          setChartData(mockCandles);
        }
      } catch (err) {
        console.error("Lỗi khi tải lịch sử biểu đồ:", err);
      }
    };

    fetchHistory();
  }, [selectedGoldKey, timeframe, prices, activeTab]);

  useEffect(() => {
    setVisibleCount(chartData.length);
  }, [chartData]);

  const activeItem = prices[selectedGoldKey] || { name: 'Đang tải...', buy: 0, sell: 0, diff: 0, change: '▲ +0.00%', up: true };
  const currentPrice = activeTab === 'sell' ? activeItem.buy : activeItem.sell;

  const getGoldBalance = () => {
    // Tạm thời giữ tương thích ngược: với các loại vàng mới, trả về tổng số dư vàng chung
    const totalGold = (goldBalances.sjc || 0) + (goldBalances.pnj || 0) + (goldBalances.doji || 0);
    return totalGold;
  };

  const handleQuantityChange = (val) => {
    setQuantity(val);
    if (val === '' || isNaN(val)) {
      setAmount('');
      return;
    }
    const calculatedAmount = parseFloat(val) * currentPrice;
    setAmount(Math.round(calculatedAmount).toString());
  };

  const handleAmountChange = (val) => {
    setAmount(val);
    if (val === '' || isNaN(val)) {
      setQuantity('');
      return;
    }
    const calculatedQty = parseFloat(val) / currentPrice;
    setQuantity(calculatedQty.toFixed(4));
  };

  const handlePercentClick = (percent) => {
    if (activeTab === 'buy') {
      const targetAmount = Math.floor(walletBalance * percent);
      setAmount(targetAmount.toString());
      const calculatedQty = targetAmount / currentPrice;
      setQuantity(calculatedQty.toFixed(4));
    } else {
      const targetQty = getGoldBalance() * percent;
      setQuantity(targetQty.toFixed(4));
      const calculatedAmount = targetQty * currentPrice;
      setAmount(Math.round(calculatedAmount).toString());
    }
  };

  const handleZoomIn = () => {
    setVisibleCount((prev) => Math.max(6, prev - 4));
  };

  const handleZoomOut = () => {
    setVisibleCount((prev) => Math.min(chartData.length, prev + 4));
  };

  const handleResetZoom = () => {
    setVisibleCount(chartData.length);
  };

  // Xử lý đặt lệnh giao dịch
  const handleSubmitOrder = async () => {
    const qtyVal = parseFloat(quantity);
    const amountVal = parseFloat(amount);

    if (isNaN(qtyVal) || qtyVal <= 0) {
      setOrderStatus({ show: true, success: false, message: 'Số lượng vàng không hợp lệ.' });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setOrderStatus({ show: true, success: false, message: 'Vui lòng đăng nhập để thực hiện giao dịch.' });
      return;
    }

    const ordId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const txnId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    try {
      // Tải thông tin user profile
      const { data: dbUser, error: userErr } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('auth_user_id', session.user.id)
        .single();
      
      if (userErr || !dbUser) throw new Error('Không tìm thấy thông tin hồ sơ của bạn.');

      // Sử dụng selectedGoldKey trực tiếp làm goldType (giờ là mã vang.today như SJL1L10)
      let goldType = selectedGoldKey;

      // Lấy ví vàng của khách hàng trong CSDL
      const { data: wallets } = await supabase
        .from('gold_wallets')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('gold_type', goldType);

      let currentGrams = 0;
      if (wallets && wallets.length > 0) {
        currentGrams = Number(wallets[0].quantity_grams);
      }

      if (activeTab === 'buy') {
        // MUA VÀNG (Dữ liệu trừ Ví tiền VND, cộng Ví vàng online ngay lập tức)
        const currentStoreStock = storeStock[selectedGoldKey];
        if (qtyVal > currentStoreStock) {
          setOrderStatus({ 
            show: true, 
            success: false, 
            message: `Kho hàng của cửa hàng chỉ còn ${currentStoreStock} chỉ/lượng. Không đủ đáp ứng.` 
          });
          return;
        }

        if (amountVal > walletBalance) {
          setOrderStatus({ show: true, success: false, message: 'Số dư ví VND không đủ để thanh toán trực tuyến.' });
          return;
        }

        // 1. Trừ Ví tiền VND cục bộ & cộng ví vàng
        depositMoney(-amountVal);
        const sourceKey = selectedGoldKey;
        useStore.setState((state) => ({
          goldBalances: {
            ...state.goldBalances,
            [sourceKey]: parseFloat((state.goldBalances[sourceKey] + qtyVal).toFixed(4))
          }
        }));

        // 2. Cập nhật Ví vàng trong cơ sở dữ liệu Supabase lập tức
        const newGrams = currentGrams + (qtyVal * 3.75);
        await supabase
          .from('gold_wallets')
          .update({ quantity_grams: newGrams })
          .eq('user_id', dbUser.id)
          .eq('gold_type', goldType);

        // 3. Ghi log order hoàn thành lập tức lên Supabase
        await supabase
          .schema('financial_ledgers')
          .from('orders')
          .insert({
            id: ordId,
            user_id: dbUser.id,
            gold_type: activeItem.name,
            order_type: 'BUY_ONLINE',
            quantity_grams: qtyVal * 3.75,
            unit_price_vnd: Math.round(currentPrice / 3.75),
            total_amount_vnd: amountVal,
            status: 'COMPLETED'
          });

        // Hợp đồng mua điện tử qua SMTP
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: session.user.email,
              subject: `[GoldChain] Hợp đồng mua vàng tích lũy điện tử #${ordId}`,
              templateName: 'HopDongMua',
              templateData: {
                name: dbUser.full_name || session.user.email.split('@')[0],
                contractId: ordId,
                goldType: activeItem.name,
                quantity: qtyVal.toString(),
                price: currentPrice.toLocaleString('vi-VN'),
                total: amountVal.toLocaleString('vi-VN'),
                date: new Date().toLocaleString('vi-VN')
              }
            })
          });
        } catch (mailErr) {
          console.error("Lỗi gửi email hợp đồng mua qua SMTP:", mailErr);
        }

        // 4. Tạo lịch sử giao dịch local
        const newTxn = {
          id: txnId,
          type: 'buy',
          goldTypeName: activeItem.name,
          quantity: qtyVal,
          price: currentPrice,
          total: amountVal,
          pnl: '—',
          time: new Date().toLocaleTimeString('vi-VN') + ' hôm nay',
          status: 'OK'
        };

        useStore.setState((state) => ({
          transactions: [newTxn, ...state.transactions]
        }));

        // Cập nhật lại kho của shop
        setStoreStock(prev => ({
          ...prev,
          [selectedGoldKey]: Math.max(0, Number((prev[selectedGoldKey] - qtyVal).toFixed(2)))
        }));

        setOrderStatus({ 
          show: true, 
          success: true, 
          message: `Mua tích lũy thành công! Trừ ví VND và cộng ${qtyVal} chỉ vào ví vàng tích lũy online của bạn.` 
        });

      } else if (activeTab === 'sell') {
        // BÁN VÀNG (Trừ Ví vàng online và cộng tiền vào Ví VND trực tuyến ngay lập tức)
        const availableGold = getGoldBalance();
        if (qtyVal > availableGold) {
          setOrderStatus({ 
            show: true, 
            success: false, 
            message: `Số dư ví vàng ${activeItem.name} tích lũy của bạn không đủ để bán. Sở hữu hiện tại: ${availableGold.toFixed(3)} chỉ.` 
          });
          return;
        }

        // 1. Trừ Ví vàng cục bộ & cộng Ví VND
        const sourceKey = selectedGoldKey;
        useStore.setState((state) => ({
          goldBalances: {
            ...state.goldBalances,
            [sourceKey]: Math.max(0, parseFloat((state.goldBalances[sourceKey] - qtyVal).toFixed(4)))
          }
        }));
        depositMoney(amountVal);

        // 2. Trừ Ví vàng trong cơ sở dữ liệu Supabase
        const newGrams = Math.max(0, currentGrams - (qtyVal * 3.75));
        await supabase
          .from('gold_wallets')
          .update({ quantity_grams: newGrams })
          .eq('user_id', dbUser.id)
          .eq('gold_type', goldType);

        // 3. Ghi log order hoàn thành lập tức lên Supabase
        await supabase
          .schema('financial_ledgers')
          .from('orders')
          .insert({
            id: ordId,
            user_id: dbUser.id,
            gold_type: activeItem.name,
            order_type: 'SELL_ONLINE',
            quantity_grams: qtyVal * 3.75,
            unit_price_vnd: Math.round(currentPrice / 3.75),
            total_amount_vnd: amountVal,
            status: 'COMPLETED'
          });

        // Hợp đồng bán điện tử qua SMTP
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: session.user.email,
              subject: `[GoldChain] Hợp đồng bán vàng tích lũy trực tuyến #${ordId}`,
              templateName: 'HopDongBan',
              templateData: {
                name: dbUser.full_name || session.user.email.split('@')[0],
                contractId: ordId,
                goldType: activeItem.name,
                quantity: qtyVal.toString(),
                price: currentPrice.toLocaleString('vi-VN'),
                total: amountVal.toLocaleString('vi-VN'),
                date: new Date().toLocaleString('vi-VN')
              }
            })
          });
        } catch (mailErr) {
          console.error("Lỗi gửi email hợp đồng bán qua SMTP:", mailErr);
        }

        // 4. Giao dịch local
        const newTxn = {
          id: txnId,
          type: 'sell',
          goldTypeName: activeItem.name,
          quantity: qtyVal,
          price: currentPrice,
          total: amountVal,
          pnl: '—',
          time: new Date().toLocaleTimeString('vi-VN') + ' hôm nay',
          status: 'OK'
        };

        useStore.setState((state) => ({
          transactions: [newTxn, ...state.transactions]
        }));

        setOrderStatus({ 
          show: true, 
          success: true, 
          message: `Bán thành công! Ví vàng của bạn đã trừ ${qtyVal} chỉ và cộng ₫${amountVal.toLocaleString('vi-VN')} vào ví VND trực tuyến.` 
        });

      } else if (activeTab === 'withdraw') {
        // RÚT VÀNG VẬT CHẤT (Chờ duyệt và quét mã QR tại quầy để bàn giao vàng vật chất)
        const availableGold = getGoldBalance();
        if (qtyVal > availableGold) {
          setOrderStatus({ 
            show: true, 
            success: false, 
            message: `Số dư ví vàng tích lũy không đủ để thực hiện yêu cầu rút. Khả dụng: ${availableGold.toFixed(3)} chỉ.` 
          });
          return;
        }

        // 1. Khấu trừ Ví vàng online tạm thời của khách (đóng băng để chuyển thành vàng thật)
        const sourceKey = selectedGoldKey;
        useStore.setState((state) => ({
          goldBalances: {
            ...state.goldBalances,
            [sourceKey]: Math.max(0, parseFloat((state.goldBalances[sourceKey] - qtyVal).toFixed(4)))
          }
        }));

        // 2. Trừ Ví vàng trong CSDL Supabase
        const newGrams = Math.max(0, currentGrams - (qtyVal * 3.75));
        await supabase
          .from('gold_wallets')
          .update({ quantity_grams: newGrams })
          .eq('user_id', dbUser.id)
          .eq('gold_type', goldType);

        // 3. Đăng ký một đơn rút vàng vật chất PENDING (Chờ quét QR tại quầy)
        await supabase
          .schema('financial_ledgers')
          .from('orders')
          .insert({
            id: ordId,
            user_id: dbUser.id,
            gold_type: activeItem.name,
            order_type: 'WITHDRAW_PHYSICAL',
            quantity_grams: qtyVal * 3.75,
            unit_price_vnd: Math.round(currentPrice / 3.75),
            total_amount_vnd: amountVal,
            status: 'PENDING' // Chờ ra quầy nhận
          });

        // 4. Tạo lịch sử giao dịch ở dạng PENDING (Chờ nhận vàng)
        const newTxn = {
          id: txnId,
          type: 'withdraw',
          goldTypeName: activeItem.name,
          quantity: qtyVal,
          price: currentPrice,
          total: amountVal,
          pnl: '—',
          time: new Date().toLocaleTimeString('vi-VN') + ' hôm nay',
          status: 'Chờ nhận tại quầy'
        };

        const newOrder = {
          id: ordId,
          goldType: selectedGoldKey,
          goldTypeName: activeItem.name,
          quantity: qtyVal,
          totalAmount: amountVal,
          createdAt: new Date().toLocaleTimeString('vi-VN') + ' hôm nay',
          status: 'pending'
        };

        useStore.setState((state) => ({
          orders: [newOrder, ...state.orders],
          transactions: [newTxn, ...state.transactions]
        }));

        setOrderStatus({ 
          show: true, 
          success: true, 
          message: `Yêu cầu rút vàng vật chất thành công! Số dư ví vàng đã đóng băng ${qtyVal} chỉ. Vui lòng mang CCCD và mã hợp đồng ${ordId} ra quầy để quét mã nhận vàng thật.` 
        });
      }

      // Làm mới số dư vàng & kho cửa hàng
      await fetchUserBalances(dbUser.id);
      await fetchStoreStock();
      setQuantity('');
      setAmount('');
    } catch (err) {
      console.error(err);
      setOrderStatus({ show: true, success: false, message: 'Đã xảy ra lỗi: ' + err.message });
    }
  };

  // 4. Vẽ biểu đồ hình nến Nhật
  const renderChartElements = () => {
    if (chartData.length === 0) return null;
    const visibleData = chartData.slice(-visibleCount);
    if (visibleData.length === 0) return null;

    const width = 600;
    const height = 220;
    const padding = 20;

    const highs = visibleData.map(d => d.high);
    const lows = visibleData.map(d => d.low);
    const maxVolume = Math.max(...visibleData.map(d => d.volume)) || 1;
    
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

    const candleWidth = Math.max(4, Math.floor((width - padding * 2) / visibleData.length) - 6);

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

  const goldListKeys = Object.keys(prices);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      
      {/* 1. TICKER TAPE HEADER */}
      <div className="neo-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', background: '#050505', border: '1px solid rgba(212, 175, 55, 0.15)', padding: '12px 24px', borderRadius: '8px' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mã sản phẩm</span>
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--gold)', marginTop: '2px' }}>{activeItem.name}</div>
        </div>
        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.08)' }}></div>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Giá mua vào (Shop)</span>
          <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--emerald)', marginTop: '2px' }}>₫{activeItem.buy.toLocaleString('vi-VN')}</div>
        </div>
        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.08)' }}></div>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Giá bán ra (Shop)</span>
          <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--ruby)', marginTop: '2px' }}>₫{activeItem.sell.toLocaleString('vi-VN')}</div>
        </div>
        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.08)' }}></div>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Biến động 24h</span>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: activeItem.up ? 'var(--emerald)' : 'var(--ruby)', marginTop: '2px' }}>
            {activeItem.change}
          </div>
        </div>
        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.08)' }}></div>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chênh lệch Spread</span>
          <div style={{ fontWeight: '500', fontSize: '14px', color: 'var(--text-main)', marginTop: '2px' }}>₫{activeItem.diff.toLocaleString('vi-VN')}</div>
        </div>
      </div>

      {/* 2. BỐ CỤC 2 CỘT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px' }}>
        
        {/* CỘT TRÁI: BIỂU ĐỒ NẾN + BẢNG GIÁ + KHO CỦA CỬA HÀNG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="neo-card" style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.06)', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '70px', left: '20px', display: 'flex', gap: '12px', fontSize: '11px', zIndex: 5 }}>
              <span style={{ color: '#F59E0B' }}>● MA(9): ₫{chartData[chartData.length-1]?.close.toLocaleString('vi-VN')}</span>
              <span style={{ color: '#EC4899' }}>● MA(21): ₫{chartData[chartData.length-1]?.open.toLocaleString('vi-VN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative', zIndex: 2 }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Đồ thị Nến Nhật &bull; volume</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['1H', '1D', '1W', '1M'].map((tf) => (
                    <button 
                      key={tf} 
                      className="btn" 
                      onClick={() => setTimeframe(tf)}
                      style={{ 
                        fontSize: '11px', 
                        padding: '4px 10px', 
                        background: timeframe === tf ? 'var(--gold)' : 'rgba(255,255,255,0.02)',
                        color: timeframe === tf ? '#000' : 'var(--text-main)',
                        borderColor: timeframe === tf ? 'var(--gold)' : 'rgba(255,255,255,0.08)'
                      }}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
                <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.12)' }}></div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button className="btn" onClick={handleZoomIn} style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255,255,255,0.02)' }}>🔍+</button>
                  <button className="btn" onClick={handleZoomOut} style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255,255,255,0.02)' }}>🔍-</button>
                  <button className="btn" onClick={handleResetZoom} style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255,255,255,0.02)' }}>↺</button>
                </div>
              </div>
            </div>

            <div style={{ height: '220px', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {chartData.length > 0 ? (
                <svg width="100%" height="100%" viewBox="0 0 600 220" preserveAspectRatio="none">
                  {renderChartElements()}
                </svg>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>Đang tạo biểu đồ...</div>
              )}
            </div>
          </div>

          {/* Bảng báo giá */}
          <div className="neo-card" style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
            <div className="h3" style={{ marginBottom: '12px', fontSize: '14px' }}>Bảng báo giá niêm yết tại quầy</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Sản phẩm vàng</th>
                    <th>Cửa hàng Mua vào</th>
                    <th>Cửa hàng Bán ra</th>
                    <th>Biến động 24h</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>Chọn</th>
                  </tr>
                </thead>
                <tbody>
                  {goldListKeys.map((key) => {
                    const item = prices[key];
                    if (!item) return null;
                    const isSelected = selectedGoldKey === key;
                    return (
                      <tr key={key} onClick={() => setSelectedGoldKey(key)} style={{ cursor: 'pointer', background: isSelected ? 'rgba(212, 175, 55, 0.05)' : 'transparent' }}>
                        <td style={{ fontWeight: '600', color: isSelected ? 'var(--gold)' : '#fff' }}>{item.name}</td>
                        <td className="price-dn">₫{item.buy.toLocaleString('vi-VN')}</td>
                        <td className="price-up">₫{item.sell.toLocaleString('vi-VN')}</td>
                        <td style={{ color: item.up ? 'var(--emerald)' : 'var(--ruby)', fontWeight: '500' }}>{item.change}</td>
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{
                            width: '14px', height: '14px', borderRadius: '50%',
                            border: isSelected ? '1.5px solid var(--gold)' : '1.5px solid rgba(255, 255, 255, 0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: '0.2s all ease',
                            boxShadow: isSelected ? '0 0 8px rgba(212, 175, 55, 0.5)' : 'none',
                            background: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                            margin: '0 auto'
                          }}>
                            {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 4px var(--gold)' }} />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kho vàng shop */}
          <div className="neo-card" style={{ background: '#050505', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div className="h3" style={{ margin: 0, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--gold)', borderRadius: '50%', boxShadow: '0 0 8px var(--gold)' }}></span>
                Trạng thái kho vàng của Cửa hàng (Store Vault)
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {goldListKeys.map((key) => {
                const item = prices[key];
                if (!item) return null;
                const stockQty = storeStock[key] || 0;
                const unit = 'lượng';
                const isLow = stockQty < 60;
                return (
                  <div key={key} style={{ padding: '10px 12px', background: selectedGoldKey === key ? 'rgba(212, 175, 55, 0.04)' : 'rgba(255,255,255,0.01)', border: selectedGoldKey === key ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: isLow ? '#F59E0B' : '#fff' }}>{stockQty} <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>{unit}</span></div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* CỘT PHẢI: FORM GIAO DỊCH (MUA / BÁN / RÚT) */}
        <div className="neo-card" style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.06)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.02)', padding: '2px', borderRadius: '8px' }}>
            <button 
              onClick={() => { setActiveTab('buy'); setQuantity(''); setAmount(''); }}
              style={{ 
                flex: 1, padding: '10px 4px', border: 'none', borderRadius: '6px', fontSize: '12px',
                background: activeTab === 'buy' ? 'var(--emerald)' : 'transparent',
                color: activeTab === 'buy' ? '#000' : 'var(--text-muted)',
                fontWeight: 'bold', cursor: 'pointer', transition: '0.2s'
              }}
            >
              Mua tích lũy
            </button>
            <button 
              onClick={() => { setActiveTab('sell'); setQuantity(''); setAmount(''); }}
              style={{ 
                flex: 1, padding: '10px 4px', border: 'none', borderRadius: '6px', fontSize: '12px',
                background: activeTab === 'sell' ? 'var(--ruby)' : 'transparent',
                color: activeTab === 'sell' ? '#fff' : 'var(--text-muted)',
                fontWeight: 'bold', cursor: 'pointer', transition: '0.2s'
              }}
            >
              Bán trực tuyến
            </button>
            <button 
              onClick={() => { setActiveTab('withdraw'); setQuantity(''); setAmount(''); }}
              style={{ 
                flex: 1, padding: '10px 4px', border: 'none', borderRadius: '6px', fontSize: '12px',
                background: activeTab === 'withdraw' ? 'var(--gold-gradient)' : 'transparent',
                color: activeTab === 'withdraw' ? '#000' : 'var(--text-muted)',
                fontWeight: 'bold', cursor: 'pointer', transition: '0.2s'
              }}
            >
              Rút vật chất
            </button>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
            {activeTab === 'buy' && <span><strong>Thao tác:</strong> Trừ tiền Ví VND, cộng Ví vàng online tức thì.</span>}
            {activeTab === 'sell' && <span><strong>Thao tác:</strong> Trừ Ví vàng online, cộng tiền Ví VND trực tuyến.</span>}
            {activeTab === 'withdraw' && <span><strong>Thao tác:</strong> Đóng băng Ví vàng online. Bạn phải đến quầy quét mã QR để lấy vàng vật chất.</span>}
          </div>

          {/* Form input */}
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Sản phẩm vàng</label>
            <select 
              className="form-input" 
              value={selectedGoldKey} 
              onChange={(e) => { setSelectedGoldKey(e.target.value); setQuantity(''); setAmount(''); }}
              style={{ background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' }}
            >
              {goldListKeys.map((key) => (
                <option key={key} value={key}>
                  {prices[key]?.name} (&bull; ₫{(activeTab === 'sell' ? prices[key]?.buy : prices[key]?.sell)?.toLocaleString('vi-VN')}/chỉ)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Số lượng giao dịch (chỉ)</label>
            <input 
              className="form-input" 
              placeholder="0.00" 
              type="number" 
              step="0.01" 
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              style={{ background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <div className="form-hint" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {activeTab === 'buy'
                ? `Kho cửa hàng còn: ${storeStock[selectedGoldKey] || 0} lượng`
                : `Ví vàng tích lũy cá nhân: ${getGoldBalance().toFixed(3)} chỉ`}
            </div>
          </div>

          {/* Nút phần trăm */}
          {activeTab !== 'withdraw' && (
            <div style={{ display: 'flex', gap: '6px' }}>
              {[0.25, 0.50, 0.75, 1.0].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePercentClick(p)}
                  style={{
                    flex: 1, padding: '6px 0', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px',
                    color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer'
                  }}
                  className="hover-highlight"
                >
                  {p * 100}%
                </button>
              ))}
            </div>
          )}

          {activeTab !== 'withdraw' && (
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Số tiền quy đổi (VNĐ)</label>
              <input 
                className="form-input" 
                placeholder="0" 
                type="number" 
                step="1000"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                style={{ background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <div className="form-hint" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {activeTab === 'buy'
                  ? `Số dư Ví tiền khả dụng: ₫${walletBalance.toLocaleString('vi-VN')}`
                  : `Trị giá quy đổi dự kiến: ₫${amount ? Math.round(parseFloat(amount)).toLocaleString('vi-VN') : '0'}`}
              </div>
            </div>
          )}

          {/* Báo cáo phí */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Giá chốt giao dịch</span>
              <span style={{ color: 'var(--gold)', fontWeight: '600' }}>₫{currentPrice.toLocaleString('vi-VN')} / chỉ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Phí dịch vụ rút</span>
              <span style={{ color: 'var(--emerald)' }}>Miễn phí (₫0)</span>
            </div>
            {activeTab !== 'withdraw' && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span style={{ color: '#fff' }}>{activeTab === 'buy' ? 'Tổng thanh toán' : 'Tổng nhận về'}</span>
                  <span style={{ color: 'var(--gold)', fontSize: '14px' }}>₫{amount ? Math.round(parseFloat(amount)).toLocaleString('vi-VN') : '0'}</span>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(212,175,55,0.05)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.12)' }}>
            <span className="pulse-dot" style={{ display: 'inline-block', width: '5px', height: '5px', background: 'var(--gold)', borderRadius: '50%' }}></span>
            <span style={{ fontSize: '11px', color: '#B59440' }}>
              Giá niêm yết được chốt trong <strong style={{ color: '#fff' }}>{timeLeft}</strong> giây
            </span>
          </div>

          <button 
            className="btn" 
            onClick={handleSubmitOrder}
            disabled={!quantity || parseFloat(quantity) <= 0}
            style={{ 
              width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold',
              background: activeTab === 'buy' ? 'var(--emerald)' : (activeTab === 'sell' ? 'var(--ruby)' : 'var(--gold-gradient)'),
              color: activeTab === 'sell' ? '#fff' : '#000',
              border: 'none', borderRadius: '6px',
              cursor: (!quantity || parseFloat(quantity) <= 0) ? 'not-allowed' : 'pointer',
              opacity: (!quantity || parseFloat(quantity) <= 0) ? 0.45 : 1
            }}
          >
            {activeTab === 'buy' ? 'MUA VÀO VÍ VÀNG' : (activeTab === 'sell' ? 'BÁN TRỰC TUYẾN' : 'TẠO YÊU CẦU RÚT VÀNG')}
          </button>
        </div>

      </div>

      {/* TOAST THÔNG BÁO KẾT QUẢ */}
      {orderStatus.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="neo-card" style={{ background: '#050505', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '24px', maxWidth: '380px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '40px', color: orderStatus.success ? 'var(--emerald)' : 'var(--ruby)' }}>
              {orderStatus.success ? '✓' : '✗'}
            </div>
            <h4 className="h3" style={{ margin: 0, color: '#fff', fontSize: '16px' }}>{orderStatus.success ? 'Thành công' : 'Thất bại'}</h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{orderStatus.message}</p>
            <button 
              className="btn btn-gold" 
              onClick={() => setOrderStatus({ show: false, success: true, message: '' })}
              style={{ width: '100%', padding: '10px', fontWeight: 'bold' }}
            >
              Đồng ý
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
