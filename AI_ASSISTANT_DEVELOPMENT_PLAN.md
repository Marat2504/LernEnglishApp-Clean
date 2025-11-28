# План разработки функционала ИИ-ассистента

## Обзор
Текущее приложение имеет базовый ChatBotScreen с имитацией диалогов. Необходимо полностью переработать функционал для интеграции с реальным API согласно документации в `API_DOCUMENTATION.md`.

## Этап 1: Подготовка типов и сервисов

### 1.1 Обновление типов данных (`src/types/index.ts`)
- Добавить интерфейсы для Dialog:
  ```typescript
  interface Dialog {
    id: string;
    userId: string;
    topic?: string;
    difficulty?: string;
    languageLevel?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    messageCount?: number;
  }
  ```

- Добавить интерфейсы для Message:
  ```typescript
  interface Message {
    id: string;
    dialogId: string;
    sender: 'USER' | 'AI';
    text: string;
    audioUrl?: string;
    correction?: string;
    explanation?: string;
    createdAt: string;
  }
  ```

- Добавить интерфейсы для API запросов/ответов:
  - CreateDialogRequest, UpdateDialogRequest
  - SendMessageRequest, SendMessageWithCorrectionRequest
  - DialogsResponse, DialogResponse, SendMessageResponse

- Обновить `src/types/navigation.ts`:
  ```typescript
  export type RootStackParamList = {
    // существующие экраны...
    DialogsList: undefined;
    CreateDialog: undefined;
    DialogSettings: { dialogId: string };
    Chat: { dialogId: string };
  };
  ```

### 1.2 Создание сервиса для чатов (`src/services/chatService.ts`)
Создать функции для всех API эндпоинтов:

```typescript
// Получение списка диалогов
export const getDialogs = async (userId: string, page = 1, limit = 20) => {
  const response = await api.get(`/chat/dialogs/${userId}`, { params: { page, limit } });
  return response.data;
};

// Создание диалога
export const createDialog = async (data: CreateDialogRequest) => {
  const response = await api.post('/chat/dialog', data);
  return response.data;
};

// Обновление диалога
export const updateDialog = async (id: string, updates: UpdateDialogRequest) => {
  const response = await api.put(`/chat/dialog/${id}`, updates);
  return response.data;
};

// Получение диалога с сообщениями
export const getDialog = async (id: string, page = 1, limit = 50) => {
  const response = await api.get(`/chat/dialog/${id}`, { params: { page, limit } });
  return response.data;
};

// Отправка сообщения (стандартный режим)
export const sendMessage = async (dialogId: string, text: string) => {
  const response = await api.post(`/chat/dialog/${dialogId}/message/send`, { text });
  return response.data;
};

// Отправка сообщения с коррекцией
export const sendMessageWithCorrection = async (dialogId: string, text: string) => {
  const response = await api.post(`/chat/dialog/${dialogId}/message/send-with-correction`, { text });
  return response.data;
};

// Удаление диалога
export const deleteDialog = async (id: string) => {
  await api.delete(`/chat/dialog/${id}`);
};
```

**Критерии готовности:**
- Все типы определены и экспортированы
- Сервис содержит функции для всех API эндпоинтов
- Функции обрабатывают ошибки и возвращают корректные данные

## Этап 2: Создание экранов управления диалогами

### 2.1 Экран списка диалогов (`src/screens/DialogsListScreen.tsx`)
- FlatList с диалогами пользователя
- Pull-to-refresh для обновления списка
- FAB для создания нового диалога
- Для каждого диалога отображать:
  - Тема (или "Без темы")
  - Уровень сложности
  - Количество сообщений
  - Дата последнего обновления
- Swipe-to-delete для удаления диалогов
- Пагинация при прокрутке вниз
- Переход в чат по нажатию на диалог

**Критерии готовности:**
- Список загружается при открытии экрана
- Создание нового диалога работает
- Удаление диалога с подтверждением
- Пагинация работает корректно

### 2.2 Экран создания диалога (`src/screens/CreateDialogScreen.tsx`)
- Форма с полями:
  - Тема (TextInput, опционально)
  - Уровень сложности (Picker с A1-C2)
- Кнопка "Создать"
- Валидация: уровень сложности обязателен
- После создания переход в чат

