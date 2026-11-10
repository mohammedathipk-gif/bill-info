# 🍽️ QuickBite - Aesthetic Food Order & Billing POS System
*Developed by **ATHIP, AADHIL, KIRUBA, MOUSIK, KAMESH***

A high-performance, mobile-first, and desktop-optimized **Food Ordering & Billing POS (Point of Sale)** web application designed specifically for restaurants, cafes, cloud kitchens, and food trucks.

Crafted with clean **aesthetic designs**, glassmorphic UI, dark/light mode, real-time audio sound effects (Web Audio API), realistic thermal paper receipts, kitchen KOT management, cash change calculator, and 1-tap WhatsApp billing.

---

## 🚀 Key Aesthetic & Functional Features

### 🛒 1. Gourmet POS & Food Ordering Interface
- **Dual Responsive Layout:** 
  - **Desktop:** Split screen with responsive catalog grid on the left and sticky real-time order & calculation panel on the right.
  - **Mobile / Tablet:** Thumb-friendly navigation, floating active cart bar, and slide-up bill drawer.
- **Visual Dish Cards:** High-resolution food photography, crispy veg/non-veg badges, tags (*Bestseller*, *Chef Special*, *Spicy 🔥*), calorie counters, and animated stepper pills (`-`, quantity, `+`).
- **Category Filter Pills:** Quick filtering across Burgers, Artisan Pizzas, Biryani, Starters, Drinks, and Desserts.
- **Search & Veg Only Switch:** Instant dish search with keyboard shortcut (`/` or `Ctrl+K`) and pure-veg filter toggle.
- **⚡ Off-Menu Custom Item:** Quickly add spontaneous dishes (e.g., "Special Thali", "Extra Butter") straight to the bill on the fly.
- **Cooking Notes:** Attach custom preparation requests to any item with 1-tap presets (*Less Spicy*, *Extra Spicy*, *No Onion/Garlic*, *Parcel Separate*).

### 🧾 2. Realistic Thermal Receipt & Invoicing
- **Perforated Thermal Slip (58mm/80mm):** Realistic thermal paper styling with sawtooth jagged bottom, monospace typography, restaurant branding, GSTIN, itemized rates, and barcode representation.
- **Taxes & Discount Engine:** Automatic calculation of GST with CGST (2.5%) + SGST (2.5%) split, percentage or flat discounts, and round-off adjustment.
- **Cashier Change Calculator:** Quick cash chips (`Exact`, `₹100`, `₹200`, `₹500`, `₹2000`) with real-time "Change to Return" calculation.
- **Direct Thermal Print (`Ctrl+P` / `window.print()`):** Print-ready formatting for Bluetooth & USB thermal receipt printers.
- **UPI QR Code:** Automatic generation of scannable QR code for instant UPI, GPay, PhonePe, and Paytm payments.
- **WhatsApp Digital Invoice:** Generates an emoji-rich, formatted WhatsApp invoice to send to customer phones.

### 👨‍🍳 3. Kitchen Display System (KDS) & KOT Tokens
- **Live Kitchen Token Queue:** Tokens (e.g. `#101`, `#102`) with order type (*Dine-In Table 1-8*, *Takeaway*, *Delivery*).
- **Elapsed Cooking Timer:** Real-time indicator ("Just now", "4m ago", "12m ago") with visual warning indicators for overdue orders.
- **Status Workflow:** 1-click status transitions: `Preparing 👨‍🍳` &rarr; `Ready for Pickup 🔔` &rarr; `Completed ✅`.
- **Dedicated KOT Slips:** Instant reprint of Kitchen Order Tickets with large quantity indicators and special cooking notes.

### 📊 4. Business Sales Analytics
- **Live Metrics Cards:** Today's Sales Revenue, Today's Order Count, Average Order Value (AOV), and All-Time Sales.
- **Payment Method Progress Bars:** Cash vs. UPI vs. Card breakdown.
- **Popular Dishes Leaderboard:** Ranked by order count and revenue.
- **Excel/CSV Export:** 1-click download of all transaction history with UTF-8 BOM encoding.

