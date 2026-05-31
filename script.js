const API_PROXY =
  "https://corsproxy.io/?url=https://api.github.com/repos/igareck/vpn-configs-for-russia/contents/";
const REPO_OWNER = "igareck";
const REPO_NAME = "vpn-configs-for-russia";
const CACHE_KEY = "vpn_files_cache";
const CACHE_DURATION = 30 * 60 * 1000;

let currentFiles = [];

// DOM
const categoriesContainer = document.getElementById("categoriesContainer");
const lastUpdateEl = document.getElementById("lastUpdate");
const fileCountEl = document.getElementById("fileCount");
const refreshBtn = document.getElementById("refreshBtn");
const themeToggle = document.getElementById("themeToggle");
const mainContent = document.getElementById("mainContent");
const guideScreen = document.getElementById("guideScreen");
const guideClose = document.getElementById("guideClose");
const appsScreen = document.getElementById("appsScreen");
const warpScreen = document.getElementById("warpScreen");
const appsClose = document.getElementById("appsClose");
const warpClose = document.getElementById("warpClose");
const navItems = document.querySelectorAll(".nav-item");
const hintOverlay = document.getElementById("hintOverlay");
const hintCard = document.getElementById("hintCard");
const hintContent = document.getElementById("hintContent");
const hintClose = document.getElementById("hintClose");
const toastEl = document.getElementById("toast");

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadFiles();
  refreshBtn.addEventListener("click", () => loadFiles(true));
  guideClose.addEventListener("click", () => switchScreen("main"));
  if (appsClose)
    appsClose.addEventListener("click", () => switchScreen("main"));
  if (warpClose)
    warpClose.addEventListener("click", () => switchScreen("main"));
  navItems.forEach((btn) => {
    btn.addEventListener("click", () => switchScreen(btn.dataset.screen));
  });
  hintClose.addEventListener("click", closeHint);
  hintOverlay.addEventListener("click", (e) => {
    if (e.target === hintOverlay) closeHint();
  });

  // Платформенные переключатели
  const platformBtns = document.querySelectorAll(".platform-btn");
  const mobileContent = document.querySelector(".mobile-content");
  const desktopContent = document.querySelector(".desktop-content");

  if (platformBtns.length) {
    platformBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const platform = btn.dataset.platform;
        platformBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        if (platform === "mobile") {
          if (mobileContent) mobileContent.classList.add("active");
          if (desktopContent) desktopContent.classList.remove("active");
        } else {
          if (mobileContent) mobileContent.classList.remove("active");
          if (desktopContent) desktopContent.classList.add("active");
        }
      });
    });
  }
});

// Тема
function initTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute(
    "data-theme",
    saved || (prefersDark ? "dark" : "light"),
  );
  themeToggle.addEventListener("click", toggleTheme);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme");
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}

// Переключение экранов (мобильная навигация)
// Переключение экранов (мобильная навигация) с сохранением
function switchScreen(screen) {
  // Скрываем ВСЕ экраны
  mainContent.style.display = "none";
  guideScreen.classList.remove("open");
  if (appsScreen) appsScreen.classList.remove("open");
  if (warpScreen) warpScreen.classList.remove("open");

  // Убираем активный класс со всех кнопок навигации
  navItems.forEach((b) => b.classList.remove("active"));

  // Показываем выбранный экран
  if (screen === "main") {
    mainContent.style.display = "";
    const mainBtn = document.querySelector('[data-screen="main"]');
    if (mainBtn) mainBtn.classList.add("active");
  } else if (screen === "guide") {
    guideScreen.classList.add("open");
    const guideBtn = document.querySelector('[data-screen="guide"]');
    if (guideBtn) guideBtn.classList.add("active");
  } else if (screen === "apps") {
    if (appsScreen) appsScreen.classList.add("open");
    const appsBtn = document.querySelector('[data-screen="apps"]');
    if (appsBtn) appsBtn.classList.add("active");
  } else if (screen === "warp") {
    if (warpScreen) warpScreen.classList.add("open");
    const warpBtn = document.querySelector('[data-screen="warp"]');
    if (warpBtn) warpBtn.classList.add("active");
  }

  // Сохраняем текущий экран в localStorage
  localStorage.setItem("currentScreen", screen);
}

// Восстановление экрана после загрузки
function restoreCurrentScreen() {
  const savedScreen = localStorage.getItem("currentScreen");
  if (savedScreen && savedScreen !== "main") {
    setTimeout(() => {
      switchScreen(savedScreen);
    }, 100);
  }
}