**Критерии готовности:**
- Форма валидируется корректно
- Диалог создается через API
- Переход в чат работает

### 2.3 Экран настроек диалога (`src/screens/DialogSettingsScreen.tsx`)
- Отображение текущих параметров диалога
- Редактирование темы и уровня сложности
- Кнопка "Удалить диалог" с подтверждением Alert
- После удаления возврат к списку диалогов

**Критерии готовности:**
- Параметры обновляются через API
- Удаление работает с подтверждением
- Навигация корректная

## Этап 3: Переработка ChatBotScreen

### 3.1 Обновление состояния и логики (`src/screens/ChatBotScreen.tsx`)
- Замена имитации на реальные API вызовы
- Добавление состояния:
  - `dialog: Dialog | null`
  - `messages: Message[]`
  - `loading: boolean`
  - `correctionMode: boolean`
  - `pagination: { page: number, hasNext: boolean }`
- useEffect для загрузки диалога и начальных сообщений
- Функции отправки сообщений с/без коррекции
- Обработка пагинации при прокрутке вверх

### 3.2 Улучшение UI
- Отображение сообщений с исправлениями:
  - Для USER: текст + подсказка с correction и explanation
  - Для AI: только текст
- Индикатор загрузки при отправке
- Обработка ошибок с toast/snackbar
- Кнопка переключения режима коррекции
- Кнопка настроек диалога

### 3.3 Добавление функционала
- Голосовой ввод (интеграция с Expo Speech)
- Автоматическая прокрутка к новым сообщениям
- Кэширование сообщений для производительности

**Критерии готовности:**
- Чат загружается с реальными данными
- Отправка сообщений работает в обоих режимах
- Коррекции отображаются корректно
- Пагинация работает при прокрутке вверх

## Этап 4: Интеграция в навигацию

### 4.1 Обновление App.tsx
- Добавление новых экранов в RootStack:
  ```typescript
  <RootStack.Screen name="DialogsList" component={DialogsListScreen} />
  <RootStack.Screen name="CreateDialog" component={CreateDialogScreen} />
  <RootStack.Screen name="DialogSettings" component={DialogSettingsScreen} />
  <RootStack.Screen name="Chat" component={ChatBotScreen} />
  ```
- Удаление старого ChatBot из вкладок

### 4.2 Обновление HomeScreen
- Изменение кнопки "ИИ агент":
  - Вместо `navigation.navigate('ChatBot')`
  - Использовать `navigation.navigate('DialogsList')`

**Критерии готовности:**
- Все новые экраны доступны через навигацию
- Переходы работают корректно
- Старый ChatBot удален из вкладок

## Этап 5: Тестирование и доработки

### 5.1 Тестирование API интеграции
- Проверка всех эндпоинтов через реальные запросы
- Тестирование обработки ошибок (404, 500, сеть)
- Проверка пагинации и больших объемов данных
- Тестирование edge cases (пустые диалоги, длинные сообщения)

### 5.2 UX/UI доработки
- Адаптивный дизайн для разных размеров экранов
- Темная тема (если поддерживается в приложении)
- Анимации загрузки и переходов
- Улучшение accessibility

### 5.3 Оптимизация производительности
- React.memo для компонентов сообщений
- Оптимизация FlatList (keyExtractor, getItemLayout)
- Кэширование API ответов
- Lazy loading изображений/аудио

### 5.4 Финальное тестирование
- End-to-end тестирование полного флоу:
  1. Создание диалога
  2. Общение в чате
  3. Использование коррекции
  4. Настройки и удаление
- Тестирование на разных устройствах
- Проверка потребления батареи и трафика

**Критерии готовности:**
- Все API работают стабильно
- UI адаптивен и интуитивен
- Производительность приемлемая
- Нет критических багов

## Риски и зависимости
- **API готовность:** Все эндпоинты должны быть реализованы на сервере
- **Дизайн система:** Возможно потребуется согласование с общим стилем приложения
- **Тестирование:** Необходим тестовый сервер с данными

## Примерная оценка времени
- Этап 1: 4-6 часов
- Этап 2: 8-12 часов
- Этап 3: 10-15 часов
- Этап 4: 2-4 часа
- Этап 5: 6-10 часов

**Итого: 30-47 часов разработки**
