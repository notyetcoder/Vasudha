/**
 * env.ts
 * 
 * Validates required environment variables at startup.
 * If any are missing, throws a clear error with instructions
 * instead of cryptic "Cannot read property of undefined" errors.
 */

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const serverOnly = [
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

// Validate public env vars (safe to check on client too)
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Create a .env.local file with this variable set.\n` +
      `See .env.example for reference.`
    );
  }
}

export const env = {
  SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  // Server-only — undefined on client (intentional)
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const;
