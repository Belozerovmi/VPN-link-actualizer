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
  navItems.forEach((btn) => {
    btn.addEventListener("click", () => switchScreen(btn.dataset.screen));
  });
  hintClose.addEventListener("click", closeHint);
  hintOverlay.addEventListener("click", (e) => {
    if (e.target === hintOverlay) closeHint();
  });
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
function switchScreen(screen) {
  if (screen === "guide") {
    mainContent.style.display = "none";
    guideScreen.classList.add("open");
    navItems.forEach((b) => b.classList.remove("active"));
    document.querySelector('[data-screen="guide"]').classList.add("active");
  } else {
    mainContent.style.display = "";
    guideScreen.classList.remove("open");
    navItems.forEach((b) => b.classList.remove("active"));
    document.querySelector('[data-screen="main"]').classList.add("active");
  }
}

// Тост
function showToast(msg, isError = false) {
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

// Загрузка
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
  categoriesContainer.innerHTML =
    '<div class="loading-state"><div class="spinner"></div><p>Загрузка подписок…</p></div>';
}
function showError() {
  categoriesContainer.innerHTML =
    '<div class="error-state"><div class="error-icon">⚠️</div><p class="error-message">Не удалось загрузить файлы</p></div>';
}
function updateStatus(n) {
  const d = new Date();
  lastUpdateEl.textContent = `Актуально на ${d.toLocaleString("ru-RU")}`;
  fileCountEl.textContent = `Найдено ссылок: ${n}`;
}

// Группировка
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

// Рендер
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
  categoriesContainer.innerHTML = html;

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
    showToast("✅ Ссылка скопирована!");
  }
}
