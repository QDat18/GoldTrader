import { create } from "zustand";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseLedger = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: "financial_ledgers" }
});

// Initial state from the old vanilla store
const initialState = {
  currentUser: {
    name: "Khách hàng",
    phone: "",
    email: "",
    cccd: "",
    role: "guest", // 'guest', 'user' or 'admin'
    kycStep: 1,
    kycStatus: "unverified", // 'verified', 'pending', 'rejected', 'unverified'
  },
  walletBalance: 0,
  goldBalances: {
    sjc: 0.0,
    pnj: 0.0,
    doji: 0.0,
  },
  goldPrices: {}, // Dynamic: Tự động nạp từ Database
  orders: [],
  transactions: [
    {
      id: 'TXN-202607011234',
      type: 'buy',
      goldTypeName: 'SJC 1 Chỉ',
      quantity: 1,
      price: 8700000,
      total: 8700000,
      pnl: '—',
      time: '10:30 01/07/2026',
      status: 'OK'
    },
    {
      id: 'TXN-202607025678',
      type: 'dca',
      goldTypeName: 'PNJ 9999',
      quantity: 0.5,
      price: 7870000,
      total: 3935000,
      pnl: '—',
      time: '08:00 02/07/2026',
      status: 'OK'
    },
    {
      id: 'TXN-202607039012',
      type: 'sell',
      goldTypeName: 'DOJI 999.9',
      quantity: 2,
      price: 8630000,
      total: 17260000,
      pnl: '+₫863.000',
      time: '14:15 03/07/2026',
      status: 'OK'
    }
  ],
  notifications: [
    {
      id: 1,
      type: 'transaction',
      title: 'Đơn hàng mua đang chờ nhận',
      desc: 'Mua 1.500 chỉ SJC 1 Chỉ — Trị giá ₫13.125.000 đã thanh toán bằng ví. Chờ quét mã QR tại quầy để nhận vàng vật chất.',
      time: '10:30 hôm nay',
      unread: true,
      date: 'Hôm nay, 10:30:15'
    },
    {
      id: 2,
      type: 'system',
      title: 'Xác thực tài khoản (KYC)',
      desc: 'Hồ sơ xác thực danh tính CCCD của bạn đã được gửi thành công và đang chờ xét duyệt.',
      time: '09:15 hôm nay',
      unread: true,
      date: 'Hôm nay, 09:15:00'
    },
    {
      id: 3,
      type: 'system',
      title: 'Chào mừng thành viên mới',
      desc: 'Chào mừng bạn đến với GoldChain - Hệ thống mua bán và tích lũy vàng vật chất thế hệ mới.',
      time: 'Hôm qua',
      unread: false,
      date: 'Hôm qua, 15:45:10'
    }
  ],
  dcaPlans: [],
  inventory: [],
  kycSubmissions: [],
};

