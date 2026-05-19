'use client';
import { useState, useMemo, useEffect, useCallback, startTransition } from 'react';
import type { User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getAllUsersForPublic } from '@/actions/users';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { findUserById } from '@/lib/user-utils';
import UserAvatar from './UserAvatar';
import Fuse from 'fuse.js';

interface UserSearchProps {
  initialUsers: User[];
  initialTotal: number;
  pageSize: number;
}

const getFirstName = (fullName?: string | null) => {
  if (!fullName) return '';
  return fullName.split(' ')[0];
};

// Uses allUsers for accurate ID lookups — falls back to text fields
const getParentDisplay = (user: User, allUsers: User[]) => {
  const father = findUserById(user.fatherId, allUsers);
  const mother = findUserById(user.motherId, allUsers);
  const fatherName = father ? father.name : getFirstName(user.fatherName);
  const motherName = mother ? mother.name : getFirstName(user.motherName);
  if (!fatherName && !motherName) return null;
  const rel = user.gender === 'male' ? 's/o' : 'd/o';
  if (fatherName && motherName) return `${rel} ${fatherName} & ${motherName}`;
  return `${rel} ${fatherName || motherName}`;
};

// h/o = husband of, w/o = wife of
const getSpouseDisplay = (user: User, allUsers: User[]) => {
  if (user.maritalStatus !== 'married') return null;
  const spouse = findUserById(user.spouseId, allUsers);
  const spouseName = spouse ? spouse.name : getFirstName(user.spouseName);
  if (!spouseName) return null;
  const rel = user.gender === 'male' ? 'h/o' : 'w/o';
  return `${rel} ${spouseName}`;
};

