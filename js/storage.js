// Browser persistence with optional synchronization to the Node API.
const StorageManager = {
  keys: { settings: 'qb_settings', menu: 'qb_menu_items', orders: 'qb_orders', cart: 'qb_active_cart' },
  read(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (error) { console.warn('Could not read local app data:', error); return fallback; }
  },
  write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (error) { console.warn('Could not save local app data:', error); }
  },
  getSettings() { return { ...DEFAULT_SETTINGS, ...this.read(this.keys.settings, {}) }; },
  saveSettings(settings) {
    this.write(this.keys.settings, settings);
    this.request('/api/settings', { method: 'POST', body: JSON.stringify(settings) });
  },
  getMenuItems() { return this.read(this.keys.menu, null) || DEFAULT_MENU_ITEMS.map(item => ({ ...item })); },
  saveMenuItems(items) {
    this.write(this.keys.menu, items);
    this.request('/api/menu', { method: 'POST', body: JSON.stringify(items) });
  },
  getOrders() { return this.read(this.keys.orders, []); },
  saveOrders(orders) {
    this.write(this.keys.orders, orders);
    this.request('/api/orders/sync', { method: 'POST', body: JSON.stringify(orders) });
  },
  updateOrderStatus(orderId, status) {
    const orders = this.getOrders();
    const order = orders.find(item => item.id === orderId);
    if (!order) return;
    order.status = status;
    this.write(this.keys.orders, orders);
    this.request(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
  request(path, options = {}) {
    if (typeof fetch !== 'function') return Promise.resolve(null);
    return fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } })
      .then(response => response.ok ? response.json().catch(() => null) : null)
      .catch(() => null);
  },
  async syncWithBackend() {
    try {
      const [ordersResponse, menuResponse, settingsResponse] = await Promise.all([
        fetch('/api/orders'), fetch('/api/menu'), fetch('/api/settings')
      ]);
      if (![ordersResponse, menuResponse, settingsResponse].every(response => response.ok)) return false;
      const [serverOrders, serverMenu, serverSettings] = await Promise.all([
        ordersResponse.json(), menuResponse.json(), settingsResponse.json()
      ]);
      if (Array.isArray(serverOrders) && serverOrders.length) this.write(this.keys.orders, serverOrders);
      else if (this.getOrders().length) await this.request('/api/orders/sync', { method: 'POST', body: JSON.stringify(this.getOrders()) });
      if (Array.isArray(serverMenu) && serverMenu.length) this.write(this.keys.menu, serverMenu);
      else await this.request('/api/menu', { method: 'POST', body: JSON.stringify(this.getMenuItems()) });
      if (serverSettings && Object.keys(serverSettings).length) this.write(this.keys.settings, { ...DEFAULT_SETTINGS, ...serverSettings });
      else await this.request('/api/settings', { method: 'POST', body: JSON.stringify(this.getSettings()) });
      return true;
    } catch (error) {
      // Static hosting and offline use intentionally fall back to localStorage.
      return false;
    }
  },
  exportBackupJSON() {
    const backup = { version: 1, exportedAt: new Date().toISOString(), settings: this.getSettings(), menuItems: this.getMenuItems(), orders: this.getOrders() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'quickbite-backup.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  importBackupJSON(text) {
    try {
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.menuItems) || !Array.isArray(data.orders) || !data.settings) return false;
      this.write(this.keys.settings, { ...DEFAULT_SETTINGS, ...data.settings });
      this.write(this.keys.menu, data.menuItems);
      this.write(this.keys.orders, data.orders);
      this.saveSettings(data.settings); this.saveMenuItems(data.menuItems); this.saveOrders(data.orders);
      return true;
    } catch (error) { return false; }
  },
  resetAllData() {
    Object.values(this.keys).forEach(key => localStorage.removeItem(key));
    this.request('/api/reset', { method: 'POST', body: '{}' });
  }
};
