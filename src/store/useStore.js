import { create } from 'zustand';

// Initial state from the old vanilla store
const initialState = {
  currentUser: {
    name: 'Nguyễn Văn An',
    phone: '0912 345 678',
    email: 'an.nguyen@goldchain.vn',
    cccd: '001234567890',
    role: 'guest', // 'guest', 'user' or 'admin'
    kycStep: 3,
    kycStatus: 'pending' // 'verified', 'pending', 'rejected'
  },
  walletBalance: 12450000,
  goldBalances: {
    sjc: 7.25,
    pnj: 3.50,
    doji: 0.0
  },
  goldPrices: {
    sjc: { name: 'SJC 1 Chỉ', buy: 8700000, sell: 8750000, diff: 50000, change: '▲ +0.34%', up: true },
    pnj: { name: 'PNJ 9999', buy: 7870000, sell: 7920000, diff: 50000, change: '▼ -0.12%', up: false },
    doji: { name: 'DOJI 999.9', buy: 8580000, sell: 8630000, diff: 50000, change: '▲ +0.22%', up: true }
  },
  orders: [
    {
      id: 'ORD-20250120-000123',
      goldType: 'sjc',
      goldTypeName: 'SJC 1 Chỉ',
      quantity: 0.5,
      totalAmount: 4375000,
      createdAt: '14:15 hôm nay',
      status: 'pending',
      timeline: [
        { title: 'Đặt lệnh thành công', time: '14:15:22', desc: 'Thanh toán xác nhận', done: true },
        { title: 'Hóa đơn điện tử đã tạo', time: '14:15:23', desc: 'SHA-256 hash lưu trên chain', done: true },
        { title: 'Chờ xuất trình QR tại quầy', time: '', desc: 'Hạn: trong vòng 7 ngày', done: false }
      ]
    },
    // ... we can add the rest of the mock data later, keeping it short for now
  ],
  transactions: [],
  notifications: [],
  dcaPlans: [],
  inventory: [],
  kycSubmissions: []
};

const useStore = create((set, get) => ({
  ...initialState,

  switchUserRole: (role) => set((state) => ({
    currentUser: { ...state.currentUser, role }
  })),

  updateKycStatus: (status) => set((state) => ({
    currentUser: { 
      ...state.currentUser, 
      kycStatus: status,
      kycStep: status === 'verified' ? 3 : state.currentUser.kycStep
    }
  })),

  depositMoney: (amount) => set((state) => ({
    walletBalance: state.walletBalance + amount
  })),

  // We will port the full buyGold and sellGold logic later
  // buyGold: (goldType, quantity, price) => { ... },
  // sellGold: (goldType, quantity, price) => { ... },
}));

export default useStore;
