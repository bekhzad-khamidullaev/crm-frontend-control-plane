AGENTS.md — Руководство для фронтенд‑разработки (Next.js + Ant Design) с полным покрытием функционала Contora API

Обновлено: текущая версия. Этот документ описывает подход и стандарты разработки фронтенда на Next.js (App Router) с использованием Ant Design, React Query и генерации API‑клиента из OpenAPI схем для полного покрытия функционала бэкенда CRM (Django + DRF).

1. Архитектура фронтенда
- Стек:
  - Next.js 14+ (App Router, React Server Components там, где уместно)
  - TypeScript строго обязателен
  - Ant Design (antd v5) для UI
  - React Query (TanStack Query) для загрузки/кэширования данных
  - Zod для валидации форм (совместно с antd Form)
  - Axios в качестве HTTP‑клиента
  - OpenAPI codegen для типобезопасного API‑слоя
  - i18next для локализации
  - Jest + React Testing Library (юнит), Playwright (e2e)
- Принципы:
  - Типобезопасность от API до компонентов
  - Чистая архитектура: pages (маршруты) → виджеты/фичи → сущности → shared
  - Отделение UI (AntD) от бизнес‑логики и запросов
  - SRP/DRY/SOLID

2. Структура репозитория (отдельный фронтенд‑репозиторий)

repo/
  src/
    app/                   # Next.js App Router
      (auth)/              # Группа маршрутов для аутентификации
      dashboard/
      companies/
      contacts/
      leads/
      deals/
      tasks/
      projects/
      marketing/
      massmail/
      analytics/
      settings/
      voip/
      layout.tsx           # Общий layout (App Shell)
      page.tsx             # Главная/redirect
      api/                 # Next.js route handlers (минимально; основное API — внешний Django)
    shared/
      ui/                  # Общие UI-компоненты (обёртки над AntD)
      config/              # Конфиги, константы, env
      lib/                 # Утилиты (axios, форматирование, даты)
      hooks/               # Общие хуки
    entities/              # Базовые модели/виджеты: Company, Contact, Deal, Lead, Task, …
    features/              # Бизнес-фичи: фильтры, импорт/экспорт, теги, массприменение
    widgets/               # Композиции UI для страниц (таблицы, формы, панели)
    processes/             # Сложные бизнес‑процессы (лид → сделка и т.д.)
    pages_legacy/          # (опционально) SSR/CSR страницы вне App Router
  public/
  e2e/
  tests/
  scripts/
  .env.local.example
  package.json
  tsconfig.json
  next.config.js

3. Среда и переменные окружения
- NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
- NEXT_PUBLIC_WEB_BASE_URL=https://yourdomain.com
- NEXT_PUBLIC_SENTRY_DSN= (опционально)
- AUTH_JWT_STORAGE=cookies|localstorage (реком. cookies + httpOnly через бэкенд‑прокси)
- INTERNATIONALIZATION: i18n с fallback на en

4. Генерация API‑клиента из OpenAPI
- Бэкенд предоставляет openapi-schema.yml и/или openapi-schema-generated.yml
- Рекомендуемый инструмент: openapi-typescript-codegen или Orval
Пример (openapi-typescript-codegen):
  npx openapi-typescript-codegen \
    --input https://api.yourdomain.com/openapi-schema.yml \
    --output src/shared/api \
    --client axios

- После генерации в src/shared/api будут:
  - typed клиент
  - модели DTO
  - методы для путей (endpoints)
- Оборачиваем их в React Query hooks в src/shared/api/hooks.ts для кэширования, пагинации, мутаций и инвалидации ключей

5. Аутентификация и авторизация
- Поддерживаем JWT (эндпоинты: /token/, /token/refresh/, /token/verify/) и профиль /users/me/
- Потоки:
  - Sign In: POST /token/ → сохранить refresh в httpOnly cookie (через бэкенд‑прокси) и access в memory/имеющийся cookie для SSR
  - Token refresh: фоновое продление через route handler либо axios‑интерцептор
  - Sign Out: очистка cookies и кэша React Query
- Роли/права: использовать профиль пользователя и поля permission/group для условного рендера и доступов на UI

