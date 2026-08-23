const SUPABASE_URL = 'https://xdphktujhqnddxmwjred.supabase.co';
const SUPABASE_KEY = 'sb_publishable__ElzqpGGGXJ6RCV9SHJq_g_Jb9zrvc-';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = null;

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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    errorMsg.textContent = 'Ошибка: ' + error.message;
  } else {
    currentUser = data.user;
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
  if (error) {
    console.error(error);
    return;
  }
  const list = document.getElementById('admin-menu-list');
  list.innerHTML = data.map(item => `
    <div class="menu-item-admin">
      <div>
        <strong>${item.name}</strong> — ${item.price} ₽
        <br><small style="color:#B0B0B0">${item.is_available ? 'Доступно' : 'Скрыто'}</small>
      </div>
      <button class="btn-delete" onclick="deleteMenuItem(${item.id})">Удалить</button>
    </div>
  `).join('');
}

async function addMenuItem() {
  const name = document.getElementById('item-name').value;
  const description = document.getElementById('item-desc').value;
  const price = parseInt(document.getElementById('item-price').value);
  const image_url = document.getElementById('item-image').value || 'https://via.placeholder.com/150';
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
    msg.textContent = 'Успешно добавлено!';
    msg.style.color = '#4CAF50';
    document.getElementById('item-name').value = '';
    document.getElementById('item-desc').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-image').value = '';
    loadAdminMenu();
  }
}

async function deleteMenuItem(id) {
  if (!confirm('Удалить эту позицию?')) return;
  const { error } = await supabase.from('menu').delete().eq('id', id);
  if (error) {
    alert('Ошибка удаления: ' + error.message);
  } else {
    loadAdminMenu();
  }
}

checkSession();