'use client';
import { useState, useMemo, useEffect, startTransition } from 'react';
import type { User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search, Loader2, SlidersHorizontal, X } from 'lucide-react';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface UserSearchProps {
  initialUsers: User[];
  initialTotal: number;
  pageSize: number;
}

const getFirstName = (n?: string | null) => n ? n.split(' ')[0] : '';

const getParentDisplay = (user: User, allUsers: User[]) => {
  const father = findUserById(user.fatherId, allUsers);
  const mother = findUserById(user.motherId, allUsers);
  const fn = father ? father.name : getFirstName(user.fatherName);
  const mn = mother ? mother.name : getFirstName(user.motherName);
  if (!fn && !mn) return null;
  const rel = user.gender === 'male' ? 's/o' : 'd/o';
  return fn && mn ? `${rel} ${fn} & ${mn}` : `${rel} ${fn || mn}`;
};

const getSpouseDisplay = (user: User, allUsers: User[]) => {
  if (user.maritalStatus !== 'married') return null;
  const spouse = findUserById(user.spouseId, allUsers);
  const sn = spouse ? spouse.name : getFirstName(user.spouseName);
  if (!sn) return null;
  return `${user.gender === 'male' ? 'h/o' : 'w/o'} ${sn}`;
};

const LOAD_MORE = 24;