### 🎨 5. Aesthetic UI & Sensory Feedback
- **🌙 Dark & Light Themes:** Instant toggle for night shifts, dimly lit dining areas, or vibrant day use.
- **🔊 Web Audio API Sound Synthesizer:** Subtle pops on item addition, chime on order completion, and clicks on buttons (toggleable).
- **Glassmorphism & Micro-Interactions:** Modern backdrop blur, smooth spring transitions, and responsive touch feedback.

---

## 💻 How to Run Frontend & Backend

QuickBite can run as a **Full-Stack Node.js / Python Web App with REST APIs** or as an **Offline-First Static PWA (GitHub Pages)** with zero build setup!

### Option 1: Full-Stack Node.js Server (Recommended for Backend + REST APIs)
```bash
npm start
# or
node server.js
```
- Open `http://localhost:8080`
- Provides REST APIs:
  - `GET /api/health` — Backend health check
  - `GET /api/orders` & `POST /api/orders` — Live order management and multi-device persistence
  - `PATCH /api/orders/:id` — Update status (Preparing, Ready, Completed)
  - `GET /api/menu` & `POST /api/menu` — Custom dish catalog sync
  - `GET /api/analytics` — Live revenue, order count & popular dishes
  - `GET /api/settings` & `POST /api/settings` — Store details, taxes & UPI

### Option 2: Python 3 Backend Server
```bash
python server.py
```
- Runs with standard Python 3 (zero `pip install` required).

### Option 3: Docker Container
```bash
docker-compose up -d
# or
docker build -t quickbite-pos . && docker run -p 8080:8080 quickbite-pos
```

### Option 4: Double-Click PowerShell Server (Windows Wi-Fi)
1. Right-click `start-server.ps1` and select **Run with PowerShell**.
2. Open `http://localhost:8080` on PC, or open the displayed IP on your phone on the same Wi-Fi.

### Option 5: Free Online Hosting (GitHub Pages)
1. Push to GitHub (`main` branch).
2. Go to **Settings** &rarr; **Pages** &rarr; **Source**: select **GitHub Actions**.
3. GitHub automatically builds and hosts your live app at `https://<username>.github.io/<repo-name>/`.

### Option 6: Install as an App (PWA)
- **On Android (Chrome):** Tap Menu (⋮) &rarr; **"Install App"** or **"Add to Home Screen"**.
- **On iPhone (Safari):** Tap Share &rarr; **"Add to Home Screen"**.

---

## ⌨️ Pro Cashier Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `/` or `Ctrl + K` | Focus & search food items |
| `Ctrl + Enter` | Instant Generate Bill & Token |
| `Escape` | Close any active modal / preview |

---

## 📂 File Architecture

```
food-billing-app/
├── index.html          # Main single-page application structure & modals
├── manifest.json       # PWA manifest for standalone app installation
├── sw.js               # Service Worker for offline caching
├── start-server.ps1    # Lightweight local server script
├── css/
│   └── styles.css      # Custom styling, dark mode, thermal receipt & print CSS
├── js/
│   ├── app.js          # Master controller, audio engine, navigation & event listeners
│   ├── billing.js      # Bill math, thermal slip HTML, KOT slip & WhatsApp invoices
│   ├── data.js         # Menu catalog, categories, tables & default settings
│   ├── orders.js       # Active cart, order lifecycle, analytics & CSV export
│   └── storage.js      # LocalStorage layer & JSON backup/restore
└── icons/
    ├── favicon.svg     # SVG vector brand icon
    ├── icon-192.png    # Mobile app icon (192x192)
    └── icon-512.png    # High-res mobile app icon (512x512)
```

---

## 👥 Credits

Developed with ❤️ by **ATHIP, AADHIL, KIRUBA, MOUSIK, KAMESH**
