// QuickBite Billing, Invoicing & Receipt Engine

const BillingEngine = {
  // Calculate full bill breakdown
  calculateBill(items, options = {}) {
    const discountType = options.discountType || 'percent'; // 'percent' or 'flat'
    const discountValue = parseFloat(options.discountValue) || 0;
    const taxRate = parseFloat(options.taxRate) || 0;
    const serviceRate = parseFloat(options.serviceRate) || 0;
    const cashTendered = parseFloat(options.cashTendered) || 0;

    let subtotal = 0;
    let totalItemsCount = 0;

    items.forEach(item => {
      subtotal += (item.price * item.quantity);
      totalItemsCount += item.quantity;
    });

    // Discount
    let discountAmount = 0;
    if (discountType === 'percent') {
      discountAmount = (subtotal * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }
    discountAmount = Math.min(discountAmount, subtotal); // Don't exceed subtotal

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    
    // Tax (e.g. 5% GST = 2.5% CGST + 2.5% SGST)
    const taxAmount = (taxableAmount * taxRate) / 100;
    const cgstAmount = taxAmount / 2;
    const sgstAmount = taxAmount / 2;
    
    const serviceAmount = (taxableAmount * serviceRate) / 100;
    
    const exactTotal = taxableAmount + taxAmount + serviceAmount;
    const grandTotal = Math.round(exactTotal);
    const roundOff = Number((grandTotal - exactTotal).toFixed(2));

    // Change to return (if cash paid)
    const changeAmount = cashTendered > grandTotal ? Number((cashTendered - grandTotal).toFixed(2)) : 0;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      totalItemsCount,
      discountType,
      discountValue,
      discountAmount: Number(discountAmount.toFixed(2)),
      taxableAmount: Number(taxableAmount.toFixed(2)),
      taxRate,
      taxAmount: Number(taxAmount.toFixed(2)),
      cgstAmount: Number(cgstAmount.toFixed(2)),
      sgstAmount: Number(sgstAmount.toFixed(2)),
      serviceRate,
      serviceAmount: Number(serviceAmount.toFixed(2)),
      exactTotal: Number(exactTotal.toFixed(2)),
      roundOff,
      grandTotal,
      cashTendered,
      changeAmount
    };
  },

  // Format currency
  formatCurrency(amount, currency = '₹') {
    return `${currency}${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  },

  // Generate UPI QR code URL
  getUpiQrUrl(upiId, storeName, amount) {
    if (!upiId) return null;
    const cleanUpi = encodeURIComponent(upiId.trim());
    const cleanName = encodeURIComponent(storeName.trim());
    const upiUri = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${amount}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`;
  },

  // Render HTML Thermal Receipt (58mm/80mm style)
  generateThermalReceiptHtml(order, settings) {
    const currency = settings.currency || '₹';
    const qrUrl = this.getUpiQrUrl(settings.upiId, settings.storeName, order.totals.grandTotal);
    const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const itemRows = order.items.map(item => `
      <tr class="border-b border-gray-100">
        <td class="text-left font-semibold py-1.5 align-top">
          <div class="text-gray-900">${item.name}</div>
          ${item.note ? `<div class="text-[10px] text-gray-500 italic mt-0.5 font-sans">👉 Note: ${item.note}</div>` : ''}
        </td>
        <td class="text-center py-1.5 align-top font-mono font-bold">${item.quantity}</td>
        <td class="text-right py-1.5 align-top font-mono text-gray-600">${currency}${item.price.toFixed(2)}</td>
        <td class="text-right py-1.5 align-top font-mono font-bold text-gray-900">${currency}${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <div id="printable-receipt" class="thermal-receipt bg-white text-gray-900 p-5 font-mono text-xs max-w-sm mx-auto shadow-xl border border-gray-200 rounded-sm select-all">
        <!-- Store Brand Header -->
        <div class="text-center pb-3 border-b-2 border-dashed border-gray-400">
          <div class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-600 text-white font-black text-sm mb-1.5">
            QB
          </div>
          <h2 class="text-base font-black tracking-wider uppercase text-gray-900">${settings.storeName}</h2>
          ${settings.tagline ? `<p class="text-[11px] text-gray-600 font-sans mt-0.5">${settings.tagline}</p>` : ''}
          ${settings.address ? `<p class="text-[10px] text-gray-500 font-sans mt-0.5">${settings.address}</p>` : ''}
          <p class="text-[11px] text-gray-600 font-sans mt-1">Tel: <strong>${settings.phone || 'N/A'}</strong></p>
          ${settings.gstin ? `<p class="text-[10px] font-bold text-gray-800 mt-0.5">GSTIN: ${settings.gstin}</p>` : ''}
        </div>

        <!-- Order Meta Details -->
        <div class="py-2.5 border-b border-dashed border-gray-300 text-[11px] space-y-1">
          <div class="flex justify-between items-center">
            <span class="text-gray-500">BILL NO: <strong>#${order.billNumber}</strong></span>
            <span class="bg-gray-900 text-white px-2 py-0.5 rounded font-black text-xs">TOKEN #${order.tokenNumber}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">DATE: ${formattedDate}</span>
            <span class="font-bold text-red-600">${order.orderType || 'Dine-In'}</span>
          </div>
          ${order.customerName ? `
            <div class="pt-1 border-t border-dotted border-gray-200 flex justify-between">
              <span class="text-gray-500">CUSTOMER:</span>
              <span class="font-semibold text-gray-800 truncate max-w-[180px]">${order.customerName} ${order.customerPhone ? `(${order.customerPhone})` : ''}</span>
            </div>
          ` : ''}
        </div>

        <!-- Items Table -->
        <table class="w-full text-xs my-2.5 border-b-2 border-dashed border-gray-400">
          <thead>
            <tr class="border-b border-gray-300 text-[10px] text-gray-500 font-bold uppercase tracking-wider text-left">
              <th class="py-1">ITEM</th>
              <th class="py-1 text-center">QTY</th>
              <th class="py-1 text-right">RATE</th>
              <th class="py-1 text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <!-- Calculations Breakdown -->
        <div class="text-[11px] space-y-1 pb-2.5 border-b border-dashed border-gray-300">
          <div class="flex justify-between">
            <span class="text-gray-600">Subtotal (${order.totals.totalItemsCount} items):</span>
            <span class="font-bold font-mono">${currency}${order.totals.subtotal.toFixed(2)}</span>
          </div>

          ${order.totals.discountAmount > 0 ? `
            <div class="flex justify-between text-emerald-700 font-medium">
              <span>Discount (${order.totals.discountType === 'percent' ? `${order.totals.discountValue}%` : 'Flat'}):</span>
              <span class="font-mono">-${currency}${order.totals.discountAmount.toFixed(2)}</span>
            </div>
          ` : ''}

          ${order.totals.taxAmount > 0 ? `
            <div class="flex justify-between text-gray-600">
              <span>CGST (${(order.totals.taxRate / 2).toFixed(1)}%):</span>
              <span class="font-mono">+${currency}${order.totals.cgstAmount.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-gray-600">
              <span>SGST (${(order.totals.taxRate / 2).toFixed(1)}%):</span>
              <span class="font-mono">+${currency}${order.totals.sgstAmount.toFixed(2)}</span>
            </div>
          ` : ''}

          ${order.totals.serviceAmount > 0 ? `
            <div class="flex justify-between text-gray-600">
              <span>Service Charge (${order.totals.serviceRate}%):</span>
              <span class="font-mono">+${currency}${order.totals.serviceAmount.toFixed(2)}</span>
            </div>
          ` : ''}

          ${Math.abs(order.totals.roundOff) > 0 ? `
            <div class="flex justify-between text-gray-500 text-[10px]">
              <span>Round Off:</span>
              <span class="font-mono">${order.totals.roundOff > 0 ? '+' : ''}${currency}${order.totals.roundOff.toFixed(2)}</span>
            </div>
          ` : ''}
        </div>

        <!-- Grand Total Block -->
        <div class="py-2.5 border-b-2 border-dashed border-gray-800 flex justify-between items-baseline bg-gray-50 px-2 rounded my-1">
          <span class="text-xs font-black uppercase tracking-wider text-gray-900">GRAND TOTAL:</span>
          <span class="text-lg font-black font-mono text-gray-900">${currency}${order.totals.grandTotal.toFixed(2)}</span>
        </div>

        <!-- Payment Info -->
        <div class="py-2 text-[11px] border-b border-dashed border-gray-300 space-y-1">
          <div class="flex justify-between items-center">
            <span>Payment Mode:</span>
            <span class="font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              ${order.paymentMethod || 'CASH'} - PAID ✅
            </span>
          </div>
          ${order.totals.cashTendered > 0 ? `
            <div class="flex justify-between text-gray-600 text-[10px]">
              <span>Cash Received:</span>
              <span class="font-mono font-bold">${currency}${order.totals.cashTendered.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-emerald-700 font-bold text-[10px]">
              <span>Change Returned:</span>
              <span class="font-mono">${currency}${order.totals.changeAmount.toFixed(2)}</span>
            </div>
          ` : ''}
        </div>

        ${qrUrl && order.paymentMethod === 'upi' ? `
          <!-- UPI Payment QR Code -->
          <div class="py-3 text-center border-b border-dashed border-gray-300">
            <p class="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Scan to Verify / Pay via UPI</p>
            <div class="p-2 inline-block bg-white rounded-lg border border-gray-200 shadow-xs">
              <img src="${qrUrl}" alt="UPI QR" class="w-28 h-28 mx-auto" />
            </div>
            <p class="text-[10px] font-mono text-gray-600 mt-1">${settings.upiId}</p>
          </div>
        ` : ''}

        <!-- Barcode representation -->
        <div class="py-2.5 text-center border-b border-dashed border-gray-300">
          <div class="font-mono tracking-widest text-[16px] text-gray-800 select-none">
            ||| | |||| | ||| || |||| | || | |||
          </div>
          <p class="text-[9px] text-gray-400 font-mono mt-0.5">*QB-${order.billNumber}*</p>
        </div>

        <!-- Footer Note -->
        <div class="pt-3 text-center text-[10px] text-gray-500 font-sans space-y-1">
          <p class="font-bold text-gray-700">${settings.receiptFooter || 'Thank you for your visit!'}</p>
          <p class="text-[9px] text-gray-400">Powered by QuickBite POS • Developed by <strong>ATHIP, AADHIL, KIRUBA, MOUSIK, KAMESH</strong></p>
        </div>
      </div>
    `;
  },

  // Generate Kitchen Order Token (KOT)
  generateKotHtml(order, settings) {
    const formattedTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const itemRows = order.items.map(item => `
      <tr class="border-b-2 border-gray-200">
        <td class="py-2 text-2xl font-black font-mono w-14 align-top text-gray-900">${item.quantity}x</td>
        <td class="py-2 text-sm font-bold text-gray-900 align-top">
          <div class="leading-snug">${item.name}</div>
          ${item.note ? `
            <div class="text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded font-bold mt-1 inline-block border border-amber-300 font-sans">
              ⚠️ ${item.note}
            </div>
          ` : ''}
        </td>
      </tr>
    `).join('');

    return `
      <div id="printable-kot" class="kot-slip bg-white text-gray-900 p-5 font-mono text-sm max-w-sm mx-auto shadow-xl border-2 border-gray-900 rounded-sm">
        <div class="text-center pb-2 border-b-4 border-black">
          <span class="bg-black text-white text-[11px] font-black uppercase px-2 py-0.5 rounded tracking-widest">KITCHEN SLIP</span>
          <h1 class="text-xl font-black uppercase tracking-wider mt-1">${settings.storeName}</h1>
        </div>

        <div class="py-3 border-b-2 border-black flex justify-between items-center bg-gray-50 px-2 rounded my-1.5">
          <div>
            <div class="text-[10px] font-bold text-gray-500 uppercase">KITCHEN TOKEN</div>
            <div class="text-4xl font-black text-gray-900">#${order.tokenNumber}</div>
          </div>
          <div class="text-right">
            <div class="text-[10px] font-bold text-gray-500 uppercase">ORDER / TABLE</div>
            <div class="text-base font-black bg-black text-white px-2.5 py-1 rounded tracking-wide">${order.orderType}</div>
          </div>
        </div>

        <div class="text-[11px] py-1.5 text-gray-600 border-b border-gray-300 flex justify-between font-bold">
          <span>TIME: ${formattedTime}</span>
          <span>BILL: #${order.billNumber}</span>
        </div>

        <table class="w-full my-3">
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="pt-3 border-t-2 border-black text-center text-xs font-bold text-gray-700">
          Total Items: <span class="text-base font-black text-black">${order.totals.totalItemsCount}</span> | Kitchen Chef Copy
        </div>
      </div>
    `;
  },

  // WhatsApp Bill Formatter & Link Generator
  generateWhatsAppUrl(order, settings) {
    const currency = settings.currency || '₹';
    let msg = `🍽️ *${settings.storeName.toUpperCase()}*\n`;
    if (settings.tagline) msg += `_${settings.tagline}_\n`;
    if (settings.address) msg += `📍 ${settings.address}\n`;
    if (settings.phone) msg += `📞 ${settings.phone}\n`;
    msg += `\n🧾 *INVOICE: #${order.billNumber}*\n`;
    msg += `🎫 *TOKEN: #${order.tokenNumber}* | ${order.orderType}\n`;
    msg += `🗓️ ${new Date(order.createdAt).toLocaleString()}\n`;
    if (order.customerName) msg += `👤 Customer: *${order.customerName}*\n`;
    msg += `--------------------------------\n`;

    order.items.forEach(item => {
      msg += `▪️ ${item.quantity}x ${item.name} = ${currency}${(item.price * item.quantity).toFixed(2)}\n`;
      if (item.note) msg += `   _(Note: ${item.note})_\n`;
    });

    msg += `--------------------------------\n`;
    msg += `Subtotal: ${currency}${order.totals.subtotal.toFixed(2)}\n`;

    if (order.totals.discountAmount > 0) {
      msg += `Discount (${order.totals.discountType === 'percent' ? `${order.totals.discountValue}%` : 'Flat'}): -${currency}${order.totals.discountAmount.toFixed(2)}\n`;
    }
    if (order.totals.taxAmount > 0) {
      msg += `GST (${order.totals.taxRate}%): +${currency}${order.totals.taxAmount.toFixed(2)}\n`;
    }
    if (order.totals.serviceAmount > 0) {
      msg += `Service Charge: +${currency}${order.totals.serviceAmount.toFixed(2)}\n`;
    }
    msg += `*GRAND TOTAL: ${currency}${order.totals.grandTotal.toFixed(2)}*\n`;
    msg += `Payment Mode: ${order.paymentMethod.toUpperCase()} (PAID ✅)\n\n`;
    msg += `${settings.receiptFooter || 'Thank you for your visit! 😊'}\n\n_Powered by QuickBite POS_\n*Developed by ATHIP, AADHIL, KIRUBA, MOUSIK, KAMESH*`;

    const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(msg);

    if (cleanPhone.length >= 10) {
      const countryCode = cleanPhone.length === 10 ? '91' : '';
      return `https://wa.me/${countryCode}${cleanPhone}?text=${encodedMsg}`;
    } else {
      return `https://api.whatsapp.com/send?text=${encodedMsg}`;
    }
  }
};
