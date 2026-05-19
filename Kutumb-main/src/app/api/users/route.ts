import { NextResponse } from 'next/server';

// Mock data - replace with actual Supabase calls
const mockUsers = [
  {
    id: '1',
    name: 'રાજેશ',
    surname: 'પટેલ',
    gender: 'male' as const,
    maritalStatus: 'married' as const,
    birthYear: '1980',
    profilePictureUrl: null,
  },
  {
    id: '2',
    name: 'પ્રિયા',
    surname: 'શર્મા',
    gender: 'female' as const,
    maritalStatus: 'married' as const,
    birthYear: '1985',
    profilePictureUrl: null,
  },
  {
    id: '3',
    name: 'આનંદ',
    surname: 'પટેલ',
    gender: 'male' as const,
    maritalStatus: 'single' as const,
    birthYear: '2005',
    profilePictureUrl: null,
  },
  {
    id: '4',
    name: 'સુમિત્રા',
    surname: 'શર્મા',
    gender: 'female' as const,
    maritalStatus: 'married' as const,
    birthYear: '1982',
    profilePictureUrl: null,
  },
  {
    id: '5',
    name: 'વિક્રમ',
    surname: 'પટેલ',
    gender: 'male' as const,
    maritalStatus: 'married' as const,
    birthYear: '1983',
    profilePictureUrl: null,
  },
];

export async function GET() {
  try {
    // TODO: Replace with actual Supabase call:
    // const { data, error } = await supabase
    //   .from('users')
    //   .select('*')
    //   .eq('isDeleted', false);

    return NextResponse.json({
      users: mockUsers,
      total: mockUsers.length,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
