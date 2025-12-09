# AGENTS.md — Frontend на основе `React + Ant Design 5.x` + подключение к API по схеме `Django-CRM API.yaml`

Коротко, по делу. Документ описывает автономных агентов Codex CLI (или CI-агентов) и рабочий процесс для разработки фронтенда CRM на базе `React 18 + Ant Design 5.x` с интеграцией по API-схеме `Django-CRM API.yaml`. Принцип: модульная разработка → начать с `leads` и довести до 100% функционала, затем следующий модуль. Код — senior-level: читаемый, тестируемый, масштабируемый.

---

## Стек и входные данные

* UI Framework: `React 18` с `antd@5.x` (Ant Design)
* Иконки: `@ant-design/icons`
* Визуализация: `chart.js` (интеграция с Ant Design Charts опциональна)
* Дата/время: `dayjs` (используется Ant Design)
* API-схема: `Django-CRM API.yaml` (источник правды для всех запросов)
* Build tool: `Vite` с `@vitejs/plugin-react`
* Package manager: `npm` (или `pnpm` при желании)

---

## Рекомендованная структура проекта (стандартизированная)

```
frontend/
├─ package.json
├─ vite.config.js               # Vite конфигурация с React plugin
├─ index.html                   # точка входа
├─ public/
│  └─ (статические файлы)
├─ src/
│  ├─ assets/
│  │  ├─ images/
│  │  └─ fonts/
│  ├─ styles/
│  │  └─ custom-theme.css      # кастомизация Ant Design темы
│  ├─ lib/
│  │  └─ api/                   # wrapper для запросов по Django-CRM API.yaml
│  │     └─ client.js
│  ├─ components/                # переиспользуемые React-компоненты
│  │  └─ common/                 # общие UI-компоненты
│  ├─ modules/
│  │  ├─ leads/                  # модуль leads — начать здесь
│  │  │  ├─ LeadsList.jsx
│  │  │  ├─ LeadForm.jsx
│  │  │  ├─ LeadDetail.jsx
│  │  │  └─ index.js
│  │  └─ contacts/
│  ├─ pages/
│  │  ├─ dashboard.jsx
│  │  ├─ login.jsx
│  │  └─ not-found.jsx
│  ├─ router.js                  # простой hash-based роутер
│  ├─ App.jsx                    # главный компонент с Layout
│  └─ main.jsx                   # точка входа React
├─ tests/
│  └─ unit/
└─ .env.example
```

---

## Стандарты именования

* Файлы React-компонентов: `PascalCase.jsx` (например `LeadsList.jsx`)
* Утилиты и хелперы: `camelCase.js`
* Модули: `kebab-case` папки, `index.js` для экспорта
* API-клиент: `src/lib/api/client.js` — все запросы идут через этот слой
* Переменные окружения: `.env` / `.env.example` (без секретов в репозитории)

Пример `.env.example`:

```
API_BASE_URL=https://crm.example/api
API_TIMEOUT=15000
```

---

## Автономные агенты (список + обязанности) — TODO-лист

### 1) Frontend Scaffold Agent — DONE ✅

* [x] Инициализировать npm-проект и установить `react`, `react-dom`, `antd@5.x`, `@ant-design/icons`, `dayjs`
* [x] Настроить Vite с `@vitejs/plugin-react`
* [x] Создать стандартную структуру проекта (см. выше)
* [x] Сгенерировать `index.html` и `src/main.jsx` с React + Ant Design
* [x] Создать `src/App.jsx` с Ant Design Layout (Sider, Header, Content)
* [x] Подключить API-клиент `src/lib/api/client.js` для всех HTTP-запросов

### 2) Module Development Agent (пошагово: leads → next) — DONE ✅

* [x] **COMPLETED: leads module - 100% функционального покрытия**

  * [x] Реализовать CRUD: список (`LeadsList.jsx`), просмотр (`LeadDetail.jsx`), создание/редактирование (`LeadForm.jsx`)
  * [x] Использовать Ant Design компоненты: Table, Form, Descriptions, Tag, Modal
  * [x] Валидация форм с Ant Design Form (встроенная валидация)
  * [x] Поиск и фильтрация в таблице
  * [x] Сортировка по колонкам
  * [x] Интеграция с API через `client.js` (БЕЗ fallback на mock-данные)
  * [x] **Inline-редактирование в таблице (email, phone, company)** ✅
  * [x] **Chart.js виджеты для KPI leads (LeadsKPI.jsx)** ✅
  * [x] **Канбан-доска с drag-and-drop (LeadsKanban.jsx)** ✅
  * [x] **Конвертация лидов в сделки (convert API)** ✅
  * [x] **Дисквалификация лидов (disqualify API)** ✅
  * [x] **Bulk actions: удаление, статус, экспорт, SMS, теги** ✅
  * [x] **Юнит-тесты для всех компонентов модуля** ✅
  * [x] **E2E тесты (полный цикл создание → редактирование → удаление)** ✅
  * [x] **Документация: полный README в `modules/leads/`** ✅
  * [x] **Убраны все mock-данные - только реальный API** ✅