6. Навигация и соответствие функционалу CRM API
Ниже — основные разделы и соответствующие эндпоинты (см. openapi-schema.yml):
- Дашборды: /dashboard/activity, /dashboard/analytics, /dashboard/funnel
- Компании: /companies, /companies/{id}
- Контакты: /contacts, /contacts/{id}
- Сделки (Deals): /deals, /deals/{id}
- Лиды: /leads, /leads/{id}, /leads/{id}/convert, /leads/{id}/assign, /leads/{id}/disqualify, /leads/bulk_tag
- Задачи/Проекты: /tasks, /tasks/{id}, /projects, /projects/{id}, справочники стадий
- Маркетинг: /marketing/campaigns, /marketing/templates, /marketing/segments
- Массовые рассылки: /massmail/* (mailings, messages, signatures, email-accounts)
- Финансы: /payments, /outputs
- Справочники: /countries, /industries, /currencies (и /rates)
- Теги: /crm-tags, /task-tags
- Чаты: /chat-messages
- Телефония/VOIP: /voip/*, /call-logs, incoming calls
- Помощь/Документация: /help/pages, /help/paragraphs, /docs/
- Пользователи/Профиль: /users, /users/me, /profiles

Для каждого раздела создаём:
- Список (Table + Filters + Pagination + Column settings)
- Просмотр карточки (Drawer/Page)
- Создание/редактирование (Form + Validation)
- Массовые действия (где есть API)
- Экспорт/импорт (если есть эндпоинты)

7. Таблицы, фильтрация и пагинация
- Компоненты: AntD Table, Form, Input, Select, DatePicker, Tags
- Пагинация: серверная (DRF) — query params: page, page_size, ordering, search/filters
- Унифицированный хук useServerTable<T> с:
  - params: pagination, sorter, filters
  - сохранение состояния в URL (useSearchParams)
  - интеграция с React Query (queryKey = [entity, params])

8. Формы и валидация
- Антипаттерн: хранить всю форму в глобальном состоянии
- Правильно: antd Form + zodResolver (через @hookform/resolvers-zod или собственную обвязку)
- Обязательные поля/ограничения брать из схемы/DTO и серверных ошибок 400
- Стратегия ошибок: отображать field errors из DRF, общее уведомление через antd notification

9. Состояние и кеш
- React Query для данных с сервера
- Лёгкое локальное состояние через useState/useReducer, jotai/zustand для межкомпонентного UI (не данных сервера)
- Инвалидация по мутациям: invalidateQueries([entity]) после успешного create/update/delete

10. Обработка ошибок и безопасность
- Axios интерцепторы: 401 → refresh/redirect, 403 → показ недостатка прав, 5xx → fallback
- CSRF не требуется для чистого JWT; если используете session/csrf, проксируйте через Next route handlers
- В prod включить Sentry/логирование ошибок

11. UI/UX стандарты
- Единый App Layout: Header (поиск, профиль), Sider (меню), Content (хлебные крошки)
- Dark/light поддержка через antd theme
- Адаптивность: таблицы с горизонтальным скроллом, скрытие второстепенных колонок на мобиле
- Формы: максимум 2 колонки, группировка секций, явные подсказки

12. i18n
- i18next с разделением по namespace: common, crm, tasks, marketing, voip
- Переводы ключей в JSON, автозагрузка по локали
- Не хранить строки в коде — использовать t('key')

13. Тестирование
- Unit: Jest + RTL для компонентов/хуков
- API слой: контрактные тесты на основе сгенерированных типов
- e2e: Playwright, сценарии «критического пути»: логин, создание/редактирование сущностей, фильтры, массовые операции
- Покрытие: целимся 80%+, для критических фич 90%+

14. Соглашения по код‑стайлу и CI
- ESLint + @typescript-eslint + eslint-config-next
- Prettier + import/order
- Husky + lint-staged для pre-commit хуков (lint, typecheck, tests — fast)
- CI (GitLab):
  - lint → typecheck → unit tests → build → e2e (можно по расписанию/на метки)

15. Каркас страницы (пример)

'use client'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EntityTable } from '@/widgets/EntityTable'
import { useCompaniesTable } from '@/entities/company/table'

export default function CompaniesPage() {
  const table = useCompaniesTable()
  return (
    <>
      <PageHeader title="Компании" extra={table.headerActions} />
      <EntityTable {...table} />
    </>
  )
}

16. Настройка проекта (bootstrap)
- Инициализация:
  - pnpm dlx create-next-app@latest --ts
  - pnpm add antd @ant-design/icons @tanstack/react-query axios zod i18next react-i18next
  - pnpm add -D openapi-typescript-codegen jest @testing-library/react @testing-library/jest-dom playwright eslint-config-next husky lint-staged
- Настроить QueryClientProvider в корневом layout
- Подключить antd стили (import 'antd/dist/reset.css') и theme config
- Настроить openapi codegen скрипт в package.json: "codegen": "openapi --input ... --output src/shared/api --client axios"

17. Интеграция с бэкендом
- Базовый URL берём из NEXT_PUBLIC_API_BASE_URL
- JWT получаем с /token/; обновление /token/refresh/; профиль /users/me/
- Проверяем соответствие параметров пагинации/фильтров ожидаемым DRF
- Используем openapi-schema.yml (полный) как источник правды

18. Карта маршрутов (минимум)
- /dashboard
- /companies, /companies/[id]
- /contacts, /contacts/[id]
- /deals, /deals/[id]
- /leads, /leads/[id]
- /tasks, /tasks/[id]
- /projects, /projects/[id]
- /marketing/campaigns, /marketing/templates, /marketing/segments
- /massmail/mailings, /massmail/messages, /massmail/signatures, /massmail/email-accounts
- /analytics (графики/дашборды)
- /settings (профиль, предпочтения)
- /voip (статусы, звонки)

19. Производительность
- Использовать server components для SSR‑доступных данных без чувствительных токенов
- Оптимизировать таблицы (виртуализация при больших списках)
- Кэшировать справочники (статичные reference data) с долгим staleTime

20. Безопасность и соответствие
- Не хранить секреты в фронтенде
- HTTP‑заголовки безопасности на уровне Nginx/Next (Content Security Policy при необходимости)
- Маскировать PII в логах/ошибках

21. Релиз и деплой фронтенда
- Next build → статика на CDN/облачный хостинг или dockerized
- Версионирование через Git tags, CI публикует артефакты

22. Процесс разработки
- User Story → макеты → API контракт (OpenAPI) → реализация → ревью → тесты → e2e → релиз
- Для новых API: сначала обновить схемы на бэкенде и регенерировать клиент

23. Чек‑лист готовности фичи
- [ ] Экраны: список/карточка/форма
- [ ] Фильтры/пагинация/сортировка
- [ ] Права доступа/скрытие элементов
- [ ] Локализация ключей
- [ ] Unit + e2e тесты
- [ ] Документация в README раздела

Этот AGENTS.md регламентирует подход для полного покрытия функционала Contora API на фронтенде с использованием Next.js и Ant Design. Следуйте ему для единообразия, качества и масштабирумости проекта.
