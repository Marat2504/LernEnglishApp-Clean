// src/services/cardsService.ts
import api from './api';
import { Card, CreateCardDto } from '../types';

export const getCards = async (): Promise<Card[]> => {
  const response = await api.get('/cards');
  return response.data;
};

export const createCard = async (dto: CreateCardDto): Promise<Card> => {
  console.log('Creating card with dto:', dto);
  const response = await api.post('/cards', dto);
  console.log('Create card response:', response.status, response.data);
  return response.data;
};

export const updateCard = async (cardId: string, data: Partial<Card>): Promise<Card> => {
  const response = await api.patch(`/cards/${cardId}`, data);
  return response.data;
};

export const attachTagToCard = async (cardId: string, tagId: string) => {
  await api.post(`/cards/${cardId}/tags/${tagId}`);
};

export const detachTagFromCard = async (cardId: string, tagId: string) => {
  await api.delete(`/cards/${cardId}/tags/${tagId}`);
};

export const getTagsForCard = async (cardId: string) => {
  const response = await api.get(`/cards/${cardId}/tags`);
  return response.data.tags;
};

export const deleteCard = async (cardId: string): Promise<void> => {
  await api.delete(`/cards/${cardId}`);
};

export const toggleLearnedStatus = async (cardId: string, isLearned: boolean): Promise<Card> => {
  const response = await api.patch(`/cards/${cardId}/learned`, { isLearned });
  return response.data.card;
};
