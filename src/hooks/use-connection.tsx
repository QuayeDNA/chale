import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type ConnectionPerson = {
  id: string;
  display_name: string | null;
};

/**
 * The other person on the connection, resolved to something you can put on the
 * screen: a name for copy and a seed for the avatar.
 *
 * `connections` stores two ids and nothing else — no name, no avatar — so the
 * only way to name the other person is to ask the users table and work out
 * which of the two ids is not ours. That is one extra query rather than a
 * join, because which column holds our id is per-row.
 */
export type Connection = {
  id: string;
  status: string;
  invite_code: string | null;
  partner: ConnectionPerson | null;
};

export function useConnection() {
  /**
   * The newest connection, pending or linked. `invite_code` rides along so the
   * pending case can show the code that was already sent instead of generating
   * a second one — the inviter's code is the only way in, and losing it strands
   * the person who has not joined yet.
   */
  return useQuery({
    queryKey: ['connection', 'mine'],
    queryFn: async (): Promise<Connection | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from('connections').select('id,user_a_id,user_b_id,status,invite_code').or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return null;

      // Ours is whichever id we are; theirs is the other one. A connection
      // still waiting on its invite has no partner row yet.
      const partnerId = data.user_a_id === user.id ? data.user_b_id : data.user_a_id;
      if (!partnerId) {
        return { id: data.id, status: data.status, invite_code: data.invite_code, partner: null };
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id,display_name')
        .eq('id', partnerId)
        .maybeSingle();
      if (profileError) throw profileError;

      return {
        id: data.id,
        status: data.status,
        invite_code: data.invite_code,
        partner: profile as ConnectionPerson | null,
      };
    },
  });
}