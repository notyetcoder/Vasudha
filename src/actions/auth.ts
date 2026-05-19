'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Build a Supabase auth client using the session cookie store
function createAuthClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

export interface LoginData {
  email: string;
  password: string;   // was `any` — explicitly typed
}

export async function login(
  data: LoginData
): Promise<{ success: boolean; error?: string }> {
  // Basic sanity checks before hitting Supabase
  if (!data.email?.trim() || !data.password) {
    return { success: false, error: 'Email and password are required.' };
  }
  if (data.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  const supabase = createAuthClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email.trim().toLowerCase(),
    password: data.password,
  });

  if (error) {
    // Don't expose internal Supabase error details to the client
    // Map to user-friendly messages
    if (error.message.toLowerCase().includes('invalid')) {
      return { success: false, error: 'Invalid email or password.' };
    }
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { success: false, error: 'Please confirm your email before logging in.' };
    }
    if (error.message.toLowerCase().includes('rate limit')) {
      return { success: false, error: 'Too many attempts. Please wait a moment and try again.' };
    }
    return { success: false, error: 'Login failed. Please try again.' };
  }

  return { success: true };
}

export async function logout(): Promise<{ success: boolean; error?: string }> {
  const supabase = createAuthClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, error: 'Logout failed.' };
  }
  return { success: true };
}
