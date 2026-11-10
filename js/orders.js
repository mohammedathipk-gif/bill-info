// Cart, checkout, order history, analytics and CSV export.
const OrdersManager = {
  currentCart: [], discountType: 'percent', discountValue: 0, cashTendered: 0,
  currentOrderType: 'Dine-In Table 1', customerName: '', customerPhone: '', paymentMethod: 'cash',
  loadPersistedCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(StorageManager.keys.cart) || '{}');
      this.currentCart = Array.isArray(saved.items) ? saved.items : [];
      this.discountType = saved.discountType || 'percent'; this.discountValue = Number(saved.discountValue) || 0;
      this.cashTendered = Number(saved.cashTendered) || 0; this.currentOrderType = saved.currentOrderType || 'Dine-In Table 1';
      this.customerName = saved.customerName || ''; this.customerPhone = saved.customerPhone || '';
      this.paymentMethod = saved.paymentMethod || 'cash';
    } catch (_) { this.currentCart = []; }
  },
  persistCart() {
    const state = { items: this.currentCart, discountType: this.discountType, discountValue: this.discountValue, cashTendered: this.cashTendered, currentOrderType: this.currentOrderType, customerName: this.customerName, customerPhone: this.customerPhone, paymentMethod: this.paymentMethod };
    try { localStorage.setItem(StorageManager.keys.cart, JSON.stringify(state)); } catch (_) {}
  },
  addToCart(item, quantity = 1) {
    const existing = this.currentCart.find(row => row.id === item.id);
    if (existing) existing.quantity += quantity;
    else this.currentCart.push({ ...item, quantity, note: '' });
    this.persistCart();
  },
  addCustomItem(name, price, veg = true) {
    this.addToCart({ id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name, price, veg, category: 'custom', description: 'Custom bill item', inStock: true });
  },
  updateQuantity(itemId, difference) {
    const item = this.currentCart.find(row => row.id === itemId);
    if (!item) return;
    item.quantity += difference;
    if (item.quantity <= 0) this.currentCart = this.currentCart.filter(row => row.id !== itemId);
    this.persistCart();
  },
  setItemNote(itemId, note) {
    const item = this.currentCart.find(row => row.id === itemId);
    if (item) { item.note = note; this.persistCart(); }
  },
  clearCart() {
    this.currentCart = []; this.discountType = 'percent'; this.discountValue = 0;
    this.cashTendered = 0; this.customerName = ''; this.customerPhone = ''; this.persistCart();
  },
  checkout(settings) {
    if (!this.currentCart.length) throw new Error('Add at least one item before checkout.');
    const totals = BillingEngine.calculateBill(this.currentCart, {
      discountType: this.discountType, discountValue: this.discountValue, taxRate: settings.taxRate,
      serviceRate: settings.serviceChargeRate, cashTendered: this.paymentMethod === 'cash' ? this.cashTendered : 0
    });
    if (this.paymentMethod === 'cash' && this.cashTendered > 0 && this.cashTendered < totals.grandTotal) throw new Error('Cash received is less than the bill total.');
    const orders = StorageManager.getOrders();
    const now = new Date();
    const latestBill = orders.reduce((max, order) => Math.max(max, Number(order.billNumber) || 0), 1000);
    const latestToken = orders.reduce((max, order) => Math.max(max, Number(order.tokenNumber) || 0), 100);
    const order = {
      id: `order_${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
      billNumber: latestBill + 1, tokenNumber: latestToken + 1, createdAt: now.toISOString(),
      orderType: this.currentOrderType, customerName: this.customerName.trim(), customerPhone: this.customerPhone.trim(),
      paymentMethod: this.paymentMethod, status: 'Preparing', items: this.currentCart.map(item => ({ ...item })), totals
    };
    orders.unshift(order); StorageManager.saveOrders(orders); this.clearCart();
    return order;
  },
  renderActiveOrders() {
    if (window.App) { App.renderOrdersTab(); App.updateLiveBadges(); }
  },
  getAnalytics() {
    const orders = StorageManager.getOrders().filter(order => order.status !== 'Cancelled');
    const today = new Date().toLocaleDateString();
    const todayOrders = orders.filter(order => new Date(order.createdAt).toLocaleDateString() === today);
    const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.totals?.grandTotal || 0), 0);
    const paymentBreakdown = { cash: 0, upi: 0, card: 0 };
    todayOrders.forEach(order => { if (paymentBreakdown[order.paymentMethod] !== undefined) paymentBreakdown[order.paymentMethod] += Number(order.totals?.grandTotal || 0); });
    const itemStats = new Map();
    orders.forEach(order => (order.items || []).forEach(item => {
      const stat = itemStats.get(item.id) || { id: item.id, name: item.name, veg: item.veg, count: 0, revenue: 0 };
      stat.count += Number(item.quantity) || 0; stat.revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0); itemStats.set(item.id, stat);
    }));
    const totalRevenueAllTime = orders.reduce((sum, order) => sum + Number(order.totals?.grandTotal || 0), 0);
    return { todayRevenue, todayOrderCount: todayOrders.length, avgOrderValueToday: todayOrders.length ? todayRevenue / todayOrders.length : 0,
      totalRevenueAllTime, totalOrdersAllTime: orders.length, paymentBreakdown, topItems: [...itemStats.values()].sort((a, b) => b.count - a.count).slice(0, 8) };
  },
  exportOrdersToCsv() {
    const rows = [['Bill', 'Token', 'Date', 'Order type', 'Customer', 'Payment', 'Status', 'Items', 'Subtotal', 'Discount', 'Tax', 'Total']];
    StorageManager.getOrders().forEach(order => rows.push([order.billNumber, order.tokenNumber, order.createdAt, order.orderType, order.customerName || '', order.paymentMethod, order.status, (order.items || []).map(item => `${item.quantity}x ${item.name}`).join('; '), order.totals?.subtotal || 0, order.totals?.discountAmount || 0, order.totals?.taxAmount || 0, order.totals?.grandTotal || 0]));
    const csv = '\ufeff' + rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `quickbite-orders-${new Date().toISOString().slice(0, 10)}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};
