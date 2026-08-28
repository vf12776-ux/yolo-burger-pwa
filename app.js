const SUPABASE_URL = 'https://xdphktujhqnddxmwjred.supabase.co';
const SUPABASE_KEY = 'sb_publishable__ElzqpGGGXJ6RCV9SHJq_g_Jb9zrvc-';

const dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let menuData = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function loadMenu() {
  const { data, error } = await dbClient
    .from('menu')
    .select('*')
    .eq('is_available', true)
    .order('id', { ascending: true });

  if (error) {
    console.error('Ошибка загрузки меню:', error);
    document.getElementById('menu-items').innerHTML = '<p style="text-align:center; padding:20px;">Ошибка загрузки меню.</p>';
    return;
  }

  menuData = data || [];
  renderMenu();
}

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

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

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

// ==========================================
// ГЛАВНОЕ ИЗМЕНЕНИЕ: СОХРАНЕНИЕ В БАЗУ + ВЫБОР СВЯЗИ
// ==========================================
async function checkout() {
  if (cart.length === 0) return;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Подготовка данных для сохранения
  const orderItems = cart.map(item => ({
    name: item.name,
    price: item.price,
    quantity: item.quantity
  }));

  // 1. СОХРАНЯЕМ ЗАКАЗ В БАЗУ ДАННЫХ
  const { data, error } = await dbClient
    .from('orders')
    .insert([{
      items: orderItems,
      total: total,
      status: 'new'
    }])
    .select();

  if (error) {
    console.error('Ошибка сохранения заказа:', error);
    alert('Не удалось сохранить заказ. Попробуйте позвонить нам.');
    return;
  }

  const orderId = data[0].id;

  // 2. ОЧИЩАЕМ КОРЗИНУ
  cart = [];
  saveCart();
  renderCart();
  closeCart();

  // 3. ПОКАЗЫВАЕМ ЭКРАН УСПЕХА
  showOrderSuccess(orderId, total);
}

function showOrderSuccess(orderId, total) {
  // Создаём модальное окно успеха
  const overlay = document.getElementById('overlay');
  const modal = document.getElementById('cart-modal');
  
  // Скрываем корзину, показываем успех
  modal.innerHTML = `
    <div style="text-align:center; padding:30px 20px;">
      <h2 style="color:#4CAF50; font-size:28px;">✅ Заказ №${orderId} принят!</h2>
      <p style="color:#B0B0B0; margin:15px 0;">Сумма: <strong style="color:white;">${total} ₽</strong></p>
      <p style="color:#FFF8E1; margin:20px 0; font-size:16px;">Мы перезвоним вам для подтверждения.<br>Или свяжитесь с нами сами:</p>
      
      <a href="tel:+79789270042" style="display:block; background:#4CAF50; color:white; padding:15px; border-radius:12px; text-decoration:none; font-size:18px; font-weight:bold; margin:10px 0;">📞 Позвонить</a>
      
      <a href="https://wa.me/79789270042?text=${encodeURIComponent('Здравствуйте! Мой заказ №' + orderId + ' на сумму ' + total + '₽.')}" target="_blank" style="display:block; background:#25D366; color:white; padding:15px; border-radius:12px; text-decoration:none; font-size:16px; font-weight:bold; margin:10px 0;">💬 Написать в WhatsApp</a>
      
      <button onclick="closeOrderSuccess()" style="margin-top:20px; background:#333; color:white; border:none; padding:12px 30px; border-radius:8px; font-size:16px; cursor:pointer;">Вернуться в меню</button>
    </div>
  `;
  
  modal.classList.add('open');
  overlay.classList.add('open');
}

function closeOrderSuccess() {
  document.getElementById('cart-modal').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  
  // Восстанавливаем HTML корзины
  setTimeout(() => {
    document.getElementById('cart-modal').innerHTML = `
      <div class="cart-modal-header">
        <h3>Ваш заказ</h3>
        <button class="close-cart" onclick="closeCart()">✕</button>
      </div>
      <div id="cart-items">
        <p class="empty-cart">Корзина пуста</p>
      </div>
      <div class="cart-total">
        <span>Итого:</span>
        <span id="cart-total">0 ₽</span>
      </div>
      <button class="btn-primary" onclick="checkout()">Оформить предзаказ</button>
      <button class="btn-secondary" onclick="callRestaurant()">📞 Позвонить и продублировать</button>
    `;
  }, 300);
}

function callRestaurant() {
  window.location.href = 'tel:+79789270042';
}

loadMenu();
renderCart();