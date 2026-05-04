# Auth Guard Documentation

## Описание

Auth Guard - это система защиты роутов от неавторизованного доступа в CRM приложении. Она автоматически проверяет JWT токены и перенаправляет пользователей на страницу входа при необходимости.

## Возможности

- ✅ Автоматическая проверка авторизации при изменении роута
- ✅ Проверка срока действия JWT токена
- ✅ Автоматический редирект на /login для неавторизованных пользователей
- ✅ Автоматический редирект на /dashboard для авторизованных пользователей, пытающихся попасть на /login
- ✅ Поддержка публичных роутов (не требующих авторизации)
- ✅ Логирование попыток несанкционированного доступа

## API

### `checkAuth(route, requireAuth)`

Проверяет авторизацию для конкретного роута.

**Параметры:**
- `route` (object) - Объект роута с полем `name`
- `requireAuth` (boolean) - Требуется ли авторизация (по умолчанию `true`)

**Возвращает:**
- `boolean` - `true` если доступ разрешен, `false` если нет

**Пример:**
```javascript
import { checkAuth } from './lib/auth-guard';

const hasAccess = checkAuth({ name: 'dashboard' }, true);
if (hasAccess) {
  // Загрузить компонент
}
```

### `authGuardMiddleware(route, routeMeta)`

Middleware для автоматической проверки при изменении роута.

**Параметры:**
- `route` (object) - Объект роута
- `routeMeta` (object) - Метаданные роута с полем `auth`

**Возвращает:**
- `boolean` - `true` если доступ разрешен

**Пример:**
```javascript
import { authGuardMiddleware } from './lib/auth-guard';
import { getRouteMeta } from './router';

onRouteChange((newRoute) => {
  const meta = getRouteMeta(newRoute.name);
  if (!authGuardMiddleware(newRoute, meta)) {
    // Доступ запрещен, произошел редирект
    return;
  }
  // Продолжить обработку роута
});
```

### `getAuthStatus()`

Получает текущий статус авторизации.

**Возвращает:**
```typescript
{
  authenticated: boolean,  // Авторизован ли пользователь
  tokenValid: boolean,     // Валиден ли токен
  user: object | null      // Информация о пользователе
}
```

**Пример:**
```javascript
import { getAuthStatus } from './lib/auth-guard';

const status = getAuthStatus();
console.log('Authenticated:', status.authenticated);
console.log('Token valid:', status.tokenValid);
```

### `useAuthGuard(redirect)`

Hook-like функция для использования в компонентах.

**Параметры:**
- `redirect` (boolean) - Нужно ли редиректить если не авторизован (по умолчанию `true`)

**Возвращает:**
- `boolean` - `true` если авторизован

**Пример:**
```javascript
import { useAuthGuard } from './lib/auth-guard';

function ProtectedComponent() {
  const isAuth = useAuthGuard(); // Автоматически редиректит на login
  
  if (!isAuth) {
    return null;
  }
  
  return <div>Protected content</div>;
}
```

## Интеграция в App.jsx

Auth Guard уже интегрирован в главный компонент приложения:

```javascript
import { isAuthenticated, getToken, clearToken } from './lib/api/auth';

useEffect(() => {
  // Проверка при монтировании
  const authenticated = isAuthenticated();
  
  if (authenticated) {
    // Инициализация для авторизованного пользователя
    initializeApp();
  } else {
    // Редирект на login
    navigate('/login');
  }

  // Проверка при каждом изменении роута
  const unsubscribe = onRouteChange((newRoute) => {
    const authenticated = isAuthenticated();
    
    if (newRoute.name !== 'login' && !authenticated) {
      navigate('/login');
      return;
    }
    
    if (newRoute.name === 'login' && authenticated) {
      navigate('/dashboard');
      return;
    }
  });

  return unsubscribe;
}, []);
```

## Конфигурация роутов

В `router.js` настраивается требование авторизации для каждого роута:

```javascript
export const routeMeta = {
  'login': { auth: false },      // Публичный роут
  'dashboard': { auth: true },   // Требует авторизацию
  'leads-list': { auth: true },
  // ...
};
```

## Автоматический refresh токена

При истечении access token происходит автоматическая попытка обновления через refresh token (реализовано в `client.js`):

1. При каждом запросе проверяется срок действия токена
2. Если токен истек, отправляется запрос на `POST /api/token/refresh/`
3. При успехе - обновляется access token и запрос повторяется
4. При ошибке - пользователь выкидывается на страницу входа

```javascript
// Из client.js
if (token && isTokenExpired(token)) {
  await refreshAccessToken();
}

// При 401 ошибке
if (res.status === 401 && !isAuthEndpoint) {
  await refreshAccessToken();
  return request(method, path, { params, body, headers, retry: true });
}
```

## Обработка ошибок авторизации

### 401 Unauthorized

При получении 401 ответа от API:
1. Попытка обновить токен через refresh token
2. Если refresh token невалиден - очистка токенов и редирект на login
3. Все pending запросы ставятся в очередь и выполняются после refresh

### Token Expired

При локальной проверке токена:
1. Проверка поля `exp` в JWT payload
2. Если токен истек - автоматический refresh или редирект

### No Token

Если токена нет совсем:
1. Немедленный редирект на `/login`
2. Все WebSocket соединения закрываются

## Логирование

Auth Guard логирует все попытки несанкционированного доступа:

```javascript
console.warn('Unauthorized access attempt, redirecting to login');
console.warn('[AuthGuard] Token expired, redirecting to login');
console.log('[AuthGuard] Already authenticated, redirecting to dashboard');
```

## Тестирование

Полное покрытие тестами в `tests/unit/auth-guard.test.js`:

```bash
npm test auth-guard
```

Тесты покрывают:
- ✅ Доступ авторизованных пользователей
- ✅ Блокировка неавторизованных пользователей
- ✅ Публичные роуты
- ✅ Истечение токена
- ✅ Редирект с login на dashboard для авторизованных

## Best Practices

### 1. Всегда проверяйте авторизацию в компонентах

```javascript
function MyComponent() {
  const isAuth = useAuthGuard();
  
  if (!isAuth) return null;
  
  return <div>...</div>;
}
```

### 2. Используйте routeMeta для конфигурации

```javascript
// В router.js
'my-route': { auth: true, title: 'My Route' }
```

### 3. Обрабатывайте логаут правильно

```javascript
const handleLogout = () => {
  clearToken();  // Очистить токены
  disconnectWebSockets();  // Закрыть соединения
  setUser(null);  // Очистить state
  navigate('/login');  // Редирект
};
```

### 4. Не храните чувствительные данные в localStorage

JWT токены шифруются и безопасны, но не храните пароли или другие секреты в браузере.

## Troubleshooting

### Проблема: Бесконечный редирект

**Причина:** Роут login помечен как требующий авторизацию

**Решение:** Убедитесь что в routeMeta для login указано `auth: false`

### Проблема: Токен истекает слишком быстро

**Причина:** Backend настроен на короткий TTL для access token

**Решение:** Настройте refresh token и увеличьте TTL в Django settings

### Проблема: После логаута остаются данные

**Причина:** State не очищается полностью

**Решение:** Очищайте весь state и WebSocket соединения при логауте

## См. также

- `src/lib/api/auth.js` - Утилиты для работы с токенами
- `src/lib/api/client.js` - HTTP клиент с auto-refresh
- `src/router.js` - Роутер приложения
- `src/App.jsx` - Интеграция Auth Guard
