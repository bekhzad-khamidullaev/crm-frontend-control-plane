# 🔄 Исправление Бесконечного Цикла Редиректов

## Проблема
Frontend застревал в бесконечном цикле редиректов между `/login` и `/dashboard`.

## Причина
1. **DEMO_MODE = true по умолчанию** в `src/lib/api/auth.js`
2. `isAuthenticated()` всегда возвращал `true` из-за DEMO_MODE
3. App.jsx думал что пользователь авторизован
4. API запросы возвращали 401 (нет токена)
5. client.js редиректил на `/login`
6. App.jsx снова видел auth=true → редирект на `/dashboard`
7. **ЦИКЛ ПОВТОРЯЛСЯ**

## Решение

### 1. Добавлен VITE_DEMO_MODE в .env
```env
# Demo Mode - set to false to require real authentication
VITE_DEMO_MODE=false
```

### 2. Предотвращение повторных редиректов
Добавлена проверка в `client.js`:
```javascript
if (typeof window !== 'undefined' && !window.location.hash.includes('/login')) {
  window.location.hash = '/login';
  setTimeout(() => window.location.reload(), 100);
}
```

Это предотвращает редирект если уже на странице login.

## Использование

### Production (требует авторизацию)
```env
VITE_DEMO_MODE=false
```

### Development/Demo (без авторизации)
```env
VITE_DEMO_MODE=true
```

## Проверка
1. Убедитесь что `.env` содержит `VITE_DEMO_MODE=false`
2. Перезапустите dev server: `npm run dev`
3. Откройте браузер
4. Должна показаться страница login без редиректов

## Измененные файлы
- ✅ `.env` - добавлен VITE_DEMO_MODE=false
- ✅ `.env.example` - добавлен VITE_DEMO_MODE=false
- ✅ `src/lib/api/client.js` - предотвращение повторных редиректов (3 места)

