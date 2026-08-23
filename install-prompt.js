// Показываем подсказку только для Safari на iOS
function isIOSSafari() {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream && /Safari/.test(ua);
}

if (isIOSSafari()) {
  // Показываем подсказку через 2 секунды после загрузки
  setTimeout(() => {
    document.getElementById('safari-hint').style.display = 'block';
    // Скрываем через 6 секунд
    setTimeout(() => {
      document.getElementById('safari-hint').style.display = 'none';
    }, 6000);
  }, 2000);
}

// Для Android/Chrome: стандартный механизм (браузер сам решит, когда показать)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Если хочешь принудительно показать кнопку, можно раскомментировать код ниже,
  // но лучше довериться браузеру, чтобы не раздражать пользователя.
  /*
  const installBtn = document.createElement('button');
  installBtn.textContent = '📱 Установить YOLO';
  installBtn.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#E53935;color:white;border:none;padding:12px 24px;border-radius:25px;font-weight:bold;z-index:300;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
  installBtn.onclick = async () => {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    installBtn.remove();
  };
  document.body.appendChild(installBtn);
  */
});