import { supabase } from './supabase';

export async function isFavourite(questionId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to use favourites.');
  const { data, error } = await supabase
    .from('favourites')
    .select('question_id')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function toggleFavourite(questionId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to use favourites.');
  const { data } = await supabase
    .from('favourites')
    .select('question_id')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .maybeSingle();
  if (data) {
    const { error } = await supabase
      .from('favourites')
      .delete()
      .eq('user_id', user.id)
      .eq('question_id', questionId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase
    .from('favourites')
    .insert({ user_id: user.id, question_id: questionId });
  if (error) throw error;
  return true;
}

export type FavouriteItem = {
  question_id: string;
  text: string;
};

export async function listFavourites(): Promise<FavouriteItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to use favourites.');
  const { data, error } = await supabase
    .from('favourites')
    .select('question_id, questions ( text )')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    question_id: r.question_id,
    text: (r.questions as unknown as { text: string } | null)?.text ?? '',
  }));
}
