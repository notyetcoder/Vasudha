'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { User } from '@/lib/types';
import { findAllRelationshipPaths, FoundPath } from '@/lib/relationship-engine';
import { buildFamilyTree } from '@/lib/tree-builder';
import { getAllUsersForPublic } from '@/actions/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserAvatar from '@/components/UserAvatar';
import FamilyTreeRenderer from '@/components/FamilyTreeRenderer';
import {
  ArrowRightLeft, ChevronRight, GitMerge, Loader2,
  Search, TreePine, Users, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ─── Person Selector Modal ────────────────────────────────────────────────────

function PersonSelectorModal({
  open, onClose, onSelect, users, title, exclude,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (u: User) => void;
  users: User[];
  title: string;
  exclude?: User | null;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users
      .filter(u => u.id !== exclude?.id)
      .filter(u => !term || `${u.name} ${u.surname} ${u.family ?? ''}`.toLowerCase().includes(term))
      .slice(0, 60);
  }, [users, q, exclude]);

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search by name..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <ScrollArea className="h-72 rounded-md border">
          <div className="p-2 space-y-1">
            {filtered.map(u => (
              <button key={u.id} onClick={() => { onSelect(u); onClose(); setQ(''); }}
                className="flex items-center gap-3 w-full text-left p-2 rounded-md hover:bg-accent transition-colors">
                <UserAvatar name={u.name} profilePictureUrl={u.profilePictureUrl} size={40} isDeceased={u.isDeceased} />
                <div>
                  <p className="font-medium text-sm">{u.name} {u.surname}</p>
                  {u.family && <p className="text-xs text-muted-foreground">{u.family}</p>}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No results found.</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Person Picker Card ───────────────────────────────────────────────────────

function PersonCard({ user, label, onClear, onSelect }: {
  user: User | null; label: string; onClear: () => void; onSelect: () => void;
}) {
  if (!user) {
    return (
      <button onClick={onSelect}
        className="flex flex-col items-center justify-center gap-2 w-full h-36 rounded-xl border-2 border-dashed border-white/20 hover:border-primary/60 hover:bg-primary/5 transition-all">
        <Users className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">Click to select</p>
      </button>
    );
  }
  return (
    <div className="relative flex flex-col items-center gap-2 w-full h-36 rounded-xl border-2 border-primary/40 bg-primary/5 p-3 justify-center">
      <button onClick={onClear} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors">
        <X className="h-4 w-4" />
      </button>
      <UserAvatar name={user.name} profilePictureUrl={user.profilePictureUrl} size={52} isDeceased={user.isDeceased} />
      <p className="font-semibold text-sm text-center">{user.name} {user.surname}</p>
      {user.family && <p className="text-xs text-muted-foreground">{user.family}</p>}
      <button onClick={onSelect} className="text-xs text-primary hover:underline">Change</button>
    </div>
  );
}

// ─── Edge label chip ──────────────────────────────────────────────────────────

function EdgeLabel({ label }: { label: string }) {
  const map: Record<string, string> = {
    father: 'Father ↑', mother: 'Mother ↑',
    son: 'Son ↓', daughter: 'Daughter ↓', spouse: 'Spouse',
  };
  return (
    <div className="flex flex-col items-center gap-1 mx-1">
      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full whitespace-nowrap">
        {map[label] ?? label}
      </span>
      <ChevronRight className="h-4 w-4 text-primary/60 shrink-0" />
    </div>
  );
}

// ─── Single path card ─────────────────────────────────────────────────────────

function PathCard({ path, index, isActive, onClick }: {
  path: FoundPath; index: number; isActive: boolean; onClick: () => void;
}) {
  // Badge color by relation type
  const typeBadgeClass: Record<string, string> = {
    direct:           'bg-blue-500/20 text-blue-300',
    grandparent:      'bg-purple-500/20 text-purple-300',
    grandchild:       'bg-purple-500/20 text-purple-300',
    'uncle-aunt':     'bg-amber-500/20 text-amber-300',
    'nephew-niece':   'bg-amber-500/20 text-amber-300',
    'uncle-aunt-child':'bg-teal-500/20 text-teal-300',
    'in-law':         'bg-pink-500/20 text-pink-300',
    extended:         'bg-orange-500/20 text-orange-300',
    distant:          'bg-gray-500/20 text-gray-400',
  };
  const badgeClass = typeBadgeClass[path.type] ?? 'bg-gray-500/20 text-gray-400';

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border-2 p-4 cursor-pointer transition-all duration-200',
        isActive
          ? 'border-primary bg-primary/5 shadow-lg'
          : 'border-white/10 bg-card/20 hover:border-primary/40',
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
            {index + 1}
          </span>
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', badgeClass)}>
            {path.type}
          </span>
          <span className="text-xs text-muted-foreground border border-white/10 px-2 py-0.5 rounded-full">
            {path.side}
          </span>
          <span className="text-xs text-muted-foreground">{path.distance} પગલાં</span>
        </div>
        {/* Primary Gujarati label */}
        <div className="text-right">
          <p className="text-base font-bold text-primary leading-tight">{path.labels.gujarati}</p>
          <p className="text-xs text-muted-foreground">{path.labels.english}</p>
        </div>
      </div>

      {/* Gujarati path explanation */}
      {path.gujaratiPath && (
        <p className="text-xs text-muted-foreground/70 mb-3 italic">
          {path.gujaratiPath}
        </p>
      )}

      {/* Horizontal chain of people */}
      <div className="overflow-x-auto">
        <div className="flex items-center min-w-max gap-0">
          {path.steps.map((step, i) => (
            <div key={`${step.id}-${i}`} className="flex items-center">
              {i > 0 && <EdgeLabel label={step.edgeLabel} />}
              <Link href={`/profile/${step.id}`} onClick={e => e.stopPropagation()}
                className="flex flex-col items-center gap-1 group min-w-[70px]">
                <UserAvatar
                  name={step.name}
                  profilePictureUrl={step.profilePictureUrl}
                  size={i === 0 || i === path.steps.length - 1 ? 56 : 44}
                  className={cn(
                    'transition-transform group-hover:scale-110',
                    (i === 0 || i === path.steps.length - 1) && 'ring-2 ring-primary ring-offset-2',
                  )}
                />
                <p className="text-xs font-medium text-center max-w-[70px] truncate">{step.name}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Hindi label footer */}
      <p className="text-xs text-muted-foreground/60 mt-2 text-right">{path.labels.hindi}</p>
    </div>
  );
}

// ─── Connection Finder View ───────────────────────────────────────────────────

function ConnectionFinder({ users, loading }: { users: User[]; loading: boolean }) {
  const [personA, setPersonA] = useState<User | null>(null);
  const [personB, setPersonB] = useState<User | null>(null);
  const [result, setResult] = useState<ReturnType<typeof findAllRelationshipPaths> | null>(null);
  const [finding, setFinding] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [modal, setModal] = useState<'A' | 'B' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFind = () => {
    if (!personA || !personB) return;
    setFinding(true);
    setError(null);
    try {
      const res = findAllRelationshipPaths(personA, personB, users);
      setResult(res);
      setActiveIdx(0);
      if (!res.found) setError('No connection found within 8 steps between these two people.');
    } catch { setError('An error occurred. Please try again.'); }
    finally { setFinding(false); }
  };

  const handleSwap = () => { setPersonA(personB); setPersonB(personA); setResult(null); };

  return (
    <div className="space-y-6">
      <Card className="bg-card/30 backdrop-blur-lg border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">Select Two People</CardTitle>
          {loading && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading all community profiles…
            </p>
          )}
          {!loading && <p className="text-sm text-muted-foreground">{users.length} members loaded</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <PersonCard user={personA} label="Person A"
              onClear={() => { setPersonA(null); setResult(null); }}
              onSelect={() => setModal('A')} />
            <button onClick={handleSwap} disabled={!personA && !personB}
              className="p-2 rounded-full border border-white/20 hover:bg-primary/10 disabled:opacity-40 transition-colors">
              <ArrowRightLeft className="h-4 w-4" />
            </button>
            <PersonCard user={personB} label="Person B"
              onClear={() => { setPersonB(null); setResult(null); }}
              onSelect={() => setModal('B')} />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>
          )}

          <Button onClick={handleFind} disabled={!personA || !personB || finding || loading}
            className="w-full py-5 text-base font-semibold bg-gradient-to-r from-primary to-violet-500 hover:opacity-90"
            size="lg">
            {finding ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Search className="h-5 w-5 mr-2" />}
            Find Relationship
          </Button>
        </CardContent>
      </Card>

      {/* Results — show best path prominently, others as numbered tabs */}
      {result?.found && result.paths.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {result.paths.length === 1 ? '1 Connection Found' : `${result.paths.length} Connections Found`}
            </h2>
            <p className="text-sm text-muted-foreground">
              નજીકનો: <span className="font-semibold text-primary">{result.paths[0].labels.gujarati}</span>
              <span className="text-xs text-muted-foreground ml-1">({result.paths[0].side})</span>
            </p>
          </div>

          {/* Numbered path selector buttons */}
          {result.paths.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {result.paths.map((p, i) => (
                <button key={i} onClick={() => setActiveIdx(i)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                    activeIdx === i
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-white/20 text-muted-foreground hover:border-primary/40',
                  )}>
                  {i + 1} · {p.labels.gujarati} · {p.side}
                </button>
              ))}
            </div>
          )}

          {/* Active path */}
          <PathCard path={result.paths[activeIdx]} index={activeIdx} isActive onClick={() => {}} />
        </div>
      )}

      <PersonSelectorModal open={modal === 'A'} onClose={() => setModal(null)}
        onSelect={u => { setPersonA(u); setResult(null); }} users={users} title="Select Person A" exclude={personB} />
      <PersonSelectorModal open={modal === 'B'} onClose={() => setModal(null)}
        onSelect={u => { setPersonB(u); setResult(null); }} users={users} title="Select Person B" exclude={personA} />
    </div>
  );
}

