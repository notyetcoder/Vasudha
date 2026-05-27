/**
 * env.ts
 *
 * Validates required environment variables.
 * Import this file anywhere to trigger validation,
 * or it self-validates when Next.js loads server modules.
 *
 * Usage: import '@/lib/env'; // at top of data.ts or layout.tsx
 */

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

if (typeof window === 'undefined') {
  // Server-side only validation
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(
        `[Vasudha] Missing required environment variable: ${key}\n` +
        `Create a .env.local file. See .env.example for reference.`
      );
    }
  }
}

export const env = {
  SUPABASE_URL:             process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY:        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY, // server-only
} as const;
