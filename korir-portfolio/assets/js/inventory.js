/* ==========================================================================
   INDULGE ESSENTIALS STORE — Inventory, POS & Reporting (client-side MVP)
   ========================================================================== */

/* ---------- constants ---------- */
var CATEGORIES = ['Clothing','Accessories','Personal Care','Home Goods','Wellness'];
var STORAGE_KEYS = { PRODUCTS:'indulge_products', ORDERS:'indulge_orders', SETTINGS:'indulge_settings', CART:'indulge_cart', SESSION:'indulge_session', THEME:'indulge_theme' };

/* ---------- icon set (feather/lucide-style outline icons) ---------- */
var ICONS = {
  package:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  cart:'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  layers:'<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  tag:'<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  search:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  minus:'<line x1="5" y1="12" x2="19" y2="12"/>',
  plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  x:'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  check:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  alert:'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  edit:'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  chevronDown:'<polyline points="6 9 12 15 18 9"/>',
  logOut:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  moon:'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  sun:'<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  star:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  pieChart:'<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
  menu:'<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  creditCard:'<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  shirt:'<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  droplet:'<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
  coffee:'<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
  wind:'<path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>',
  shoppingBag:'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  leaf:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  sparkle:'<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/>'
};
var PRODUCT_ICON_MAP = { p1:'shirt', p2:'droplet', p3:'sparkle', p4:'coffee', p5:'wind', p6:'shoppingBag', p7:'sun', p8:'leaf' };
function icon(name, size){
  size = size || 18;
  var inner = ICONS[name] || ICONS.package;
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;" aria-hidden="true">'+inner+'</svg>';
}

/* ---------- application state ---------- */
var state = {
  products: [], orders: [], settings: null, cart: [], session: null, theme: 'light',
  view: 'products', productCategoryFilter: 'All Products', productSearch: '', inventorySearch: '',
  reportRange: { start:'', end:'' }, loginTab: 'admin', loginError:'',
  mobileMenuOpen:false, userMenuOpen:false, modal:null
};
var salesChartInstance = null, categoryChartInstance = null;

/* ---------- utility functions ---------- */
function escapeHtml(str){
  if (str === undefined || str === null) return '';
  return String(str).replace(/[&<>"']/g, function(m){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m];
  });
}
function uid(prefix){ return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function money(n){ return '$' + (Number(n)||0).toFixed(2); }
function applyTheme(theme){ document.documentElement.setAttribute('data-theme', theme || 'light'); }
function defaultSettings(){ return { lowStockThreshold:5, notifications:true, backupFrequency:'Daily' }; }
function hexToRgba(hex, alpha){
  hex = (hex||'').replace('#','').trim();
  if (hex.length !== 6) return 'rgba(79,70,229,'+alpha+')';
  var bigint = parseInt(hex,16), r=(bigint>>16)&255, g=(bigint>>8)&255, b=bigint&255;
  return 'rgba('+r+','+g+','+b+','+alpha+')';
}
function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

/* ---------- persistent storage (window.storage) with safe fallbacks ---------- */
function hasStorage(){ return typeof window !== 'undefined' && !!window.storage; }
async function safeGet(key, shared, fallback){
  if (!hasStorage()) return fallback;
  try{
    var result = await window.storage.get(key, shared);
    if (result && result.value !== undefined && result.value !== null){
      return JSON.parse(result.value);
    }
    return fallback;
  }catch(e){ return fallback; }
}
async function safeSet(key, value, shared){
  if (!hasStorage()) return false;
  try{
    var result = await window.storage.set(key, JSON.stringify(value), shared);
    return !!result;
  }catch(e){ console.error('storage set failed for', key, e); return false; }
}

/* ---------- seed / demo data ---------- */
function seedProducts(){
  return [
    { id:'p1', name:'Organic Cotton T-Shirt', category:'Clothing', price:24.99, stock:15 },
    { id:'p2', name:'Stainless Steel Water Bottle', category:'Accessories', price:19.99, stock:8 },
    { id:'p3', name:'Natural Bamboo Toothbrush', category:'Personal Care', price:4.99, stock:25 },
    { id:'p4', name:'Handmade Ceramic Mug', category:'Home Goods', price:16.99, stock:12 },
    { id:'p5', name:'Essential Oil Diffuser', category:'Wellness', price:29.99, stock:6 },
    { id:'p6', name:'Reusable Shopping Bag', category:'Accessories', price:9.99, stock:30 },
    { id:'p7', name:'Himalayan Salt Lamp', category:'Home Goods', price:22.99, stock:4 },
    { id:'p8', name:'Organic Lavender Soap', category:'Personal Care', price:7.99, stock:20 }
  ];
}
function seedOrders(products){
  var byId = {};
  products.forEach(function(p){ byId[p.id] = p; });
  var qtyRecipes = [
    { p1:25, p2:20, p3:60, p4:22, p5:18, p6:40, p7:14, p8:30 },
    { p1:30, p2:24, p3:70, p4:26, p5:22, p6:46, p7:16, p8:35 },
    { p1:26, p2:20, p3:62, p4:22, p5:19, p6:40, p7:13, p8:30 },
    { p1:38, p2:30, p3:85, p4:34, p5:28, p6:55, p7:20, p8:42 },
    { p1:35, p2:28, p3:80, p4:32, p5:26, p6:52, p7:18, p8:40 },
    { p1:42, p2:34, p3:95, p4:38, p5:32, p6:60, p7:23, p8:46 }
  ];
  var now = new Date();
  var orders = [];
  for (var i=0; i<qtyRecipes.length; i++){
    var monthsAgo = qtyRecipes.length - i;
    var d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 12);
    var dateStr = d.toISOString().slice(0,10);
    var items = [];
    Object.keys(qtyRecipes[i]).forEach(function(pid){
      var p = byId[pid];
      if (!p) return;
      var qty = qtyRecipes[i][pid];
      items.push({ productId:pid, name:p.name, category:p.category, price:p.price, qty:qty, lineTotal:+(p.price*qty).toFixed(2) });
    });
    var total = +items.reduce(function(s,it){ return s + it.lineTotal; }, 0).toFixed(2);
    orders.push({ id:'seed-order-'+(i+1), date:dateStr, items:items, total:total });
  }
  return orders;
}

/* ---------- toasts ---------- */
function showToast(message, type){
  type = type || 'success';
  var container = document.getElementById('toast-container');
  if (!container) return;
  var el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = icon(type==='success' ? 'check' : 'alert', 18) + '<span>' + escapeHtml(message) + '</span>';
  container.appendChild(el);
  setTimeout(function(){
    el.style.opacity = '0';
    el.style.transform = 'translateX(24px)';
    setTimeout(function(){ el.remove(); }, 220);
  }, 3200);
}

