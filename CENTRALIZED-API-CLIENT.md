# 🔧 Централизованный API клиент с автоматической аутентификацией

## 🎯 Цель

Создать надежный API клиент с:
- ✅ Автоматическая отправка JWT токена
- ✅ Автоматический refresh при истечении токена
- ✅ Централизованная обработка ошибок
- ✅ Retry механизм для failed запросов
- ✅ Request/Response interceptors
- ✅ Единая точка конфигурации

---

## 📋 Что будет улучшено

### 1. **Автоматический Refresh токенов**
```javascript
// Если access токен истек:
// 1. Автоматически запросить новый через refresh token
// 2. Повторить оригинальный запрос с новым токеном
// 3. Если refresh не удался - редирект на /login
```

### 2. **Централизованная обработка ошибок**
```javascript
// 401 Unauthorized → автоматический refresh или logout
// 403 Forbidden → показать сообщение
// 404 Not Found → показать сообщение
// 500 Server Error → показать сообщение и retry
// Network Error → показать offline уведомление
```

### 3. **Request Queue**
```javascript
// Если идет refresh токена:
// 1. Поставить все запросы в очередь
// 2. После refresh выполнить все из очереди
// 3. Избежать race conditions
```

### 4. **Interceptors**
```javascript
// Request interceptor:
// - Добавить токен автоматически
// - Добавить custom headers
// - Логирование запросов (dev mode)

// Response interceptor:
// - Обработка ошибок
// - Трансформация данных
// - Логирование ответов (dev mode)
```

---

## 🚀 Улучшенная версия client.js

См. файл с обновленным кодом ниже.

---

## 📊 Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    React Component                       │
│                  (calls api.get())                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  API Client (client.js)                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │        Request Interceptor                        │  │
│  │  • Add Authorization header                       │  │
│  │  • Add custom headers                             │  │
│  │  • Check token expiration                         │  │
│  └───────────────────┬───────────────────────────────┘  │
│                      │                                   │
│                      ▼                                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │          Token expired?                           │  │
│  │          ┌──────────┐                             │  │
│  │    NO ◄──┤  Check   │──► YES                      │  │
│  │     │    └──────────┘     │                       │  │
│  │     │                     ▼                       │  │
│  │     │            ┌─────────────────┐              │  │
│  │     │            │  Refresh Token  │              │  │
│  │     │            │  (auto retry)   │              │  │
│  │     │            └────────┬────────┘              │  │
│  │     │                     │                       │  │
│  │     │           Success ◄─┴─► Failed             │  │
│  │     │              │            │                 │  │
│  │     ▼              ▼            ▼                 │  │
│  │  ┌──────────────────────────────────────────┐    │  │
│  │  │        Fetch Request                     │    │  │
│  │  └──────────────────┬───────────────────────┘    │  │
│  │                     │                             │  │
│  │                     ▼                             │  │
│  │  ┌──────────────────────────────────────────┐    │  │
│  │  │       Response Interceptor               │    │  │
│  │  │  • Handle errors (401, 403, 500, etc.)   │    │  │
│  │  │  • Transform data                        │    │  │
│  │  │  • Show notifications                    │    │  │
│  │  └──────────────────┬───────────────────────┘    │  │
│  └────────────────────┼────────────────────────────┘  │
└───────────────────────┼───────────────────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │   Component   │
                │ (gets data)   │
                └───────────────┘
```

---

## 🔑 Ключевые функции

### 1. **Auto Refresh**
```javascript
// Автоматически обновляет токен если истек
const response = await api.get('/contacts/');
// Если токен истек:
// 1. Запрос refresh token
// 2. Сохранить новый access token
// 3. Повторить запрос /contacts/
// 4. Вернуть результат
```

### 2. **Request Queue**
```javascript
// Если несколько запросов одновременно и токен истек:
// 1. Первый запрос инициирует refresh
// 2. Остальные ждут в очереди
// 3. После refresh все выполняются с новым токеном
```

### 3. **Error Handling**
```javascript
try {
  const data = await api.get('/contacts/');
} catch (error) {
  // error.status - HTTP статус
  // error.message - сообщение
  // error.details - детали от сервера
}
```

---

## 💡 Использование

### Базовые запросы:
```javascript
import { api } from './lib/api/client';

