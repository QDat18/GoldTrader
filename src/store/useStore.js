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
  transactions: [],
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

  // We will port the full buyGold and sellGold logic later
  // buyGold: (goldType, quantity, price) => { ... },
  // sellGold: (goldType, quantity, price) => { ... },
}));

export default useStore;