/* ==========================================================================
   LOGIN VIEW
   ========================================================================== */
function buildLoginHTML(){
  var tab = state.loginTab;
  var hint = tab === 'admin'
    ? 'Credentials: <b>admin</b> / <b>admin123</b>'
    : 'Credentials: <b>staff</b> / <b>staff123</b>';
  return ''
  + '<div class="login-topbar">'
  +   '<div class="navbar-brand">' + logoBadge() + '<span>Indulge Essentials <span class="brand-word">Store</span></span></div>'
  +   '<div class="btn btn-outline btn-sm" style="pointer-events:none;">' + icon('package',15) + ' Inventory Management</div>'
  + '</div>'
  + '<div class="login-page">'
  +   '<div class="login-visual">'
  +     '<div class="login-visual-content">'
  +       '<div class="login-visual-badge">' + icon('package',26) + '</div>'
  +       '<h1>Everyday essentials,<br/>thoughtfully stocked.</h1>'
  +       '<p>One place to sell, restock, and understand how Indulge Essentials is really doing — built for the people running the floor, not just the spreadsheet.</p>'
  +       '<div class="chip-row">'
  +         '<div class="floating-chip">' + icon('leaf',15) + ' Personal Care</div>'
  +         '<div class="floating-chip">' + icon('wind',15) + ' Wellness</div>'
  +         '<div class="floating-chip">' + icon('shirt',15) + ' Clothing</div>'
  +         '<div class="floating-chip">' + icon('coffee',15) + ' Home Goods</div>'
  +       '</div>'
  +     '</div>'
  +   '</div>'
  +   '<div class="login-form-side">'
  +     '<div class="login-form-box">'
  +       '<div class="login-form-eyebrow">Inventory Management</div>'
  +       '<h2>Welcome back</h2>'
  +       '<p>Access for admin and staff only.</p>'
  +       '<div class="login-tabs" role="tablist">'
  +         '<button type="button" role="tab" aria-selected="' + (tab==='admin') + '" class="login-tab ' + (tab==='admin'?'active':'') + '" onclick="setLoginTab(\'admin\')">Admin</button>'
  +         '<button type="button" role="tab" aria-selected="' + (tab==='staff') + '" class="login-tab ' + (tab==='staff'?'active':'') + '" onclick="setLoginTab(\'staff\')">Staff</button>'
  +       '</div>'
  +       (state.loginError ? '<div class="login-error">' + icon('alert',16) + '<span>' + escapeHtml(state.loginError) + '</span></div>' : '')
  +       '<form onsubmit="return handleLogin(event)">'
  +         '<div class="form-group">'
  +           '<label class="form-label" for="login-username">Username</label>'
  +           '<input class="form-input" id="login-username" placeholder="Enter your username" autocomplete="username" required />'
  +         '</div>'
  +         '<div class="form-group">'
  +           '<label class="form-label" for="login-password">Password</label>'
  +           '<input class="form-input" id="login-password" type="password" placeholder="Enter your password" autocomplete="current-password" required />'
  +         '</div>'
  +         '<div class="login-hint">' + hint + '</div>'
  +         '<button class="btn btn-primary btn-block" type="submit">Login</button>'
  +       '</form>'
  +       '<div class="login-footer-note">Contact admin for account assistance</div>'
  +     '</div>'
  +   '</div>'
  + '</div>';
}
function logoBadge(){ return '<span class="logo-badge">' + icon('package',18) + '</span>'; }
function setLoginTab(tab){ state.loginTab = tab; state.loginError=''; renderView(); }
async function handleLogin(e){
  e.preventDefault();
  var u = document.getElementById('login-username').value.trim();
  var p = document.getElementById('login-password').value;
  var tab = state.loginTab;
  var ok=false, role=tab, fullName='', email='';
  if (tab==='admin' && u.toLowerCase()==='admin' && p==='admin123'){ ok=true; fullName='Admin User'; email='admin@stockmaster.com'; }
  if (tab==='staff' && u.toLowerCase()==='staff' && p==='staff123'){ ok=true; fullName='Staff Member'; email='staff@stockmaster.com'; }
  if (!ok){ state.loginError='Incorrect username or password for this role.'; renderView(); return false; }
  state.loginError='';
  state.session = { role:role, username:u, fullName:fullName, email:email };
  state.view = 'products';
  await safeSet(STORAGE_KEYS.SESSION, state.session, false);
  showToast('Welcome back, ' + fullName + '!', 'success');
  renderView();
  return false;
}
async function handleLogout(){
  state.session = null; state.userMenuOpen = false; state.cart = [];
  await safeSet(STORAGE_KEYS.SESSION, null, false);
  renderView();
}

/* ==========================================================================
   NAVBAR
   ========================================================================== */
function buildNavHTML(){
  var role = state.session.role;
  var allLinks = [
    { key:'products', label:'Products', roles:['admin','staff'] },
    { key:'inventory', label:'Inventory', roles:['admin','staff'] },
    { key:'reports', label:'Reports', roles:['admin'] },
    { key:'settings', label:'Settings', roles:['admin'] }
  ];
  var links = allLinks.filter(function(l){ return l.roles.indexOf(role) !== -1; });
  var linkHtml = links.map(function(l){
    return '<button type="button" class="nav-link ' + (state.view===l.key?'active':'') + '" onclick="goToView(\'' + l.key + '\')">' + escapeHtml(l.label) + '</button>';
  }).join('');

  var dropdownHtml = '';
  if (state.userMenuOpen){
    dropdownHtml = '<button type="button" class="user-backdrop" aria-hidden="true" onclick="toggleUserMenu()" tabindex="-1"></button>'
      + '<div class="user-dropdown">'
      +   '<div class="user-dropdown-info">'
      +     '<div class="user-dropdown-name">' + escapeHtml(state.session.fullName) + '</div>'
      +     '<div class="user-dropdown-email">' + escapeHtml(state.session.email) + '</div>'
      +     '<span class="user-dropdown-role">' + escapeHtml(role) + '</span>'
      +   '</div>'
      +   '<div class="user-dropdown-divider"></div>'
      +   '<button type="button" class="user-dropdown-item" onclick="handleLogout()">' + icon('logOut',15) + ' Log out</button>'
      + '</div>';
  }

  var html = '<div class="navbar">';
  html += '<div class="navbar-brand">' + logoBadge() + '<span>Indulge Essentials <span class="brand-word">Store</span></span></div>';
  html += '<div class="navbar-links ' + (state.mobileMenuOpen?'open':'') + '" id="navbar-links">' + linkHtml + '</div>';
  html += '<div class="navbar-right">';
  html +=   '<button type="button" class="icon-btn hamburger" aria-label="Toggle menu" onclick="toggleMobileMenu()">' + icon('menu',18) + '</button>';
  html +=   '<div class="user-menu">';
  html +=     '<button type="button" class="user-chip" onclick="toggleUserMenu()" aria-haspopup="true" aria-expanded="' + state.userMenuOpen + '">' + icon('user',15) + '<span>' + escapeHtml(state.session.username) + '</span>' + icon('chevronDown',13) + '</button>';
  html +=     dropdownHtml;
  html +=   '</div>';
  html +=   '<button type="button" class="icon-btn" aria-label="Toggle dark mode" onclick="toggleQuickTheme()">' + icon(state.theme==='dark'?'sun':'moon',17) + '</button>';
  html += '</div>';
  html += '</div>';
  return html;
}
function goToView(view){ state.view = view; state.mobileMenuOpen=false; state.userMenuOpen=false; renderView(); }
function toggleMobileMenu(){ state.mobileMenuOpen = !state.mobileMenuOpen; renderView(); }
function toggleUserMenu(){ state.userMenuOpen = !state.userMenuOpen; renderView(); }
async function toggleQuickTheme(){
  state.theme = state.theme==='dark' ? 'light' : 'dark';
  applyTheme(state.theme);
  await safeSet(STORAGE_KEYS.THEME, state.theme, false);
  renderView();
}
async function setTheme(name){
  state.theme = name;
  applyTheme(name);
  await safeSet(STORAGE_KEYS.THEME, name, false);
  renderView();
}

