import { useQueryClient } from '@tanstack/react-query';
import { invalidationGroups, queryKeys } from '@/lib/queryKeys';

type InvalidationGroup = keyof typeof invalidationGroups;

export function useQueryInvalidation() {
  const queryClient = useQueryClient();

  const invalidateGroup = (group: InvalidationGroup) => {
    const queries = invalidationGroups[group];
    queries.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: queryKey as any });
    });
  };

  const invalidateAll = () => {
    // Invalidate all admin-related queries
    Object.values(invalidationGroups).flat().forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: queryKey as any });
    });
  };

  return {
    invalidateGroup,
    invalidateAll,
    queryKeys,
  };
}
