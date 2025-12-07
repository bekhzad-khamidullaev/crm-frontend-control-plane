# AGENTS.md — Frontend на основе `admin-lte@4.0.0-rc4` + подключение к API по схеме `Django-CRM API.yaml`

Коротко, по делу. Документ описывает автономных агентов Codex CLI (или CI-агентов) и рабочий процесс для разработки фронтенда CRM на базе `admin-lte@4.0.0-rc4` с интеграцией по API-схеме `Django-CRM API.yaml`. Принцип: модульная разработка → начать с `leads` и довести до 100% функционала, затем следующий модуль. Код — senior-level: читаемый, тестируемый, масштабируемый.

---

## Стек и входные данные

* UI-kit / шаблон: `npm install admin-lte@4.0.0-rc4`
* Визуализация: `chart.js`
* API-схема: `Django-CRM API.yaml` (источник правды для всех запросов)
* JS: современная модульная организация (ES Modules). Рекомендуется интеграция с Vue 3 если нужна компонентность; AdminLTE используется как UI-кит.
* Package manager: `npm` (или `pnpm` при желании).

---

## Рекомендованная структура проекта (стандартизированная)

```
frontend/
├─ package.json
├─ tailwind.config.js (опционально, если комбинируете)
├─ adminlte.config.js (интеграция/override переменных)
├─ public/
│  └─ index.html
├─ src/
│  ├─ assets/
│  │  ├─ images/
│  │  └─ fonts/
│  ├─ styles/
│  │  └─ adminlte-overrides.css
│  ├─ lib/
│  │  └─ api/                   # wrapper для запросов по Django-CRM API.yaml
│  │     └─ client.js
│  ├─ components/                # переиспользуемые UI-компоненты
│  │  └─ ui-*/                   # карточки, таблицы, формы
│  ├─ modules/
│  │  ├─ leads/                  # модуль leads — начать здесь
│  │  │  ├─ LeadsList.js
│  │  │  ├─ LeadForm.js
│  │  │  └─ index.js
│  │  └─ contacts/
│  ├─ pages/
│  │  ├─ dashboard.js
│  │  └─ settings.js
│  ├─ router.js (опционально)
│  └─ main.js
├─ tests/
│  └─ unit/
└─ .env.example
```

---

## Стандарты именования

* Файлы компонентов: `PascalCase.js` (или `.vue` если Vue используется).
* Модули: `kebab-case` папки, `index.js` для экспорта.
* API-клиент: `src/lib/api/client.js` — все запросы идут через этот слой.
* Переменные окружения: `.env` / `.env.example` (без секретов в репозитории).

Пример `.env.example`:

```
API_BASE_URL=https://crm.example/api
API_TIMEOUT=15000
```

---

## Автономные агенты (список + обязанности) — TODO-лист

### 1) Frontend Scaffold Agent — TODO

* [ ] Инициализировать npm-проект и установить `admin-lte@4.0.0-rc4`, `chart.js`.
* [ ] Создать стандартную структуру проекта (см. выше).
* [ ] Сгенерировать `public/index.html` с подключением AdminLTE CSS/JS.
* [ ] Создать `src/lib/api/client.js` — skeleton для всех HTTP-запросов (fetch/axios).

### 2) Module Development Agent (пошагово: leads → next) — TODO

* [ ] **Start: leads module**

  * [ ] Реализовать CRUD: список, просмотр, создание, редактирование, удаление.
  * [ ] Валидация форм на клиенте + отображение ошибок от API.
  * [ ] Inline-редактирование в таблице (editable cells).
  * [ ] Подключить Chart.js виджет для KPI leads.
  * [ ] Полная интеграция с эндпойнтами из `Django-CRM API.yaml`.
  * [ ] Юнит-тесты для бизнес-логики модуля.
  * [ ] E2E тест сценарии (создание → редактирование → удаление).
  * [ ] Документация: README в `modules/leads/` с описанием API-эндпойнтов, состояний и UI flows.
* [ ] После 100% покрытия `leads` переходить к `contacts`, далее `deals`, `tasks` и т.д.

### 3) Component Generator Agent — TODO

* [ ] Сгенерировать повторно используемые компоненты AdminLTE-стиля: таблица, пагинация, debounce search, modal wrapper.
* [ ] Все компоненты — доступные (a11y) и с тестами.

### 4) API Integration Agent — TODO

* [ ] Преобразовать `Django-CRM API.yaml` в понятные вызовы (client wrapper).
* [ ] Генерировать типы/схемы ответов (если TypeScript — интерфейсы).
* [ ] Центральная обработка ошибок и retry/backoff.

### 5) Styling & Theme Agent — TODO

* [ ] Подключить AdminLTE CSS и сделать минимальные переопределения в `adminlte-overrides.css` для палитры проекта (заменить переменные цветов в одном месте).
* [ ] Гарантировать только светлую тему (убрать/отключить переключатели тем).
* [ ] Проверить контрастность и доступность цветовой палитры.

### 6) Charts & Analytics Agent — TODO

* [ ] Создать обёртку Chart.js для простого инстанцирования в компонентах.
* [ ] Подключать данные по API — обновление в реальном времени (polling / websocket по требованию).

### 7) Linter & CI Agent — TODO

* [ ] Настроить ESLint + Prettier + Husky pre-commit hooks.
* [ ] Добавить CI (GitLab/GitHub Actions) — pipelines: lint → test → build.
* [ ] Добавить правило: merge только если module coverage (leads) = 100% перед дальнейшими мержами функционального кода.

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

* Для простоты: локальный state в компонентах + простой централизованный `store` (singleton service).
* Если применяете Vue/React — использовать Pinia/Redux.
* AdminLTE использовать как UI-kit; логику и компоненты писать отдельно, не менять исходники пакета.

---

## Подводные камни

* AdminLTE версии RC — возможны breaking changes; pin версии в `package.json`.
* Если backend меняет API — обновить `Django-CRM API.yaml` и регенерировать client wrapper.
* Встраивание большого UI-кита + framework — возможны конфликты CSS; держать переопределения минимальными и централизованными.
* Требование 100% функционального покрытия для модуля увеличивает время — запланировать тесты и CI.

---

## Быстрый старт — TODO (развернуть вручную)

* [ ] `npm init -y`
* [ ] `npm i admin-lte@4.0.0-rc4 chart.js`
* [ ] Создать `src/lib/api/client.js` и подключить `API_BASE_URL` из `.env`
* [ ] Реализовать `modules/leads/` минимально: список + создание (получение данных из `Django-CRM API.yaml`)
* [ ] Настроить lint, тесты и CI

---
