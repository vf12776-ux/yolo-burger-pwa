// Проверяем, установлено ли приложение
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
}

// Определяем браузер и ОС
function detectBrowser() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);
  const isAndroid = /Android/.test(ua);
  
  if (isIOS && isSafari) return 'ios-safari';
  if (isAndroid && isChrome) return 'android-chrome';
  if (isAndroid && !isChrome) return 'android-other';
  return 'desktop';
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  if (isStandalone()) return;
  
  const browser = detectBrowser();
  const installContainer = document.getElementById('install-container');
  
  if (browser === 'ios-safari') {
    installContainer.innerHTML = `
      <div class="install-hint">
        <p>📱 Для установки на iPhone:</p>
        <p>Нажмите "Поделиться" и выберите "На экран «Домой»"</p>
      </div>
    `;
  } else if (browser === 'android-chrome') {
    installContainer.innerHTML = `
      <button id="install-btn" class="install-btn">📱 Установить приложение</button>
    `;
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
        <p class="warning">⚠️ Вы не в Chrome</p>
        <p>Нажмите "Скопировать"</p>
        <p>↓</p>
        <button onclick="copyLink()" class="copy-btn">📋 Скопировать</button>
        <p>Нажмите "Открыть Chrome" и вставьте ссылку</p>
        <button onclick="openChrome()" class="chrome-btn">🌐 Открыть Chrome</button>
      </div>
    `;
  }
}

function copyLink() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    alert('Ссылка скопирована!');
  });
}

function openChrome() {
  const url = window.location.href;
  window.location.href = `intent://${new URL(url).hostname}${new URL(url).pathname}#Intent;scheme=https;package=com.android.chrome;end`;
}

// Запуск при загрузке
if (!isStandalone()) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(showInstallButton, 1000);
  });
}