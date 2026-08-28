const SUPABASE_URL = 'https://xdphktujhqnddxmwjred.supabase.co';
const SUPABASE_KEY = 'sb_publishable__ElzqpGGGXJ6RCV9SHJq_g_Jb9zrvc-';

const dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = null;
let deferredPrompt = null;
let ordersInterval = null;

async function checkSession() {
  const { data: { session } } = await dbClient.auth.getSession();
  if (session) {
    currentUser = session.user;
    showAdminPanel();
  }
}

async function login() {
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  const errorMsg = document.getElementById('login-error');
  
  if (!email || !password) {
    errorMsg.textContent = 'Заполните email и пароль';
    return;
  }
  
  errorMsg.textContent = 'Вход...';
  const { data, error } = await dbClient.auth.signInWithPassword({ email, password });
  
  if (error) {
    errorMsg.textContent = 'Ошибка: ' + error.message;
  } else {
    currentUser = data.user;
    errorMsg.textContent = '';
    showAdminPanel();
  }
}

async function logout() {
  await dbClient.auth.signOut();
  currentUser = null;
  if (ordersInterval) clearInterval(ordersInterval);
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('admin-panel').classList.add('hidden');
}

function showAdminPanel() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
  loadAdminMenu();
  loadOrders();
  // Автообновление заказов каждые 30 секунд
  ordersInterval = setInterval(loadOrders, 30000);
}

// ==========================================
// ВКЛАДКИ
// ==========================================
function switchTab(tab) {
  document.getElementById('section-menu').classList.toggle('hidden', tab !== 'menu');
  document.getElementById('section-orders').classList.toggle('hidden', tab !== 'orders');
  document.getElementById('tab-menu').classList.toggle('active', tab === 'menu');
  document.getElementById('tab-orders').classList.toggle('active', tab === 'orders');
  
  if (tab === 'orders') loadOrders();
}

// ==========================================
// МЕНЮ
// ==========================================
async function loadAdminMenu() {
  const { data, error } = await dbClient.from('menu').select('*').order('id', { ascending: false });
  if (error) return;
  
  const listEl = document.getElementById('admin-menu-list');
  if (!data || data.length === 0) {
    listEl.innerHTML = '<p style="color:#B0B0B0">Меню пусто.</p>';
    return;
  }

  listEl.innerHTML = data.map(item => `
    <div class="menu-item-admin">
      <div>
        <strong>${item.name}</strong> — ${item.price} ₽<br>
        <small style="color:#B0B0B0">${item.is_available ? '✅ Доступно' : '❌ Скрыто'}</small>
      </div>
      <button class="btn-delete" data-id="${item.id}">Удалить</button>
    </div>
  `).join('');

  document.querySelectorAll('.btn-delete[data-id]').forEach(btn => {
    btn.addEventListener('click', () => deleteMenuItem(btn.dataset.id));
  });
}

async function addMenuItem() {
  const name = document.getElementById('item-name').value.trim();
  const description = document.getElementById('item-desc').value.trim();
  const price = parseInt(document.getElementById('item-price').value);
  const image_url = document.getElementById('item-image').value.trim() || 'https://via.placeholder.com/150';
  const msg = document.getElementById('admin-msg');
  
  if (!name || !price) { 
    msg.textContent = 'Заполни название и цену!'; 
    msg.style.color = '#E53935'; 
    return; 
  }
  
  msg.textContent = 'Сохранение...';
  const { error } = await dbClient.from('menu').insert([{ name, description, price, image_url, is_available: true }]);
  
  if (error) { 
    msg.textContent = 'Ошибка: ' + error.message; 
    msg.style.color = '#E53935'; 
  } else {
    msg.textContent = '✅ Успешно!'; 
    msg.style.color = '#4CAF50';
    document.getElementById('item-name').value = '';
    document.getElementById('item-desc').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-image').value = '';
    setTimeout(() => { msg.textContent = ''; }, 2000);
    loadAdminMenu();
  }
}

async function deleteMenuItem(id) {
  if (!confirm('Удалить?')) return;
  await dbClient.from('menu').delete().eq('id', id);
  loadAdminMenu();
}

