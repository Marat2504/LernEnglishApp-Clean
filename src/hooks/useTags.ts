import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as tagsService from '../services/tagsService';
import { Tag, CreateTagDto } from '../types';

export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: tagsService.getTags,
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tagsService.createTag,
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['tags']}),
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tagsService.deleteTag,
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['tags']}),
  });
};
