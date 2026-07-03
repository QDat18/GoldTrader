// Global State Store with Pub/Sub pattern
class Store {
  constructor() {
    this.listeners = [];
    this.loadState();
  }

  loadState() {
    // Default initial data
    this.state = {
      currentUser: {
        name: 'Nguyễn Văn An',
        phone: '0912 345 678',
        email: 'an.nguyen@goldchain.vn',
        cccd: '001234567890',
        role: 'user', // 'user' or 'admin'
        kycStep: 3,
        kycStatus: 'pending' // 'verified', 'pending', 'rejected'
      },
      walletBalance: 12450000, // 12,450,000 VND
      goldBalances: {
        sjc: 7.25, // chỉ
        pnj: 3.50, // chỉ
        doji: 0.0  // chỉ
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
        {
          id: 'ORD-20250110',
          goldType: 'pnj',
          goldTypeName: 'PNJ 9999',
          quantity: 1.0,
          totalAmount: 7920000,
          createdAt: '10/01/2025 09:30',
          status: 'completed',
          timeline: [
            { title: 'Đặt lệnh thành công', time: '10/01 09:30', desc: 'Thanh toán xác nhận', done: true },
            { title: 'Hóa đơn điện tử đã tạo', time: '10/01 09:31', desc: 'Lưu trên chain', done: true },
            { title: 'Đã nhận tại quầy', time: '10/01 10:45', desc: 'Chi nhánh Q1', done: true }
          ]
        },
        {
          id: 'ORD-20250105',
          goldType: 'sjc',
          goldTypeName: 'SJC 1 Chỉ',
          quantity: 2.0,
          totalAmount: 17500000,
          createdAt: '05/01/2025 15:00',
          status: 'completed',
          timeline: [
            { title: 'Đặt lệnh thành công', time: '05/01 15:00', desc: 'Thanh toán xác nhận', done: true },
            { title: 'Đã nhận tại quầy', time: '05/01 16:30', desc: 'Chi nhánh Q7', done: true }
          ]
        }
      ],
      transactions: [
        { id: 'TXN-20250120', type: 'buy', goldTypeName: 'SJC 1 Chỉ', quantity: 0.50, price: 8750000, total: 4375000, pnl: '—', time: '14:15 hôm nay', status: 'OK' },
        { id: 'TXN-20250119', type: 'dca', goldTypeName: 'SJC 1 Chỉ', quantity: 0.12, price: 8600000, total: 1000000, pnl: '—', time: '08:00 hôm qua', status: 'OK' },
        { id: 'TXN-20250118', type: 'sell', goldTypeName: 'PNJ 9999', quantity: 1.00, price: 7920000, total: 7920000, pnl: '+₫320.000', time: '10:30, 2 ngày trước', status: 'OK' },
        { id: 'TXN-20250115', type: 'buy', goldTypeName: 'PNJ 9999', quantity: 2.00, price: 7760000, total: 15520000, pnl: '—', time: '09:00, 5 ngày trước', status: 'OK' }
      ],
      notifications: [
        {
          id: 1,
          type: 'transaction',
          title: 'Lệnh mua thành công',
          desc: 'Mua 0.5 chỉ SJC — ₫4.375.000',
          time: '14:15',
          unread: true,
          date: 'Hôm nay, 14:15:22',
          goldTypeName: 'SJC 1 Chỉ',
          qty: '0.5 chỉ',
          price: '₫8.750.000/chỉ',
          total: '₫4.375.000',
          orderId: 'ORD-20250120-000123'
        },
        {
          id: 2,
          type: 'dca',
          title: 'DCA tự động chạy',
          desc: 'Tích lũy ₫1.000.000 SJC thành công',
          time: '08:00',
          unread: true,
          date: 'Hôm qua, 08:00:00',
          goldTypeName: 'SJC 1 Chỉ',
          qty: '0.12 chỉ',
          price: '₫8.600.000/chỉ',
          total: '₫1.000.000',
          orderId: 'ORD-20250119'
        },
        {
          id: 3,
          type: 'price',
          title: 'Giá SJC tăng mạnh',
          desc: 'SJC +2.1% trong 24h — ₫8.750.000',
          time: '07:30',
          unread: true,
          date: 'Hôm nay, 07:30:00'
        },
        {
          id: 4,
          type: 'account',
          title: 'KYC đã được duyệt',
          desc: 'Tài khoản đã được xác minh đầy đủ',
          time: 'Hôm qua',
          unread: false,
          date: 'Hôm qua, 15:30:00'
        },
        {
          id: 5,
          type: 'order',
          title: 'Đơn hàng đã được nhận',
          desc: 'ORD-0110 — Nhận tại chi nhánh Q1',
          time: '10/01',
          unread: false,
          date: '10/01/2025 10:45:00',
          orderId: 'ORD-20250110'
        }
      ],
      dcaPlans: [
        { id: 1, goldType: 'sjc', goldTypeName: 'SJC 1 Chỉ', amount: 1000000, frequency: 'Hàng tháng', day: 'Ngày 1', executedCount: 14, avgPrice: 7780000, status: 'running' }
      ],
      inventory: [
        { serial: 'SJC-2024-001234', goldType: 'sjc', goldTypeName: 'SJC 1 Chỉ', weight: '3.75g', brand: 'SJC HCM', status: 'available', orderId: '—', date: '15/01/2025' },
        { serial: 'SJC-2024-001235', goldType: 'sjc', goldTypeName: 'SJC 1 Chỉ', weight: '3.75g', brand: 'SJC HCM', status: 'pending', orderId: 'ORD-20250120-000123', date: '15/01/2025' },
        { serial: 'PNJ-2024-005678', goldType: 'pnj', goldTypeName: 'PNJ 9999', weight: '3.75g', brand: 'PNJ HN', status: 'available', orderId: '—', date: '12/01/2025' },
        { serial: 'DOJ-2024-000089', goldType: 'doji', goldTypeName: 'DOJI 999.9', weight: '3.75g', brand: 'DOJI HN', status: 'shipped', orderId: 'ORD-20250110', date: '08/01/2025' }
      ],
      kycSubmissions: [
        { id: 'kyc-1', name: 'Nguyễn Văn A', time: '14:20 hôm nay', type: 'CCCD', avatar: 'NV', status: 'pending' },
        { id: 'kyc-2', name: 'Trần Thị H', time: '13:45 hôm nay', type: 'CCCD', avatar: 'TH', status: 'pending' },
        { id: 'kyc-3', name: 'Lê Phúc M', time: '11:30 hôm nay', type: 'Hộ chiếu', avatar: 'LP', status: 'pending' }
      ]
    };
  }

