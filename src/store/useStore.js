import { create } from "zustand";

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
  goldPrices: {
    sjc: {
      name: "SJC 1 Chỉ",
      buy: 8700000,
      sell: 8750000,
      diff: 50000,
      change: "▲ +0.34%",
      up: true,
    },
    pnj: {
      name: "PNJ 9999",
      buy: 7870000,
      sell: 7920000,
      diff: 50000,
      change: "▼ -0.12%",
      up: false,
    },
    doji: {
      name: "DOJI 999.9",
      buy: 8580000,
      sell: 8630000,
      diff: 50000,
      change: "▲ +0.22%",
      up: true,
    },
  },
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
  notifications: [],
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
    set((state) => {
      localStorage.removeItem('goldchain_mock_session');
      return {
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
      };
    }),

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
      pnl: '+₫' + Math.floor(totalRevenue * 0.05).toLocaleString('vi-VN'),
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
}));

export default useStore;
