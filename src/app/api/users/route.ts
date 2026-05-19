import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public read-only API endpoint.
// Uses the anon key — Supabase RLS restricts what it can return.
// Never expose service_role key in an API route.

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('users')
      .select(
        // Only return fields needed for public display — never return internal IDs of relatives
        // through this unauthenticated endpoint
        'id, name, surname, maidenName, gender, maritalStatus, family, birthYear, profilePictureUrl, isDeceased, description, fatherName, motherName, spouseName, fatherId, motherId, spouseId',
        { count: 'exact' }
      )
      .order('name', { ascending: true })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
    }

    return NextResponse.json(
      {
        users: data ?? [],
        total: count ?? 0,
        page,
        pageSize,
        success: true,
      },
      {
        headers: {
          // Cache for 30 seconds on CDN edge — stale data is acceptable for a public directory
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
