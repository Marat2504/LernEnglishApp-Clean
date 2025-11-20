import api from './api';
import { SessionResultDto, CardProgress, Card } from '../types';

export interface StudyProgressItem {
  cardId: string;
  englishWord: string;
  progress: {
    [mode: string]: {
      correctAnswers: number;
      incorrectAnswers: number;
      isLearned: boolean;
    };
  };
}

export const submitSessionResult = async (data: SessionResultDto): Promise<void> => {
  await api.post('/study/session-result', data);
};

export const getStudyProgress = async (mode?: string): Promise<StudyProgressItem[]> => {
  const params = mode ? { mode } : {};
  const response = await api.get('/study/progress', { params });
  return response.data;
};

export const getCardsToReview = async (limit?: number): Promise<Card[]> => {
  const params = limit ? { limit } : {};
  const response = await api.get('/study/cards-to-review', { params });
  return response.data;
};