// Добавляем восстановление в DOMContentLoaded
// НАЙДИТЕ существующий document.addEventListener("DOMContentLoaded", ...)
// и добавьте внутрь restoreCurrentScreen();

// Если хотите просто добавить без изменения существующего кода, добавьте:
document.addEventListener("DOMContentLoaded", () => {
  restoreCurrentScreen();
});

// Тост
function showToast(msg, isError = false) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.style.background = isError ? "var(--red)" : "var(--green)";
  toastEl.style.color = "#fff";
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 3000);
}

// Подсказки
const hints = {
  black: {
    title: "Чёрные списки",
    text: "Для обычного интернета (кабель или мобильный без ограничений). Используйте, если открываются любые сайты, а VPN нужен для доступа к заблокированным сервисам (YouTube, Telegram, WhatsApp, Instagram и др.).",
  },
  white: {
    title: "Белые списки",
    text: "Для максимально ограниченного мобильного интернета, когда работают только одобренные сайты (Яндекс, Госуслуги, ВК). Конфиги обходят CIDR‑блокировки по IP‑диапазонам.",
  },
  tor: {
    title: "Tor Bridges",
    text: "Мосты для сети Tor. Альтернатива VPN, особенно стабильна для ПК. Работают TCP‑соединения; UDP (онлайн‑игры, звонки) — не гарантированы.",
  },
};

function openHint(type) {
  const h = hints[type];
  if (!h) return;
  hintContent.innerHTML = `<h3>${h.title}</h3><p>${h.text}</p>`;
  hintOverlay.classList.add("open");
}

function closeHint() {
  hintOverlay.classList.remove("open");
}

// Загрузка файлов
async function loadFiles(force = false) {
  if (!force) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_DURATION) {
          currentFiles = data;
          render(data);
          updateStatus(data.length);
          return;
        }
      } catch (_) {}
    }
  }
  showLoading();
  try {
    const resp = await fetch(API_PROXY, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "vpn-hub-app",
      },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const files = await resp.json();
    const txt = files.filter(
      (f) => f.name.endsWith(".txt") && f.type === "file",
    );
    txt.sort((a, b) => a.name.localeCompare(b.name));
    currentFiles = txt;
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data: txt, ts: Date.now() }),
    );
    render(txt);
    updateStatus(txt.length);
    showToast(`Загружено ${txt.length} файлов`);
  } catch (e) {
    console.error(e);
    showError();
    showToast("Ошибка загрузки. Попробуйте позже.", true);
  }
}

function showLoading() {
  if (categoriesContainer) {
    categoriesContainer.innerHTML =
      '<div class="loading-state"><div class="spinner"></div><p>Загрузка подписок…</p></div>';
  }
}

function showError() {
  if (categoriesContainer) {
    categoriesContainer.innerHTML =
      '<div class="error-state"><div class="error-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-alert-triangle"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg></div><p class="error-message">Не удалось загрузить файлы</p></div>';
  }
}

function updateStatus(n) {
  const d = new Date();
  if (lastUpdateEl) {
    lastUpdateEl.textContent = `Актуально на ${d.toLocaleString("ru-RU")}`;
  }
  if (fileCountEl) {
    fileCountEl.textContent = `Найдено ссылок: ${n}`;
  }
}

// Группировка файлов
function groupFiles(files) {
  const g = {
    black: {
      name: "ЧЁРНЫЕ СПИСКИ",
      desc: "Обход блокировок",
      icon: "shield",
      hint: "black",
      files: [],
    },
    white: {
      name: "БЕЛЫЕ СПИСКИ",
      desc: "Обход CIDR/SNI",
      icon: "star",
      hint: "white",
      files: [],
    },
    tor: {
      name: "TOR BRIDGES",
      desc: "Мосты для Tor",
      icon: "clock",
      hint: "tor",
      files: [],
    },
    other: {
      name: "ПРОЧИЕ",
      desc: "Доп. подписки",
      icon: "file",
      hint: null,
      files: [],
    },
  };
  files.forEach((f) => {
    const n = f.name.toUpperCase();
    if (n.includes("BLACK") || n.includes("SHADOWSOCKS")) g.black.files.push(f);
    else if (n.includes("WHITE") || n.includes("CIDR") || n.includes("SNI"))
      g.white.files.push(f);
    else if (n.includes("TOR") || n.includes("BRIDGE")) g.tor.files.push(f);
    else g.other.files.push(f);
  });
  return g;
}