/* ==========================================================================
   PRODUCTS / POS VIEW
   ========================================================================== */
function getFilteredProducts(){
  var q = state.productSearch.toLowerCase();
  return state.products.filter(function(p){
    var catMatch = state.productCategoryFilter === 'All Products' || p.category === state.productCategoryFilter;
    var searchMatch = p.name.toLowerCase().indexOf(q) !== -1;
    return catMatch && searchMatch;
  });
}
function productIconName(p){ return PRODUCT_ICON_MAP[p.id] || 'package'; }

function buildProductGridHTML(){
  var list = getFilteredProducts();
  if (list.length === 0){
    return '<div class="empty-state" style="grid-column:1/-1;">' + icon('search',26) + '<div style="margin-top:10px;">No products match your search.</div></div>';
  }
  var html = '';
  list.forEach(function(p){
    var inCart = state.cart.find(function(c){ return c.productId === p.id; });
    var cartQty = inCart ? inCart.qty : 0;
    var atMax = cartQty >= p.stock;
    html += '<div class="product-card">';
    html +=   '<div class="product-thumb">' + icon(productIconName(p), 38) + '</div>';
    html +=   '<div class="product-info">';
    html +=     '<div class="product-name">' + escapeHtml(p.name) + '</div>';
    html +=     '<div class="product-cat">' + escapeHtml(p.category) + '</div>';
    html +=     '<div class="product-footer">';
    html +=       '<span class="product-price">' + money(p.price) + '</span>';
    if (p.stock === 0){
      html += '<button type="button" class="btn btn-outline btn-sm" disabled>Out of Stock</button>';
    } else {
      html += '<button type="button" class="btn btn-primary btn-sm" onclick="addToCart(\'' + p.id + '\')" ' + (atMax ? 'disabled' : '') + '>' + icon('cart',14) + ' Add</button>';
    }
    html +=     '</div>';
    html +=   '</div>';
    html += '</div>';
  });
  return html;
}

function buildCartPanelHTML(){
  var items = state.cart.map(function(c){
    var p = state.products.find(function(pp){ return pp.id === c.productId; });
    if (!p) return null;
    return { productId:c.productId, qty:c.qty, product:p, lineTotal: p.price * c.qty };
  }).filter(Boolean);
  var total = items.reduce(function(s,i){ return s + i.lineTotal; }, 0);

  var html = '<div class="cart-panel">';
  html += '<h3 style="color:var(--primary);margin-bottom:16px;font-size:1.05rem;">' + icon('cart',18) + ' Your Cart</h3>';
  if (items.length === 0){
    html += '<div class="cart-empty">Your cart is empty</div>';
  } else {
    items.forEach(function(i){
      html += '<div class="cart-item">';
      html +=   '<div style="flex:1;min-width:0;">';
      html +=     '<div class="cart-item-name">' + escapeHtml(i.product.name) + '</div>';
      html +=     '<div class="cart-item-price">' + money(i.product.price) + ' each</div>';
      html +=   '</div>';
      html +=   '<div class="qty-stepper">';
      html +=     '<button type="button" aria-label="Decrease quantity" onclick="changeCartQty(\'' + i.productId + '\',-1)">' + icon('minus',12) + '</button>';
      html +=     '<span class="qty-val">' + i.qty + '</span>';
      html +=     '<button type="button" aria-label="Increase quantity" onclick="changeCartQty(\'' + i.productId + '\',1)" ' + (i.qty >= i.product.stock ? 'disabled' : '') + '>' + icon('plus',12) + '</button>';
      html +=   '</div>';
      html +=   '<button type="button" class="cart-remove-btn" aria-label="Remove from cart" onclick="removeFromCart(\'' + i.productId + '\')">' + icon('x',13) + '</button>';
      html += '</div>';
    });
  }
  html += '<div class="cart-total-row"><span>Total:</span><span>' + money(total) + '</span></div>';
  html += '<button type="button" class="btn btn-primary btn-block" ' + (items.length===0?'disabled':'') + ' onclick="openCheckoutModal()">' + icon('creditCard',16) + ' Proceed to Payment</button>';
  html += '</div>';
  return html;
}

function buildProductsHTML(){
  var categories = ['All Products'].concat(CATEGORIES);
  var catListHtml = categories.map(function(c){
    var iconName = c === 'All Products' ? 'layers' : 'tag';
    return '<button type="button" class="category-item ' + (state.productCategoryFilter===c?'active':'') + '" onclick="setCategory(\'' + c + '\')">' + icon(iconName,15) + ' ' + escapeHtml(c) + '</button>';
  }).join('');

  var html = '<div class="products-toolbar">';
  html +=   '<div class="input-icon-wrap" style="max-width:420px;flex:1;">' + icon('search',17) + '<input class="form-input" placeholder="Search products..." value="' + escapeHtml(state.productSearch) + '" oninput="onProductSearchInput(this.value)" aria-label="Search products" /></div>';
  html += '</div>';
  html += '<div class="products-layout">';
  html +=   '<div class="card" style="padding:16px;">';
  html +=     '<div style="font-weight:800;margin-bottom:12px;font-size:.92rem;">Categories</div>';
  html +=     '<div class="category-list">' + catListHtml + '</div>';
  html +=   '</div>';
  html +=   '<div>';
  html +=     '<h2 class="section-title" style="font-size:1.25rem;">Available Products</h2>';
  html +=     '<div class="product-grid" id="product-grid">' + buildProductGridHTML() + '</div>';
  html +=   '</div>';
  html +=   buildCartPanelHTML();
  html += '</div>';
  return html;
}

