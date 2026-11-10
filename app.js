// QuickBite Master Application Controller & UI Engine

// Built-in Web Audio API Sound Synthesizer (Zero external dependencies)
const SoundFX = {
  ctx: null,
  enabled: true,

  init() {
    this.enabled = localStorage.getItem('qb_sound_enabled') !== 'false';
    const initCtx = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx && !this.ctx) {
          this.ctx = new AudioCtx();
        }
      } catch (e) {}
      window.removeEventListener('click', initCtx);
    };
    window.addEventListener('click', initCtx);
  },

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('qb_sound_enabled', this.enabled ? 'true' : 'false');
    if (this.enabled) this.playPop();
    return this.enabled;
  },

  playPop() {
    if (!this.enabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.ctx && AudioCtx) this.ctx = new AudioCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  },

  playSuccess() {
    if (!this.enabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.ctx && AudioCtx) this.ctx = new AudioCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.15, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.18);
      });
    } catch (e) {}
  },

  playClick() {
    if (!this.enabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.ctx && AudioCtx) this.ctx = new AudioCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  }
};

const App = {
  activeTab: 'pos', // 'pos', 'orders', 'analytics', 'menu', 'settings'
  selectedCategory: 'all',
  searchQuery: '',
  vegOnlyFilter: false,
  kitchenStatusFilter: 'all',
  sortBy: 'default', // 'default', 'price-asc', 'price-desc', 'popular'
  
  settings: {},
  menuItems: [],
  deferredPrompt: null,
  activeOrderForReceipt: null,
  activeItemForNote: null,

  init() {
    SoundFX.init();
    this.initDarkMode();
    this.settings = StorageManager.getSettings();
    this.menuItems = StorageManager.getMenuItems();
    OrdersManager.loadPersistedCart();
    StorageManager.syncWithBackend().then(() => {
      // Re-render kitchen/orders count if new orders arrived from server
      OrdersManager.renderActiveOrders();
    }).catch(() => {});

    this.bindEvents();
    this.bindKeyboardShortcuts();
    this.renderHeader();
    this.renderCategories();
    this.renderMenu();
    this.renderCart();
    this.setupPwaInstall();
    this.updateSoundButtonUI();

    // Re-create lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  // Dark Mode Support
  initDarkMode() {
    const isDark = localStorage.getItem('qb_theme') === 'dark' || 
      (!localStorage.getItem('qb_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggleDarkMode() {
    SoundFX.playClick();
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('qb_theme', isDark ? 'dark' : 'light');
    if (window.lucide) lucide.createIcons();
  },

  toggleSound() {
    const enabled = SoundFX.toggle();
    this.updateSoundButtonUI();
    this.showToast(enabled ? 'Sound effects enabled' : 'Sound effects muted');
  },

  toggleFullscreen() {
    SoundFX.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      this.showToast('Fullscreen mode on');
    } else {
      document.exitFullscreen().catch(() => {});
      this.showToast('Fullscreen mode off');
    }
  },

  setSort(sortType) {
    SoundFX.playClick();
    this.sortBy = sortType;
    this.renderMenu();
  },

  setQuickDiscount(type, value) {
    SoundFX.playClick();
    OrdersManager.discountType = type;
    OrdersManager.discountValue = value;
    const typeEl = document.getElementById('cart-discount-type');
    const valEl = document.getElementById('cart-discount-value');
    if (typeEl) typeEl.value = type;
    if (valEl) valEl.value = value;
    this.renderCart();
    this.showToast(`Applied ${value}${type === 'percent' ? '%' : ' flat'} discount`);
  },

  updateSoundButtonUI() {
    const btns = document.querySelectorAll('.sound-toggle-btn');
    btns.forEach(btn => {
      btn.innerHTML = SoundFX.enabled 
        ? '<i data-lucide="volume-2" class="w-4 h-4"></i>' 
        : '<i data-lucide="volume-x" class="w-4 h-4 text-gray-400"></i>';
    });
    if (window.lucide) lucide.createIcons();
  },

  // Update & Save Settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    StorageManager.saveSettings(this.settings);
    this.renderHeader();
    this.renderCart();
    this.showToast('Restaurant profile updated successfully!');
  },

  // Unified Tab Switching (Works for Desktop & Mobile)
  switchTab(tabName) {
    SoundFX.playClick();
    this.activeTab = tabName;
    
    // Toggle content sections
    ['pos', 'orders', 'analytics', 'menu', 'settings'].forEach(tab => {
      const el = document.getElementById(`tab-content-${tab}`);
      if (el) {
        if (tab === tabName) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }

      // Desktop Nav Button highlight
      const desktopNav = document.getElementById(`desktop-nav-btn-${tab}`);
      if (desktopNav) {
        if (tab === tabName) {
          desktopNav.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs bg-red-600 text-white';
        } else {
          desktopNav.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';
        }
      }

      // Mobile Nav Button highlight
      const mobileNav = document.getElementById(`nav-btn-${tab}`);
      if (mobileNav) {
        if (tab === tabName) {
          mobileNav.classList.add('text-red-600', 'dark:text-red-500', 'font-bold');
          mobileNav.classList.remove('text-gray-500', 'dark:text-gray-400');
        } else {
          mobileNav.classList.remove('text-red-600', 'dark:text-red-500', 'font-bold');
          mobileNav.classList.add('text-gray-500', 'dark:text-gray-400');
        }
      }
    });

    // Refresh content for selected tab
    if (tabName === 'orders') {
      this.renderOrdersTab();
    } else if (tabName === 'analytics') {
      this.renderAnalyticsTab();
    } else if (tabName === 'menu') {
      this.renderMenuManagementTab();
    } else if (tabName === 'settings') {
      this.renderSettingsTab();
    }

    this.updateLiveBadges();
    if (window.lucide) lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // Update live badges (e.g. pending kitchen orders)
  updateLiveBadges() {
    const orders = StorageManager.getOrders();
    const pending = orders.filter(o => o.status === 'Preparing' || o.status === 'Ready').length;
    
    document.querySelectorAll('.kitchen-badge-count').forEach(el => {
      if (pending > 0) {
        el.textContent = pending;
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });
  },

  // Bind UI Events
  bindEvents() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderMenu();
      });
    }

    // Veg Only Filter
    const vegToggle = document.getElementById('veg-only-toggle');
    if (vegToggle) {
      vegToggle.addEventListener('change', (e) => {
        SoundFX.playClick();
        this.vegOnlyFilter = e.target.checked;
        this.renderMenu();
      });
    }

    // Discount Type & Value
    const discountTypeEl = document.getElementById('cart-discount-type');
    const discountValEl = document.getElementById('cart-discount-value');
    if (discountTypeEl && discountValEl) {
      discountTypeEl.addEventListener('change', (e) => {
        OrdersManager.discountType = e.target.value;
        this.renderCart();
      });
      discountValEl.addEventListener('input', (e) => {
        OrdersManager.discountValue = parseFloat(e.target.value) || 0;
        this.renderCart();
      });
    }

    // Order Type / Table selection
    const tableSelect = document.getElementById('cart-table-select');
    if (tableSelect) {
      tableSelect.addEventListener('change', (e) => {
        OrdersManager.currentOrderType = e.target.value;
        OrdersManager.persistCart();
      });
    }

    // Customer Name & Phone
    const custName = document.getElementById('cart-cust-name');
    const custPhone = document.getElementById('cart-cust-phone');
    if (custName) {
      custName.addEventListener('input', (e) => {
        OrdersManager.customerName = e.target.value;
        OrdersManager.persistCart();
      });
    }
    if (custPhone) {
      custPhone.addEventListener('input', (e) => {
        OrdersManager.customerPhone = e.target.value;
        OrdersManager.persistCart();
      });
    }

    // Payment method selector
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        SoundFX.playClick();
        const method = e.currentTarget.dataset.method;
        OrdersManager.paymentMethod = method;
        this.updatePaymentButtons();
        this.renderCart();
      });
    });

    // Close Modals on backdrop click
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('app-modal')) {
        this.closeAllModals();
      }
    });
  },

  // Keyboard Shortcuts for Pro Cashiers
  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Focus search: '/' or 'Ctrl+K'
      if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Generate Bill: 'Ctrl + Enter'
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (OrdersManager.currentCart.length > 0) {
          this.processCheckout();
        }
      }

      // Escape: Close any open modal
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  },

  renderHeader() {
    const titleEl = document.getElementById('header-store-name');
    const tagEl = document.getElementById('header-store-tagline');
    if (titleEl) titleEl.textContent = this.settings.storeName;
    if (tagEl) tagEl.textContent = this.settings.tagline || 'Food & Billing POS';
    this.updateLiveBadges();
  },

  renderCategories() {
    const container = document.getElementById('categories-bar');
    if (!container) return;

    container.innerHTML = DEFAULT_CATEGORIES.map(cat => {
      const isSelected = this.selectedCategory === cat.id;
      return `
        <button 
          onclick="App.selectCategory('${cat.id}')"
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 touch-press ${
            isSelected 
              ? 'bg-red-600 text-white shadow-md ring-2 ring-red-400/40' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }"
        >
          <i data-lucide="${cat.icon || 'utensils'}" class="w-3.5 h-3.5"></i>
          <span>${cat.name}</span>
        </button>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  selectCategory(catId) {
    SoundFX.playClick();
    this.selectedCategory = catId;
    this.renderCategories();
    this.renderMenu();
  },

  // Render Menu Catalog
  renderMenu() {
    const container = document.getElementById('menu-items-grid');
    if (!container) return;

    const filtered = this.menuItems.filter(item => {
      // Category filter
      if (this.selectedCategory !== 'all' && item.category !== this.selectedCategory) {
        return false;
      }
      // Veg only
      if (this.vegOnlyFilter && !item.veg) {
        return false;
      }
      // Search query
      if (this.searchQuery) {
        const matchName = item.name.toLowerCase().includes(this.searchQuery);
        const matchDesc = (item.description || '').toLowerCase().includes(this.searchQuery);
        const matchTag = (item.tag || '').toLowerCase().includes(this.searchQuery);
        if (!matchName && !matchDesc && !matchTag) return false;
      }
      return true;
    });

    // Apply sorting
    if (this.sortBy === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'popular') {
      filtered.sort((a, b) => (b.tag ? 1 : 0) - (a.tag ? 1 : 0));
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center text-gray-400 dark:text-gray-500">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-3">
            <i data-lucide="utensils" class="w-7 h-7"></i>
          </div>
          <p class="font-extrabold text-sm text-gray-700 dark:text-gray-300">No delicious dishes found</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Try another category, clear search, or add a custom item</p>
          <button onclick="App.openQuickCustomItemModal()" class="mt-3 inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-bold px-3 py-1.5 rounded-lg touch-press">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Add Off-Menu Item</span>
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const currency = this.settings.currency || '₹';

    container.innerHTML = filtered.map(item => {
      const cartItem = OrdersManager.currentCart.find(ci => ci.id === item.id);
      const currentQty = cartItem ? cartItem.quantity : 0;
      const isOut = item.inStock === false;

      return `
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700/80 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group ${isOut ? 'opacity-60 grayscale-[40%]' : ''}">
          <!-- Food Image with Badges -->
          <div class="relative h-32 sm:h-36 bg-gray-100 dark:bg-gray-900 overflow-hidden cursor-pointer" onclick="${isOut ? '' : `App.addToCart('${item.id}')`}">
            <img 
              src="${item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'}" 
              alt="${item.name}" 
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'"
            />
            
            <!-- Veg / Non-Veg Tag -->
            <div class="absolute top-2 left-2 bg-white/95 dark:bg-gray-900/90 backdrop-blur-sm p-1 rounded-md shadow-xs flex items-center">
              <span class="${item.veg ? 'veg-badge' : 'non-veg-badge'}"></span>
            </div>

            <!-- Optional Tag Pill -->
            ${item.tag ? `
              <div class="absolute top-2 right-2 bg-gray-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                ${item.tag}
              </div>
            ` : ''}

            <!-- Out of Stock Overlay -->
            ${isOut ? `
              <div class="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                <span class="bg-rose-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">Sold Out</span>
              </div>
            ` : ''}
          </div>

          <!-- Dish Info -->
          <div class="p-3 flex-1 flex flex-col justify-between">
            <div>
              <h3 class="font-bold text-gray-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition">${item.name}</h3>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-tight">${item.description || ''}</p>
            </div>

            <!-- Pricing & Action Row -->
            <div class="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
              <div>
                <span class="font-black text-sm sm:text-base text-gray-900 dark:text-white font-mono">
                  ${currency}${item.price}
                </span>
                ${item.calories ? `<span class="hidden sm:inline text-[10px] text-gray-400 ml-1 font-medium">${item.calories}</span>` : ''}
              </div>

              ${isOut ? `
                <span class="text-[11px] text-gray-400 dark:text-gray-500 font-semibold">Unavailable</span>
              ` : currentQty > 0 ? `
                <div class="flex items-center bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 shadow-2xs">
                  <button 
                    onclick="App.decreaseCartItem('${item.id}')"
                    class="w-7 h-7 flex items-center justify-center font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/50 rounded-l-lg touch-press"
                  >-</button>
                  <span class="w-6 text-center font-bold text-xs font-mono">${currentQty}</span>
                  <button 
                    onclick="App.increaseCartItem('${item.id}')"
                    class="w-7 h-7 flex items-center justify-center font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/50 rounded-r-lg touch-press"
                  >+</button>
                </div>
              ` : `
                <button 
                  onclick="App.addToCart('${item.id}')"
                  class="bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs touch-press transition"
                >
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>ADD</span>
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  // Cart Operations
  addToCart(itemId) {
    const item = this.menuItems.find(i => i.id === itemId);
    if (!item || item.inStock === false) return;
    SoundFX.playPop();
    OrdersManager.addToCart(item, 1);
    this.renderMenu();
    this.renderCart();
  },

  increaseCartItem(itemId) {
    SoundFX.playPop();
    OrdersManager.updateQuantity(itemId, 1);
    this.renderMenu();
    this.renderCart();
  },

  decreaseCartItem(itemId) {
    SoundFX.playClick();
    OrdersManager.updateQuantity(itemId, -1);
    this.renderMenu();
    this.renderCart();
  },

  setQuickCash(amount) {
    SoundFX.playClick();
    OrdersManager.cashTendered = amount;
    const input = document.getElementById('cart-cash-tendered');
    if (input) input.value = amount;
    this.renderCart();
  },

  // Render POS Cart & Billing Panel
  renderCart() {
    const items = OrdersManager.currentCart;
    const currency = this.settings.currency || '₹';

    const totals = BillingEngine.calculateBill(items, {
      discountType: OrdersManager.discountType,
      discountValue: OrdersManager.discountValue,
      taxRate: this.settings.taxRate,
      serviceRate: this.settings.serviceChargeRate,
      cashTendered: OrdersManager.paymentMethod === 'cash' ? OrdersManager.cashTendered : 0
    });

    // Update Floating Mobile Cart Bar
    const floatBar = document.getElementById('mobile-cart-float-bar');
    const floatCount = document.getElementById('float-cart-count');
    const floatTotal = document.getElementById('float-cart-total');

    if (floatBar && floatCount && floatTotal) {
      if (items.length > 0) {
        floatBar.classList.remove('hidden');
        floatCount.textContent = `${totals.totalItemsCount} Item${totals.totalItemsCount > 1 ? 's' : ''}`;
        floatTotal.textContent = `${currency}${totals.grandTotal.toFixed(2)}`;
      } else {
        floatBar.classList.add('hidden');
      }
    }

    // Populate Table Selectors
    const tableSelects = document.querySelectorAll('.table-select-elem');
    tableSelects.forEach(sel => {
      if (sel.options.length === 0) {
        sel.innerHTML = DEFAULT_TABLES.map(t => 
          `<option value="${t}" ${OrdersManager.currentOrderType === t ? 'selected' : ''}>${t}</option>`
        ).join('');
      } else {
        sel.value = OrdersManager.currentOrderType;
      }
    });

    // Populate Items Container (Desktop & Mobile Drawer)
    const cartContainers = document.querySelectorAll('.cart-items-container');
    cartContainers.forEach(container => {
      if (items.length === 0) {
        container.innerHTML = `
          <div class="py-12 text-center text-gray-400 dark:text-gray-500">
            <div class="w-12 h-12 mx-auto rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-600 mb-2">
              <i data-lucide="shopping-bag" class="w-6 h-6"></i>
            </div>
            <p class="font-bold text-xs text-gray-600 dark:text-gray-400">Order cart is empty</p>
            <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Click + on menu items to begin billing</p>
          </div>
        `;
      } else {
        container.innerHTML = items.map(item => `
          <div class="py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="${item.veg ? 'veg-badge' : 'non-veg-badge'} flex-shrink-0"></span>
                <span class="font-bold text-xs text-gray-800 dark:text-gray-200 truncate">${item.name}</span>
              </div>
              <div class="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                ${currency}${item.price} × ${item.quantity} = <strong class="text-gray-800 dark:text-gray-200">${currency}${(item.price * item.quantity).toFixed(2)}</strong>
              </div>
              ${item.note ? `
                <div class="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded inline-block mt-0.5">
                  👉 ${item.note}
                </div>
              ` : `
                <button onclick="App.openItemNoteModal('${item.id}')" class="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline mt-0.5 block">
                  + Add cooking note
                </button>
              `}
            </div>

            <!-- Stepper controls -->
            <div class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
              <button 
                onclick="App.decreaseCartItem('${item.id}')"
                class="w-6 h-6 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded touch-press text-xs"
              >-</button>
              <span class="w-5 text-center text-xs font-black font-mono text-gray-800 dark:text-gray-100">${item.quantity}</span>
              <button 
                onclick="App.increaseCartItem('${item.id}')"
                class="w-6 h-6 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded touch-press text-xs"
              >+</button>
            </div>
          </div>
        `).join('');
      }
    });

    // Update Totals Summary
    const updateSummaryElements = (suffix = '') => {
      const subtotalEl = document.getElementById(`cart-subtotal${suffix}`);
      const discountRow = document.getElementById(`cart-discount-row${suffix}`);
      const discountVal = document.getElementById(`cart-discount-amt${suffix}`);
      const taxRow = document.getElementById(`cart-tax-row${suffix}`);
      const taxLabel = document.getElementById(`cart-tax-label${suffix}`);
      const taxVal = document.getElementById(`cart-tax-amt${suffix}`);
      const grandTotalEl = document.getElementById(`cart-grand-total${suffix}`);
      const changeRow = document.getElementById(`cart-change-row${suffix}`);
      const changeVal = document.getElementById(`cart-change-amt${suffix}`);

      if (subtotalEl) subtotalEl.textContent = `${currency}${totals.subtotal.toFixed(2)}`;
      
      if (discountRow && discountVal) {
        if (totals.discountAmount > 0) {
          discountRow.classList.remove('hidden');
          discountVal.textContent = `-${currency}${totals.discountAmount.toFixed(2)}`;
        } else {
          discountRow.classList.add('hidden');
        }
      }

      if (taxRow && taxVal && taxLabel) {
        if (totals.taxAmount > 0) {
          taxRow.classList.remove('hidden');
          taxLabel.textContent = `GST (${totals.taxRate}%):`;
          taxVal.textContent = `+${currency}${totals.taxAmount.toFixed(2)}`;
        } else {
          taxRow.classList.add('hidden');
        }
      }

      if (grandTotalEl) grandTotalEl.textContent = `${currency}${totals.grandTotal.toFixed(2)}`;

      // Cash change row
      if (changeRow && changeVal) {
        if (OrdersManager.paymentMethod === 'cash' && OrdersManager.cashTendered > totals.grandTotal) {
          changeRow.classList.remove('hidden');
          changeVal.textContent = `${currency}${totals.changeAmount.toFixed(2)}`;
        } else {
          changeRow.classList.add('hidden');
        }
      }
    };

    updateSummaryElements(''); // Desktop
    updateSummaryElements('-mobile'); // Mobile Drawer

    this.updatePaymentButtons();
    if (window.lucide) lucide.createIcons();
  },

  updatePaymentButtons() {
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
      const method = btn.dataset.method;
      if (method === OrdersManager.paymentMethod) {
        btn.classList.add('bg-red-600', 'text-white', 'border-red-600', 'shadow-xs');
        btn.classList.remove('bg-white', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300', 'border-gray-200', 'dark:border-gray-700');
      } else {
        btn.classList.remove('bg-red-600', 'text-white', 'border-red-600', 'shadow-xs');
        btn.classList.add('bg-white', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300', 'border-gray-200', 'dark:border-gray-700');
      }
    });

    // Toggle cash tender box visibility
    const cashBox = document.getElementById('cash-tender-box');
    if (cashBox) {
      if (OrdersManager.paymentMethod === 'cash') {
        cashBox.classList.remove('hidden');
      } else {
        cashBox.classList.add('hidden');
      }
    }
  },

  // Open & Close Mobile Cart Drawer
  openMobileCartDrawer() {
    SoundFX.playClick();
    const drawer = document.getElementById('mobile-cart-drawer');
    if (drawer) {
      drawer.classList.remove('hidden');
      this.renderCart();
    }
  },

  closeMobileCartDrawer() {
    const drawer = document.getElementById('mobile-cart-drawer');
    if (drawer) drawer.classList.add('hidden');
  },

  // Process Checkout
  processCheckout() {
    try {
      const order = OrdersManager.checkout(this.settings);
      SoundFX.playSuccess();
      this.closeMobileCartDrawer();
      this.renderMenu();
      this.renderCart();
      this.showReceiptModal(order);
      this.updateLiveBadges();
      this.showToast(`Order Token #${order.tokenNumber} Created!`);
    } catch (e) {
      alert(e.message || 'Checkout failed');
    }
  },

  // Show Thermal Receipt Modal
  showReceiptModal(order) {
    const modal = document.getElementById('receipt-modal');
    const container = document.getElementById('receipt-render-box');
    if (!modal || !container) return;

    this.activeOrderForReceipt = order;
    container.innerHTML = BillingEngine.generateThermalReceiptHtml(order, this.settings);
    modal.classList.remove('hidden');

    if (window.lucide) lucide.createIcons();
  },

  closeReceiptModal() {
    const modal = document.getElementById('receipt-modal');
    if (modal) modal.classList.add('hidden');
  },

  printReceipt() {
    if (!this.activeOrderForReceipt) return;
    const container = document.getElementById('receipt-render-box');
    container.innerHTML = BillingEngine.generateThermalReceiptHtml(this.activeOrderForReceipt, this.settings);
    window.print();
  },

  printKot() {
    if (!this.activeOrderForReceipt) return;
    const container = document.getElementById('receipt-render-box');
    container.innerHTML = BillingEngine.generateKotHtml(this.activeOrderForReceipt, this.settings);
    window.print();
    // Restore receipt after KOT printing
    setTimeout(() => {
      container.innerHTML = BillingEngine.generateThermalReceiptHtml(this.activeOrderForReceipt, this.settings);
    }, 1000);
  },

  shareOnWhatsApp() {
    if (!this.activeOrderForReceipt) return;
    const url = BillingEngine.generateWhatsAppUrl(this.activeOrderForReceipt, this.settings);
    window.open(url, '_blank');
  },

  copyBillText() {
    if (!this.activeOrderForReceipt) return;
    SoundFX.playPop();
    const currency = this.settings.currency || '₹';
    const o = this.activeOrderForReceipt;
    let txt = `🍽️ ${this.settings.storeName.toUpperCase()}\n`;
    if (this.settings.tagline) txt += `${this.settings.tagline}\n`;
    txt += `Bill: #${o.billNumber} | Token: #${o.tokenNumber} | ${o.orderType}\n`;
    txt += `Date: ${new Date(o.createdAt).toLocaleString()}\n`;
    if (o.customerName) txt += `Customer: ${o.customerName} ${o.customerPhone ? `(${o.customerPhone})` : ''}\n`;
    txt += `--------------------------------\n`;
    o.items.forEach(i => {
      txt += `${i.quantity}x ${i.name} = ${currency}${(i.price * i.quantity).toFixed(2)}\n`;
      if (i.note) txt += `   Note: ${i.note}\n`;
    });
    txt += `--------------------------------\n`;
    txt += `Subtotal: ${currency}${o.totals.subtotal.toFixed(2)}\n`;
    if (o.totals.discountAmount > 0) txt += `Discount: -${currency}${o.totals.discountAmount.toFixed(2)}\n`;
    if (o.totals.taxAmount > 0) txt += `GST: +${currency}${o.totals.taxAmount.toFixed(2)}\n`;
    txt += `TOTAL: ${currency}${o.totals.grandTotal.toFixed(2)} (${o.paymentMethod.toUpperCase()} PAID)\n`;
    txt += `--------------------------------\n`;
    txt += `${this.settings.receiptFooter || 'Thank you!'}\n`;
    txt += `Developed by ATHIP, AADHIL, KIRUBA, MOUSIK, KAMESH\n`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => {
        this.showToast('Bill text copied to clipboard! 📋');
      }).catch(() => {
        this.showToast('Could not copy to clipboard');
      });
    } else {
      this.showToast('Clipboard not supported');
    }
  },

  downloadBillTxt() {
    if (!this.activeOrderForReceipt) return;
    SoundFX.playClick();
    const currency = this.settings.currency || '₹';
    const o = this.activeOrderForReceipt;
    let txt = `================================\n`;
    txt += `   ${this.settings.storeName.toUpperCase()}\n`;
    if (this.settings.tagline) txt += `   ${this.settings.tagline}\n`;
    if (this.settings.address) txt += `   ${this.settings.address}\n`;
    if (this.settings.phone) txt += `   Tel: ${this.settings.phone}\n`;
    if (this.settings.gstin) txt += `   GSTIN: ${this.settings.gstin}\n`;
    txt += `================================\n`;
    txt += `Bill No : #${o.billNumber}\n`;
    txt += `Token   : #${o.tokenNumber}\n`;
    txt += `Date    : ${new Date(o.createdAt).toLocaleString()}\n`;
    txt += `Type    : ${o.orderType}\n`;
    if (o.customerName) txt += `Customer: ${o.customerName}\n`;
    txt += `--------------------------------\n`;
    txt += `ITEM            QTY   RATE   AMT\n`;
    txt += `--------------------------------\n`;
    o.items.forEach(i => {
      const name = i.name.length > 15 ? i.name.slice(0, 15) : i.name.padEnd(15, ' ');
      const qty = String(i.quantity).padStart(3, ' ');
      const rate = String(i.price.toFixed(2)).padStart(6, ' ');
      const amt = String((i.price * i.quantity).toFixed(2)).padStart(6, ' ');
      txt += `${name} ${qty} ${rate} ${amt}\n`;
      if (i.note) txt += `  Note: ${i.note}\n`;
    });
    txt += `--------------------------------\n`;
    txt += `Subtotal:       ${currency}${o.totals.subtotal.toFixed(2)}\n`;
    if (o.totals.discountAmount > 0) txt += `Discount:      -${currency}${o.totals.discountAmount.toFixed(2)}\n`;
    if (o.totals.taxAmount > 0) txt += `GST (${o.totals.taxRate}%):      +${currency}${o.totals.taxAmount.toFixed(2)}\n`;
    txt += `--------------------------------\n`;
    txt += `GRAND TOTAL:    ${currency}${o.totals.grandTotal.toFixed(2)}\n`;
    txt += `Payment:        ${o.paymentMethod.toUpperCase()} (PAID)\n`;
    txt += `================================\n`;
    txt += `${this.settings.receiptFooter || 'Thank you for your visit!'}\n`;
    txt += `Developed by ATHIP, AADHIL, KIRUBA, MOUSIK, KAMESH\n`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill_${o.billNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Bill text file downloaded! 📄');
  },

  // =========================================================================
  // KITCHEN ORDER DISPLAY (KDS) & TOKEN BOARD
  // =========================================================================
  setKitchenFilter(status) {
    SoundFX.playClick();
    this.kitchenStatusFilter = status;
    this.renderOrdersTab();
  },

  renderOrdersTab() {
    const container = document.getElementById('orders-list-container');
    if (!container) return;

    const allOrders = StorageManager.getOrders();
    const currency = this.settings.currency || '₹';

    // Filter by selected tab
    const orders = allOrders.filter(o => {
      if (this.kitchenStatusFilter === 'all') return true;
      return o.status === this.kitchenStatusFilter;
    });

    // Update filter tab active styles
    document.querySelectorAll('.kitchen-filter-btn').forEach(btn => {
      if (btn.dataset.status === this.kitchenStatusFilter) {
        btn.className = 'kitchen-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 text-white shadow-xs';
      } else {
        btn.className = 'kitchen-filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
      }
    });

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-300 dark:text-gray-600 mb-3">
            <i data-lucide="chef-hat" class="w-7 h-7"></i>
          </div>
          <p class="font-extrabold text-sm text-gray-700 dark:text-gray-300">No Orders in this Kitchen Queue</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">New incoming food orders and tokens will appear live here</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = orders.map(order => {
      // Calculate elapsed minutes
      const elapsedMins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
      const timeAgoText = elapsedMins < 1 ? 'Just now' : `${elapsedMins}m ago`;
      const timerColor = elapsedMins > 15 ? 'text-red-500 font-black' : elapsedMins > 8 ? 'text-amber-500 font-bold' : 'text-gray-400 font-medium';

      const statusBadge = 
        order.status === 'Preparing' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300' :
        order.status === 'Ready' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300' :
        order.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300' :
        'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300';

      const itemsList = (order.items || []).map(i => `
        <div class="flex items-start justify-between py-1 border-b border-gray-50 dark:border-gray-800/80 text-xs">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="font-mono font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">${i.quantity}×</span>
            <span class="font-bold text-gray-800 dark:text-gray-200 truncate">${i.name}</span>
          </div>
          ${i.note ? `<span class="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded ml-2">⚠️ ${i.note}</span>` : ''}
        </div>
      `).join('');

      return `
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700/80 shadow-2xs p-4 hover:shadow-md transition">
          <!-- Top Card Meta -->
          <div class="flex items-start justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="bg-gray-900 dark:bg-black text-white font-mono font-black text-xs px-2.5 py-1 rounded-lg">Token #${order.tokenNumber}</span>
                <span class="font-black text-sm text-gray-900 dark:text-white">${order.orderType}</span>
                <span class="text-[11px] ${timerColor}">${timeAgoText}</span>
              </div>
              <div class="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                Bill #${order.billNumber} • ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                ${order.customerName ? ` • <strong>${order.customerName}</strong>` : ''}
              </div>
            </div>

            <!-- Status Dropdown -->
            <select 
              onchange="App.changeOrderStatus('${order.id}', this.value)"
              class="text-xs font-bold px-2.5 py-1.5 rounded-xl border ${statusBadge} focus:outline-none dark:bg-gray-900"
            >
              <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>👨‍🍳 Preparing</option>
              <option value="Ready" ${order.status === 'Ready' ? 'selected' : ''}>🔔 Ready for Pickup</option>
              <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
              <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
            </select>
          </div>

          <!-- Items Details -->
          <div class="py-2.5 space-y-1">
            ${itemsList}
          </div>

          <!-- Bottom Actions -->
          <div class="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-700 text-xs">
            <span class="text-gray-500 dark:text-gray-400 font-medium">
              Total: <strong class="text-gray-900 dark:text-white font-mono text-sm">${currency}${order.totals.grandTotal.toFixed(2)}</strong>
              <span class="uppercase text-[10px] text-gray-400 ml-1">(${order.paymentMethod})</span>
            </span>

            <div class="flex items-center gap-1.5">
              <button 
                onclick="App.printOrderKot('${order.id}')"
                class="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-[11px] px-2.5 py-1 rounded-lg font-bold touch-press flex items-center gap-1"
                title="Print Kitchen Ticket"
              >
                <i data-lucide="chef-hat" class="w-3.5 h-3.5"></i>
                <span>KOT</span>
              </button>
              <button 
                onclick="App.viewOrderReceipt('${order.id}')"
                class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-[11px] px-2.5 py-1 rounded-lg font-bold touch-press flex items-center gap-1"
              >
                <i data-lucide="receipt" class="w-3.5 h-3.5"></i>
                <span>Bill</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  changeOrderStatus(orderId, newStatus) {
    SoundFX.playPop();
    StorageManager.updateOrderStatus(orderId, newStatus);
    this.renderOrdersTab();
    this.updateLiveBadges();
    this.showToast(`Order Token status: ${newStatus}`);
  },

  viewOrderReceipt(orderId) {
    const orders = StorageManager.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      this.showReceiptModal(order);
    }
  },

  printOrderKot(orderId) {
    const orders = StorageManager.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      this.activeOrderForReceipt = order;
      this.printKot();
    }
  },

  // =========================================================================
  // ANALYTICS & SALES REPORT
  // =========================================================================
  renderAnalyticsTab() {
    const metrics = OrdersManager.getAnalytics();
    const currency = this.settings.currency || '₹';

    const todayRevEl = document.getElementById('stat-today-revenue');
    const todayOrdersEl = document.getElementById('stat-today-orders');
    const avgOrderValEl = document.getElementById('stat-today-aov');
    const totalRevEl = document.getElementById('stat-alltime-revenue');
    const totalOrdersEl = document.getElementById('stat-alltime-orders');

    if (todayRevEl) todayRevEl.textContent = `${currency}${metrics.todayRevenue.toFixed(2)}`;
    if (todayOrdersEl) todayOrdersEl.textContent = metrics.todayOrderCount;
    if (avgOrderValEl) avgOrderValEl.textContent = `${currency}${metrics.avgOrderValueToday.toFixed(2)}`;
    if (totalRevEl) totalRevEl.textContent = `${currency}${metrics.totalRevenueAllTime.toFixed(2)}`;
    if (totalOrdersEl) totalOrdersEl.textContent = metrics.totalOrdersAllTime;

    // Payment breakdown
    const cashRev = document.getElementById('stat-pay-cash');
    const upiRev = document.getElementById('stat-pay-upi');
    const cardRev = document.getElementById('stat-pay-card');
    if (cashRev) cashRev.textContent = `${currency}${metrics.paymentBreakdown.cash.toFixed(2)}`;
    if (upiRev) upiRev.textContent = `${currency}${metrics.paymentBreakdown.upi.toFixed(2)}`;
    if (cardRev) cardRev.textContent = `${currency}${metrics.paymentBreakdown.card.toFixed(2)}`;

    // Progress Bars for Payments
    const totalTodayPay = metrics.todayRevenue || 1; // prevent divide by 0
    const cashPercent = Math.round((metrics.paymentBreakdown.cash / totalTodayPay) * 100);
    const upiPercent = Math.round((metrics.paymentBreakdown.upi / totalTodayPay) * 100);
    const cardPercent = Math.round((metrics.paymentBreakdown.card / totalTodayPay) * 100);

    const cashBar = document.getElementById('bar-pay-cash');
    const upiBar = document.getElementById('bar-pay-upi');
    const cardBar = document.getElementById('bar-pay-card');
    if (cashBar) cashBar.style.width = `${cashPercent}%`;
    if (upiBar) upiBar.style.width = `${upiPercent}%`;
    if (cardBar) cardBar.style.width = `${cardPercent}%`;

    // Top Selling Items
    const topContainer = document.getElementById('stat-top-items');
    if (topContainer) {
      if (metrics.topItems.length === 0) {
        topContainer.innerHTML = `<p class="text-xs text-gray-400 py-6 text-center">No sales recorded yet. Place orders from POS to see popularity charts.</p>`;
      } else {
        topContainer.innerHTML = metrics.topItems.map((item, idx) => `
          <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 text-xs">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-5 h-5 rounded-full ${idx === 0 ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'} font-black flex items-center justify-center text-[10px] flex-shrink-0">
                #${idx + 1}
              </span>
              <span class="${item.veg ? 'veg-badge' : 'non-veg-badge'}"></span>
              <span class="font-bold text-gray-800 dark:text-gray-200 truncate">${item.name}</span>
            </div>
            <div class="text-right flex-shrink-0">
              <span class="font-black text-gray-900 dark:text-white font-mono">${item.count} orders</span>
              <div class="text-[10px] text-gray-400 font-mono">${currency}${item.revenue.toFixed(2)}</div>
            </div>
          </div>
        `).join('');
      }
    }
  },

  exportCsvReport() {
    SoundFX.playClick();
    OrdersManager.exportOrdersToCsv(this.settings.currency || '₹');
    this.showToast('CSV Report downloaded successfully!');
  },

  // =========================================================================
  // MENU MANAGEMENT
  // =========================================================================
  renderMenuManagementTab() {
    const container = document.getElementById('menu-manage-items-list');
    if (!container) return;

    const currency = this.settings.currency || '₹';

    container.innerHTML = this.menuItems.map(item => `
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700/80 p-3 sm:p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-sm transition">
        <div class="flex items-center gap-3 min-w-0">
          <img src="${item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'}" class="w-12 h-12 rounded-xl object-cover bg-gray-100 dark:bg-gray-900 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'" />
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="${item.veg ? 'veg-badge' : 'non-veg-badge'}"></span>
              <h4 class="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">${item.name}</h4>
              ${item.tag ? `<span class="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.2 rounded">${item.tag}</span>` : ''}
            </div>
            <p class="text-xs text-red-600 dark:text-red-400 font-black mt-0.5 font-mono">${currency}${item.price}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <!-- Toggle Stock -->
          <button 
            onclick="App.toggleItemStock('${item.id}')"
            class="text-[11px] font-bold px-2.5 py-1 rounded-xl border touch-press ${
              item.inStock !== false 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }"
          >
            ${item.inStock !== false ? 'In Stock' : 'Out of Stock'}
          </button>

          <!-- Edit -->
          <button 
            onclick="App.openEditItemModal('${item.id}')"
            class="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl touch-press"
            title="Edit Dish"
          >
            <i data-lucide="edit-2" class="w-4 h-4"></i>
          </button>

          <!-- Delete -->
          <button 
            onclick="App.deleteMenuItem('${item.id}')"
            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl touch-press"
            title="Delete Dish"
          >
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
  },

  toggleItemStock(itemId) {
    SoundFX.playClick();
    const item = this.menuItems.find(i => i.id === itemId);
    if (item) {
      item.inStock = item.inStock === false ? true : false;
      StorageManager.saveMenuItems(this.menuItems);
      this.renderMenuManagementTab();
      this.renderMenu();
      this.showToast(`${item.name} is now ${item.inStock ? 'In Stock' : 'Out of Stock'}`);
    }
  },

  deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to remove this dish from the menu?')) return;
    SoundFX.playClick();
    this.menuItems = this.menuItems.filter(i => i.id !== itemId);
    StorageManager.saveMenuItems(this.menuItems);
    this.renderMenuManagementTab();
    this.renderMenu();
    this.showToast('Dish removed from menu');
  },

  openAddItemModal() {
    SoundFX.playClick();
    document.getElementById('item-modal-title').textContent = 'Add New Food Item';
    document.getElementById('item-form-id').value = '';
    document.getElementById('item-form-name').value = '';
    document.getElementById('item-form-price').value = '';
    document.getElementById('item-form-category').value = 'burgers';
    document.getElementById('item-form-veg').checked = true;
    document.getElementById('item-form-desc').value = '';
    document.getElementById('item-form-tag').value = '';
    document.getElementById('item-form-image').value = '';
    document.getElementById('item-form-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  openEditItemModal(itemId) {
    SoundFX.playClick();
    const item = this.menuItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('item-modal-title').textContent = 'Edit Food Item';
    document.getElementById('item-form-id').value = item.id;
    document.getElementById('item-form-name').value = item.name;
    document.getElementById('item-form-price').value = item.price;
    document.getElementById('item-form-category').value = item.category || 'burgers';
    document.getElementById('item-form-veg').checked = item.veg;
    document.getElementById('item-form-desc').value = item.description || '';
    document.getElementById('item-form-tag').value = item.tag || '';
    document.getElementById('item-form-image').value = item.image || '';
    document.getElementById('item-form-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  saveItemForm(e) {
    e.preventDefault();
    const id = document.getElementById('item-form-id').value;
    const name = document.getElementById('item-form-name').value.trim();
    const price = parseFloat(document.getElementById('item-form-price').value) || 0;
    const category = document.getElementById('item-form-category').value;
    const veg = document.getElementById('item-form-veg').checked;
    const desc = document.getElementById('item-form-desc').value.trim();
    const tag = document.getElementById('item-form-tag').value.trim();
    const image = document.getElementById('item-form-image').value.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';

    if (!name || price <= 0) {
      alert('Please provide a valid dish name and price.');
      return;
    }

    if (id) {
      const idx = this.menuItems.findIndex(i => i.id === id);
      if (idx !== -1) {
        this.menuItems[idx] = {
          ...this.menuItems[idx],
          name, price, category, veg, description: desc, tag, image
        };
      }
    } else {
      const newItem = {
        id: 'item_' + Date.now(),
        name, price, category, veg, description: desc, tag, image,
        inStock: true
      };
      this.menuItems.unshift(newItem);
    }

    SoundFX.playPop();
    StorageManager.saveMenuItems(this.menuItems);
    document.getElementById('item-form-modal').classList.add('hidden');
    this.renderMenuManagementTab();
    this.renderMenu();
    this.showToast('Food dish saved successfully!');
  },

  // Quick Off-Menu Custom Item for Cashiers
  openQuickCustomItemModal() {
    SoundFX.playClick();
    document.getElementById('quick-item-modal').classList.remove('hidden');
    document.getElementById('quick-item-name').value = '';
    document.getElementById('quick-item-price').value = '';
    document.getElementById('quick-item-name').focus();
    if (window.lucide) lucide.createIcons();
  },

  addQuickCustomItem(e) {
    e.preventDefault();
    const name = document.getElementById('quick-item-name').value.trim();
    const price = parseFloat(document.getElementById('quick-item-price').value) || 0;
    const veg = document.getElementById('quick-item-veg').checked;

    if (!name || price <= 0) {
      alert('Enter item name and price');
      return;
    }

    SoundFX.playPop();
    OrdersManager.addCustomItem(name, price, veg);
    document.getElementById('quick-item-modal').classList.add('hidden');
    this.renderCart();
    this.showToast(`Added ${name} to active bill`);
  },

  // Item Cooking Note Modal
  openItemNoteModal(itemId) {
    this.activeItemForNote = itemId;
    const item = OrdersManager.currentCart.find(ci => ci.id === itemId);
    if (!item) return;

    document.getElementById('note-modal-item-name').textContent = item.name;
    document.getElementById('note-modal-input').value = item.note || '';
    document.getElementById('item-note-modal').classList.remove('hidden');
    document.getElementById('note-modal-input').focus();
  },

  applyQuickNote(text) {
    SoundFX.playClick();
    const input = document.getElementById('note-modal-input');
    if (input) {
      input.value = input.value ? `${input.value}, ${text}` : text;
    }
  },

  saveItemNote() {
    if (!this.activeItemForNote) return;
    const note = document.getElementById('note-modal-input').value.trim();
    OrdersManager.setItemNote(this.activeItemForNote, note);
    document.getElementById('item-note-modal').classList.add('hidden');
    this.renderCart();
    this.showToast('Cooking note attached');
  },

  resetDefaultMenu() {
    if (!confirm('Reset menu catalog to sample defaults? Any custom items will be overwritten.')) return;
    SoundFX.playClick();
    this.menuItems = [...DEFAULT_MENU_ITEMS];
    StorageManager.saveMenuItems(this.menuItems);
    this.renderMenuManagementTab();
    this.renderMenu();
    this.showToast('Sample menu restored.');
  },

  // =========================================================================
  // SETTINGS & PROFILE
  // =========================================================================
  renderSettingsTab() {
    const s = this.settings;
    document.getElementById('setting-store-name').value = s.storeName || '';
    document.getElementById('setting-tagline').value = s.tagline || '';
    document.getElementById('setting-phone').value = s.phone || '';
    document.getElementById('setting-address').value = s.address || '';
    document.getElementById('setting-gstin').value = s.gstin || '';
    document.getElementById('setting-currency').value = s.currency || '₹';
    document.getElementById('setting-tax-rate').value = s.taxRate || 0;
    document.getElementById('setting-upi-id').value = s.upiId || '';
    document.getElementById('setting-receipt-footer').value = s.receiptFooter || '';
  },

  saveSettingsForm(e) {
    e.preventDefault();
    SoundFX.playSuccess();
    const newSettings = {
      storeName: document.getElementById('setting-store-name').value.trim() || 'My Food Restaurant',
      tagline: document.getElementById('setting-tagline').value.trim(),
      phone: document.getElementById('setting-phone').value.trim(),
      address: document.getElementById('setting-address').value.trim(),
      gstin: document.getElementById('setting-gstin').value.trim(),
      currency: document.getElementById('setting-currency').value.trim() || '₹',
      taxRate: parseFloat(document.getElementById('setting-tax-rate').value) || 0,
      upiId: document.getElementById('setting-upi-id').value.trim(),
      receiptFooter: document.getElementById('setting-receipt-footer').value.trim()
    };
    this.updateSettings(newSettings);
  },

  exportBackup() {
    SoundFX.playClick();
    StorageManager.exportBackupJSON();
    this.showToast('Backup file generated');
  },

  importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const ok = StorageManager.importBackupJSON(event.target.result);
      if (ok) {
        alert('Data restored successfully! App will reload.');
        window.location.reload();
      } else {
        alert('Invalid backup file. Could not restore.');
      }
    };
    reader.readAsText(file);
  },

  resetAll() {
    if (confirm('CAUTION: This will delete all order history and settings! Continue?')) {
      StorageManager.resetAllData();
      window.location.reload();
    }
  },

  closeAllModals() {
    document.querySelectorAll('.app-modal').forEach(m => m.classList.add('hidden'));
  },

  // Toast Notification
  showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.innerHTML = `
      <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i>
      <span>${message}</span>
    `;
    toast.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  },

  // PWA Setup
  setupPwaInstall() {
    const banner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('pwa-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      if (banner) banner.classList.remove('hidden');
    });

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (this.deferredPrompt) {
          this.deferredPrompt.prompt();
          await this.deferredPrompt.userChoice;
          this.deferredPrompt = null;
          if (banner) banner.classList.add('hidden');
        } else {
          this.openPhoneUploadGuideModal();
        }
      });
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => {
          console.log('SW register note:', err);
        });
      });
    }
  },

  openPhoneUploadGuideModal() {
    SoundFX.playClick();
    const modal = document.getElementById('phone-guide-modal');
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }
};

// Global Initialization
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
