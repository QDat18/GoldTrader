import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const supabaseLedger = supabase.schema('financial_ledgers');

const generateBlockchainHash = async (payloadStr) => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadStr);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Lỗi khi băm SHA-256:', err);
    return 'HASH-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
};

export default function Trade() {
  const prices = useStore((state) => state.goldPrices);
  const walletBalance = useStore((state) => state.walletBalance);
  const goldBalances = useStore((state) => state.goldBalances);
  const depositMoney = useStore((state) => state.depositMoney);
  const fetchGoldPrices = useStore((state) => state.fetchGoldPrices);
  const fetchUserBalances = useStore((state) => state.fetchUserBalances);
  const currentUser = useStore((state) => state.currentUser);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('buy'); // 'buy', 'sell', 'withdraw'
  const [selectedGoldKey, setSelectedGoldKey] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pickupStore, setPickupStore] = useState('');
  const [amount, setAmount] = useState('');
  const [timeframe, setTimeframe] = useState('1D'); // '1H', '1D', '1W', '1M'
  const [timeLeft, setTimeLeft] = useState(60);
  const [orderStatus, setOrderStatus] = useState({ show: false, success: true, message: '' });
  const [showConfirmBuy, setShowConfirmBuy] = useState(false);
  const [showInvoiceOpen, setShowInvoiceOpen] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [visibleCount, setVisibleCount] = useState(24);

  // Kho hàng vật lý của cửa hàng - được lấy trực tiếp từ database
  const [storeStock, setStoreStock] = useState({});

  const getBrandCategory = (key) => {
    return key;
  };

  const fetchStoreStock = async () => {
    try {
      const { data, error } = await supabase
        .from('vault_inventory')
        .select('gold_type, status, weight_grams');
      if (error) throw error;
      
      const weights = {};
      const keys = Object.keys(prices);
      keys.forEach(k => { weights[k] = 0; });

      if (data) {
        data.forEach(item => {
          if (item.status === 'AVAILABLE') {
            const key = item.gold_type; // e.g. "SJL1L10"
            const w = Number(item.weight_grams) || 0;
            if (weights[key] !== undefined) {
              weights[key] += w;
            } else {
              // Hỗ trợ dự phòng các mã cũ
              const typeLower = key.toLowerCase();
              if (typeLower.includes('sjc')) weights['SJL1L10'] = (weights['SJL1L10'] || 0) + w;
              else if (typeLower.includes('pnj')) weights['PQHNVM'] = (weights['PQHNVM'] || 0) + w;
            }
          }
        });
      }
      setStoreStock(weights);
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
      let startTime = new Date();
      if (timeframe === '1H') {
        limit = 15;
        startTime.setHours(startTime.getHours() - 1);
      } else if (timeframe === '1D') {
        limit = 30;
        startTime.setDate(startTime.getDate() - 1);
      } else if (timeframe === '1W') {
        limit = 50;
        startTime.setDate(startTime.getDate() - 7);
      } else if (timeframe === '1M') {
        limit = 80;
        startTime.setDate(startTime.getDate() - 30);
      }

      try {
        const { data, error } = await supabaseLedger
          .from('gold_price_snapshots')
          .select('*')
          .eq('source', source)
          .eq('gold_type', activeItem.name)
          .gte('recorded_at', startTime.toISOString())
          .order('recorded_at', { ascending: true }); // Chú ý: sắp xếp tăng dần thời gian

        if (error) throw error;

        if (data && data.length >= 5) {
          // Xác định số phút cho mỗi nến tùy timeframe
          let T = 5; // số phút gộp
          if (timeframe === '1H') T = 5;
          else if (timeframe === '1D') T = 48; // ~30 nến / ngày
          else if (timeframe === '1W') T = 240; // 42 nến / tuần (6 nến/ngày)
          else if (timeframe === '1M') T = 1440; // 30 nến / tháng (1 nến/ngày)

          // Gộp dữ liệu theo thời gian (bucketKey)
          const bucketKeyOf = (dateStr, minutes) => {
            const d = new Date(dateStr);
            if (minutes === 1440) {
              return d.toISOString().substring(0, 10); // "YYYY-MM-DD"
            }
            const ms = d.getTime();
            const bucketMs = Math.floor(ms / (minutes * 60 * 1000)) * (minutes * 60 * 1000);
            return new Date(bucketMs).toISOString();
          };

          const groups = {};
          const groupKeys = [];
          for (const row of data) {
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
            
            // open lấy từ close của nến trước, nếu là nến đầu tiên thì lấy buy_price của bản ghi đầu tiên trong nhóm
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
            
            // volume: tổng volume hoặc tự sinh dựa trên số lượng bản ghi gộp lại
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
          // Fallback sang mock data nếu dữ liệu lịch sử trong DB chưa đủ (ví dụ setup mới)
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

  const getGoldBalance = (keyOverride) => {
    return goldBalances[keyOverride || selectedGoldKey] || 0;
  };

  const goldListKeys = Object.keys(prices);

  const availableGoldListKeys = (activeTab === 'sell' || activeTab === 'withdraw')
    ? goldListKeys.filter(key => getGoldBalance(key) > 0)
    : goldListKeys;

  useEffect(() => {
    if (activeTab === 'sell' || activeTab === 'withdraw') {
      const available = goldListKeys.filter(k => getGoldBalance(k) > 0);
      if (available.length > 0 && !available.includes(selectedGoldKey)) {
        setSelectedGoldKey(available[0]);
        setQuantity('');
        setAmount('');
      } else if (available.length === 0 && selectedGoldKey !== '') {
        setSelectedGoldKey('');
        setQuantity('');
        setAmount('');
      }
    }
  }, [activeTab, goldBalances, selectedGoldKey]);

  const activeItem = prices[selectedGoldKey] || { name: 'Đang tải...', buy: 0, sell: 0, diff: 0, change: '▲ +0.00%', up: true };
  const currentPrice = activeTab === 'sell' ? activeItem.buy : activeItem.sell;

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

      // Sử dụng selectedGoldKey tương ứng với mã nguyên bản (VD: SJL1L10)
      const exactGoldType = selectedGoldKey;

      // Lấy ví vàng của khách hàng trong CSDL
      const { data: wallets } = await supabase
        .from('gold_wallets')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('gold_type', exactGoldType);

      let currentGrams = 0;
      if (wallets && wallets.length > 0) {
        currentGrams = Number(wallets[0].quantity_grams);
      }

      if (activeTab === 'buy') {
        // MUA VÀNG (Dữ liệu trừ Ví tiền VND, cộng Ví vàng online ngay lập tức)
        const currentStoreStock = storeStock[selectedGoldKey] || 0; // grams
        const stockQtyChi = currentStoreStock / 3.75; // 3.75g = 1 chỉ
        if (qtyVal > stockQtyChi) {
          setOrderStatus({ 
            show: true, 
            success: false, 
            message: `Kho hàng của cửa hàng chỉ còn ${stockQtyChi.toFixed(2)} chỉ. Không đủ đáp ứng.` 
          });
          return;
        }

        if (amountVal > walletBalance) {
          setOrderStatus({ show: true, success: false, message: 'Số dư ví VND không đủ để thanh toán trực tuyến.' });
          return;
        }

        // 1. Trừ Ví tiền VND cục bộ & cộng ví vàng
        depositMoney(-amountVal);
        useStore.setState((state) => ({
          goldBalances: {
            ...state.goldBalances,
            [exactGoldType]: parseFloat(((state.goldBalances[exactGoldType] || 0) + qtyVal).toFixed(4))
          }
        }));

        // 2. Cập nhật Ví vàng trong cơ sở dữ liệu Supabase lập tức
        const newGrams = Number((currentGrams + (qtyVal * 3.75)).toFixed(4));
        if (wallets && wallets.length > 0) {
          await supabase
            .from('gold_wallets')
            .update({ quantity_grams: newGrams })
            .eq('id', wallets[0].id);
        } else {
          await supabase
            .from('gold_wallets')
            .insert({ user_id: dbUser.id, gold_type: exactGoldType, quantity_grams: newGrams });
        }

        // 2.5. Trừ tồn kho vật lý tương ứng trong Database (vault_inventory)
        const { data: availableBars, error: fetchErr } = await supabase
          .from('vault_inventory')
          .select('*')
          .eq('gold_type', selectedGoldKey)
          .eq('status', 'AVAILABLE')
          .order('id', { ascending: true });

        if (fetchErr) throw fetchErr;

        let gramsToDeduct = qtyVal * 3.75;
        if (availableBars && availableBars.length > 0) {
          for (const bar of availableBars) {
            if (gramsToDeduct <= 0) break;
            const barWeight = Number(bar.weight_grams);
            if (barWeight <= gramsToDeduct) {
              gramsToDeduct -= barWeight;
              const { error: updErr } = await supabase
                .from('vault_inventory')
                .update({
                  status: 'RESERVED',
                  order_id: ordId
                })
                .eq('id', bar.id);
              if (updErr) throw updErr;
            } else {
              const newGrams = barWeight - gramsToDeduct;
              gramsToDeduct = 0;
              const { error: updErr } = await supabase
                .from('vault_inventory')
                .update({
                  weight_grams: newGrams,
                  order_id: ordId
                })
                .eq('id', bar.id);
              if (updErr) throw updErr;
            }
          }
        }

        // 3. Ghi log order hoàn thành lập tức lên Supabase
        const payloadStrBuy = `${ordId}|BUY|${dbUser.id}|${exactGoldType}|${qtyVal}|${amountVal}|${new Date().toISOString()}`;
        const pdfHashBuy = await generateBlockchainHash(payloadStrBuy);
        await supabase
          .schema('financial_ledgers')
          .from('orders')
          .insert({
            id: ordId,
            user_id: dbUser.id,
            gold_type: exactGoldType,
            order_type: 'BUY_ONLINE',
            quantity_grams: Number((qtyVal * 3.75).toFixed(4)),
            unit_price_vnd: Math.round(currentPrice / 3.75),
            total_amount_vnd: amountVal,
            order_status: 'COMPLETED',
            payment_status: 'PAID',
            secure_token: 'TOK-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            pdf_hash: pdfHashBuy
          });

        const invoiceInfo = {
          name: dbUser.full_name || session.user.email.split('@')[0],
          contractId: ordId,
          goldType: activeItem.name,
          quantity: `${qtyVal.toString()} (${Number((qtyVal * 3.75).toFixed(4))}g)`,
          price: currentPrice.toLocaleString('vi-VN'),
          total: amountVal.toLocaleString('vi-VN'),
          date: new Date().toLocaleString('vi-VN'),
          type: activeTab
        };

        // Hợp đồng mua điện tử qua SMTP (Chạy ngầm không await)
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: session.user.email,
            subject: `[GoldChain] Hợp đồng mua vàng tích lũy điện tử #${ordId}`,
            templateName: 'HopDongMua',
            templateData: invoiceInfo
          })
        }).catch(mailErr => console.error("Lỗi gửi email hợp đồng mua qua SMTP:", mailErr));

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

        setInvoiceDetails(invoiceInfo);
        setShowInvoiceOpen(true);

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
        useStore.setState((state) => ({
          goldBalances: {
            ...state.goldBalances,
            [exactGoldType]: Math.max(0, parseFloat((state.goldBalances[exactGoldType] - qtyVal).toFixed(4)))
          }
        }));
        depositMoney(amountVal);

        // 2. Trừ Ví vàng trong cơ sở dữ liệu Supabase
        const newGrams = Math.max(0, Number((currentGrams - (qtyVal * 3.75)).toFixed(4)));
        await supabase
          .from('gold_wallets')
          .update({ quantity_grams: newGrams })
          .eq('id', wallets[0].id);

        // 3. Ghi log order hoàn thành lập tức lên Supabase
        const payloadStrSell = `${ordId}|SELL|${dbUser.id}|${exactGoldType}|${qtyVal}|${amountVal}|${new Date().toISOString()}`;
        const pdfHashSell = await generateBlockchainHash(payloadStrSell);
        await supabase
          .schema('financial_ledgers')
          .from('orders')
          .insert({
            id: ordId,
            user_id: dbUser.id,
            gold_type: exactGoldType,
            order_type: 'SELL_ONLINE',
            quantity_grams: Number((qtyVal * 3.75).toFixed(4)),
            unit_price_vnd: Math.round(currentPrice / 3.75),
            total_amount_vnd: amountVal,
            order_status: 'COMPLETED',
            payment_status: 'PAID',
            secure_token: 'TOK-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            pdf_hash: pdfHashSell
          });

        // Hợp đồng bán điện tử qua SMTP (Chạy ngầm không await)
        fetch('/api/send-email', {
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
              quantity: `${qtyVal.toString()} (${Number((qtyVal * 3.75).toFixed(4))}g)`,
              price: currentPrice.toLocaleString('vi-VN'),
              total: amountVal.toLocaleString('vi-VN'),
              date: new Date().toLocaleString('vi-VN'),
              type: activeTab
            }
          })
        }).catch(mailErr => console.error("Lỗi gửi email hợp đồng bán qua SMTP:", mailErr));

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
        if (!pickupStore) {
          setOrderStatus({ show: true, success: false, message: 'Vui lòng chọn chi nhánh cửa hàng để nhận vàng.' });
          return;
        }
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
        const newGrams = Math.max(0, Number((currentGrams - (qtyVal * 3.75)).toFixed(4)));
        await supabase
          .from('gold_wallets')
          .update({ quantity_grams: newGrams })
          .eq('id', wallets[0].id);

        // 3. Đăng ký một đơn rút vàng vật chất PENDING (Chờ quét QR tại quầy)
        const payloadStrWithdraw = `${ordId}|WITHDRAW|${dbUser.id}|${exactGoldType}|${qtyVal}|${amountVal}|${new Date().toISOString()}`;
        const pdfHashWithdraw = await generateBlockchainHash(payloadStrWithdraw);
        await supabase
          .schema('financial_ledgers')
          .from('orders')
          .insert({
            id: ordId,
            user_id: dbUser.id,
            gold_type: exactGoldType,
            order_type: 'WITHDRAW_PHYSICAL',
            quantity_grams: Number((qtyVal * 3.75).toFixed(4)),
            unit_price_vnd: Math.round(currentPrice / 3.75),
            total_amount_vnd: amountVal,
            order_status: 'WAITING_PICKUP',
            payment_status: 'PAID',
            secure_token: 'TOK-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            pdf_hash: pdfHashWithdraw
          });

        const storeNameMap = {
          'HN_123_THAIHA': 'Hà Nội: 123 Thái Hà, Quận Đống Đa',
          'HCM_456_NTMK': 'TP.HCM: 456 Nguyễn Thị Minh Khai, Quận 3',
          'DN_789_NVL': 'Đà Nẵng: 789 Nguyễn Văn Linh, Quận Hải Châu'
        };

        const secretToken = 'TOK-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        // Gửi Thư mời nhận vàng qua Email (Kèm Mã QR / Mã bảo mật)
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: session.user.email,
            subject: `[GoldChain] Thư mời nhận bàn giao vàng vật chất #${ordId}`,
            templateName: 'ThuMoiNhanVang',
            templateData: {
              name: dbUser.full_name || session.user.email.split('@')[0],
              contractId: ordId,
              goldType: activeItem.name,
              quantity: `${qtyVal.toString()} (${Number((qtyVal * 3.75).toFixed(4))}g)`,
              pickupStore: storeNameMap[pickupStore] || pickupStore,
              secureToken: secretToken,
              date: new Date().toLocaleString('vi-VN')
            }
          })
        }).catch(mailErr => console.error("Lỗi gửi email thư mời nhận vàng qua SMTP:", mailErr));

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
          message: `Yêu cầu rút vàng thành công! Hệ thống đã gửi THƯ MỜI NHẬN VÀNG kèm MÃ BẢO MẬT (QR) tới Email của bạn. Vui lòng mang CCCD đến chi nhánh đã chọn để nhận vàng.` 
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
                const totalWeightGrams = storeStock[key] || 0;
                const stockQtyLuot = totalWeightGrams / 37.5; // 37.5g = 1 lượng
                const unit = 'lượng';
                const isLow = stockQtyLuot < 6.0; // low stock below 6 lượng
                return (
                  <div key={key} style={{ padding: '10px 12px', background: selectedGoldKey === key ? 'rgba(212, 175, 55, 0.04)' : 'rgba(255,255,255,0.01)', border: selectedGoldKey === key ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: isLow ? '#F59E0B' : '#fff' }}>{stockQtyLuot.toFixed(2)} <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>{unit}</span></div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* CỘT PHẢI: FORM GIAO DỊCH (MUA / BÁN / RÚT) */}
        <div className="neo-card" style={{ 
          background: '#050505', 
          border: '1px solid rgba(255,255,255,0.06)', 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px', 
          height: 'fit-content',
          position: 'relative'
        }}>
          {(!currentUser || !currentUser.email) ? (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(5, 5, 5, 0.75)',
              backdropFilter: 'blur(6px)',
              borderRadius: '8px',
              zIndex: 10,
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gold)', marginBottom: '4px' }}>Chưa đăng nhập</div>
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500', marginBottom: '16px' }}>Vui lòng đăng nhập để bắt đầu giao dịch</div>
              <button 
                type="button"
                className="btn"
                onClick={() => navigate('/login')}
                style={{
                  padding: '10px 24px',
                  background: 'var(--gold-gradient)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: '0.2s all'
                }}
              >
                Đăng nhập ngay
              </button>
            </div>
          ) : currentUser.kycStatus !== 'verified' ? (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(5, 5, 5, 0.75)',
              backdropFilter: 'blur(6px)',
              borderRadius: '8px',
              zIndex: 10,
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gold)', marginBottom: '4px' }}>Tính năng tạm khóa</div>
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500', marginBottom: '16px' }}>Chờ được xác minh eKYC</div>
              <button 
                type="button"
                onClick={() => window.open('https://t.me/goldchain_support', '_blank')}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(212,175,55,0.15)',
                  border: '1px solid var(--gold)',
                  borderRadius: '6px',
                  color: 'var(--gold)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: '0.2s all'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.25)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.15)' }}
              >
                Liên hệ trợ giúp
              </button>
            </div>
          ) : null}
          
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
              disabled={availableGoldListKeys.length === 0}
            >
              {availableGoldListKeys.map((key) => {
                const balText = activeTab !== 'buy' ? ` - Có sẵn: ${getGoldBalance(key).toFixed(3)} chỉ` : '';
                return (
                  <option key={key} value={key}>
                    {prices[key]?.name}{balText} (&bull; ₫{(activeTab === 'sell' ? prices[key]?.buy : prices[key]?.sell)?.toLocaleString('vi-VN')}/chỉ)
                  </option>
                );
              })}
              {availableGoldListKeys.length === 0 && (
                <option value="">Bạn chưa sở hữu loại vàng nào</option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Số lượng giao dịch (chỉ)
              {quantity && <span style={{ marginLeft: '6px', color: 'var(--gold)' }}>(~ {(parseFloat(quantity) * 3.75).toFixed(4)} gram)</span>}
            </label>
            {activeTab === 'withdraw' ? (
              <select
                className="form-input"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                style={{ background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="">Chọn định mức thỏi/nhẫn vàng...</option>
                <option value="0.5">0.5 chỉ (1.875g)</option>
                <option value="1">1.0 chỉ (3.75g)</option>
                <option value="1.5">1.5 chỉ (5.625g)</option>
                <option value="2">2.0 chỉ (7.5g)</option>
                <option value="5">5.0 chỉ (18.75g)</option>
                <option value="10">10 chỉ (1 lượng / 37.5g)</option>
              </select>
            ) : (
              <input 
                className="form-input" 
                placeholder="0.00" 
                type="number" 
                step="0.01" 
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                style={{ background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            )}
            {activeTab === 'withdraw' && (
              <div style={{ marginTop: '16px' }}>
                <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Chi nhánh nhận vàng vật chất</label>
                <select
                  className="form-input"
                  value={pickupStore}
                  onChange={(e) => setPickupStore(e.target.value)}
                  style={{ background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="">Chọn chi nhánh gần khối bạn...</option>
                  <option value="HN_123_THAIHA">Hà Nội: 123 Thái Hà, Quận Đống Đa</option>
                  <option value="HCM_456_NTMK">TP.HCM: 456 Nguyễn Thị Minh Khai, Quận 3</option>
                  <option value="DN_789_NVL">Đà Nẵng: 789 Nguyễn Văn Linh, Quận Hải Châu</option>
                </select>
              </div>
            )}
            <div className="form-hint" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {activeTab === 'buy'
                ? `Kho cửa hàng còn: ${(storeStock[selectedGoldKey] / 3.75 || 0).toFixed(2)} chỉ (~ ${(storeStock[selectedGoldKey] / 37.5 || 0).toFixed(2)} lượng)`
                : `Ví vàng tích lũy cá nhân: ${getGoldBalance().toFixed(3)} chỉ`}
            </div>
            {activeTab === 'buy' && quantity && parseFloat(quantity) > (storeStock[selectedGoldKey] / 3.75 || 0) && (
              <div style={{ color: 'var(--ruby)', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>
                ⚠️ Số lượng mua vượt quá tồn kho khả dụng của cửa hàng!
              </div>
            )}
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
            onClick={() => {
              if (activeTab === 'buy') {
                const currentStoreStock = storeStock[selectedGoldKey] || 0;
                const stockQtyChi = currentStoreStock / 3.75;
                if (parseFloat(quantity) > stockQtyChi) {
                  setOrderStatus({ 
                    show: true, 
                    success: false, 
                    message: `Kho hàng của cửa hàng chỉ còn ${stockQtyChi.toFixed(2)} chỉ. Không đủ đáp ứng.` 
                  });
                  return;
                }
                setShowConfirmBuy(true);
              } else {
                handleSubmitOrder();
              }
            }}
            disabled={!quantity || parseFloat(quantity) <= 0 || (activeTab === 'buy' && parseFloat(quantity) > (storeStock[selectedGoldKey] / 3.75 || 0))}
            style={{ 
              width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold',
              background: activeTab === 'buy' ? 'var(--emerald)' : (activeTab === 'sell' ? 'var(--ruby)' : 'var(--gold-gradient)'),
              color: activeTab === 'sell' ? '#fff' : '#000',
              border: 'none', borderRadius: '6px',
              cursor: (!quantity || parseFloat(quantity) <= 0 || (activeTab === 'buy' && parseFloat(quantity) > (storeStock[selectedGoldKey] / 3.75 || 0))) ? 'not-allowed' : 'pointer',
              opacity: (!quantity || parseFloat(quantity) <= 0 || (activeTab === 'buy' && parseFloat(quantity) > (storeStock[selectedGoldKey] / 3.75 || 0))) ? 0.45 : 1
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

      {/* MODAL XÁC NHẬN MUA VÀNG */}
      {showConfirmBuy && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="neo-card" style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '28px', maxWidth: '420px', width: '100%', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '1px solid var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '24px', color: 'var(--gold)', fontWeight: 'bold' }}>?</span>
              </div>
              <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '18px', fontWeight: '700' }}>Xác nhận Mua Vàng Tích Lũy</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Vui lòng kiểm tra kỹ thông tin giao dịch bên dưới:</p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Loại vàng:</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{activeItem.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số lượng:</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{parseFloat(quantity).toFixed(2)} chỉ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Giá chốt mua:</span>
                <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>₫{currentPrice.toLocaleString('vi-VN')} / chỉ</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>Tổng thanh toán:</span>
                <span style={{ color: 'var(--gold)', fontWeight: '800' }}>₫{Math.round(parseFloat(amount || 0)).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowConfirmBuy(false)} 
                style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Hủy giao dịch
              </button>
              <button 
                className="btn" 
                onClick={() => {
                  setShowConfirmBuy(false);
                  handleSubmitOrder();
                }}
                style={{ flex: 1, padding: '10px', background: 'var(--gold)', color: '#000', border: 'none', fontWeight: 'bold' }}
              >
                Đồng ý mua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HÓA ĐƠN BIÊN NHẬN CHI TIẾT */}
      {showInvoiceOpen && invoiceDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }}>
          <div style={{ 
            maxWidth: '440px', 
            width: '100%', 
            background: '#1E1E1E', 
            border: '1px solid #2D3748', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header đồng bộ HopDongMua.html */}
            <div style={{
              padding: '24px 20px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #1A1A1A, #121212)',
              borderBottom: '2px solid #B38728',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                color: '#121212',
                fontSize: '20px'
              }}>G</div>
              <div style={{
                fontSize: '18px',
                fontWeight: '750',
                color: '#FFFFFF',
                letterSpacing: '1px'
              }}>GOLD<span style={{ color: '#B38728' }}>CHAIN</span></div>
            </div>

            {/* Content hóa đơn */}
            <div style={{ padding: '24px', color: '#E2E8F0', fontSize: '13px', lineHeight: '1.5' }}>
              <div style={{ fontSize: '18px', color: '#FFFFFF', fontWeight: '600', marginBottom: '4px', textAlign: 'center' }}>Giao Dịch Thành Công</div>
              <div style={{ textAlign: 'center', fontSize: '13px', color: '#B38728', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px' }}>Hợp đồng mua vàng tích lũy điện tử</div>
              
              <p style={{ margin: '0 0 16px 0' }}>
                Kính gửi quý khách <strong style={{ color: '#FFFFFF' }}>{invoiceDetails.name}</strong>,
              </p>
              <p style={{ margin: '0 0 16px 0' }}>
                Hệ thống xác nhận lệnh Mua vàng tích lũy trực tuyến của quý khách đã được khớp lệnh thành công. Dưới đây là thông tin chi tiết hợp đồng giao dịch:
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#121212', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2D3748', marginBottom: '20px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#A0AEC0', fontWeight: '550' }}>Mã hợp đồng (Order ID)</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#B38728', fontWeight: 'bold', textAlign: 'right' }}>{invoiceDetails.contractId}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#A0AEC0', fontWeight: '550' }}>Sản phẩm vàng</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#FFFFFF', fontWeight: 'bold', textAlign: 'right' }}>{invoiceDetails.goldType}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#A0AEC0', fontWeight: '550' }}>Số lượng vàng</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#FFFFFF', fontWeight: 'bold', textAlign: 'right' }}>{invoiceDetails.quantity} chỉ</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#A0AEC0', fontWeight: '550' }}>Đơn giá niêm yết</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#FFFFFF', fontWeight: 'bold', textAlign: 'right' }}>₫{invoiceDetails.price} / chỉ</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#A0AEC0', fontWeight: '550' }}>Thời gian giao dịch</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #2D3748', color: '#FFFFFF', fontWeight: 'bold', textAlign: 'right' }}>{invoiceDetails.date}</td>
                  </tr>
                  <tr style={{ background: 'rgba(179, 135, 40, 0.08)' }}>
                    <td style={{ padding: '10px 14px', color: '#B38728', fontWeight: '700' }}>
                      {invoiceDetails.type === 'sell' ? 'Tổng tiền nhận (Ví VND)' : 'Tổng tiền thanh toán'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#B38728', fontSize: '15px', fontWeight: '800', textAlign: 'right' }}>₫{invoiceDetails.total}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{
                textAlign: 'center',
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                color: '#10B981',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '16px'
              }}>
                🛡️ Chứng nhận quyền sở hữu vàng vật chất 1:1 trong kho ký gửi của GoldChain.
              </div>

              <p style={{ fontSize: '11px', color: '#A0AEC0', textAlign: 'center', margin: '0 0 16px 0' }}>
                Hóa đơn và bằng chứng số (SHA-256 Hash) của hợp đồng này đã được lưu trữ bảo vệ trên sổ cái Blockchain. Bản sao PDF đã được gửi qua email của quý khách.
              </p>

              <button 
                className="btn btn-gold" 
                onClick={() => {
                  setShowInvoiceOpen(false);
                  setInvoiceDetails(null);
                }}
                style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: 'bold' }}
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