function setCategory(c){ state.productCategoryFilter = c; renderView(); }
function onProductSearchInput(val){
  state.productSearch = val;
  var grid = document.getElementById('product-grid');
  if (grid) grid.innerHTML = buildProductGridHTML();
}

async function addToCart(productId){
  var p = state.products.find(function(x){ return x.id === productId; });
  if (!p) return;
  var existing = state.cart.find(function(c){ return c.productId === productId; });
  var currentQty = existing ? existing.qty : 0;
  if (currentQty >= p.stock){ showToast('Not enough stock available', 'error'); return; }
  if (existing) existing.qty += 1;
  else state.cart.push({ productId:productId, qty:1 });
  await safeSet(STORAGE_KEYS.CART, state.cart, false);
  showToast(p.name + ' added to cart', 'success');
  renderView();
}
async function changeCartQty(productId, delta){
  var item = state.cart.find(function(c){ return c.productId === productId; });
  var p = state.products.find(function(x){ return x.id === productId; });
  if (!item || !p) return;
  item.qty += delta;
  if (item.qty <= 0){ state.cart = state.cart.filter(function(c){ return c.productId !== productId; }); }
  else if (item.qty > p.stock){ item.qty = p.stock; }
  await safeSet(STORAGE_KEYS.CART, state.cart, false);
  renderView();
}
async function removeFromCart(productId){
  state.cart = state.cart.filter(function(c){ return c.productId !== productId; });
  await safeSet(STORAGE_KEYS.CART, state.cart, false);
  renderView();
}

/* ---- checkout modal ---- */
function openCheckoutModal(){
  if (state.cart.length === 0) return;
  state.modal = { type:'checkout' };
  renderView();
}
function buildCheckoutModalHTML(){
  var items = state.cart.map(function(c){
    var p = state.products.find(function(pp){ return pp.id === c.productId; });
    return { qty:c.qty, product:p, lineTotal: p.price * c.qty };
  });
  var total = items.reduce(function(s,i){ return s + i.lineTotal; }, 0);

  var html = '<div class="modal-overlay" onclick="if(event.target===this) closeModal()">';
  html +=   '<div class="modal-box" role="dialog" aria-modal="true" aria-label="Confirm order">';
  html +=     '<div class="modal-header"><h3>Confirm Order</h3><button type="button" class="modal-close" aria-label="Close" onclick="closeModal()">' + icon('x',20) + '</button></div>';
  items.forEach(function(i){
    html += '<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:.88rem;"><span>' + escapeHtml(i.product.name) + ' &times; ' + i.qty + '</span><span>' + money(i.lineTotal) + '</span></div>';
  });
  html +=     '<div class="divider"></div>';
  html +=     '<div style="display:flex;justify-content:space-between;font-weight:800;font-size:1.1rem;margin-bottom:22px;"><span>Total</span><span>' + money(total) + '</span></div>';
  html +=     '<div style="display:flex;gap:10px;">';
  html +=       '<button type="button" class="btn btn-outline btn-block" onclick="closeModal()">Cancel</button>';
  html +=       '<button type="button" class="btn btn-primary btn-block" onclick="confirmCheckout()">' + icon('check',16) + ' Confirm Purchase</button>';
  html +=     '</div>';
  html +=   '</div>';
  html += '</div>';
  return html;
}
async function confirmCheckout(){
  var items = state.cart.map(function(c){
    var p = state.products.find(function(pp){ return pp.id === c.productId; });
    return { productId:p.id, name:p.name, category:p.category, price:p.price, qty:c.qty, lineTotal:+(p.price*c.qty).toFixed(2) };
  });
  var total = +items.reduce(function(s,i){ return s + i.lineTotal; }, 0).toFixed(2);
  items.forEach(function(i){
    var p = state.products.find(function(pp){ return pp.id === i.productId; });
    if (p) p.stock = Math.max(0, p.stock - i.qty);
  });
  var order = { id:uid('order'), date: todayISO(), items:items, total:total };
  state.orders.push(order);
  state.cart = [];
  state.modal = null;
  await safeSet(STORAGE_KEYS.PRODUCTS, state.products, true);
  await safeSet(STORAGE_KEYS.ORDERS, state.orders, true);
  await safeSet(STORAGE_KEYS.CART, state.cart, false);
  showToast('Order placed! Total ' + money(total), 'success');
  renderView();
}
function closeModal(){ state.modal = null; renderView(); }

/* ==========================================================================
   INVENTORY VIEW
   ========================================================================== */
