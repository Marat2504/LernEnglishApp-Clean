import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as cardsService from '../services/cardsService';
import * as studyService from '../services/studyService';
import { Card, CreateCardDto, CardTag } from '../types';

export const useCards = () => {
  return useQuery<Card[]>({
    queryKey: ['cards'],
    queryFn: cardsService.getCards,
  });
};

export const useCreateCard = () => {
  const queryClient = useQueryClient();
  return useMutation<Card, unknown, CreateCardDto>({
    mutationFn: cardsService.createCard,
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['cards']}),
  });
};

export const useAttachTag = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, { cardId: string; tagId: string }>({
    mutationFn: ({cardId, tagId}) => cardsService.attachTagToCard(cardId, tagId),
    onSuccess: (_, { cardId }) => {
      queryClient.invalidateQueries({queryKey: ['cards']});
      queryClient.invalidateQueries({queryKey: ['cardTags', cardId]});
    },
  });
};


export const useDetachTag = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, { cardId: string; tagId: string }>({
    mutationFn: ({cardId, tagId}) => cardsService.detachTagFromCard(cardId, tagId),
    onSuccess: (_, { cardId }) => {
      queryClient.invalidateQueries({queryKey: ['cards']});
      queryClient.invalidateQueries({queryKey: ['cardTags', cardId]});
    },
  });
};

export const useTagsForCard = (cardId: string) => {
  return useQuery<CardTag[]>({
    queryKey: ['cardTags', cardId],
    queryFn: () => cardsService.getTagsForCard(cardId),
  });
};

export const useDeleteCard = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: cardsService.deleteCard,
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['cards']}),
  });
};

export const useToggleLearned = () => {
  const queryClient = useQueryClient();
  return useMutation<Card, unknown, { cardId: string; isLearned: boolean }>({
    mutationFn: ({ cardId, isLearned }) => cardsService.toggleLearnedStatus(cardId, isLearned),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['cards']}),
  });
};

export const useStudyProgress = () => {
  return useQuery({
    queryKey: ['studyProgress'],
    queryFn: studyService.getStudyProgress,
  });
};
