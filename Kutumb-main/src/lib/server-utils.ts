
import type { User } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

// This function needs to be in a non-server action file to be called from server components
export async function findChildren(parentId: string): Promise<User[]> {
  const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`fatherId.eq.${parentId},motherId.eq.${parentId}`);
  if (error) {
    console.error(`Error finding children for ${parentId}`, error);
    return [];
  }
  return data || [];
}

// This function needs to be in a non-server action file to be called from server components
export async function findSiblings(user: User): Promise<User[]> {
  if (!user.fatherId && !user.motherId) return [];
  
  const orConditions = [];
  if (user.fatherId) orConditions.push(`fatherId.eq.${user.fatherId}`);
  if (user.motherId) orConditions.push(`motherId.eq.${user.motherId}`);

  const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .neq('id', user.id) 
    .or(orConditions.join(','));

  if (error) {
    console.error(`Error finding siblings for ${user.id}`, error);
    return [];
  }
  return data || [];
}
