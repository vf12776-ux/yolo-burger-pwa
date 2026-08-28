// Глобальная переменная - не вызывает ошибок при повторной загрузке
if (!window.supabaseClient) {
  const SUPABASE_URL = 'https://xdphktujhqnddxmwjred.supabase.co';
  const SUPABASE_KEY = 'sb_publishable__ElzqpGGGXJ6RCV9SHJq_g_Jb9zrvc-';
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

const supabase = window.supabaseClient;
let currentUser = null;
let deferredPrompt = null;

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    errorMsg.textContent = 'Ошибка: ' + error.message;
  } else {
    currentUser = data.user;
    errorMsg.textContent = '';
    showAdminPanel();
  }
}

async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('admin-panel').classList.add('hidden');
}

function showAdminPanel() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
  loadAdminMenu();
}

async function loadAdminMenu() {
  const { data, error } = await supabase.from('menu').select('*').order('id', { ascending: false });
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

  document.querySelectorAll('.btn-delete').forEach(btn => {
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
  const { error } = await supabase.from('menu').insert([{ name, description, price, image_url, is_available: true }]);
  
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
  await supabase.from('menu').delete().eq('id', id);
  loadAdminMenu();
}

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
  if (isStandalone()) return;
  const browser = detectBrowser();
  const installContainer = document.getElementById('install-container');
  if (!installContainer) return;
  
  if (browser === 'ios') {
    installContainer.innerHTML = '<div class="install-hint"><p>📱 Нажмите "Поделиться" → "На экран «Домой»"</p></div>';
  } else if (browser === 'android-chrome') {
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
  
  if (!isStandalone()) {
    setTimeout(showInstallButton, 500);
  }
  
  checkSession();
});