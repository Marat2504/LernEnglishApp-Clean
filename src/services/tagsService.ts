// src/services/tagsService.ts
import api from './api';
import { Tag, CreateTagDto } from '../types';

export const getTags = async (): Promise<Tag[]> => {
  const response = await api.get('/tags');
  console.log('Tags response data:', response.data);
  return response.data;
};

export const createTag = async (dto: CreateTagDto): Promise<Tag> => {
  const response = await api.post('/tags', dto);
  return response.data;
};

export const deleteTag = async (tagId: string): Promise<void> => {
  await api.delete(`/tags/${tagId}`);
};