const useStore = create((set, get) => ({
  ...initialState,

  switchUserRole: (role) =>
    set((state) => ({
      currentUser: { ...state.currentUser, role },
    })),

  updateKycStatus: (status) =>
    set((state) => ({
      currentUser: {
        ...state.currentUser,
        kycStatus: status,
        kycStep: status === "verified" ? 3 : state.currentUser.kycStep,
      },
    })),

  depositMoney: (amount) =>
    set((state) => ({
      walletBalance: state.walletBalance + amount,
    })),

  setCurrentUser: (user) =>
    set((state) => ({
      currentUser: user,
    })),

  updateProfile: (updates) =>
    set((state) => ({
      currentUser: { ...state.currentUser, ...updates }
    })),

  logout: () =>
    set((state) => ({
      currentUser: {
        name: '',
        phone: '',
        email: '',
        cccd: '',
        role: 'guest',
        kycStep: 1,
        kycStatus: 'pending'
      },
      walletBalance: 0,
      goldBalances: { sjc: 0, pnj: 0, doji: 0 }
    })),

  updateGoldPrice: (goldType, newSell, newBuy) =>
    set((state) => ({
      goldPrices: {
        ...state.goldPrices,
        [goldType]: {
          ...state.goldPrices[goldType],
          sell: newSell,
          buy: newBuy,
        }
      }
    })),

  buyGold: (goldType, quantity, price) => {
    const state = get();
    const item = state.goldPrices[goldType];
    const totalCost = quantity * price;

    if (state.walletBalance < totalCost) {
      throw new Error('Số dư ví không đủ để thực hiện giao dịch này.');
    }

    const timeNow = new Date();
    const dateStr = timeNow.getFullYear() + String(timeNow.getMonth() + 1).padStart(2, '0') + String(timeNow.getDate()).padStart(2, '0');
    const orderId = `ORD-${dateStr}-${Math.floor(100000 + Math.random() * 900000)}`;
    const txnId = `TXN-${dateStr}${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id: orderId,
      goldType: goldType,
      goldTypeName: item.name,
      quantity: quantity,
      totalAmount: totalCost,
      createdAt: `${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')} hôm nay`,
      status: 'pending',
      timeline: [
        { title: 'Đặt lệnh thành công', time: `${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')}:${String(timeNow.getSeconds()).padStart(2, '0')}`, desc: 'Thanh toán xác nhận', done: true },
        { title: 'Hóa đơn điện tử đã tạo', time: `${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')}:${String(timeNow.getSeconds() + 1).padStart(2, '0')}`, desc: 'SHA-256 hash lưu trên chain', done: true },
        { title: 'Chờ xuất trình QR tại quầy', time: '', desc: 'Hạn: trong vòng 7 ngày', done: false }
      ]
    };

    const newTxn = {
      id: txnId,
      type: 'buy',
      goldTypeName: item.name,
      quantity: quantity,
      price: price,
      total: totalCost,
      pnl: '—',
      time: `${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')} hôm nay`,
      status: 'OK'
    };

    const newNotification = {
      id: state.notifications.length + 1,
      type: 'transaction',
      title: 'Lệnh mua thành công',
      desc: `Mua ${quantity} chỉ ${item.name.split(' ')[0]} — ₫${totalCost.toLocaleString('vi-VN')}`,
      time: `${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')}`,
      unread: true,
      date: `Hôm nay, ${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')}:${String(timeNow.getSeconds()).padStart(2, '0')}`,
      goldTypeName: item.name,
      qty: `${quantity} chỉ`,
      price: `₫${price.toLocaleString('vi-VN')}/chỉ`,
      total: `₫${totalCost.toLocaleString('vi-VN')}`,
      orderId: orderId
    };

    let newInventory = [...state.inventory];
    const availableBar = newInventory.find(i => i.goldType === goldType && i.status === 'available');
    if (availableBar) {
      availableBar.status = 'pending';
      availableBar.orderId = orderId;
    } else {
      const randSerial = `${goldType.toUpperCase()}-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      newInventory.push({
        serial: randSerial,
        goldType: goldType,
        goldTypeName: item.name,
        weight: '3.75g',
        brand: goldType === 'sjc' ? 'SJC HCM' : (goldType === 'pnj' ? 'PNJ HN' : 'DOJI HN'),
        status: 'pending',
        orderId: orderId,
        date: new Date().toLocaleDateString('vi-VN')
      });
    }

    set({
      walletBalance: state.walletBalance - totalCost,
      goldBalances: {
        ...state.goldBalances,
        [goldType]: parseFloat((state.goldBalances[goldType] + quantity).toFixed(4))
      },
      orders: [newOrder, ...state.orders],
      transactions: [newTxn, ...state.transactions],
      notifications: [newNotification, ...state.notifications],
      inventory: newInventory
    });

    return orderId;
  },

  sellGold: (goldType, quantity, price) => {
    const state = get();
    const item = state.goldPrices[goldType];
    const userBalance = state.goldBalances[goldType];

    if (userBalance < quantity) {
      throw new Error(`Số lượng vàng ${item.name} trong kho không đủ để bán.`);
    }

    const totalRevenue = quantity * price;

    const timeNow = new Date();
    const dateStr = timeNow.getFullYear() + String(timeNow.getMonth() + 1).padStart(2, '0') + String(timeNow.getDate()).padStart(2, '0');
    const txnId = `TXN-${dateStr}${Math.floor(1000 + Math.random() * 9000)}`;

    const newTxn = {
      id: txnId,
      type: 'sell',
      goldTypeName: item.name,
      quantity: quantity,
      price: price,
      total: totalRevenue,
      pnl: '—',
      time: `${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')} hôm nay`,
      status: 'OK'
    };

    const newNotification = {
      id: state.notifications.length + 1,
      type: 'transaction',
      title: 'Lệnh bán thành công',
      desc: `Bán ${quantity} chỉ ${item.name.split(' ')[0]} — ₫${totalRevenue.toLocaleString('vi-VN')}`,
      time: `${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')}`,
      unread: true,
      date: `Hôm nay, ${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')}:${String(timeNow.getSeconds()).padStart(2, '0')}`,
      goldTypeName: item.name,
      qty: `${quantity} chỉ`,
      price: `₫${price.toLocaleString('vi-VN')}/chỉ`,
      total: `₫${totalRevenue.toLocaleString('vi-VN')}`
    };

    set({
      walletBalance: state.walletBalance + totalRevenue,
      goldBalances: {
        ...state.goldBalances,
        [goldType]: parseFloat((userBalance - quantity).toFixed(4))
      },
      transactions: [newTxn, ...state.transactions],
      notifications: [newNotification, ...state.notifications]
    });
  },

  createDcaPlan: (goldType, amount, frequency, day) => {
    const state = get();
    const item = state.goldPrices[goldType];
    const newPlan = {
      id: state.dcaPlans.length + 1,
      goldType: goldType,
      goldTypeName: item.name,
      amount: amount,
      frequency: frequency,
      day: day,
      executedCount: 0,
      avgPrice: item.buy,
      status: 'running'
    };
    set({ dcaPlans: [...state.dcaPlans, newPlan] });
  },

  pauseDcaPlan: (id) =>
    set((state) => ({ dcaPlans: state.dcaPlans.map(p => p.id === id ? { ...p, status: 'paused' } : p) })),

  resumeDcaPlan: (id) =>
    set((state) => ({ dcaPlans: state.dcaPlans.map(p => p.id === id ? { ...p, status: 'running' } : p) })),

  cancelDcaPlan: (id) =>
    set((state) => ({ dcaPlans: state.dcaPlans.filter(p => p.id !== id) })),

  submitKyc: (submission) =>
    set((state) => {
      const newSub = {
        id: `KYC-${Date.now()}`,
        name: submission.name || 'Người dùng',
        avatar: submission.avatar || 'N',
        time: new Date().toLocaleString('vi-VN'),
        type: 'CCCD'
      };
      return { kycSubmissions: [newSub, ...state.kycSubmissions] };
    }),

  approveKyc: (id) =>
    set((state) => {
      // In this mock, we also automatically verify the current user
      return { 
        kycSubmissions: state.kycSubmissions.filter(s => s.id !== id),
        currentUser: { ...state.currentUser, kycStatus: 'verified', kycStep: 3 }
      };
    }),

  rejectKyc: (id) =>
    set((state) => {
      return { 
        kycSubmissions: state.kycSubmissions.filter(s => s.id !== id),
        currentUser: { ...state.currentUser, kycStatus: 'rejected', kycStep: 2 }
      };
    }),

  fetchGoldPrices: async () => {
    try {
      const { data, error } = await supabaseLedger
        .from("gold_price_snapshots")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      if (data && data.length > 0) {
        // Nhóm các bản ghi theo source (type_code) để tính toán biến động
        const snapshotsGrouped = {};
        data.forEach(row => {
          const key = row.source; // type_code từ vang.today (VD: SJL1L10, DOHNL...)
          if (!snapshotsGrouped[key]) {
            snapshotsGrouped[key] = [];
          }
          snapshotsGrouped[key].push(row);
        });

        // Tự động xây dựng Dynamic goldPrices từ dữ liệu DB
        const nextPrices = {};
        for (const [sourceCode, records] of Object.entries(snapshotsGrouped)) {
          const latest = records[0];
          const previous = records[1];

          const buy = Number(latest.buy_price_vnd);
          const sell = Number(latest.sell_price_vnd);
          const diff = Math.max(0, sell - buy);

          let change = "▲ +0.00%";
          let up = true;

          if (previous) {
            const prevSell = Number(previous.sell_price_vnd);
            if (prevSell > 0) {
              const changeVal = ((sell - prevSell) / prevSell) * 100;
              if (changeVal >= 0) {
                change = `▲ +${changeVal.toFixed(2)}%`;
                up = true;
              } else {
                change = `▼ ${changeVal.toFixed(2)}%`;
                up = false;
              }
            }
          }

          nextPrices[sourceCode] = {
            name: latest.gold_type, // Tên hiển thị tiếng Việt (từ worker đã dịch sẵn)
            buy,
            sell,
            diff,
            change,
            up,
            sourceCode, // Mã gốc vang.today (VD: SJL1L10) để truy vấn lịch sử
          };
        }

        set({ goldPrices: nextPrices });
      }
    } catch (err) {
      console.error("Lỗi khi tải giá vàng từ database:", err);
    }
  },

  fetchUserBalances: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('gold_wallets')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      if (data && data.length > 0) {
        const balances = { sjc: 0, pnj: 0, doji: 0 };
        data.forEach(w => {
          const type = w.gold_type.toLowerCase();
          if (type.includes('sjc')) balances.sjc = Number(w.quantity_grams) / 3.75;
          else if (type.includes('pnj')) balances.pnj = Number(w.quantity_grams) / 3.75;
          else if (type.includes('doji')) balances.doji = Number(w.quantity_grams) / 3.75;
        });
        set({ goldBalances: balances });
      }
    } catch (err) {
      console.error("Lỗi khi tải số dư vàng của khách hàng:", err);
    }
  },

  markAllNotificationsAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, unread: false }))
    })),

  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => n.id === id ? { ...n, unread: false } : n)
    })),

  clearAllNotifications: () =>
    set({ notifications: [] }),
}));

export default useStore;
