const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'quickbite.json');
const DEFAULTS = { orders: [], menu: [], settings: {} };
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

function readDatabase() {
  try { return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) }; }
  catch (_) { return { ...DEFAULTS }; }
}
function writeDatabase(database) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temporary = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(database, null, 2));
  fs.renameSync(temporary, DATA_FILE);
}
function sendJson(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}
function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''; request.on('data', chunk => { body += chunk; if (body.length > 2_000_000) reject(new Error('Request body too large')); });
    request.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (_) { reject(new Error('Request body must be valid JSON')); } });
    request.on('error', reject);
  });
}
function serveStatic(request, response) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname); }
  catch (_) { response.writeHead(400); return response.end('Bad request'); }
  if (pathname === '/') pathname = '/index.html';
  const resolved = path.resolve(ROOT, `.${pathname}`);
  if (!resolved.startsWith(`${ROOT}${path.sep}`) && resolved !== ROOT) { response.writeHead(403); return response.end('Forbidden'); }
  fs.stat(resolved, (error, stats) => {
    if (error || !stats.isFile()) { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return response.end('Not found'); }
    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(resolved).toLowerCase()] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    fs.createReadStream(resolved).pipe(response);
  });
}

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname;
  try {
    let db = readDatabase();
    if (request.method === 'GET' && pathname === '/api/health') return sendJson(response, 200, { ok: true, service: 'QuickBite POS API', timestamp: new Date().toISOString() });
    if (request.method === 'GET' && pathname === '/api/orders') return sendJson(response, 200, db.orders);
    if (request.method === 'GET' && pathname === '/api/menu') return sendJson(response, 200, db.menu);
    if (request.method === 'GET' && pathname === '/api/settings') return sendJson(response, 200, db.settings);
    if (request.method === 'GET' && pathname === '/api/analytics') {
      const orders = db.orders.filter(order => order.status !== 'Cancelled');
      const today = new Date().toLocaleDateString();
      const todayOrders = orders.filter(order => new Date(order.createdAt).toLocaleDateString() === today);
      return sendJson(response, 200, { todayOrders: todayOrders.length, todayRevenue: todayOrders.reduce((sum, order) => sum + Number(order.totals?.grandTotal || 0), 0), allTimeOrders: orders.length, allTimeRevenue: orders.reduce((sum, order) => sum + Number(order.totals?.grandTotal || 0), 0) });
    }
    if (request.method === 'POST' && pathname === '/api/orders') {
      const order = await readBody(request);
      if (!order || !order.id || !Array.isArray(order.items)) return sendJson(response, 400, { error: 'Order must include an id and items array.' });
      db.orders = [order, ...db.orders.filter(item => item.id !== order.id)]; writeDatabase(db); return sendJson(response, 201, order);
    }
    if (request.method === 'POST' && pathname === '/api/orders/sync') {
      const orders = await readBody(request); if (!Array.isArray(orders)) return sendJson(response, 400, { error: 'Expected an array of orders.' });
      db.orders = orders; writeDatabase(db); return sendJson(response, 200, { ok: true, count: orders.length });
    }
    if (request.method === 'PATCH' && pathname.startsWith('/api/orders/')) {
      const id = decodeURIComponent(pathname.slice('/api/orders/'.length)); const update = await readBody(request);
      const order = db.orders.find(item => item.id === id); if (!order) return sendJson(response, 404, { error: 'Order not found.' });
      if (!['Preparing', 'Ready', 'Completed', 'Cancelled'].includes(update.status)) return sendJson(response, 400, { error: 'Invalid order status.' });
      order.status = update.status; writeDatabase(db); return sendJson(response, 200, order);
    }
    if (request.method === 'POST' && pathname === '/api/menu') {
      const menu = await readBody(request); if (!Array.isArray(menu)) return sendJson(response, 400, { error: 'Expected an array of menu items.' });
      db.menu = menu; writeDatabase(db); return sendJson(response, 200, { ok: true, count: menu.length });
    }
    if (request.method === 'POST' && pathname === '/api/settings') {
      const settings = await readBody(request); if (!settings || Array.isArray(settings) || typeof settings !== 'object') return sendJson(response, 400, { error: 'Expected a settings object.' });
      db.settings = settings; writeDatabase(db); return sendJson(response, 200, settings);
    }
    if (request.method === 'POST' && pathname === '/api/reset') { writeDatabase({ ...DEFAULTS }); return sendJson(response, 200, { ok: true }); }
    if (pathname.startsWith('/api/')) return sendJson(response, 404, { error: 'API route not found.' });
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405, { Allow: 'GET, HEAD' }); return response.end('Method not allowed'); }
    return serveStatic(request, response);
  } catch (error) {
    return sendJson(response, error.message === 'Request body must be valid JSON' ? 400 : 500, { error: error.message || 'Internal server error.' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`QuickBite website and API listening on http://localhost:${PORT}`);
  if (HOST === '0.0.0.0') {
    const addresses = Object.values(os.networkInterfaces()).flat().filter(address => address && address.family === 'IPv4' && !address.internal);
    addresses.forEach(address => console.log(`On your Wi-Fi: http://${address.address}:${PORT}`));
  }
});

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