// GET
const contacts = await api.get('/contacts/');

// POST
const newContact = await api.post('/contacts/', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PATCH
const updated = await api.patch('/contacts/1/', {
  email: 'newemail@example.com'
});

// DELETE
await api.delete('/contacts/1/');
```

### С параметрами:
```javascript
// Query parameters
const filtered = await api.get('/contacts/', {
  params: {
    page: 1,
    page_size: 20,
    search: 'john'
  }
});
// Запрос: /contacts/?page=1&page_size=20&search=john
```

### С custom headers:
```javascript
const data = await api.post('/upload/', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

---

## 🎯 Преимущества

### До (старый клиент):
```javascript
// Нужно вручную проверять токен
const token = getToken();
if (!token || isTokenExpired(token)) {
  // Manually refresh
  const newToken = await refreshToken();
  setToken(newToken);
}

// Вручную добавлять заголовки
const response = await fetch('/api/contacts/', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Вручную обрабатывать ошибки
if (response.status === 401) {
  // Manually handle
}
```

### После (новый клиент):
```javascript
// Всё автоматически!
const contacts = await api.get('/contacts/');
// - Токен добавляется автоматически
// - Refresh выполняется автоматически
// - Ошибки обрабатываются централизованно
```

---

## 🔧 Конфигурация

### Настройка базового URL:
```javascript
// В .env
VITE_API_BASE_URL=http://localhost:8000
```

### Настройка timeouts:
```javascript
// client.js
const API_TIMEOUT = 30000; // 30 секунд
```

### Включить debug mode:
```javascript
// client.js
const DEBUG = import.meta.env.DEV; // true в dev mode
```

---

## 🧪 Тестирование

### 1. Проверка auto-refresh:
```javascript
// Используйте старый токен (истекший)
localStorage.setItem('crm_access_token', 'expired_token');

// Сделайте запрос
const contacts = await api.get('/contacts/');

// Должно автоматически:
// 1. Обнаружить что токен истек
// 2. Запросить refresh
// 3. Получить новый токен
// 4. Повторить запрос /contacts/
// 5. Вернуть данные
```

### 2. Проверка error handling:
```javascript
// Запрос к несуществующему endpoint
try {
  await api.get('/nonexistent/');
} catch (error) {
  console.log(error.status); // 404
  console.log(error.message); // "Not Found"
}
```

---

## 📚 API Reference

### `api.get(path, options)`
Выполняет GET запрос.

**Parameters:**
- `path` (string) - URL path (например `/contacts/`)
- `options` (object) - Опции запроса
  - `params` (object) - Query parameters
  - `headers` (object) - Custom headers

**Returns:** Promise<any>

### `api.post(path, data, options)`
Выполняет POST запрос.

**Parameters:**
- `path` (string) - URL path
- `data` (any) - Request body
- `options` (object) - Опции запроса

**Returns:** Promise<any>

### `api.patch(path, data, options)`
Выполняет PATCH запрос.

### `api.put(path, data, options)`
Выполняет PUT запрос.

### `api.delete(path, options)`
Выполняет DELETE запрос.

---

## 🎉 Готово!

Централизованный API клиент готов к использованию!

**Преимущества:**
- ✅ Автоматический refresh токенов
- ✅ Централизованная обработка ошибок
- ✅ Request/Response interceptors
- ✅ Retry механизм
- ✅ Debug mode
- ✅ Единая точка конфигурации

**Используйте везде:**
```javascript
import { api } from './lib/api/client';
const data = await api.get('/endpoint/');
```

Всё остальное работает автоматически! 🚀