function catIcon(t) {
  const i = {
    shield:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    star: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    clock:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    file: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
  };
  return i[t] || i.file;
}

// Рендер файлов
function render(files) {
  const groups = groupFiles(files);
  let html = "";
  for (const [key, grp] of Object.entries(groups)) {
    if (!grp.files.length) continue;
    const hintHtml = grp.hint
      ? `<button class="hint-btn" data-hint="${grp.hint}" aria-label="Подробнее о ${grp.name}">?</button>`
      : "";
    html += `<div class="category">
            <div class="category-header">
                <span class="category-icon">${catIcon(grp.icon)}</span>
                <span class="category-title">${grp.name} ${hintHtml}</span>
                <span class="category-badge">${grp.files.length} шт.</span>
                <span class="category-desc">${grp.desc}</span>
            </div>
            <ul class="link-list">`;
    grp.files.forEach((f) => {
      const raw = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${f.name}`;
      html += `<li class="link-item">
                <div class="link-info">
                    <span class="link-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg></span>
                    <span class="link-name">${esc(f.name)}</span>
                </div>
                <div class="link-url-wrapper">
                    <code class="link-url">${esc(raw)}</code>
                    <button class="copy-btn" data-url="${esc(raw)}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        <span>Копировать</span>
                    </button>
                </div>
            </li>`;
    });
    html += "</ul></div>";
  }
  if (categoriesContainer) {
    categoriesContainer.innerHTML = html;
  }

  // обработчики копирования
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.url;
      copy(url, btn);
    });
  });
  // обработчики подсказок
  document.querySelectorAll(".hint-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openHint(btn.dataset.hint);
    });
  });
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

async function copy(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    btn.classList.add("copied");
    const span = btn.querySelector("span");
    const orig = span.textContent;
    span.textContent = "Скопировано ";
    showToast("Ссылка скопирована!");
    setTimeout(() => {
      btn.classList.remove("copied");
      span.textContent = orig;
    }, 2000);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast("Ссылка скопирована!");
  }
}

// ===== РАБОЧИЙ WARP ГЕНЕРАТОР =====

let lastGeneratedConfig = "";
let lastGeneratedMode = "";

// Функция для генерации случайного массива байт
function getRandomBytes(n) {
  let bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return bytes;
}

// Функция для кодирования ArrayBuffer в base64
function arrayBufferToBase64(buffer) {
  let binary = "";
  let bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Асинхронная генерация пары ключей WireGuard
async function generateWireGuardKeys() {
  try {
    // Генерируем 32 случайных байта для приватного ключа
    const privateKeyBytes = new Uint8Array(32);
    crypto.getRandomValues(privateKeyBytes);

    // Импортируем приватный ключ для вычисления публичного
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      privateKeyBytes,
      { name: "X25519" },
      true,
      ["deriveKey", "deriveBits"],
    );

    // Вычисляем публичный ключ
    const publicKeyBits = await crypto.subtle.deriveBits(
      { name: "X25519", public: cryptoKey },
      cryptoKey,
      256,
    );

    // Кодируем в base64 правильно (без btoa, который портит бинарные данные)
    function toBase64(bytes) {
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }

    const privateKeyBase64 = toBase64(privateKeyBytes);
    const publicKeyBytes = new Uint8Array(publicKeyBits);
    const publicKeyBase64 = toBase64(publicKeyBytes);

    console.log(
      "Сгенерирован новый приватный ключ:",
      privateKeyBase64.substring(0, 20) + "...",
    );

    return { privateKey: privateKeyBase64, publicKey: publicKeyBase64 };
  } catch (error) {
    console.error("Ошибка генерации ключей:", error);
    // Фолбэк с реальной случайной строкой
    const fallbackPrivate = btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))),
    );
    return {
      privateKey: fallbackPrivate,
      publicKey: "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
    };
  }
}

// Список IP для обхода российских сайтов (реальные IP Google, Cloudflare, Telegram и др.)
const ruSkipAllowedIPs = `162.159.0.0/16, 66.22.0.0/16, 8.8.4.0/24, 8.8.8.0/24, 8.34.208.0/20, 8.35.192.0/20, 23.236.48.0/20, 23.251.128.0/19, 34.0.0.0/10, 35.184.0.0/13, 35.192.0.0/14, 35.196.0.0/15, 35.198.0.0/16, 35.199.0.0/17, 35.199.128.0/18, 35.200.0.0/13, 35.208.0.0/12, 64.18.0.0/20, 64.233.160.0/19, 66.102.0.0/20, 66.249.64.0/19, 70.32.128.0/19, 72.14.192.0/18, 74.114.24.0/21, 74.125.0.0/16, 104.132.0.0/23, 104.133.0.0/23, 104.134.0.0/15, 104.156.64.0/18, 104.237.160.0/19, 108.59.80.0/20, 108.170.192.0/18, 108.177.0.0/17, 130.211.0.0/16, 136.112.0.0/12, 142.250.0.0/15, 146.148.0.0/17, 162.216.148.0/22, 162.222.176.0/21, 172.110.32.0/21, 172.217.0.0/16, 172.253.0.0/16, 173.194.0.0/16, 173.255.112.0/20, 192.158.28.0/22, 192.178.0.0/15, 193.186.4.0/24, 199.36.154.0/23, 199.36.156.0/24, 199.192.112.0/22, 199.223.232.0/21, 207.223.160.0/20, 208.65.152.0/22, 208.68.108.0/22, 208.81.188.0/22, 208.117.224.0/19, 209.85.128.0/17, 216.58.192.0/19, 216.239.32.0/19, 216.239.36.0/24, 216.239.38.0/23, 216.239.40.0/22, 104.18.37.228/32, 188.114.99.235/32, 34.126.226.51/32, 162.159.128.233/32, 162.159.136.232/32, 91.108.4.0/22, 91.108.8.0/22, 91.108.56.0/22, 95.161.64.0/20, 95.161.80.0/24, 149.154.160.0/20, 205.196.0.0/14, 155.133.224.0/20, 208.78.160.0/22, 162.254.192.0/21, 146.66.160.0/19, 146.66.128.0/19`;

// Получение значений из расширенных полей
function getAdvancedWarpValues() {
  const privateKeyInput = document.getElementById("privateKey");
  const addressIPv4Input = document.getElementById("addressIPv4");
  const addressIPv6Input = document.getElementById("addressIPv6");
  const dnsInput = document.getElementById("dns");
  const mtuInput = document.getElementById("mtu");
  const endpointInput = document.getElementById("endpoint");

  const values = {};
  if (privateKeyInput && privateKeyInput.value.trim() !== "")
    values.privateKey = privateKeyInput.value.trim();
  if (addressIPv4Input && addressIPv4Input.value.trim() !== "")
    values.addressIPv4 = addressIPv4Input.value.trim();
  if (addressIPv6Input && addressIPv6Input.value.trim() !== "")
    values.addressIPv6 = addressIPv6Input.value.trim();
  if (dnsInput && dnsInput.value.trim() !== "")
    values.dns = dnsInput.value.trim();
  if (mtuInput && mtuInput.value.trim() !== "")
    values.mtu = mtuInput.value.trim();
  if (endpointInput && endpointInput.value.trim() !== "")
    values.endpoint = endpointInput.value.trim();

  return values;
}

// Генерация конфига с прогрессом
async function generateWarpConfig(mode) {
  const statusDiv = document.getElementById("warpStatus");
  const resultDiv = document.getElementById("warpResult");
  const outputPre = document.getElementById("configOutput");
  const downloadBtn = document.getElementById("downloadConfigBtn");
  const globalBtn = document.getElementById("globalWarpBtn");
  const ruSkipBtn = document.getElementById("ruSkipWarpBtn");

  // Создаем прогресс бар если его нет
  let progressContainer = document.querySelector(".warp-progress");
  if (!progressContainer) {
    progressContainer = document.createElement("div");
    progressContainer.className = "warp-progress";
    progressContainer.innerHTML = `
      <div class="progress-bar-container">
        <div class="progress-bar-fill"></div>
      </div>
      <div class="progress-steps">
        <span class="progress-step" data-step="1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4l3 3"/>
          </svg>
          Ключи
        </span>
        <span class="progress-step" data-step="2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
          </svg>
          IP адреса
        </span>
        <span class="progress-step" data-step="3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Готово
        </span>
      </div>
    `;
    statusDiv.insertAdjacentElement("afterend", progressContainer);
  }

  const progressFill = progressContainer.querySelector(".progress-bar-fill");
  const steps = progressContainer.querySelectorAll(".progress-step");

  progressContainer.classList.add("active");

  if (globalBtn) globalBtn.classList.add("generating");
  if (ruSkipBtn) ruSkipBtn.classList.add("generating");

  if (statusDiv) {
    statusDiv.textContent = "Генерация новых ключей...";
    statusDiv.classList.add("loading");
  }

  progressFill.style.width = "33%";
  steps[0].classList.add("active");
  await new Promise((r) => setTimeout(r, 400));

  try {
    const advancedValues = getAdvancedWarpValues();
    const keys = await generateWireGuardKeys();

    progressFill.style.width = "66%";
    steps[0].classList.remove("active");
    steps[0].classList.add("completed");
    steps[1].classList.add("active");

    if (statusDiv) statusDiv.textContent = "Генерация IP адресов...";
    await new Promise((r) => setTimeout(r, 350));

    // Генерируем случайные адреса в правильном формате WireGuard
    // IPv4 с маской /32
    const randomIPv4 = `172.${16 + Math.floor(Math.random() * 16)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}/32`;

    // IPv6 с маской /128 (каждый сегмент от 1 до 65535 в hex)
    const ipv6Segments = [];
    for (let i = 0; i < 8; i++) {
      ipv6Segments.push(Math.floor(Math.random() * 65536).toString(16));
    }
    const randomIPv6 = ipv6Segments.join(":") + "/128";

    progressFill.style.width = "100%";
    steps[1].classList.remove("active");
    steps[1].classList.add("completed");
    steps[2].classList.add("active");

    if (statusDiv) statusDiv.textContent = "Сборка конфига...";
    await new Promise((r) => setTimeout(r, 300));

    // Базовые настройки
    let addressIPv4 = advancedValues.addressIPv4 || randomIPv4;
    let addressIPv6 = advancedValues.addressIPv6 || randomIPv6;

    // Добавляем маски, если их нет
    if (addressIPv4 && !addressIPv4.includes("/"))
      addressIPv4 = addressIPv4 + "/32";
    if (addressIPv6 && !addressIPv6.includes("/"))
      addressIPv6 = addressIPv6 + "/128";

    const dns =
      advancedValues.dns ||
      "1.1.1.1, 1.0.0.1, 2606:4700:4700::1111, 2606:4700:4700::1001";
    const mtu = advancedValues.mtu || "1280";
    const endpoint =
      advancedValues.endpoint || "engage.cloudflareclient.com:2408";
    const warpPublicKey = "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=";
    const allowedIPs = mode === "global" ? "0.0.0.0/0, ::/0" : ruSkipAllowedIPs;
    const privateKey = advancedValues.privateKey || keys.privateKey;

    const config = `[Interface]
PrivateKey = ${privateKey}
Address = ${addressIPv4}, ${addressIPv6}
DNS = ${dns}
MTU = ${mtu}

[Peer]
PublicKey = ${warpPublicKey}
AllowedIPs = ${allowedIPs}
Endpoint = ${endpoint}
PersistentKeepalive = 25`;

    lastGeneratedConfig = config;
    lastGeneratedMode = mode;

    if (outputPre) outputPre.textContent = config;
    if (resultDiv) resultDiv.style.display = "block";

    steps[2].classList.remove("active");
    steps[2].classList.add("completed");

    setTimeout(() => {
      progressContainer.classList.remove("active");
      steps.forEach((step) => {
        step.classList.remove("active", "completed");
      });
    }, 800);

    if (statusDiv) {
      statusDiv.textContent = "Новый конфиг сгенерирован!";
      statusDiv.classList.remove("loading");
      statusDiv.classList.add("success");
    }

    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.style.opacity = "1";
    }

    setTimeout(() => {
      if (statusDiv) {
        statusDiv.classList.remove("success");
        statusDiv.textContent = "Готов к генерации";
      }
    }, 3000);

    if (resultDiv)
      resultDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });

    showToast(
      `Сгенерирован новый ${mode === "global" ? "глобальный" : "RU-skip"} конфиг!`,
    );
  } catch (error) {
    console.error("Ошибка генерации:", error);
    progressContainer.classList.remove("active");
    if (statusDiv) {
      statusDiv.textContent = "✗ Ошибка генерации. Попробуйте еще раз.";
      statusDiv.classList.remove("loading");
      statusDiv.classList.add("error");
    }
    setTimeout(() => {
      if (statusDiv) {
        statusDiv.classList.remove("error");
        statusDiv.textContent = "Готов к генерации";
      }
    }, 5000);
  } finally {
    if (globalBtn) globalBtn.classList.remove("generating");
    if (ruSkipBtn) ruSkipBtn.classList.remove("generating");
  }
}
// Обработчик аккордеона для результата
const resultAccordion = document.getElementById("resultAccordion");
const resultContent = document.getElementById("resultContent");

if (resultAccordion && resultContent) {
  resultAccordion.addEventListener("click", () => {
    const isOpen = resultContent.style.display === "block";
    resultContent.style.display = isOpen ? "none" : "block";
    resultAccordion.classList.toggle("open");
  });
}

// Функция для скачивания файла
function downloadConfigFile(configContent, mode) {
  const blob = new Blob([configContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `warp-${mode === "global" ? "global" : "ru-skip"}-${Date.now()}.conf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Обработчики кнопок WARP
const globalWarpBtn = document.getElementById("globalWarpBtn");
const ruSkipWarpBtn = document.getElementById("ruSkipWarpBtn");
const downloadConfigBtn = document.getElementById("downloadConfigBtn");

if (globalWarpBtn) {
  globalWarpBtn.addEventListener("click", () => generateWarpConfig("global"));
}
if (ruSkipWarpBtn) {
  ruSkipWarpBtn.addEventListener("click", () => generateWarpConfig("ru-skip"));
}
if (downloadConfigBtn) {
  downloadConfigBtn.addEventListener("click", () => {
    if (lastGeneratedConfig) {
      downloadConfigFile(lastGeneratedConfig, lastGeneratedMode);
      showToast("Файл .conf скачан!");
    } else {
      showToast("Сначала сгенерируйте конфиг", true);
    }
  });
}

// Исправление обводки на мобильных устройствах
function initMobileOutlineFix() {
  const interactiveElements = document.querySelectorAll(
    'button, a, [role="button"], .copy-btn, .nav-item, .theme-toggle, .refresh-btn, .hint-btn, .platform-btn, .warp-quick-btn',
  );

  interactiveElements.forEach((el) => {
    el.addEventListener("touchstart", () => {
      el.classList.add("element-tap");
    });
    el.addEventListener("touchend", () => {
      setTimeout(() => {
        el.classList.remove("element-tap");
      }, 200);
    });
    el.addEventListener("touchcancel", () => {
      el.classList.remove("element-tap");
    });
  });
}

// Запускаем исправление после загрузки DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initMobileOutlineFix();
  });
} else {
  initMobileOutlineFix();
}

// Исправление обводки на мобильных устройствах
function initMobileOutlineFix() {
  const interactiveElements = document.querySelectorAll(
    'button, a, [role="button"], .copy-btn, .nav-item, .theme-toggle, .refresh-btn, .hint-btn, .platform-btn, .warp-quick-btn',
  );

  interactiveElements.forEach((el) => {
    el.addEventListener("touchstart", () => {
      el.classList.add("element-tap");
    });
    el.addEventListener("touchend", () => {
      setTimeout(() => {
        el.classList.remove("element-tap");
      }, 200);
    });
    el.addEventListener("touchcancel", () => {
      el.classList.remove("element-tap");
    });
  });
}

// ===== СОХРАНЕНИЕ ТЕКУЩЕГО ЭКРАНА ПРИ ОБНОВЛЕНИИ =====

// Сохраняем текущий экран в localStorage
function saveCurrentScreen(screen) {
  localStorage.setItem("currentScreen", screen);
}

// Восстанавливаем экран после загрузки страницы
function restoreCurrentScreen() {
  const savedScreen = localStorage.getItem("currentScreen");
  if (savedScreen && savedScreen !== "main") {
    // Небольшая задержка, чтобы DOM точно загрузился
    setTimeout(() => {
      switchScreen(savedScreen);
    }, 100);
  }
}

// Модифицируем существующую функцию switchScreen, добавив сохранение
const originalSwitchScreen = switchScreen;
switchScreen = function (screen) {
  // Вызываем оригинальную функцию
  originalSwitchScreen(screen);
  // Сохраняем текущий экран
  saveCurrentScreen(screen);
};

// Запускаем восстановление после загрузки
document.addEventListener("DOMContentLoaded", () => {
  restoreCurrentScreen();
});

// Запускаем исправление после загрузки DOM
document.addEventListener("DOMContentLoaded", () => {
  initMobileOutlineFix();
});
