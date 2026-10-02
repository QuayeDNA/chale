import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useConnection() {
  return useQuery({
    queryKey: ['connection', 'mine'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from('connections').select('id,status').or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data as { id: string; status: string } | null;
    },
  });
}