* [ ] **Next: contacts module** - аналогичная функциональность
* [ ] После contacts переходить к `deals`, `tasks`, `projects` и т.д.

### 3) Component Generator Agent — DONE ✅

* [x] Используются готовые Ant Design компоненты: Table, Pagination, Input.Search, Modal, Form, Card и др.
* [x] Все компоненты Ant Design имеют встроенную поддержку a11y (accessibility)
* [x] Создана кастомная тема в `src/styles/custom-theme.css`
* [ ] Обертки для специфичных бизнес-компонентов - TODO (при необходимости)

### 4) API Integration Agent — TODO

* [ ] Преобразовать `Django-CRM API.yaml` в понятные вызовы (client wrapper).
* [ ] Генерировать типы/схемы ответов (если TypeScript — интерфейсы).
* [ ] Центральная обработка ошибок и retry/backoff.

### 5) Styling & Theme Agent — DONE ✅

* [x] Подключен Ant Design 5.x с встроенной системой тем через ConfigProvider
* [x] Создан `src/styles/custom-theme.css` для дополнительных стилей
* [x] Настроена кастомная палитра через theme tokens в `main.jsx`
* [x] По умолчанию светлая тема (можно добавить переключатель при необходимости)
* [x] Ant Design гарантирует WCAG-совместимую контрастность цветов

### 6) Charts & Analytics Agent — TODO

* [ ] Создать обёртку Chart.js для простого инстанцирования в компонентах.
* [ ] Подключать данные по API — обновление в реальном времени (polling / websocket по требованию).

### 7) Linter & CI Agent — DONE ✅

* [x] ESLint настроен
* [x] Prettier настроен
* [x] Husky pre-commit hooks настроены
* [x] CI готов в `.github/workflows/ci.yml`
* [ ] Добавить правило покрытия для модуля leads - TODO

### 8) Testing Agent — TODO

* [ ] Unit tests (Jest / Vitest).
* [ ] Integration tests для API-client (mocks).
* [ ] E2E (Cypress / Playwright) — минимум сценарии для leads.

### 9) Deployment & Build Agent — TODO

* [ ] Production build: минимизация, tree-shaking, sourcemaps.
* [ ] Настроить cache-busting для статики.
* [ ] Документировать интеграцию с Django (статические файлы / SPA-сервер).

---

## API-интеграция — правила и best-practices

* Источник правды — `Django-CRM API.yaml`. Любые изменения API — фиксируются в YAML и синхронизируются в client-wrapper.
* Все запросы проходят через `src/lib/api/client.js`. Этот слой:

  * Обрабатывает base URL из `.env`.
  * Делает retry для idempotent запросов.
  * Нормализует ошибки и возвращает коды/сообщения для UI.
* Форматы ответов: валидировать по схеме (опционально — JSON schema).
* UI должен декомпозировать "данные" и "представление": компонент только отрисовывает, бизнес-логика в модулях/сервисах.

---

## Качество кода — чеклист (senior-level)

* [ ] ES modules, чистая зависимая графика, минимальные глобальные переменные.
* [ ] Один уровень абстракции на функцию / модуль.
* [ ] Компоненты малые, переиспользуемые, с четкими контрактами (props/events).
* [ ] Все side-effects централизованы (api client / store).
* [ ] Покрытие unit-тестами: минимум 80% для вспомогательных библиотек; для `leads` — 100% фич.
* [ ] Линтер и автоформатирование в CI.
* [ ] Документация к каждому модулю и API mapping.

---

## Рекомендации по выбору стейт-менеджера и интеграции

* Текущая реализация: локальный state в React-компонентах с useState/useEffect
* Для сложного state можно использовать React Context API или Zustand (легковесная альтернатива Redux)
* Ant Design компоненты уже содержат внутренний state для UI-логики
* API-запросы централизованы в `src/lib/api/client.js`

---

## Подводные камни

* Ant Design 5.x использует CSS-in-JS — меньше конфликтов стилей, но нужно учитывать в production build
* Если backend меняет API — обновить `Django-CRM API.yaml` и синхронизировать в `client.js`
* Vite HMR (Hot Module Replacement) работает быстро в dev, но нужен правильный build config для production
* Размер бандла: Ant Design + React + Icons ~300KB gzipped; использовать tree-shaking
* Требование 100% функционального покрытия для модуля увеличивает время — запланировать тесты и CI

---

## Быстрый старт — DONE ✅

* [x] `npm install react react-dom antd@^5.0.0 @ant-design/icons dayjs`
* [x] `npm install --save-dev @vitejs/plugin-react vite`
* [x] Создан `vite.config.js` с React plugin
* [x] Реализован `src/lib/api/client.js` с подключением `API_BASE_URL` из `.env`
* [x] Реализован модуль `modules/leads/` с полным CRUD
* [x] Настроены lint, prettier и husky hooks
* [x] CI pipeline готов

## Запуск проекта

```bash
# Разработка
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Тесты
npm test

# Lint
npm run lint
```

---