function buildRestockAddPanelsHTML(isAdmin){
  var options = state.products.map(function(p){
    return '<option value="' + p.id + '">' + escapeHtml(p.name) + '</option>';
  }).join('');
  var categoryOptions = CATEGORIES.map(function(c){ return '<option value="' + escapeHtml(c) + '">'; }).join('');

  var html = '<div class="panels-grid ' + (isAdmin ? '' : 'single') + '">';
  html +=   '<div class="panel">';
  html +=     '<div class="panel-title">Restock Products</div>';
  html +=     '<div class="form-group"><label class="form-label" for="restock-product">Select Product</label>';
  html +=       '<select class="form-select" id="restock-product">' + options + '</select></div>';
  html +=     '<div class="form-group"><label class="form-label" for="restock-qty">Quantity to Add</label>';
  html +=       '<input class="form-input" type="number" min="1" value="10" id="restock-qty" /></div>';
  html +=     '<button type="button" class="btn btn-primary" onclick="handleRestock()">Restock Product</button>';
  html +=   '</div>';
  if (isAdmin){
    html += '<div class="panel">';
    html +=   '<div class="panel-title">Add New Product</div>';
    html +=   '<div class="form-group"><label class="form-label" for="new-prod-name">Product Name</label>';
    html +=     '<input class="form-input" id="new-prod-name" placeholder="Enter product name" /></div>';
    html +=   '<div class="form-group"><label class="form-label" for="new-prod-category">Category</label>';
    html +=     '<input class="form-input" id="new-prod-category" placeholder="Enter category" list="category-suggestions" />';
    html +=     '<datalist id="category-suggestions">' + categoryOptions + '</datalist></div>';
    html +=   '<div class="form-row">';
    html +=     '<div class="form-group"><label class="form-label" for="new-prod-price">Price ($)</label>';
    html +=       '<input class="form-input" type="number" min="0" step="0.01" placeholder="0.00" id="new-prod-price" /></div>';
    html +=     '<div class="form-group"><label class="form-label" for="new-prod-stock">Initial Stock</label>';
    html +=       '<input class="form-input" type="number" min="0" value="10" id="new-prod-stock" /></div>';
    html +=   '</div>';
    html +=   '<button type="button" class="btn btn-primary" onclick="handleAddProduct()">Add Product</button>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function buildInventoryTableHTML(){
  var isAdmin = state.session.role === 'admin';
  var q = state.inventorySearch.toLowerCase();
  var rows = state.products.filter(function(p){
    return p.name.toLowerCase().indexOf(q) !== -1 || p.category.toLowerCase().indexOf(q) !== -1;
  });
  var html = '<table class="data-table">';
  html += '<thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock Level</th><th>Status</th>' + (isAdmin ? '<th>Actions</th>' : '') + '</tr></thead>';
  html += '<tbody>';
  if (rows.length === 0){
    html += '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:36px;">No matching products.</td></tr>';
  } else {
    rows.forEach(function(p){
      var badge;
      if (p.stock === 0) badge = '<span class="badge badge-outofstock">Out of Stock</span>';
      else if (p.stock <= state.settings.lowStockThreshold) badge = '<span class="badge badge-lowstock">Low Stock (' + p.stock + ')</span>';
      else badge = '<span class="badge badge-instock">In Stock (' + p.stock + ')</span>';
      html += '<tr>';
      html +=   '<td style="font-weight:700;">' + escapeHtml(p.name) + '</td>';
      html +=   '<td>' + escapeHtml(p.category) + '</td>';
      html +=   '<td>' + money(p.price) + '</td>';
      html +=   '<td>' + p.stock + '</td>';
      html +=   '<td>' + badge + '</td>';
      if (isAdmin){
        html += '<td><div class="row-actions">';
        html +=   '<button type="button" class="edit-action" aria-label="Edit ' + escapeHtml(p.name) + '" onclick="openEditModal(\'' + p.id + '\')">' + icon('edit',16) + '</button>';
        html +=   '<button type="button" class="delete-action" aria-label="Delete ' + escapeHtml(p.name) + '" onclick="handleDeleteProduct(\'' + p.id + '\')">' + icon('trash',16) + '</button>';
        html += '</div></td>';
      }
      html += '</tr>';
    });
  }
  html += '</tbody></table>';
  return html;
}

function buildLowStockAlertsHTML(){
  var lowStock = state.products.filter(function(p){ return p.stock > 0 && p.stock <= state.settings.lowStockThreshold; });
  if (lowStock.length === 0) return '';
  var html = '<h2 class="section-title">Low Stock Alerts</h2><div style="margin-bottom:26px;">';
  lowStock.forEach(function(p){
    html += '<div class="alert-banner">';
    html +=   '<div class="alert-left">' + icon('alert',17) + ' <b>' + escapeHtml(p.name) + '</b>&nbsp;is low on stock (' + p.stock + ' left)</div>';
    html +=   '<button type="button" class="btn btn-orange btn-sm" onclick="quickRestock(\'' + p.id + '\')">Restock</button>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function buildInventoryHTML(){
  var isAdmin = state.session.role === 'admin';
  var html = '<h1 class="page-title">Inventory Management</h1>';
  if (isAdmin){
    html += '<div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">';
    html +=   '<button type="button" class="btn btn-primary" onclick="handleBackupNow()">' + icon('download',16) + ' Save Database</button>';
    html +=   '<button type="button" class="btn btn-orange" onclick="document.getElementById(\'inv-restore-input\').click()">' + icon('upload',16) + ' Load Database</button>';
    html +=   '<input type="file" id="inv-restore-input" accept="application/json" style="display:none;" onchange="handleRestoreFile(event)" />';
    html += '</div>';
  }
  html += buildRestockAddPanelsHTML(isAdmin);
  html += '<div class="input-icon-wrap" style="max-width:420px;margin-bottom:26px;">' + icon('search',17) + '<input class="form-input" placeholder="Search inventory..." value="' + escapeHtml(state.inventorySearch) + '" oninput="onInventorySearchInput(this.value)" aria-label="Search inventory" /></div>';
  html += buildLowStockAlertsHTML();
  html += '<h2 class="section-title">Current Inventory</h2>';
  html += '<div class="table-wrap" id="inventory-table-wrap">' + buildInventoryTableHTML() + '</div>';
  return html;
}

function onInventorySearchInput(val){
  state.inventorySearch = val;
  var wrap = document.getElementById('inventory-table-wrap');
  if (wrap) wrap.innerHTML = buildInventoryTableHTML();
}

async function handleRestock(){
  var sel = document.getElementById('restock-product');
  var qtyEl = document.getElementById('restock-qty');
  if (!sel || !qtyEl) return;
  var id = sel.value;
  var qty = parseInt(qtyEl.value, 10);
  if (!qty || qty <= 0){ showToast('Enter a valid quantity', 'error'); return; }
  var p = state.products.find(function(x){ return x.id === id; });
  if (!p) return;
  p.stock += qty;
  await safeSet(STORAGE_KEYS.PRODUCTS, state.products, true);
  showToast(p.name + ' restocked (+' + qty + ')', 'success');
  renderView();
}
function quickRestock(id){
  var sel = document.getElementById('restock-product');
  if (sel){ sel.value = id; }
  var qtyInput = document.getElementById('restock-qty');
  if (qtyInput){ qtyInput.focus(); qtyInput.select(); }
  var panel = sel ? sel.closest('.panel') : null;
  if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior:'smooth', block:'center' });
}
async function handleAddProduct(){
  var name = document.getElementById('new-prod-name').value.trim();
  var category = document.getElementById('new-prod-category').value.trim();
  var price = parseFloat(document.getElementById('new-prod-price').value);
  var stock = parseInt(document.getElementById('new-prod-stock').value, 10);
  if (!name || !category || isNaN(price) || price < 0 || isNaN(stock) || stock < 0){
    showToast('Please fill in all fields correctly', 'error'); return;
  }
  var product = { id: uid('p'), name:name, category:category, price:+price.toFixed(2), stock:stock };
  state.products.push(product);
  await safeSet(STORAGE_KEYS.PRODUCTS, state.products, true);
  showToast(name + ' added to inventory', 'success');
  renderView();
}

/* ---- edit product modal ---- */
function openEditModal(id){ state.modal = { type:'editProduct', productId:id }; renderView(); }
function buildEditModalHTML(){
  var p = state.products.find(function(x){ return x.id === state.modal.productId; });
  if (!p){ state.modal = null; return ''; }
  var categoryOptions = CATEGORIES.map(function(c){ return '<option value="' + escapeHtml(c) + '">'; }).join('');
  var html = '<div class="modal-overlay" onclick="if(event.target===this) closeModal()">';
  html +=   '<div class="modal-box" role="dialog" aria-modal="true" aria-label="Edit product">';
  html +=     '<div class="modal-header"><h3>Edit Product</h3><button type="button" class="modal-close" aria-label="Close" onclick="closeModal()">' + icon('x',20) + '</button></div>';
  html +=     '<div class="form-group"><label class="form-label" for="edit-name">Product Name</label><input class="form-input" id="edit-name" value="' + escapeHtml(p.name) + '" /></div>';
  html +=     '<div class="form-group"><label class="form-label" for="edit-category">Category</label><input class="form-input" id="edit-category" value="' + escapeHtml(p.category) + '" list="category-suggestions-edit" /><datalist id="category-suggestions-edit">' + categoryOptions + '</datalist></div>';
  html +=     '<div class="form-row">';
  html +=       '<div class="form-group"><label class="form-label" for="edit-price">Price ($)</label><input class="form-input" type="number" step="0.01" min="0" id="edit-price" value="' + p.price + '" /></div>';
  html +=       '<div class="form-group"><label class="form-label" for="edit-stock">Stock</label><input class="form-input" type="number" min="0" id="edit-stock" value="' + p.stock + '" /></div>';
  html +=     '</div>';
  html +=     '<div style="display:flex;gap:10px;margin-top:8px;">';
  html +=       '<button type="button" class="btn btn-outline btn-block" onclick="closeModal()">Cancel</button>';
  html +=       '<button type="button" class="btn btn-primary btn-block" onclick="saveEditProduct()">Save Changes</button>';
  html +=     '</div>';
  html +=   '</div>';
  html += '</div>';
  return html;
}
async function saveEditProduct(){
  var p = state.products.find(function(x){ return x.id === state.modal.productId; });
  if (!p) return;
  var name = document.getElementById('edit-name').value.trim();
  var category = document.getElementById('edit-category').value.trim();
  var price = parseFloat(document.getElementById('edit-price').value);
  var stock = parseInt(document.getElementById('edit-stock').value, 10);
  if (!name || !category || isNaN(price) || price < 0 || isNaN(stock) || stock < 0){
    showToast('Please fill in all fields correctly', 'error'); return;
  }
  p.name = name; p.category = category; p.price = +price.toFixed(2); p.stock = stock;
  state.modal = null;
  await safeSet(STORAGE_KEYS.PRODUCTS, state.products, true);
  showToast('Product updated', 'success');
  renderView();
}
async function handleDeleteProduct(id){
  var p = state.products.find(function(x){ return x.id === id; });
  if (!p) return;
  if (!confirm('Delete "' + p.name + '"? This cannot be undone.')) return;
  state.products = state.products.filter(function(x){ return x.id !== id; });
  state.cart = state.cart.filter(function(c){ return c.productId !== id; });
  await safeSet(STORAGE_KEYS.PRODUCTS, state.products, true);
  await safeSet(STORAGE_KEYS.CART, state.cart, false);
  showToast(p.name + ' deleted', 'success');
  renderView();
}

/* ==========================================================================
   REPORTS VIEW
   ========================================================================== */
function getFilteredOrders(){
  var start = state.reportRange.start, end = state.reportRange.end;
  return state.orders.filter(function(o){
    if (start && o.date < start) return false;
    if (end && o.date > end) return false;
    return true;
  });
}
function applyReportRange(){
  state.reportRange.start = document.getElementById('report-start').value;
  state.reportRange.end = document.getElementById('report-end').value;
  renderView();
}
function clearReportRange(){
  state.reportRange = { start:'', end:'' };
  renderView();
}
function exportCSV(){
  var filtered = getFilteredOrders();
  if (filtered.length === 0){ showToast('No orders to export for this range', 'error'); return; }
  var csv = 'Order ID,Date,Product,Category,Quantity,Unit Price,Line Total\n';
  filtered.forEach(function(o){
    o.items.forEach(function(i){
      var safeName = i.name.replace(/"/g, '""');
      csv += o.id + ',' + o.date + ',"' + safeName + '",' + i.category + ',' + i.qty + ',' + i.price.toFixed(2) + ',' + i.lineTotal.toFixed(2) + '\n';
    });
  });
  var blob = new Blob([csv], { type:'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'sales-report-' + todayISO() + '.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('CSV exported', 'success');
}

function buildReportsHTML(){
  var filtered = getFilteredOrders();
  var totalSales = filtered.reduce(function(s,o){ return s + o.total; }, 0);
  var itemsSold = filtered.reduce(function(s,o){ return s + o.items.reduce(function(s2,i){ return s2 + i.qty; }, 0); }, 0);
  var productTotals = {}, categoryTotals = {};
  filtered.forEach(function(o){
    o.items.forEach(function(i){
      productTotals[i.name] = (productTotals[i.name] || 0) + i.lineTotal;
      categoryTotals[i.category] = (categoryTotals[i.category] || 0) + i.lineTotal;
    });
  });
  var topProductEntry = Object.entries(productTotals).sort(function(a,b){ return b[1]-a[1]; })[0];
  var topCategoryEntry = Object.entries(categoryTotals).sort(function(a,b){ return b[1]-a[1]; })[0];

  var html = '<h1 class="page-title">Reports</h1>';
  html += '<div style="display:flex;gap:14px;align-items:end;flex-wrap:wrap;margin-bottom:26px;">';
  html +=   '<div class="form-group" style="margin:0;"><label class="form-label" for="report-start">Start Date</label><input class="form-input" type="date" id="report-start" value="' + state.reportRange.start + '" /></div>';
  html +=   '<div class="form-group" style="margin:0;"><label class="form-label" for="report-end">End Date</label><input class="form-input" type="date" id="report-end" value="' + state.reportRange.end + '" /></div>';
  html +=   '<button type="button" class="btn btn-primary" onclick="applyReportRange()">Apply</button>';
  html +=   '<button type="button" class="btn btn-outline" onclick="clearReportRange()">Reset</button>';
  html +=   '<button type="button" class="btn btn-cyan" onclick="exportCSV()">' + icon('download',16) + ' Export CSV</button>';
  html += '</div>';
  html += '<div class="stats-grid">';
  html +=   '<div class="stat-card"><div class="stat-icon" style="background:var(--primary-light);color:var(--primary);">' + icon('cart',20) + '</div><div class="stat-value">' + money(totalSales) + '</div><div class="stat-label">Total Sales</div></div>';
  html +=   '<div class="stat-card"><div class="stat-icon" style="background:rgba(6,182,212,.14);color:var(--cyan-dark);">' + icon('package',20) + '</div><div class="stat-value">' + itemsSold + '</div><div class="stat-label">Items Sold</div></div>';
  html +=   '<div class="stat-card"><div class="stat-icon" style="background:rgba(245,158,11,.14);color:var(--orange-dark);">' + icon('star',20) + '</div><div class="stat-value" style="font-size:1.1rem;">' + (topProductEntry ? escapeHtml(topProductEntry[0]) : '-') + '</div><div class="stat-label">Top Product</div></div>';
  html +=   '<div class="stat-card"><div class="stat-icon" style="background:rgba(236,72,153,.14);color:var(--pink-dark);">' + icon('pieChart',20) + '</div><div class="stat-value" style="font-size:1.1rem;">' + (topCategoryEntry ? escapeHtml(topCategoryEntry[0]) : '-') + '</div><div class="stat-label">Top Category</div></div>';
  html += '</div>';
  html += '<div class="card chart-card"><div class="chart-card-title">Monthly Sales ($)</div><div class="chart-box"><canvas id="sales-chart"></canvas></div></div>';
  html += '<div class="card chart-card"><div class="chart-card-title">Sales by Category</div>';
  html +=   (filtered.length === 0 ? '<div class="chart-empty">No sales data for this period</div>' : '<div class="chart-box"><canvas id="category-chart"></canvas></div>');
  html += '</div>';
  return html;
}

function drawReportCharts(){
  if (typeof Chart === 'undefined') return;
  try{
    var filtered = getFilteredOrders();
    var monthlyMap = {};
    filtered.forEach(function(o){
      var m = o.date.slice(0,7);
      monthlyMap[m] = (monthlyMap[m] || 0) + o.total;
    });
    var months = Object.keys(monthlyMap).sort();
    var monthLabels = months.map(function(m){
      var parts = m.split('-'); var y = +parts[0], mo = +parts[1];
      return new Date(y, mo-1, 1).toLocaleDateString('en-US', { month:'short' });
    });
    var monthValues = months.map(function(m){ return +monthlyMap[m].toFixed(2); });

    var salesCanvas = document.getElementById('sales-chart');
    if (salesCanvas){
      if (salesChartInstance) salesChartInstance.destroy();
      var primary = cssVar('--primary');
      var border = cssVar('--border');
      var textMuted = cssVar('--text-muted');
      salesChartInstance = new Chart(salesCanvas, {
        type:'line',
        data:{
          labels: monthLabels.length ? monthLabels : ['No data'],
          datasets:[{
            label:'Monthly Sales ($)',
            data: monthValues.length ? monthValues : [0],
            borderColor: primary, backgroundColor: hexToRgba(primary,0.15),
            fill:true, tension:0.35, pointRadius:4, pointBackgroundColor:primary, borderWidth:2.5
          }]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ display:true, position:'top', align:'end', labels:{ color:textMuted, font:{ weight:600 } } } },
          scales:{
            y:{ beginAtZero:true, grid:{ color:border }, ticks:{ color:textMuted } },
            x:{ grid:{ display:false }, ticks:{ color:textMuted } }
          }
        }
      });
    }

    var catCanvas = document.getElementById('category-chart');
    if (catCanvas){
      var catTotals = {};
      filtered.forEach(function(o){ o.items.forEach(function(i){ catTotals[i.category] = (catTotals[i.category]||0) + i.lineTotal; }); });
      var catLabels = Object.keys(catTotals);
      var catValues = catLabels.map(function(k){ return catTotals[k]; });
      var palette = ['#4F46E5','#06B6D4','#F59E0B','#EC4899','#10B981','#8B5CF6'];
      if (categoryChartInstance) categoryChartInstance.destroy();
      if (catLabels.length){
        categoryChartInstance = new Chart(catCanvas, {
          type:'doughnut',
          data:{ labels:catLabels, datasets:[{ data:catValues, backgroundColor:palette, borderWidth:2, borderColor:cssVar('--surface') }] },
          options:{ responsive:true, maintainAspectRatio:false, cutout:'62%', plugins:{ legend:{ position:'right', labels:{ color:cssVar('--text-muted'), font:{ weight:600 } } } } }
        });
      }
    }
  }catch(e){ console.error('chart render failed', e); }
}

/* ==========================================================================
   SETTINGS VIEW
   ========================================================================== */
function themeSwatch(name, bg){
  var active = state.theme === name;
  var checkIcon = active ? icon('check',15) : '';
  return '<button type="button" class="theme-swatch ' + (active?'active':'') + '" style="background:' + bg + ';" onclick="setTheme(\'' + name + '\')" aria-label="Switch to ' + name + ' theme" aria-pressed="' + active + '">' + checkIcon + '</button>';
}
function buildSettingsHTML(){
  var s = state.session;
  var backupOptions = ['Daily','Weekly','Monthly'].map(function(f){
    return '<option ' + (state.settings.backupFrequency===f?'selected':'') + '>' + f + '</option>';
  }).join('');

  var html = '<h1 class="page-title">System Settings</h1>';
  html += '<div class="settings-grid">';

  html +=   '<div class="card" style="padding:24px;">';
  html +=     '<div class="panel-title">User Profile</div>';
  html +=     '<div class="profile-header"><div class="profile-avatar">' + icon('user',22) + '</div><div><div style="font-weight:800;">' + escapeHtml(s.username) + '</div><div style="font-size:.8rem;color:var(--text-muted);">' + escapeHtml(s.email) + '</div></div></div>';
  html +=     '<div class="form-group"><label class="form-label" for="profile-name">Full Name</label><input class="form-input" id="profile-name" value="' + escapeHtml(s.fullName) + '" /></div>';
  html +=     '<div class="form-group"><label class="form-label" for="profile-email">Email</label><input class="form-input" id="profile-email" type="email" value="' + escapeHtml(s.email) + '" /></div>';
  html +=     '<div class="form-group"><label class="form-label" for="profile-password">Password</label><input class="form-input" id="profile-password" type="password" placeholder="Enter new password" /></div>';
  html +=     '<button type="button" class="btn btn-primary" onclick="handleUpdateProfile()">Update Profile</button>';
  html +=   '</div>';

  html +=   '<div class="card" style="padding:24px;">';
  html +=     '<div class="panel-title">Appearance</div>';
  html +=     '<div class="form-group"><label class="form-label">Theme</label><div style="display:flex;gap:12px;">';
  html +=       themeSwatch('light', '#ffffff');
  html +=       themeSwatch('dark', 'linear-gradient(145deg,#20243a,#0d0f1b)');
  html +=       themeSwatch('blue', 'linear-gradient(145deg,#3b82f6,#1d4ed8)');
  html +=       themeSwatch('green', 'linear-gradient(145deg,#10b981,#047857)');
  html +=     '</div></div>';
  html +=     '<div class="pref-row"><label class="form-label" for="notif-toggle" style="margin:0;">Enable Notifications</label><label class="toggle"><input type="checkbox" id="notif-toggle" ' + (state.settings.notifications?'checked':'') + ' /><span class="toggle-slider"></span></label></div>';
  html +=     '<div class="form-group"><label class="form-label" for="low-stock-threshold">Low Stock Threshold</label><input class="form-input" type="number" min="0" id="low-stock-threshold" value="' + state.settings.lowStockThreshold + '" /></div>';
  html +=     '<button type="button" class="btn btn-primary" onclick="handleSavePreferences()">Save Preferences</button>';
  html +=   '</div>';

  html +=   '<div class="card" style="padding:24px;">';
  html +=     '<div class="panel-title">Database Management</div>';
  html +=     '<div class="form-group"><label class="form-label" for="backup-freq">Backup Frequency</label><select class="form-select" id="backup-freq">' + backupOptions + '</select></div>';
  html +=     '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">';
  html +=       '<button type="button" class="btn btn-primary" onclick="handleBackupNow()">' + icon('download',15) + ' Backup Now</button>';
  html +=       '<button type="button" class="btn btn-orange" onclick="document.getElementById(\'settings-restore-input\').click()">' + icon('upload',15) + ' Restore</button>';
  html +=       '<input type="file" id="settings-restore-input" accept="application/json" style="display:none;" onchange="handleRestoreFile(event)" />';
  html +=     '</div>';
  html +=     '<button type="button" class="btn btn-pink" onclick="handleClearAllData()">' + icon('trash',15) + ' Clear All Data</button>';
  html +=   '</div>';

  html += '</div>';
  return html;
}

async function handleUpdateProfile(){
  state.session.fullName = document.getElementById('profile-name').value.trim() || state.session.fullName;
  state.session.email = document.getElementById('profile-email').value.trim() || state.session.email;
  document.getElementById('profile-password').value = '';
  await safeSet(STORAGE_KEYS.SESSION, state.session, false);
  showToast('Profile updated', 'success');
  renderView();
}
async function handleSavePreferences(){
  state.settings.notifications = document.getElementById('notif-toggle').checked;
  var threshold = parseInt(document.getElementById('low-stock-threshold').value, 10);
  state.settings.lowStockThreshold = isNaN(threshold) ? 5 : threshold;
  state.settings.backupFrequency = document.getElementById('backup-freq').value;
  await safeSet(STORAGE_KEYS.SETTINGS, state.settings, true);
  showToast('Preferences saved', 'success');
  renderView();
}
function handleBackupNow(){
  var data = { products: state.products, orders: state.orders, settings: state.settings, exportedAt: new Date().toISOString() };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'indulge-essentials-backup-' + todayISO() + '.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup downloaded', 'success');
}
function handleRestoreFile(e){
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = async function(ev){
    try{
      var data = JSON.parse(ev.target.result);
      if (!Array.isArray(data.products) || !Array.isArray(data.orders)) throw new Error('bad format');
      state.products = data.products;
      state.orders = data.orders;
      if (data.settings) state.settings = data.settings;
      await safeSet(STORAGE_KEYS.PRODUCTS, state.products, true);
      await safeSet(STORAGE_KEYS.ORDERS, state.orders, true);
      await safeSet(STORAGE_KEYS.SETTINGS, state.settings, true);
      showToast('Database restored successfully', 'success');
      renderView();
    }catch(err){
      showToast('Invalid backup file', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}
async function handleClearAllData(){
  if (!confirm('This will permanently delete all products and order history. Consider using Backup Now first. Continue?')) return;
  state.products = [];
  state.orders = [];
  state.cart = [];
  state.settings = defaultSettings();
  await safeSet(STORAGE_KEYS.PRODUCTS, state.products, true);
  await safeSet(STORAGE_KEYS.ORDERS, state.orders, true);
  await safeSet(STORAGE_KEYS.CART, state.cart, false);
  await safeSet(STORAGE_KEYS.SETTINGS, state.settings, true);
  showToast('All data cleared', 'success');
  renderView();
}

/* ==========================================================================
   MASTER RENDER
   ========================================================================== */
function renderView(){
  var app = document.getElementById('app');
  if (!app) return;

  if (!state.session){
    app.innerHTML = buildLoginHTML();
    return;
  }

  var role = state.session.role;
  if ((state.view === 'reports' || state.view === 'settings') && role !== 'admin'){
    state.view = 'products';
  }

  var content = '';
  if (state.view === 'products') content = buildProductsHTML();
  else if (state.view === 'inventory') content = buildInventoryHTML();
  else if (state.view === 'reports') content = buildReportsHTML();
  else if (state.view === 'settings') content = buildSettingsHTML();
  else { state.view = 'products'; content = buildProductsHTML(); }

  var modalHtml = '';
  if (state.modal){
    if (state.modal.type === 'checkout') modalHtml = buildCheckoutModalHTML();
    else if (state.modal.type === 'editProduct') modalHtml = buildEditModalHTML();
  }

  app.innerHTML = buildNavHTML() + '<main class="main-content">' + content + '</main>' + modalHtml;

  if (state.view === 'reports'){
    drawReportCharts();
  }
}

/* ==========================================================================
   BOOTSTRAP
   ========================================================================== */
async function initApp(){
  var app = document.getElementById('app');
  app.innerHTML = '<div class="loading-screen">' + icon('package',20) + ' Loading Indulge Essentials Store…</div>';

  var products = await safeGet(STORAGE_KEYS.PRODUCTS, true, null);
  if (!products || !products.length){
    products = seedProducts();
    await safeSet(STORAGE_KEYS.PRODUCTS, products, true);
  }
  state.products = products;

  var orders = await safeGet(STORAGE_KEYS.ORDERS, true, null);
  if (!orders){
    orders = seedOrders(state.products);
    await safeSet(STORAGE_KEYS.ORDERS, orders, true);
  }
  state.orders = orders;

  var settings = await safeGet(STORAGE_KEYS.SETTINGS, true, null);
  state.settings = settings || defaultSettings();
  if (!settings) await safeSet(STORAGE_KEYS.SETTINGS, state.settings, true);

  state.cart = await safeGet(STORAGE_KEYS.CART, false, []);
  state.session = await safeGet(STORAGE_KEYS.SESSION, false, null);
  state.theme = await safeGet(STORAGE_KEYS.THEME, false, 'light');

  applyTheme(state.theme);
  renderView();
}

initApp();