/* eslint-disable no-dupe-keys, no-undef */
import legacyContent from '../../locales/legacy-content.json';

const textOriginals = new WeakMap();
const attrOriginals = new WeakMap();
const attrsToTranslate = ['placeholder', 'title', 'aria-label', 'alt'];
const localeCaches = new Map();

let observer = null;
let activeLocale = 'ru';
const hasCyrillic = /[А-Яа-яЁё]/;
const hasLatin = /[A-Za-z]/;

const fallbackWordMaps = {
  en: {
    Пользователь: 'User',
    'Профиль пользователя': 'User profile',
    'Детали звонка': 'Call details',
    Количество: 'Count',
    Сумма: 'Amount',
    запрос: 'request',
    'анализ запроса': 'analysis of request',
    'уточнение требований': 'clarification of the requirements',
    'ценовое предложение': 'price offer',
    'коммерческое предложение': 'commercial proposal',
    'коммерческий оффер': 'commercial offer',
    договор: 'agreement',
    инвойс: 'invoice',
    'получение первого платежа': 'receiving the first payment',
    отгрузка: 'shipment',
    'успешно закрыто': 'closed (successful)',
    завершено: 'completed',
    отменено: 'cancelled',
    входящий: 'inbound',
    исходящий: 'outbound',
    Поиск: 'Search',
    Период: 'Period',
    Преимущества: 'Benefits',
    Форма: 'Form',
    'Форма заявки': 'Request form',
    Связаться: 'Contact',
    'Оставить заявку': 'Leave request',
    Команда: 'Team',
    'Последнее обновление': 'Last updated',
    обновления: 'updates',
    'Следующий шаг': 'Next step',
    Направление: 'Direction',
    Создан: 'Created',
    Тарифы: 'Pricing',
    'Рабочий email': 'Work email',
    Вероятность: 'Probability',
    Деактивировать: 'Deactivate',
    'Всего лидов': 'Total leads',
    'Воронка продаж': 'Sales funnel',
    ФИО: 'Full name',
    'Поиск по названию...': 'Search by name...',
    'Поиск по названию, email, телефону...': 'Search by name, email, phone...',
    Регион: 'Region',
    'Загрузка...': 'Loading...',
    Начало: 'Start',
    Конец: 'End',
    Экспорт: 'Export',
    'Очистить фильтры': 'Clear filters',
    Никогда: 'Never',
    Заметка: 'Note',
    'Заметка добавлена': 'Note added',
    'Добавьте текст заметки': 'Add note text',
    Всего: 'Total',
    Пропущено: 'Missed',
    Пропущен: 'Missed',
    Завершен: 'Completed',
    Звонит: 'Ringing',
    Запись: 'Recording',
    Кампания: 'Campaign',
    'Краткое описание': 'Short description',
    'Дополнительная информация': 'Additional information',
    создать: 'create',
    обновить: 'update',
    'Договор №': 'Contract #',
    'Счет №': 'Invoice #',
    'Заказ №': 'Order #',
    Платеж: 'Payment',
    'Поиск по платежам...': 'Search payments...',
    'Например:': 'For example:',
    Например: 'For example',
    'Не удалось': 'Failed to',
    Выберите: 'Select',
    Введите: 'Enter',
    Укажите: 'Specify',
    режим: 'mode',
    Режим: 'Mode',
    внутренний: 'internal',
    внешний: 'external',
    номер: 'number',
    Номер: 'Number',
    токен: 'token',
    Токен: 'Token',
    провайдер: 'provider',
    Провайдер: 'Provider',
    канал: 'channel',
    Канал: 'Channel',
    страница: 'page',
    Страница: 'Page',
    аккаунт: 'account',
    Аккаунт: 'Account',
    идентификатор: 'identifier',
    Идентификатор: 'Identifier',
    сохранены: 'saved',
    сохранить: 'save',
    загружена: 'loaded',
    загружены: 'loaded',
    настроен: 'configured',
    настроена: 'configured',
    настройки: 'settings',
    сообщение: 'message',
    сообщений: 'messages',
    звонок: 'call',
    звонков: 'calls',
    длительность: 'duration',
    статус: 'status',
    Сценарий: 'Scenario',
    сценарий: 'scenario',
    Описание: 'Description',
    завершить: 'complete',
    Завершить: 'Complete',
    логин: 'login',
    пароль: 'password',
    Скопировать: 'Copy',
    средняя: 'average',
    Средняя: 'Average',
    мин: 'min',
    Подключено: 'Connected',
    'Не подключено': 'Not connected',
    Ошибка: 'Error',
    Обновить: 'Refresh',
    Настройки: 'Settings',
    Настроить: 'Configure',
    Подключить: 'Connect',
    Отключить: 'Disconnect',
    Сохранить: 'Save',
    Отмена: 'Cancel',
    Удалить: 'Delete',
    Редактировать: 'Edit',
    'По умолчанию': 'Default',
    Пауза: 'Paused',
    Тест: 'Test',
    Статус: 'Status',
    Действия: 'Actions',
    Название: 'Name',
    Провайдер: 'Provider',
    Провайдеров: 'Providers',
    Модель: 'Model',
    Ключ: 'Key',
    Активен: 'Active',
    Активных: 'Active',
    'Последняя активность': 'Last activity',
    Синхронизация: 'Sync',
  },
  uz: {
    User: 'Foydalanuvchi',
    'User profile': 'Foydalanuvchi profili',
    'Call details': "Qo'ng'iroq tafsilotlari",
    Count: 'Soni',
    Amount: 'Summa',
    request: "so'rov",
    'analysis of request': "so'rov tahlili",
    'clarification of the requirements': 'talablarni aniqlashtirish',
    'price offer': 'narx taklifi',
    'commercial proposal': 'tijorat taklifi',
    'commercial offer': 'tijoriy offer',
    agreement: 'shartnoma',
    invoice: 'hisob-faktura',
    'receiving the first payment': "birinchi to'lovni olish",
    shipment: 'yetkazib berish',
    'closed (successful)': 'muvaffaqiyatli yopildi',
    completed: 'yakunlandi',
    canceled: 'bekor qilindi',
    cancelled: 'bekor qilindi',
    inbound: 'kiruvchi',
    outbound: 'chiquvchi',
    Failed: 'Xato',
    Поиск: 'Qidirish',
    Период: 'Davr',
    Преимущества: 'Afzalliklar',
    Форма: 'Forma',
    'Форма заявки': 'So‘rov formasi',
    Связаться: "Bog'lanish",
    'Оставить заявку': 'So‘rov qoldirish',
    Команда: 'Jamoa',
    'Последнее обновление': "So'nggi yangilanish",
    обновления: 'yangilanishlar',
    'Следующий шаг': 'Keyingi qadam',
    Направление: "Yo'nalish",
    Создан: 'Yaratilgan',
    Тарифы: 'Tariflar',
    'Рабочий email': 'Ishchi email',
    Вероятность: 'Ehtimollik',
    Деактивировать: 'Faolsizlantirish',
    'Всего лидов': 'Jami lidlar',
    'Воронка продаж': 'Savdo voronkasi',
    ФИО: "To'liq ism",
    'Поиск по названию...': 'Nom bo‘yicha qidirish...',
    'Поиск по названию, email, телефону...': 'Nom, email, telefon bo‘yicha qidirish...',
    Регион: 'Hudud',
    'Загрузка...': 'Yuklanmoqda...',
    Начало: 'Boshlanish',
    Конец: 'Tugash',
    Экспорт: 'Eksport',
    'Очистить фильтры': 'Filtrlarni tozalash',
    Никогда: 'Hech qachon',
    Заметка: 'Eslatma',
    'Заметка добавлена': "Eslatma qo'shildi",
    'Добавьте текст заметки': 'Eslatma matnini kiriting',
    Всего: 'Jami',
    Пропущено: "O'tkazib yuborilgan",
    Пропущен: "O'tkazib yuborilgan",
    Завершен: 'Yakunlangan',
    Звонит: "Qo'ng'iroq qilmoqda",
    Запись: 'Yozuv',
    Кампания: 'Kampaniya',
    'Краткое описание': 'Qisqa tavsif',
    'Дополнительная информация': "Qo'shimcha ma'lumot",
    создать: 'yaratish',
    обновить: 'yangilash',
    'Договор №': 'Shartnoma №',
    'Счет №': 'Hisob №',
    'Заказ №': 'Buyurtma №',
    Платеж: "To'lov",
    'Поиск по платежам...': "To'lovlar bo'yicha qidirish...",
    'Например:': 'Masalan:',
    Например: 'Masalan',
    'Не удалось': 'Muvaffaqiyatsiz',
    Выберите: 'Tanlang',
    Введите: 'Kiriting',
    Укажите: 'Ko‘rsating',
    режим: 'rejim',
    Режим: 'Rejim',
    внутренний: 'ichki',
    внешний: 'tashqi',
    номер: 'raqam',
    Номер: 'Raqam',
    токен: 'token',
    Токен: 'Token',
    провайдер: 'provayder',
    Провайдер: 'Provayder',
    канал: 'kanal',
    Канал: 'Kanal',
    страница: 'sahifa',
    Страница: 'Sahifa',
    аккаунт: 'hisob',
    Аккаунт: 'Hisob',
    идентификатор: 'identifikator',
    Идентификатор: 'Identifikator',
    сохранены: 'saqlandi',
    сохранить: 'saqlash',
    загружена: 'yuklandi',
    загружены: 'yuklandi',
    настроен: 'sozlangan',
    настроена: 'sozlangan',
    настройки: 'sozlamalar',
    сообщение: 'xabar',
    сообщений: 'xabarlar',
    звонок: "qo'ng'iroq",
    звонков: "qo'ng'iroqlar",
    длительность: 'davomiylik',
    статус: 'holat',
    Сценарий: 'Ssenariy',
    сценарий: 'ssenariy',
    Описание: 'Tavsif',
    завершить: 'yakunlash',
    Завершить: 'Yakunlash',
    логин: 'login',
    пароль: 'parol',
    Скопировать: 'Nusxalash',
    средняя: "o'rtacha",
    Средняя: "O'rtacha",
    мин: 'daq',
    Подключено: 'Ulangan',
    'Не подключено': 'Ulanmagan',
    Ошибка: 'Xato',
    Обновить: 'Yangilash',
    Настройки: 'Sozlamalar',
    Настроить: 'Sozlash',
    Подключить: 'Ulash',
    Отключить: 'Uzish',
    Сохранить: 'Saqlash',
    Отмена: 'Bekor qilish',
    Удалить: "O'chirish",
    Редактировать: 'Tahrirlash',
    'По умолчанию': 'Sukut bo‘yicha',
    Пауза: 'Pauza',
    Тест: 'Test',
    Статус: 'Holat',
    Действия: 'Amallar',
    Название: 'Nomi',
    Провайдер: 'Provayder',
    Провайдеров: 'Provayderlar',
    Модель: 'Model',
    Ключ: 'Kalit',
    Активен: 'Faol',
    Активных: 'Faol',
    'Последняя активность': "So'nggi faollik",
    Синхронизация: 'Sinxronlash',
  },
  ru: {
    User: 'Пользователь',
    'User profile': 'Профиль пользователя',
    'Call details': 'Детали звонка',
    Count: 'Количество',
    Amount: 'Сумма',
    request: 'запрос',
    'analysis of request': 'анализ запроса',
    'clarification of the requirements': 'уточнение требований',
    'price offer': 'ценовое предложение',
    'commercial proposal': 'коммерческое предложение',
    'commercial offer': 'коммерческий оффер',
    agreement: 'договор',
    invoice: 'инвойс',
    'receiving the first payment': 'получение первого платежа',
    shipment: 'отгрузка',
    'closed (successful)': 'успешно закрыто',
    completed: 'завершено',
    canceled: 'отменено',
    cancelled: 'отменено',
    inbound: 'входящий',
    outbound: 'исходящий',
    Failed: 'Ошибка',
    Search: 'Поиск',
    Period: 'Период',
    Benefits: 'Преимущества',
    Form: 'Форма',
    'Request form': 'Форма заявки',
    Contact: 'Связаться',
    'Leave request': 'Оставить заявку',
    Team: 'Команда',
    'Last updated': 'Последнее обновление',
    updates: 'обновления',
    'Next step': 'Следующий шаг',
    Direction: 'Направление',
    Created: 'Создан',
    Pricing: 'Тарифы',
    'Work email': 'Рабочий email',
    Probability: 'Вероятность',
    Deactivate: 'Деактивировать',
    'Total leads': 'Всего лидов',
    'Sales funnel': 'Воронка продаж',
    'Full name': 'ФИО',
    'Search by name...': 'Поиск по названию...',
    'Search by name, email, phone...': 'Поиск по названию, email, телефону...',
    Region: 'Регион',
    'Loading...': 'Загрузка...',
    Start: 'Начало',
    End: 'Конец',
    Export: 'Экспорт',
    'Clear filters': 'Очистить фильтры',
    Never: 'Никогда',
    Note: 'Заметка',
    'Note added': 'Заметка добавлена',
    'Add note text': 'Добавьте текст заметки',
    Total: 'Всего',
    Missed: 'Пропущено',
    Completed: 'Завершен',
    Ringing: 'Звонит',
    Recording: 'Запись',
    Campaign: 'Кампания',
    'Short description': 'Краткое описание',
    'Additional information': 'Дополнительная информация',
    create: 'создать',
    update: 'обновить',
    'Contract #': 'Договор №',
    'Invoice #': 'Счет №',
    'Order #': 'Заказ №',
    Payment: 'Платеж',
    'Search payments...': 'Поиск по платежам...',
    'For example:': 'Например:',
    'For example': 'Например',
    'Failed to': 'Не удалось',
    Select: 'Выберите',
    Enter: 'Введите',
    Specify: 'Укажите',
    mode: 'режим',
    Mode: 'Режим',
    internal: 'внутренний',
    external: 'внешний',
    number: 'номер',
    Number: 'Номер',
    token: 'токен',
    Token: 'Токен',
    provider: 'провайдер',
    Provider: 'Провайдер',
    channel: 'канал',
    Channel: 'Канал',
    page: 'страница',
    Page: 'Страница',
    account: 'аккаунт',
    Account: 'Аккаунт',
    identifier: 'идентификатор',
    Identifier: 'Идентификатор',
    saved: 'сохранено',
    loaded: 'загружено',
    configured: 'настроен',
    settings: 'настройки',
    message: 'сообщение',
    messages: 'сообщения',
    call: 'звонок',
    calls: 'звонки',
    duration: 'длительность',
    status: 'статус',
    Scenario: 'Сценарий',
    scenario: 'сценарий',
    Description: 'Описание',
    Complete: 'Завершить',
    complete: 'завершить',
    login: 'логин',
    password: 'пароль',
    Copy: 'Скопировать',
    Average: 'Средняя',
    average: 'средняя',
    min: 'мин',
    Connected: 'Подключено',
    'Not connected': 'Не подключено',
    Error: 'Ошибка',
    Refresh: 'Обновить',
    Settings: 'Настройки',
    Configure: 'Настроить',
    Connect: 'Подключить',
    Disconnect: 'Отключить',
    Save: 'Сохранить',
    Cancel: 'Отмена',
    Delete: 'Удалить',
    Edit: 'Редактировать',
    Default: 'По умолчанию',
    Paused: 'Пауза',
    Test: 'Тест',
    Status: 'Статус',
    Actions: 'Действия',
    Name: 'Название',
    Provider: 'Провайдер',
    Providers: 'Провайдеров',
    Model: 'Модель',
    Key: 'Ключ',
    Active: 'Активен',
    'Last activity': 'Последняя активность',
    Sync: 'Синхронизация',
  },
};

