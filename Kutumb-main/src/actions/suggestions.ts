
'use server';

import type { ActionResponse } from '@/lib/types';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/data';
import { revalidateTag } from 'next/cache';

export interface Suggestion {
    id: string;
    profile_id: string;
    profile_name: string;
    message: string;
    created_at: string;
}

export type SuggestionData = Omit<Suggestion, 'id' | 'created_at'>;

const revalidateSuggestions = () => revalidateTag('suggestions');

// Action for public users to create a suggestion
export async function createSuggestion(suggestionData: SuggestionData): Promise<ActionResponse> {
    // Use an anonymous client for public creation to respect RLS policies
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        }
    );
      
    const { error } = await supabase.from('suggestions').insert(suggestionData);

    if (error) {
        console.error('Create suggestion error:', error);
        return { success: false, message: error.message };
    }
    
    revalidateSuggestions();
    return { success: true, message: 'Suggestion submitted successfully!' };
}

// Action for admins to get all suggestions
export async function getSuggestions(): Promise<Suggestion[]> {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching suggestions:', error);
        return [];
    }
    return data || [];
}

// Action for admins to delete a suggestion
export async function deleteSuggestion(id: string): Promise<ActionResponse> {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from('suggestions').delete().eq('id', id);

    if (error) {
        console.error('Delete suggestion error:', error);
        return { success: false, message: error.message };
    }

    revalidateSuggestions();
    return { success: true, message: 'Suggestion deleted.' };
}
