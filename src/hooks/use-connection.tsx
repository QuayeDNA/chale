import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useConnection() {
  /**
   * The newest connection, pending or linked. `invite_code` rides along so the
   * pending case can show the code that was already sent instead of generating
   * a second one — the inviter's code is the only way in, and losing it strands
   * the person who has not joined yet.
   */
  return useQuery({
    queryKey: ['connection', 'mine'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from('connections').select('id,status,invite_code').or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data as { id: string; status: string; invite_code: string | null } | null;
    },
  });
}