// ─── Tree View ────────────────────────────────────────────────────────────────

function TreeView({ users, loading }: { users: User[]; loading: boolean }) {
  const [root, setRoot] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const tree = useMemo(() => {
    if (!root || users.length === 0) return null;
    return buildFamilyTree(root.id, users);
  }, [root, users]);

  return (
    <div className="space-y-6">
      <Card className="bg-card/30 backdrop-blur-lg border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">Select a Person to View Their Family Tree</CardTitle>
          {loading && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading community data…
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {root ? (
              <div className="flex items-center gap-3 flex-1 bg-primary/5 border border-primary/30 rounded-xl px-4 py-3">
                <UserAvatar name={root.name} profilePictureUrl={root.profilePictureUrl} size={48} isDeceased={root.isDeceased} />
                <div>
                  <p className="font-semibold">{root.name} {root.surname}</p>
                  {root.family && <p className="text-xs text-muted-foreground">{root.family}</p>}
                </div>
                <button onClick={() => { setRoot(null); }} className="ml-auto text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 h-16 rounded-xl border-2 border-dashed border-white/20 hover:border-primary/60 hover:bg-primary/5 transition-all">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to choose a person</span>
              </button>
            )}
            {root && (
              <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
                Change
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {tree && (
        <Card className="bg-card/30 backdrop-blur-lg border-white/10 shadow-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">
              Family Tree — {root?.name} {root?.surname}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {tree.nodes.length} people · {tree.edges.length} connections · Click any photo to visit their profile
            </p>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <FamilyTreeRenderer tree={tree} />
          </CardContent>
        </Card>
      )}

      {!root && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <TreePine className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Select a person above to view their family tree</p>
        </div>
      )}

      <PersonSelectorModal open={modalOpen} onClose={() => setModalOpen(false)}
        onSelect={u => { setRoot(u); setModalOpen(false); }}
        users={users} title="Select Person to View Tree" />
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function RelationshipFinderClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const view = (searchParams.get('view') ?? 'tree') as 'tree' | 'finder';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsersForPublic(1, 10000)
      .then(({ users: u }) => setUsers(u))
      .finally(() => setLoading(false));
  }, []);

  const setView = useCallback((v: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', v);
    router.replace(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Tab toggle — persisted in URL */}
      <div className="flex justify-center">
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="bg-card/40 border border-white/10">
            <TabsTrigger value="tree" className="gap-2">
              <TreePine className="h-4 w-4" /> Family Tree
            </TabsTrigger>
            <TabsTrigger value="finder" className="gap-2">
              <GitMerge className="h-4 w-4" /> Find Connection
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === 'tree'   && <TreeView   users={users} loading={loading} />}
      {view === 'finder' && <ConnectionFinder users={users} loading={loading} />}
    </div>
  );
}
