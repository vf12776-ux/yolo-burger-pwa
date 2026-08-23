// Временные данные меню (позже заменим на загрузку из Firebase/JSON)
const menuData = [
  {
    id: 1,
    name: "Бургер Трюфель",
    description: "Говяжья котлета, трюфельный соус, бекон, сыр",
    price: 450,
    image: "https://via.placeholder.com/150"
  },
  {
    id: 2,
    name: "Бургер с копченой вишней",
    description: "Копченая вишня, бекон, фирменный соус",
    price: 420,
    image: "https://via.placeholder.com/150"
  },
  {
    id: 3,
    name: "Классический Smash",
    description: "Двойная котлета, сыр чеддер, соленья",
    price: 380,
    image: "https://via.placeholder.com/150"
  },
  {
    id: 4,
    name: "Картофель фри",
    description: "Хрустящий картофель с морской солью",
    price: 200,
    image: "https://via.placeholder.com/150"
  },
  {
    id: 5,
    name: "Морс клюквенный",
    description: "Домашний морс из свежей клюквы",
    price: 180,
    image: "https://via.placeholder.com/150"
  }
];

let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Рендер меню
function renderMenu() {
  const container = document.getElementById('menu-items');
  container.innerHTML = menuData.map(item => `
    <div class="menu-item">
      <img src="${item.image}" alt="${item.name}" class="item-image">
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

// Удалить из корзины
function removeFromCart(itemId) {
  cart = cart.filter(i => i.id !== itemId);
  saveCart();
  renderCart();
}

// Изменить количество
function updateQuantity(itemId, delta) {
  const item = cart.find(i => i.id === itemId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(itemId);
    } else {
      saveCart();
      renderCart();
    }
  }
}

// Сохранить корзину в localStorage
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Рендер корзины
function renderCart() {
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
    cartTotal.textContent = '0 ₽';
    return;
  }
  
  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <span>${item.name}</span>
      <div class="quantity-controls">
        <button onclick="updateQuantity(${item.id}, -1)">-</button>
        <span>${item.quantity}</span>
        <button onclick="updateQuantity(${item.id}, 1)">+</button>
      </div>
      <span>${item.price * item.quantity} ₽</span>
    </div>
  `).join('');
  
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = `${total} ₽`;
}

// Оформление заказа
function checkout() {
  if (cart.length === 0) {
    alert('Корзина пуста!');
    return;
  }
  
  let message = '🍔 Предзаказ из YOLO Burgers:\n\n';
  let total = 0;
  
  cart.forEach(item => {
    message += `• ${item.name} x${item.quantity} = ${item.price * item.quantity}₽\n`;
    total += item.price * item.quantity;
  });
  
  message += `\n💰 Итого: ${total}₽`;
  message += `\n\n📱 Имя: [Ваше имя]`;
  message += `\n⏰ Время получения: [Укажите время]`;
  
  const encodedMessage = encodeURIComponent(message);
  
  // Открываем Telegram (замени на реальный номер/юзернейм)
  window.open(`https://t.me/+7978XXXXXXX?text=${encodedMessage}`, '_blank');
}

// Звонок в ресторан
function callRestaurant() {
  window.location.href = 'tel:+79789270042';
}

// Инициализация
renderMenu();
renderCart();