// ==========================================
// ЗАКАЗЫ
// ==========================================
async function loadOrders() {
  const { data, error } = await dbClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Ошибка загрузки заказов:', error);
    return;
  }

  const newOrders = data.filter(o => o.status === 'new');
  const badge = document.getElementById('orders-badge');
  
  if (newOrders.length > 0) {
    badge.textContent = newOrders.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  const listEl = document.getElementById('orders-list');
  if (!data || data.length === 0) {
    listEl.innerHTML = '<p style="color:#B0B0B0">Заказов пока нет.</p>';
    return;
  }

  listEl.innerHTML = data.map(order => {
    const itemsList = order.items.map(i => `${i.name} x${i.quantity}`).join(', ');
    const time = new Date(order.created_at).toLocaleString('ru-RU');
    const statusLabel = {
      'new': '🆕 Новый',
      'confirmed': '✅ Подтверждён',
      'done': '✔️ Выполнен',
      'cancelled': '❌ Отменён'
    }[order.status] || order.status;
    
    const isDone = order.status === 'done' || order.status === 'cancelled';
    
    return `
      <div class="order-card ${isDone ? 'done' : ''}">
        <div class="order-header">
          <span class="order-id">Заказ №${order.id}</span>
          <span class="order-time">${time}</span>
        </div>
        <div class="order-items">${itemsList}</div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="order-total">${order.total} ₽</span>
          <span style="font-size:12px;">${statusLabel}</span>
        </div>
        ${!isDone ? `
          <div class="order-actions">
            <button class="btn-sm btn-confirm" onclick="updateOrderStatus(${order.id}, 'confirmed')">Подтвердить</button>
            <button class="btn-sm btn-done" onclick="updateOrderStatus(${order.id}, 'done')">Выполнен</button>
            <button class="btn-sm btn-cancel" onclick="updateOrderStatus(${order.id}, 'cancelled')">Отмена</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

async function updateOrderStatus(id, status) {
  await dbClient.from('orders').update({ status }).eq('id', id);
  loadOrders();
}

// ==========================================
// PWA
// ==========================================
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
}

function detectBrowser() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua) && /Chrome/.test(ua) && !/YaBrowser|OPR|Firefox|SamsungBrowser|Edg/.test(ua)) return 'android-chrome';
  if (/Android/.test(ua)) return 'android-other';
  return 'desktop';
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  // Жёсткая проверка: если уже установлено — НЕ показываем кнопку
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return;
  
  const browser = detectBrowser();
  const installContainer = document.getElementById('install-container');
  if (!installContainer) return;
  
  if (browser === 'ios') {
    installContainer.innerHTML = '<div class="install-hint"><p>📱 Нажмите "Поделиться" → "На экран «Домой»"</p></div>';
  } else if (browser === 'android-chrome') {
    // Показываем кнопку ТОЛЬКО если есть deferredPrompt (браузер разрешает установку)
    if (!deferredPrompt) {
      installContainer.innerHTML = '';
      return;
    }
    installContainer.innerHTML = '<button id="install-btn" class="install-btn">📱 Установить приложение</button>';
    document.getElementById('install-btn').onclick = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        installContainer.innerHTML = '';
      }
    };
  } else if (browser === 'android-other') {
    installContainer.innerHTML = `
      <div class="install-instruction">
        <p class="warning">🔵 Вы не в Chrome</p>
        <button id="openChromeBtn" class="chrome-btn">🌐 Открыть в Chrome</button>
        <button id="copyLinkBtn" class="copy-btn">📋 Скопировать ссылку</button>
      </div>`;
    document.getElementById('openChromeBtn').addEventListener('click', () => {
      const url = window.location.href;
      const cleanUrl = url.replace(/^https?:\/\//, '');
      window.location.href = 'intent://' + cleanUrl + '#Intent;scheme=googlechrome;end';
    });
    document.getElementById('copyLinkBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      alert('Ссылка скопирована!');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const addItemBtn = document.getElementById('add-item-btn');

  if (loginBtn) loginBtn.addEventListener('click', login);
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  if (addItemBtn) addItemBtn.addEventListener('click', addMenuItem);
  
  if (!isStandalone()) setTimeout(showInstallButton, 500);
  
  checkSession();
});