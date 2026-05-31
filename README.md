<p align="center">
  <img src="favicon.ico" alt="VPN Hub Logo" width="80"/>
</p>

<h1 align="center">VPN Hub — Актуализатор подписок от igareck</h1>

<p align="center">
  <em>Автообновляемые RAW-ссылки для обхода блокировок из репозитория igareck/vpn-configs-for-russia</em>
</p>

<p align="center">
  <a href="https://belozerovmi.github.io/VPN-link-actualizer/">
    <img src="https://img.shields.io/badge/Сайт-Открыть-%237c8db5?style=for-the-badge" alt="Сайт-открыть">
  </a>
  <a href="https://github.com/Belozerovmi/VPN-link-actualizer">
    <img src="https://img.shields.io/badge/Репозиторий-Открыть-%237c8db5?style=for-the-badge&logo=github" alt="Репозиторий">
  </a>
</p>

---

## О проекте

**VPN Hub** — это веб-интерфейс для удобного копирования RAW-ссылок на конфигурационные файлы из репозитория igareck. Проект написан на нативных **HTML5**, **CSS3** и **JavaScript** без использования фреймворков. Данные подтягиваются напрямую из GitHub с кэшированием в localStorage.

---

## Функционал

<p align="center">
  <img src="https://img.shields.io/badge/Категорий-4-%237c8db5?style=flat-square" alt="Категорий">
  <img src="https://img.shields.io/badge/Режима_WARP-2-%2357ab5a?style=flat-square" alt="WARP">
  <img src="https://img.shields.io/badge/Темы-2-%239876c2?style=flat-square" alt="Темы">
</p>

### Подписки

Основной экран с группировкой конфигурационных файлов по категориям:

- **Чёрные списки** — для обычного интернета (кабель или мобильный без ограничений)
- **Белые списки** — для максимально ограниченного мобильного интернета (обход CIDR/SNI)
- **Tor Bridges** — мосты для сети Tor (альтернатива VPN)
- **Прочие** — дополнительные подписки

Каждая карточка содержит RAW-ссылку и кнопку копирования в буфер обмена. Рядом с названием категории есть кнопка `?` с подробным описанием.

### Инструкция

Пошаговое руководство по использованию:
1. Выбор категории (обычный или ограниченный интернет)
2. Копирование RAW-ссылки
3. Добавление в VPN-клиент (Karing, v2rayN, Streisand)
4. Проверка задержки и выбор сервера

### Приложения

Рекомендации VPN-клиентов с инструкциями по настройке. Поддерживается переключение между мобильной и ПК версией.

**Мобильная версия:**
- V2RayTun (Android / iOS) — установка из Google Play / App Store, импорт подписки через буфер обмена
- Amnezia WG (Android / iOS) — установка, импорт .conf файла

**ПК версия:**
- Amnezia WG (Windows / Linux / macOS) — установка из репозитория, импорт туннелей из файла

### WARP Генератор

Генерация конфигурационных файлов Cloudflare WARP:

- **Глобальный WARP** — весь трафик через VPN (`0.0.0.0/0, ::/0`)
- **WARP минус Россия** — российские сайты без VPN, только заблокирированные ресурсы

**Особенности:**
- Генерация криптостойких ключей WireGuard (Web Crypto API)
- Случайные IP-адреса для каждого сеанса (IPv4 + IPv6)
- Расширенные настройки: Private Key, DNS, MTU, Endpoint
- Прогресс-бар с этапами генерации
- Скачивание готового .conf файла
- Аккордеон для просмотра содержимого конфига

---

## Навигация

Нижняя навигационная панель с сохранением активного экрана в localStorage:

- **Подписки** — основной список RAW-ссылок
- **Инструкция** — руководство пользователя
- **Приложения** — VPN-клиенты и настройки
- **WARP** — генератор конфигураций

---

## Технологический стек

<div align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"/>
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/GitHub_API-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub API"/>
  <img src="https://img.shields.io/badge/Google_Fonts-4285F4?style=for-the-badge&logo=googlefonts&logoColor=white" alt="Google Fonts"/>
</div>

- Семантическая верстка HTML5 — корректное использование тегов
- CSS3 — CSS Variables (тёмная/светлая темы), Flexbox, Grid Layout, анимации
- JavaScript ES6+ — Fetch API, Crypto API (генерация ключей), LocalStorage (кэширование)
- GitHub REST API — чтение содержимого репозитория через CORS-прокси
- Google Fonts — шрифт Inter

---

---

## API и кэширование

- **Источник данных**: `https://api.github.com/repos/igareck/vpn-configs-for-russia/contents/`
- **CORS-прокси**: `https://corsproxy.io/?url=`
- **Кэширование**: localStorage, 30 минут
- **Принудительное обновление**: кнопка "Обновить" в статус-баре

---

## Категоризация файлов

| Категория | Условие в имени файла |
|-----------|----------------------|
| Чёрные списки | BLACK, SHADOWSOCKS |
| Белые списки | WHITE, CIDR, SNI |
| Tor Bridges | TOR, BRIDGE |
| Прочие | остальные файлы |

---

## Цветовая схема

| Роль | Тёмная тема | Светлая тема |
|------|-------------|--------------|
| Фон | `#0b0e11` | `#f7f8f9` |
| Карточки | `#181c21` | `#ffffff` |
| Акцент | `#7c8db5` | `#5b6e8d` |
| Текст основной | `#e6edf3` | `#1a1c20` |
| Текст второстепенный | `#8b949e` | `#5e6368` |
| Успех (зелёный) | `#57ab5a` | `#3e8e41` |

---

## Авторы

- **igareck** — поддержка и конфигурации
  - [vpn-configs-for-russia](https://github.com/igareck/vpn-configs-for-russia)
- **belozerov** — реализация веб-интерфейса
  - [GitHub](https://github.com/Belozerovmi)

---

<p align="center">made by belozerov</p>
