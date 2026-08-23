function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
}

function detectBrowser() {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isChrome = /Chrome/.test(ua) && !/YaBrowser|OPR|Firefox|SamsungBrowser|Edg/.test(ua);
  
  if (isIOS) return 'ios';
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
  if (!installContainer) return;
  
  if (browser === 'ios') {
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
        <p class="warning">🔵 Вы не в Chrome</p>
        <p>При сканировании QR — скопируйте ссылку и откройте её в <strong>Chrome</strong>.</p>
        <button id="openChromeBtn" class="chrome-btn">🌐 Открыть в Chrome</button>
        <button onclick="copyLink()" class="copy-btn">📋 Скопировать ссылку</button>
      </div>
    `;
    
    document.getElementById('openChromeBtn').addEventListener('click', () => {
      const url = window.location.href;
      const cleanUrl = url.replace(/^https?:\/\//, '');
      window.location.href = 'intent://' + cleanUrl + '#Intent;scheme=googlechrome;end';
    });
  }
}

function copyLink() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.querySelector('.copy-btn');
    if (btn) {
      btn.textContent = '✅ Скопировано!';
      setTimeout(() => { btn.textContent = '📋 Скопировать ссылку'; }, 2000);
    }
  }).catch(() => {
    prompt('Скопируйте эту ссылку:', url);
  });
}

if (!isStandalone()) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(showInstallButton, 500);
  });
}