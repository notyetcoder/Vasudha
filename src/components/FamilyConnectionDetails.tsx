
'use client';
import type { User } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import UserAvatar from './UserAvatar';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface FamilyConnectionDetailsProps {
  siblings: User[];
  children: User[];
  isLoading: boolean;
}

const RelativeCard = ({ person, relationship }: { person: User; relationship: string }) => {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(`/profile/${person.id}`);
  };

  return (
    <Card className="bg-background hover:bg-muted transition-colors cursor-pointer" onClick={handleNavigate}>
      <CardContent className="p-2 flex items-center gap-3">
        <UserAvatar name={person.name} profilePictureUrl={person.profilePictureUrl} size={40} isDeceased={person.isDeceased} />
        <div>
          <p className="font-semibold text-sm leading-tight">{person.name} {person.surname}</p>
          <p className="text-xs text-muted-foreground">{relationship}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default function FamilyConnectionDetails({ siblings, children, isLoading }: FamilyConnectionDetailsProps) {
  const hasFamily = siblings.length > 0 || children.length > 0;

  return (
    <div>
      <h4 className="font-semibold text-sm mb-3">Immediate Family</h4>
      {isLoading ? (
          <div className="text-center text-sm text-muted-foreground italic py-4">Loading family...</div>
      ) : hasFamily ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {siblings.map(s => <RelativeCard key={s.id} person={s} relationship={s.gender === 'male' ? 'Brother' : 'Sister'} />)}
          {children.map(c => <RelativeCard key={c.id} person={c} relationship={c.gender === 'male' ? 'Son' : 'Daughter'} />)}
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground italic py-4">
          No immediate family members (siblings or children) found.
        </div>
      )}
    </div>
  );
}
