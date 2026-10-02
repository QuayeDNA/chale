import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
export function useRealtimePrompt(promptId: string | null) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!promptId) return;
    const ch = supabase.channel(`prompt-${promptId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prompts', filter: `id=eq.${promptId}` }, () => { qc.invalidateQueries({ queryKey: ['prompt'] }); qc.invalidateQueries({ queryKey: ['answers'] }); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'answers', filter: `prompt_id=eq.${promptId}` }, () => { qc.invalidateQueries({ queryKey: ['answers'] }); qc.invalidateQueries({ queryKey: ['prompt'] }); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [promptId, qc]);
}