function isElementNode(node) {
  return node && node.nodeType === Node.ELEMENT_NODE;
}

function shouldSkipTextNode(node) {
  if (!node || !node.parentElement) return true;
  const tag = node.parentElement.tagName;
  if (!tag) return false;
  return ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE'].includes(tag);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceTokenAware(text, source, target) {
  if (!text || !source || source === target) return text;

  // Single-token replacements must not mutate parts of larger words:
  // e.g. "or" must not rewrite "password".
  const isSingleToken = /^[\p{L}\p{N}_-]+$/u.test(source);
  if (isSingleToken) {
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{N}_])(${escapeRegExp(source)})(?=$|[^\\p{L}\\p{N}_])`,
      'gu'
    );
    return text.replace(pattern, `$1${target}`);
  }

  return text.split(source).join(target);
}

function getLocaleEntries(locale) {
  const normalizedLocale = String(locale || 'ru').toLowerCase();

  const cached = localeCaches.get(normalizedLocale);
  if (cached) return cached;

  // legacyContent is keyed by Russian source phrases for `en` and `uz`.
  // Build cross-locale mappings so leftover hardcoded text in any locale
  // can still be localized to the active language.
  const ruToEn = legacyContent.en || {};
  const ruToUz = legacyContent.uz || {};
  const ruPhrases = new Set([...Object.keys(ruToEn), ...Object.keys(ruToUz)]);

  const dictionary = new Map();
  const addPair = (source, target) => {
    if (!source || !target) return;
    if (source === target) return;
    if (String(source).trim().length < 2) return;
    dictionary.set(source, target);
  };

  for (const ruPhrase of ruPhrases) {
    const enPhrase = ruToEn[ruPhrase];
    const uzPhrase = ruToUz[ruPhrase];

    if (normalizedLocale === 'en') {
      addPair(ruPhrase, enPhrase);
      addPair(uzPhrase, enPhrase);
      continue;
    }

    if (normalizedLocale === 'uz') {
      addPair(ruPhrase, uzPhrase);
      addPair(enPhrase, uzPhrase);
      continue;
    }

    // For Russian locale also normalize leftovers from EN/UZ back to RU.
    addPair(enPhrase, ruPhrase);
    addPair(uzPhrase, ruPhrase);
  }

  const entries = Array.from(dictionary.entries())
    .filter(([source, target]) => source && target && source !== target)
    .sort((a, b) => b[0].length - a[0].length);

  localeCaches.set(normalizedLocale, entries);
  return entries;
}

function translateLegacyText(value, locale) {
  if (!value) return value;

  const entries = getLocaleEntries(locale);
  if (!entries.length) return value;

  const exactMatch = entries.find(([source]) => source === value);
  if (exactMatch) return exactMatch[1];

  let next = value;
  for (const [source, target] of entries) {
    if (!next.includes(source)) continue;
    next = replaceTokenAware(next, source, target);
  }

  const words = fallbackWordMaps[locale] || {};
  const shouldApplyFallback =
    locale === 'en' || locale === 'uz' ? hasCyrillic.test(next) : hasLatin.test(next);
  if (shouldApplyFallback) {
    for (const [source, target] of Object.entries(words)) {
      if (!source || !target) continue;
      if (!next.includes(source)) continue;
      next = replaceTokenAware(next, source, target);
    }
  }
  return next;
}

function translateTextNode(node, locale) {
  if (shouldSkipTextNode(node)) return;
  const current = node.nodeValue;
  if (!current || !current.trim()) return;

  const source = textOriginals.get(node) ?? current;
  if (!textOriginals.has(node)) {
    textOriginals.set(node, source);
  }

  const translated = translateLegacyText(source, locale);
  if (translated !== current) {
    node.nodeValue = translated;
  }
}

function translateElementAttributes(element, locale) {
  if (!isElementNode(element)) return;

  let originalAttrs = attrOriginals.get(element);
  if (!originalAttrs) {
    originalAttrs = {};
    attrOriginals.set(element, originalAttrs);
  }

  for (const attrName of attrsToTranslate) {
    const attrValue = element.getAttribute(attrName);
    if (!attrValue || !attrValue.trim()) continue;

    if (!Object.prototype.hasOwnProperty.call(originalAttrs, attrName)) {
      originalAttrs[attrName] = attrValue;
    }

    const translated = translateLegacyText(originalAttrs[attrName], locale);
    if (translated !== attrValue) {
      element.setAttribute(attrName, translated);
    }
  }
}

function translateSubtree(root, locale) {
  if (!root) return;

  if (isElementNode(root)) {
    translateElementAttributes(root, locale);
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    translateTextNode(walker.currentNode, locale);
  }

  if (isElementNode(root)) {
    const elements = root.querySelectorAll('*');
    elements.forEach((element) => translateElementAttributes(element, locale));
  }
}

function ensureObserver() {
  if (observer || typeof window === 'undefined') return;

  const mount = document.getElementById('root');
  if (!mount) return;

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        translateTextNode(mutation.target, activeLocale);
        continue;
      }

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          translateTextNode(node, activeLocale);
        } else if (isElementNode(node)) {
          translateSubtree(node, activeLocale);
        }
      });
    }
  });

  observer.observe(mount, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

export function applyLegacyContentLocalization(locale) {
  activeLocale = String(locale || 'ru').toLowerCase();
  const mount = typeof window !== 'undefined' ? document.getElementById('root') : null;
  if (mount) {
    translateSubtree(mount, activeLocale);
  }
  ensureObserver();
}