  // Pub/Sub
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(callback => callback(this.state));
  }

  // Actions
  switchUserRole(role) {
    this.state.currentUser.role = role;
    this.notify();
  }

  updateKycStatus(status) {
    this.state.currentUser.kycStatus = status;
    if (status === 'verified') {
      this.state.currentUser.kycStep = 3;
    }
    this.notify();
  }

  depositMoney(amount) {
    this.state.walletBalance += amount;
    this.notify();
  }

  buyGold(goldType, quantity, price) {
    const item = this.state.goldPrices[goldType];
    const totalCost = quantity * price;

    if (this.state.walletBalance < totalCost) {
      throw new Error('Số dư ví không đủ để thực hiện giao dịch này.');
    }

    // Update balances
    this.state.walletBalance -= totalCost;
    this.state.goldBalances[goldType] = parseFloat((this.state.goldBalances[goldType] + quantity).toFixed(4));

    // Create unique Order ID and Txn ID
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
      id: this.state.notifications.length + 1,
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

    // Insert to store
    this.state.orders.unshift(newOrder);
    this.state.transactions.unshift(newTxn);
    this.state.notifications.unshift(newNotification);

    // Also assign a physical gold bar in stock for order
    const availableBar = this.state.inventory.find(i => i.goldType === goldType && i.status === 'available');
    if (availableBar) {
      availableBar.status = 'pending';
      availableBar.orderId = orderId;
    } else {
      // Create new dynamic bar in inventory as pending
      const randSerial = `${goldType.toUpperCase()}-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      this.state.inventory.push({
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

    this.notify();
    return orderId;
  }

  sellGold(goldType, quantity, price) {
    const item = this.state.goldPrices[goldType];
    const userBalance = this.state.goldBalances[goldType];

    if (userBalance < quantity) {
      throw new Error(`Số lượng vàng ${item.name} trong kho không đủ để bán.`);
    }

    const totalRevenue = quantity * price;

    // Update balances
    this.state.goldBalances[goldType] = parseFloat((userBalance - quantity).toFixed(4));
    this.state.walletBalance += totalRevenue;

    // Create txn
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
      pnl: '+₫' + Math.floor(totalRevenue * 0.05).toLocaleString('vi-VN'), // Mock PNL calculation
      time: `${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')} hôm nay`,
      status: 'OK'
    };

    const newNotification = {
      id: this.state.notifications.length + 1,
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

    this.state.transactions.unshift(newTxn);
    this.state.notifications.unshift(newNotification);

    this.notify();
  }

  // DCA plans
  createDcaPlan(goldType, amount, frequency, day) {
    const item = this.state.goldPrices[goldType];
    const newPlan = {
      id: this.state.dcaPlans.length + 1,
      goldType: goldType,
      goldTypeName: item.name,
      amount: amount,
      frequency: frequency,
      day: day,
      executedCount: 0,
      avgPrice: item.buy,
      status: 'running'
    };
    this.state.dcaPlans.push(newPlan);
    this.notify();
  }

  pauseDcaPlan(id) {
    const plan = this.state.dcaPlans.find(p => p.id === id);
    if (plan) {
      plan.status = 'paused';
      this.notify();
    }
  }

  resumeDcaPlan(id) {
    const plan = this.state.dcaPlans.find(p => p.id === id);
    if (plan) {
      plan.status = 'running';
      this.notify();
    }
  }

  cancelDcaPlan(id) {
    this.state.dcaPlans = this.state.dcaPlans.filter(p => p.id !== id);
    this.notify();
  }

  // KYC submissions (Admin flow)
  approveKyc(id) {
    const sub = this.state.kycSubmissions.find(s => s.id === id);
    if (sub) {
      sub.status = 'approved';
      // If approved our current user KYC
      if (sub.name === this.state.currentUser.name) {
        this.state.currentUser.kycStatus = 'verified';
      }
      // Add notification for the user
      this.state.notifications.unshift({
        id: this.state.notifications.length + 1,
        type: 'account',
        title: 'KYC đã được duyệt',
        desc: `Hồ sơ xác thực của ${sub.name} đã được phê duyệt thành công.`,
        time: 'Vừa xong',
        unread: true,
        date: new Date().toLocaleString('vi-VN')
      });
      // Remove from list
      this.state.kycSubmissions = this.state.kycSubmissions.filter(s => s.id !== id);
      this.notify();
    }
  }

  rejectKyc(id) {
    const sub = this.state.kycSubmissions.find(s => s.id === id);
    if (sub) {
      sub.status = 'rejected';
      if (sub.name === this.state.currentUser.name) {
        this.state.currentUser.kycStatus = 'rejected';
      }
      this.state.notifications.unshift({
        id: this.state.notifications.length + 1,
        type: 'account',
        title: 'KYC bị từ chối',
        desc: `Hồ sơ xác thực của ${sub.name} bị từ chối. Vui lòng cung cấp lại thông tin.`,
        time: 'Vừa xong',
        unread: true,
        date: new Date().toLocaleString('vi-VN')
      });
      this.state.kycSubmissions = this.state.kycSubmissions.filter(s => s.id !== id);
      this.notify();
    }
  }

  // Inventory flow
  addInventoryItem(goldType, brand) {
    const item = this.state.goldPrices[goldType];
    const randSerial = `${goldType.toUpperCase()}-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newBar = {
      serial: randSerial,
      goldType: goldType,
      goldTypeName: item.name,
      weight: '3.75g', // 1 chỉ
      brand: brand,
      status: 'available',
      orderId: '—',
      date: new Date().toLocaleDateString('vi-VN')
    };
    this.state.inventory.unshift(newBar);
    this.notify();
  }

  // Notifications
  markAllNotificationsRead() {
    this.state.notifications.forEach(n => n.unread = false);
    this.notify();
  }

  deleteNotification(id) {
    this.state.notifications = this.state.notifications.filter(n => n.id !== id);
    this.notify();
  }
}

// Global window store instance
window.store = new Store();
export default window.store;
