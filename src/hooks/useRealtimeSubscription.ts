import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, invalidationGroups } from '@/lib/queryKeys';

type TableName = 'orders' | 'products' | 'categories' | 'ingredients' | 'stock_movements' | 'suppliers' | 'couriers';

const tableToGroup: Record<TableName, keyof typeof invalidationGroups> = {
  orders: 'orders',
  products: 'products',
  categories: 'categories',
  ingredients: 'ingredients',
  stock_movements: 'stockMovements',
  suppliers: 'suppliers',
  couriers: 'couriers',
};

export function useRealtimeSubscription(tables: TableName[] = ['orders', 'products', 'categories', 'ingredients', 'stock_movements']) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel('admin-realtime');

    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        (payload) => {
          console.log(`Realtime update for ${table}:`, payload.eventType);
          
          // Invalidate related queries
          const group = tableToGroup[table];
          if (group && invalidationGroups[group]) {
            invalidationGroups[group].forEach(queryKey => {
              queryClient.invalidateQueries({ queryKey: queryKey as any });
            });
          }
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, tables.join(',')]);
}