function ProfileCard({ user, allUsers }: { user: User; allUsers: User[] }) {
  const parentText = getParentDisplay(user, allUsers);
  const spouseText = getSpouseDisplay(user, allUsers);
  const showProfession = !spouseText && user.description;

  return (
    <Link href={`/profile/${user.id}`} className="group block h-full" aria-label={`View profile of ${user.name} ${user.surname}`}>
      <Card className="h-full overflow-hidden transition-all duration-200 group-hover:shadow-xl group-hover:border-white/20 group-active:scale-95 bg-card/30 backdrop-blur-lg border-white/10 shadow-lg">
        <CardContent className="p-4 flex flex-col items-center text-center h-full">
          <div className="mb-3">
            <UserAvatar name={user.name} profilePictureUrl={user.profilePictureUrl} size={80} isDeceased={user.isDeceased} />
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-0 w-full">
            <h3 className="font-semibold text-base text-primary truncate">{user.name} {user.surname}</h3>
            <div className="text-xs text-muted-foreground mt-1 space-y-0.5 min-h-[32px]">
              {parentText && <p className="truncate">{parentText}</p>}
              <p className="truncate">{spouseText || (showProfession ? user.description : '')}</p>
            </div>
          </div>
          <div className="mt-2">
            {user.isDeceased ? (
              <Badge variant="secondary" className="text-[10px] bg-amber-400/20 border-amber-400/50 text-amber-700 dark:text-amber-300">स्वर्गस्थ</Badge>
            ) : user.family ? (
              <Badge variant="secondary" className="text-[10px] whitespace-nowrap">{user.family}</Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface FilterSheetProps {
  surnameFilter: string;  setSurnameFilter: (v: string) => void;
  familyFilter: string;   setFamilyFilter:  (v: string) => void;
  genderFilter: string;   setGenderFilter:  (v: string) => void;
  maritalFilter: string;  setMaritalFilter: (v: string) => void;
  uniqueSurnames: string[];
  uniqueFamilies: string[];
  activeFilterCount: number;
  onReset: () => void;
}

function FilterSheet({
  surnameFilter, setSurnameFilter,
  familyFilter, setFamilyFilter,
  genderFilter, setGenderFilter,
  maritalFilter, setMaritalFilter,
  uniqueSurnames, uniqueFamilies,
  activeFilterCount,
  onReset,
}: FilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-2 h-11">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Filter Profiles</SheetTitle>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onReset} className="text-xs text-muted-foreground">
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Surname</label>
            <Select value={surnameFilter} onValueChange={setSurnameFilter}>
              <SelectTrigger className="h-10"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Surnames</SelectItem>
                {uniqueSurnames.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Family</label>
            <Select value={familyFilter} onValueChange={setFamilyFilter}>
              <SelectTrigger className="h-10"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Families</SelectItem>
                {uniqueFamilies.map((f: string) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Gender</label>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="h-10"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <Select value={maritalFilter} onValueChange={setMaritalFilter}>
              <SelectTrigger className="h-10"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function UserSearch({ initialUsers, initialTotal, pageSize }: UserSearchProps) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allLoaded, setAllLoaded] = useState(false);
  const [baseUsers, setBaseUsers] = useState<User[]>([...initialUsers].sort(() => 0.5 - Math.random()));
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const [surnameFilter, setSurnameFilter] = useState('all');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [maritalFilter, setMaritalFilter] = useState('all');
  const [fuse, setFuse] = useState<Fuse<User> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getAllUsersForPublic(1, 10000)
      .then(({ users }) => {
        const shuffled = [...users].sort(() => 0.5 - Math.random());
        setAllUsers(users);
        setBaseUsers(shuffled);
        setFuse(new Fuse(users, {
          keys: ['name', 'surname', 'family', 'description', 'fatherName', 'motherName'],
          includeScore: true, threshold: 0.35, minMatchCharLength: 2,
        }));
        setAllLoaded(true);
      })
      .catch(() => toast({ variant: 'destructive', title: 'Could not load all profiles for search.' }));
  }, []);

  const lookupUsers = allUsers.length > 0 ? allUsers : initialUsers;
  const uniqueSurnames = useMemo(() => Array.from(new Set(lookupUsers.map(u => u.surname).filter(Boolean))).sort() as string[], [lookupUsers]);
  const uniqueFamilies = useMemo(() => Array.from(new Set(lookupUsers.map(u => u.family).filter(Boolean))).sort() as string[], [lookupUsers]);

  const hasSearch = !!searchTerm.trim();
  const hasFilter = surnameFilter !== 'all' || familyFilter !== 'all' || genderFilter !== 'all' || maritalFilter !== 'all';
  const isFiltering = hasSearch || hasFilter;
  const activeFilterCount = [surnameFilter, familyFilter, genderFilter, maritalFilter].filter(v => v !== 'all').length;

  const searchResults = useMemo(() => {
    if (!hasSearch || !fuse) return null;
    return fuse.search(searchTerm.trim(), { limit: 200 }).map(r => r.item);
  }, [searchTerm, fuse, hasSearch]);

  const filterSource = allLoaded ? allUsers : initialUsers;

  const filteredUsers = useMemo(() => {
    let base = searchResults ?? filterSource;
    if (!hasFilter) return base;
    return base.filter(u => {
      if (surnameFilter !== 'all' && u.surname !== surnameFilter) return false;
      if (familyFilter !== 'all' && u.family !== familyFilter) return false;
      if (genderFilter !== 'all' && u.gender !== genderFilter) return false;
      if (maritalFilter !== 'all' && u.maritalStatus !== maritalFilter) return false;
      return true;
    });
  }, [searchResults, filterSource, surnameFilter, familyFilter, genderFilter, maritalFilter, hasFilter]);

  const finalUsers = isFiltering ? filteredUsers : baseUsers.slice(0, visibleCount);
  const canLoadMore = !isFiltering && (allLoaded ? visibleCount < allUsers.length : visibleCount < initialTotal);

  const handleReset = () => {
    setSurnameFilter('all'); setFamilyFilter('all');
    setGenderFilter('all'); setMaritalFilter('all');
    setSearchTerm('');
  };

  return (
    <div className="space-y-5">
      {/* Search bar + filter button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {!allLoaded && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {searchTerm && allLoaded && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          <Input
            type="search"
            placeholder={allLoaded ? 'Search by name, family…' : 'Loading profiles…'}
            className="pl-9 pr-9 h-11 bg-background/50 border-white/20"
            value={searchTerm}
            onChange={e => startTransition(() => setSearchTerm(e.target.value))}
            disabled={!fuse}
          />
        </div>
        <FilterSheet
          surnameFilter={surnameFilter} setSurnameFilter={setSurnameFilter}
          familyFilter={familyFilter} setFamilyFilter={setFamilyFilter}
          genderFilter={genderFilter} setGenderFilter={setGenderFilter}
          maritalFilter={maritalFilter} setMaritalFilter={setMaritalFilter}
          uniqueSurnames={uniqueSurnames} uniqueFamilies={uniqueFamilies}
          activeFilterCount={activeFilterCount} onReset={handleReset}
        />
      </div>

      {/* Result count */}
      {isFiltering && (
        <p className="text-sm text-muted-foreground px-1">
          {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}
          {hasFilter && <button onClick={handleReset} className="ml-2 text-primary hover:underline text-xs">Clear filters</button>}
        </p>
      )}

      {/* Grid — 2 columns on mobile, 3 on md, 4 on lg */}
      {finalUsers.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {finalUsers.map(user => (
              <ProfileCard key={user.id} user={user} allUsers={lookupUsers} />
            ))}
          </div>

          {canLoadMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="default" onClick={() => setVisibleCount(v => v + LOAD_MORE)}
                className="px-8 border-white/20 hover:border-primary/40">
                Load More
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No profiles found.</p>
          {isFiltering && <button onClick={handleReset} className="mt-2 text-sm text-primary hover:underline">Clear filters</button>}
        </div>
      )}
    </div>
  );
}
