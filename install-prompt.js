let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  const installBtn = document.createElement('button');
  installBtn.textContent = '📱 Установить приложение';
  installBtn.className = 'install-btn';
  installBtn.onclick = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      installBtn.remove();
    }
    deferredPrompt = null;
  };
  document.body.appendChild(insternBtn);
}

// Для Safari (iOS) показываем инструкцию
function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

if (isSafari()) {
  const safariInstructions = document.createElement('div');
  safariInstructions.className = 'safari-instructions';
  safariInstructions.innerHTML = `
    <p>📱 Для установки на iPhone:</p>
    <ol>
      <li>Нажмите кнопку "Поделиться" (квадрат со стрелкой)</li>
      <li>Выберите "На экран «Домой»"</li>
    </ol>
  `;
  document.body.appendChild(safariInstructions);
}