const LOAD_MORE_COUNT = 24;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function UserSearch({ initialUsers, initialTotal, pageSize }: UserSearchProps) {
  // Full dataset fetched in background
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allLoaded, setAllLoaded] = useState(false);

  // Displayed slice when no search/filter
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [baseUsers, setBaseUsers] = useState<User[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [surnameFilter, setSurnameFilter] = useState('all');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [maritalStatusFilter, setMaritalStatusFilter] = useState('all');

  const [fuse, setFuse] = useState<Fuse<User> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Show initial batch immediately (shuffled)
    setBaseUsers(shuffleArray([...initialUsers]));

    // Background fetch ALL users for search & lookup
    getAllUsersForPublic(1, 10000)
      .then(({ users }) => {
        setAllUsers(users);
        setBaseUsers(shuffleArray([...users]));
        setFuse(new Fuse(users, {
          keys: ['name', 'surname', 'family', 'description', 'id'],
          includeScore: true,
          minMatchCharLength: 2,
          threshold: 0.3,
        }));
        setAllLoaded(true);
      })
      .catch(() => {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load all profiles for search.' });
      });
  }, [initialUsers, toast]);

  const lookupUsers = allUsers.length > 0 ? allUsers : initialUsers;

  const uniqueSurnames = useMemo(() => {
    const src = lookupUsers;
    return Array.from(new Set(src.map(u => u.surname).filter(Boolean))).sort() as string[];
  }, [lookupUsers]);

  const uniqueFamilies = useMemo(() => {
    const src = lookupUsers;
    return Array.from(new Set(src.map(u => u.family).filter(Boolean))).sort() as string[];
  }, [lookupUsers]);

  const hasActiveSearch = !!searchTerm;
  const hasActiveFilters = surnameFilter !== 'all' || familyFilter !== 'all' || genderFilter !== 'all' || maritalStatusFilter !== 'all';
  const isFiltering = hasActiveSearch || hasActiveFilters;

  const searchResults = useMemo(() => {
    if (searchTerm && fuse) {
      return fuse.search(searchTerm, { limit: 100 }).map(r => r.item);
    }
    return null;
  }, [searchTerm, fuse]);

  const filterSource = allUsers.length > 0 ? allUsers : initialUsers;

  const filteredUsers = useMemo(() => {
    const base = searchResults ?? filterSource;
    if (!hasActiveFilters) return base;
    return base.filter(u => {
      const sM = surnameFilter === 'all' || u.surname === surnameFilter;
      const fM = familyFilter === 'all' || u.family === familyFilter;
      const gM = genderFilter === 'all' || u.gender === genderFilter;
      const mM = maritalStatusFilter === 'all' || u.maritalStatus === maritalStatusFilter;
      return sM && fM && gM && mM;
    });
  }, [searchResults, filterSource, surnameFilter, familyFilter, genderFilter, maritalStatusFilter, hasActiveFilters]);

  // When searching/filtering — show ALL results; when browsing — show sliced base
  const finalUsersToShow = isFiltering ? filteredUsers : baseUsers.slice(0, visibleCount);
  const canLoadMore = !isFiltering && (allLoaded ? visibleCount < allUsers.length : visibleCount < initialTotal);

  const handleLoadMore = () => {
    setVisibleCount(v => v + LOAD_MORE_COUNT);
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <Card className="p-4 sm:p-6 bg-card/30 backdrop-blur-lg border-white/10 shadow-lg">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            {!allLoaded && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Input
              type="search"
              placeholder={allLoaded ? 'Search by name, surname, family...' : 'Loading profiles for search...'}
              className="w-full pl-10 h-11 bg-background/50 border-white/20 focus:bg-background"
              value={searchTerm}
              onChange={e => startTransition(() => setSearchTerm(e.target.value))}
              disabled={!fuse}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Select value={surnameFilter} onValueChange={setSurnameFilter}>
              <SelectTrigger className="bg-background/50 border-white/20"><SelectValue placeholder="All Surnames" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Surnames</SelectItem>
                {uniqueSurnames.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={familyFilter} onValueChange={setFamilyFilter}>
              <SelectTrigger className="bg-background/50 border-white/20"><SelectValue placeholder="All Families" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Families</SelectItem>
                {uniqueFamilies.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="bg-background/50 border-white/20"><SelectValue placeholder="All Genders" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Select value={maritalStatusFilter} onValueChange={setMaritalStatusFilter}>
              <SelectTrigger className="bg-background/50 border-white/20"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Grid */}
      {finalUsersToShow.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {finalUsersToShow.map(user => {
              const parentDisplay = getParentDisplay(user, lookupUsers);
              const spouseDisplay = getSpouseDisplay(user, lookupUsers);
              // Show profession when not married or spouse not linked yet
              const showProfession = !spouseDisplay && user.description;

              return (
                <Link key={user.id} href={`/profile/${user.id}`} className="group block">
                  <Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:border-white/20 group-hover:-translate-y-1 bg-card/30 backdrop-blur-lg border-white/10 shadow-lg">
                    <CardContent className="p-4 text-center flex flex-col h-full">
                      <div className="flex justify-center mb-4">
                        <UserAvatar
                          name={user.name}
                          profilePictureUrl={user.profilePictureUrl}
                          size={100}
                          isDeceased={user.isDeceased}
                        />
                      </div>
                      <div className="flex-grow flex flex-col justify-center">
                        <h3 className="font-semibold text-lg text-primary truncate">
                          {user.name} {user.surname}
                        </h3>
                        <div className="text-sm text-muted-foreground mt-2 space-y-1 min-h-[40px]">
                          <p className="truncate">{parentDisplay || <>&nbsp;</>}</p>
                          <p className="truncate">
                            {spouseDisplay || (showProfession ? user.description : <>&nbsp;</>)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-auto pt-3">
                        {user.isDeceased ? (
                          <Badge variant="secondary" className="bg-amber-400/20 border-amber-400/50 text-amber-700 dark:text-amber-300">
                            स्वर्गस्थ
                          </Badge>
                        ) : user.family ? (
                          <Badge variant="secondary" className="whitespace-nowrap bg-black/10 border-white/10 text-foreground/80">
                            {user.family}
                          </Badge>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Load More button */}
          {canLoadMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                className="text-xs px-6 py-2 border-white/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                Load More
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">No matching profiles found.</p>
        </div>
      )}
    </div>
  );
}
