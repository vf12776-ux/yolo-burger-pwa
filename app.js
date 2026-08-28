// ИСПРАВЛЕНО: Базовый URL без /rest/v1/
const SUPABASE_URL = 'https://xdphktujhqnddxmwjred.supabase.co';
const SUPABASE_KEY = 'sb_publishable__ElzqpGGGXJ6RCV9SHJq_g_Jb9zrvc-';

// ИСПРАВЛЕНО: Используем dbClient, чтобы избежать конфликта имен
const dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let menuData = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Загрузка меню из базы при старте
async function loadMenu() {
  const { data, error } = await dbClient
    .from('menu')
    .select('*')
    .eq('is_available', true)
    .order('id', { ascending: true });

  if (error) {
    console.error('Ошибка загрузки меню:', error);
    document.getElementById('menu-items').innerHTML = '<p style="text-align:center; padding:20px;">Ошибка загрузки меню. Проверьте интернет.</p>';
    return;
  }

  menuData = data || [];
  renderMenu();
}

// Рендер меню
function renderMenu() {
  const container = document.getElementById('menu-items');
  if (menuData.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:20px; color:#B0B0B0;">Меню пока пустое</p>';
    return;
  }
  
  container.innerHTML = menuData.map(item => `
    <div class="menu-item">
      <img src="${item.image_url}" alt="${item.name}" class="item-image" onerror="this.src='https://via.placeholder.com/150'">
      <div class="item-info">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="item-footer">
          <span class="price">${item.price} ₽</span>
          <button onclick="addToCart(${item.id})" class="btn-add">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Добавить в корзину
function addToCart(itemId) {
  const item = menuData.find(i => i.id === itemId);
  const existingItem = cart.find(i => i.id === itemId);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  saveCart();
  renderCart();
}

// Изменить количество
function updateQuantity(itemId, delta) {
  const item = cart.find(i => i.id === itemId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== itemId);
    }
    saveCart();
    renderCart();
  }
}

// Сохранить корзину
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Рендер корзины
function renderCart() {
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const floatingTotal = document.getElementById('floating-total');
  const floatingBtn = document.getElementById('floating-cart-btn');
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
    cartTotal.textContent = '0 ₽';
    floatingTotal.textContent = '0 ₽';
    floatingBtn.classList.add('hidden');
    return;
  }
  
  floatingBtn.classList.remove('hidden');
  
  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <span>${item.name}</span>
      <div class="quantity-controls">
        <button onclick="updateQuantity(${item.id}, -1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="updateQuantity(${item.id}, 1)">+</button>
      </div>
      <span>${item.price * item.quantity} ₽</span>
    </div>
  `).join('');
  
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = `${total} ₽`;
  floatingTotal.textContent = `${total} ₽`;
}

function openCart() {
  document.getElementById('cart-modal').classList.add('open');
  document.getElementById('overlay').classList.add('open');
}

function closeCart() {
  document.getElementById('cart-modal').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

function checkout() {
  if (cart.length === 0) return;
  let message = '🍔 Предзаказ из YOLO Burgers:\n\n';
  let total = 0;
  cart.forEach(item => {
    message += `• ${item.name} x${item.quantity} = ${item.price * item.quantity}₽\n`;
    total += item.price * item.quantity;
  });
  message += `\n💰 Итого: ${total}₽\n\n📱 Имя: [Ваше имя]\n⏰ Время: [Укажите время]`;
  
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/79789270042?text=${encodedMessage}`, '_blank'); 
}

function callRestaurant() {
  window.location.href = 'tel:+79789270042';
}

// Запуск при загрузке
loadMenu();
renderCart();