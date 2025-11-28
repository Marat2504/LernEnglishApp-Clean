import api from './api';
import {
  Dialog,
  Message,
  CreateDialogRequest,
  UpdateDialogRequest,
  SendMessageRequest,
  DialogsResponse,
  DialogResponse,
  SendMessageResponse,
  SendMessageWithCorrectionResponse,
} from '../types';

// Получение списка диалогов пользователя (userId берется из токена)
export const getDialogs = async (
  page = 1,
  limit = 20
): Promise<DialogsResponse> => {
  const response = await api.get('/chat/dialogs', {
    params: { page, limit },
  });
  return response.data;
};

// Создание нового диалога
export const createDialog = async (data: CreateDialogRequest): Promise<Dialog> => {
  const response = await api.post('/chat/dialog', data);
  return response.data;
};

// Обновление параметров диалога
export const updateDialog = async (
  id: string,
  updates: UpdateDialogRequest
): Promise<Dialog> => {
  const response = await api.put(`/chat/dialog/${id}`, updates);
  return response.data;
};

// Получение диалога с сообщениями
export const getDialog = async (
  id: string,
  page = 1,
  limit = 50
): Promise<DialogResponse> => {
  const response = await api.get(`/chat/dialog/${id}`, {
    params: { page, limit },
  });
  return response.data;
};

// Отправка сообщения (стандартный режим)
export const sendMessage = async (
  dialogId: string,
  text: string
): Promise<SendMessageResponse> => {
  const response = await api.post(`/chat/dialog/${dialogId}/message/send`, {
    text,
  });
  return response.data;
};

// Отправка сообщения с коррекцией ошибок
export const sendMessageWithCorrection = async (
  dialogId: string,
  text: string
): Promise<SendMessageWithCorrectionResponse> => {
  const response = await api.post(`/chat/dialog/${dialogId}/message/send-with-correction`, {
    text,
  });
  return response.data;
};

// Удаление диалога со всеми сообщениями
export const deleteDialog = async (id: string): Promise<void> => {
  await api.delete(`/chat/dialog/${id}`);
};

// Добавление сообщения в диалог (редко используется, но для полноты)
export const addMessage = async (
  dialogId: string,
  message: {
    sender: 'USER' | 'AI';
    text: string;
    audioUrl?: string;
    correction?: string;
    explanation?: string;
  }
): Promise<Message> => {
  const response = await api.post(`/chat/dialog/${dialogId}/message`, {
    dialogId,
    ...message,
  });
  return response.data;
};
