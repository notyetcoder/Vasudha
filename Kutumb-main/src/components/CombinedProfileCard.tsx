
'use client';
import type { User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import UserAvatar from './UserAvatar';
import { Button } from './ui/button';
import { Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Separator } from './ui/separator';

interface UserWithChildren extends User {
  children?: User[];
}

interface CombinedProfileCardProps {
  person1?: UserWithChildren | null;
  person2?: UserWithChildren | null;
  relationship1: string;
  relationship2: string;
  allUsers: User[];
}

const PersonDisplay = ({ person, relationship, onNameClick, onCardDoubleClick }: { person: User, relationship: string, onNameClick: (e: React.MouseEvent) => void, onCardDoubleClick: () => void }) => (
    <div className="flex flex-col items-center text-center group cursor-pointer" onDoubleClick={onCardDoubleClick}>
        <UserAvatar
            name={person.name}
            profilePictureUrl={person.profilePictureUrl}
            size={64}
            isDeceased={person.isDeceased}
            className="transition-transform group-hover:scale-110"
        />
        <p 
            className="font-semibold text-sm mt-2 text-primary hover:underline"
            onClick={onNameClick}
        >
            {person.name}
        </p>
        <p className="text-xs text-muted-foreground">{relationship}</p>
    </div>
)

const ChildDisplay = ({ child }: { child: User }) => {
    const router = useRouter();
    return (
        <div className="flex items-center gap-2 cursor-pointer hover:bg-white/10 p-1 rounded-md transition-colors" onClick={() => router.push(`/profile/${child.id}`)}>
             <UserAvatar
                name={child.name}
                profilePictureUrl={child.profilePictureUrl}
                size={32}
                isDeceased={child.isDeceased}
            />
            <p className="text-sm font-medium text-foreground truncate">{child.name}</p>
        </div>
    )
}

export default function CombinedProfileCard({ person1, person2, relationship1, relationship2 }: CombinedProfileCardProps) {
  const router = useRouter();
  const [isChildrenVisible, setIsChildrenVisible] = useState(false);
  
  const handleNavigate = (id: string) => {
    router.push(`/profile/${id}`);
  };

  if (!person1 && !person2) {
    return null;
  }

  const children = person1?.children || [];
  const showChildrenLink = children.length > 0;

  // Common card classes
  const cardClasses = "overflow-hidden transition-all duration-300 bg-card/30 backdrop-blur-lg border-white/10 shadow-lg hover:shadow-xl hover:border-white/20";
  const deceasedClasses = (person1?.isDeceased || person2?.isDeceased) ? "bg-muted/30" : "";

  // If only person1 (the blood relative) exists, we still want to show them.
  if (person1 && !person2) {
     return (
        <Card className={cn(cardClasses, person1?.isDeceased && "bg-muted/30")}>
            <CardContent className="p-3">
                 <div className="flex justify-around items-start">
                    <PersonDisplay person={person1} relationship={relationship1} onNameClick={(e) => { e.stopPropagation(); handleNavigate(person1.id); }} onCardDoubleClick={() => handleNavigate(person1.id)} />
                </div>
                 {showChildrenLink && (
                    <div className="mt-2 text-center">
                        <Button variant="link" size="sm" className="text-xs h-auto p-1 text-foreground/70" onClick={(e) => { e.stopPropagation(); setIsChildrenVisible(!isChildrenVisible); }}>
                            <Users className="mr-1 h-3 w-3" /> {isChildrenVisible ? 'Hide' : 'View'} {children.length} {children.length > 1 ? 'children' : 'child'} <ChevronDown className={cn("h-3 w-3 ml-1 transition-transform", isChildrenVisible && "rotate-180")} />
                        </Button>
                    </div>
                )}
            </CardContent>
            {isChildrenVisible && children.length > 0 && (
                <>
                    <Separator />
                    <div className="p-3 bg-black/10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {children.map(child => <ChildDisplay key={child.id} child={child} />)}
                        </div>
                    </div>
                </>
            )}
        </Card>
     )
  }

  return (
    <Card className={cn(cardClasses, deceasedClasses)}>
        <CardContent className="p-3">
            <div className="flex justify-around items-start">
                {person1 && <PersonDisplay person={person1} relationship={relationship1} onNameClick={(e) => { e.stopPropagation(); handleNavigate(person1.id); }} onCardDoubleClick={() => handleNavigate(person1.id)} />}
                {person2 && <PersonDisplay person={person2} relationship={relationship2} onNameClick={(e) => { e.stopPropagation(); handleNavigate(person2.id); }} onCardDoubleClick={() => handleNavigate(person2.id)} />}
            </div>
            {showChildrenLink && person1 && (
                 <div className="mt-2 text-center">
                    <Button 
                        variant="link" 
                        size="sm" 
                        className="text-xs h-auto p-1 text-foreground/70"
                        onClick={(e) => { e.stopPropagation(); setIsChildrenVisible(!isChildrenVisible); }}
                    >
                       <Users className="mr-1 h-3 w-3" /> {isChildrenVisible ? 'Hide' : 'View'} {children.length} {children.length > 1 ? 'children' : 'child'} <ChevronDown className={cn("h-3 w-3 ml-1 transition-transform", isChildrenVisible && "rotate-180")} />
                    </Button>
                </div>
            )}
        </CardContent>

         {isChildrenVisible && children.length > 0 && (
            <>
                <Separator />
                <div className="p-3 bg-black/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {children.map(child => <ChildDisplay key={child.id} child={child} />)}
                    </div>
                </div>
            </>
        )}
    </Card>
  )
}
