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
  ArrowRightLeft, ArrowDown, GitMerge, Loader2,
  Search, TreePine, Users, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Fuse from 'fuse.js';

// ─── Person Selector Modal ────────────────────────────────────────────────────

function PersonSelectorModal({ open, onClose, onSelect, users, title, exclude }: {
  open: boolean; onClose: () => void; onSelect: (u: User) => void;
  users: User[]; title: string; exclude?: User | null;
}) {
  const [q, setQ] = useState('');

  const fuse = useMemo(() => new Fuse(users.filter(u => u.id !== exclude?.id), {
    keys: ['name', 'surname', 'family'], threshold: 0.35, minMatchCharLength: 2,
  }), [users, exclude]);

  const filtered = useMemo(() => {
    const term = q.trim();
    if (!term) return users.filter(u => u.id !== exclude?.id).slice(0, 80);
    return fuse.search(term, { limit: 60 }).map(r => r.item);
  }, [q, fuse, users, exclude]);

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader><DialogTitle className="text-base">{title}</DialogTitle></DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input autoFocus placeholder="Search by name…" value={q}
            onChange={e => setQ(e.target.value)} className="pl-9 h-11" />
        </div>
        <ScrollArea className="flex-1 max-h-[60vh] rounded-md border">
          <div className="p-2 space-y-1">
            {filtered.map(u => (
              <button key={u.id} onClick={() => { onSelect(u); onClose(); setQ(''); }}
                className="flex items-center gap-3 w-full text-left p-2.5 rounded-lg hover:bg-accent active:bg-accent/80 transition-colors">
                <UserAvatar name={u.name} profilePictureUrl={u.profilePictureUrl} size={40} isDeceased={u.isDeceased} />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{u.name} {u.surname}</p>
                  {u.family && <p className="text-xs text-muted-foreground truncate">{u.family}</p>}
                </div>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No results.</p>}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Person Picker Card (compact for mobile) ─────────────────────────────────

function PersonCard({ user, label, onClear, onSelect }: {
  user: User | null; label: string; onClear: () => void; onSelect: () => void;
}) {
  if (!user) {
    return (
      <button onClick={onSelect}
        className="flex flex-col items-center justify-center gap-2 w-full h-28 sm:h-32 rounded-xl border-2 border-dashed border-white/20 hover:border-primary/60 hover:bg-primary/5 active:scale-95 transition-all">
        <Users className="h-6 w-6 text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <span className="text-xs text-muted-foreground/60">Tap to select</span>
      </button>
    );
  }
  return (
    <div className="relative flex flex-col items-center gap-1.5 w-full h-28 sm:h-32 rounded-xl border-2 border-primary/40 bg-primary/5 p-3 justify-center">
      <button onClick={onClear} className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10">
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <UserAvatar name={user.name} profilePictureUrl={user.profilePictureUrl} size={44} isDeceased={user.isDeceased} />
      <p className="font-semibold text-xs text-center truncate max-w-full px-4">{user.name} {user.surname}</p>
      {user.family && <p className="text-[10px] text-muted-foreground truncate">{user.family}</p>}
    </div>
  );
}

// ─── Path chain — vertical on mobile, horizontal on md+ ─────────────────────

function PathChain({ path }: { path: FoundPath }) {
  const EDGE_LABEL: Record<string, string> = {
    father: 'પિતા ↑', mother: 'માતા ↑',
    son: 'દીકરો ↓', daughter: 'દીકરી ↓', spouse: 'પત્ની/પતિ',
  };

  return (
    <div className="w-full">
      {/* Mobile: vertical */}
      <div className="flex flex-col items-center gap-0 md:hidden">
        {path.steps.map((step, i) => (
          <div key={`${step.id}-${i}`} className="flex flex-col items-center">
            {i > 0 && (
              <div className="flex flex-col items-center py-1">
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {EDGE_LABEL[step.edgeLabel] ?? step.edgeLabel}
                </span>
                <ArrowDown className="h-3.5 w-3.5 text-primary/50 mt-0.5" />
              </div>
            )}
            <Link href={`/profile/${step.id}`} className="flex flex-col items-center gap-1 group">
              <UserAvatar name={step.name} profilePictureUrl={step.profilePictureUrl}
                size={i === 0 || i === path.steps.length - 1 ? 52 : 44}
                className={cn('transition-transform group-hover:scale-110',
                  (i === 0 || i === path.steps.length - 1) && 'ring-2 ring-primary ring-offset-2'
                )}
              />
              <p className="text-xs font-medium text-center">{step.name}</p>
            </Link>
          </div>
        ))}
      </div>

      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-center overflow-x-auto">
        {path.steps.map((step, i) => (
          <div key={`${step.id}-d-${i}`} className="flex items-center shrink-0">
            {i > 0 && (
              <div className="flex flex-col items-center gap-0.5 mx-2">
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  {EDGE_LABEL[step.edgeLabel] ?? step.edgeLabel}
                </span>
                <div className="w-4 h-px bg-primary/40" />
              </div>
            )}
            <Link href={`/profile/${step.id}`} className="flex flex-col items-center gap-1 group min-w-[70px]">
              <UserAvatar name={step.name} profilePictureUrl={step.profilePictureUrl}
                size={i === 0 || i === path.steps.length - 1 ? 56 : 44}
                className={cn('transition-transform group-hover:scale-110',
                  (i === 0 || i === path.steps.length - 1) && 'ring-2 ring-primary ring-offset-2'
                )}
              />
              <p className="text-xs font-medium text-center max-w-[70px] truncate">{step.name}</p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PathCard ─────────────────────────────────────────────────────────────────

function PathCard({ path, index, isActive, onClick }: {
  path: FoundPath; index: number; isActive: boolean; onClick: () => void;
}) {
  const typeBadge: Record<string, string> = {
    direct: 'bg-blue-500/20 text-blue-300',
    grandparent: 'bg-purple-500/20 text-purple-300',
    grandchild: 'bg-purple-500/20 text-purple-300',
    'uncle-aunt': 'bg-amber-500/20 text-amber-300',
    'nephew-niece': 'bg-amber-500/20 text-amber-300',
    'uncle-aunt-child': 'bg-teal-500/20 text-teal-300',
    'in-law': 'bg-pink-500/20 text-pink-300',
    extended: 'bg-orange-500/20 text-orange-300',
    distant: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div onClick={onClick}
      className={cn('rounded-xl border-2 p-4 cursor-pointer transition-all duration-200',
        isActive ? 'border-primary bg-primary/5 shadow-lg' : 'border-white/10 bg-card/20 hover:border-primary/40'
      )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">{index + 1}</span>
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', typeBadge[path.type] ?? 'bg-gray-500/20 text-gray-400')}>{path.type}</span>
          <span className="text-xs border border-white/10 px-2 py-0.5 rounded-full text-muted-foreground">{path.side}</span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-primary leading-tight">{path.labels.gujarati}</p>
          <p className="text-[11px] text-muted-foreground">{path.labels.english}</p>
        </div>
      </div>

      {/* Path explanation */}
      {path.gujaratiPath && (
        <p className="text-[11px] text-muted-foreground/70 mb-3 italic leading-relaxed">{path.gujaratiPath}</p>
      )}

      <PathChain path={path} />

      <p className="text-[11px] text-muted-foreground/50 mt-3 text-right">{path.labels.hindi}</p>
    </div>
  );
}

// ─── Connection Finder ────────────────────────────────────────────────────────

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
    setFinding(true); setError(null);
    try {
      const res = findAllRelationshipPaths(personA, personB, users);
      setResult(res); setActiveIdx(0);
      if (!res.found) setError('No connection found within 8 steps.');
    } catch { setError('An error occurred. Please try again.'); }
    finally { setFinding(false); }
  };

  const swap = () => { setPersonA(personB); setPersonB(personA); setResult(null); };

  return (
    <div className="space-y-5">
      <Card className="bg-card/30 backdrop-blur-lg border-white/10 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Select Two People</CardTitle>
          {loading
            ? <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</p>
            : <p className="text-xs text-muted-foreground">{users.length} members loaded</p>
          }
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[1fr_36px_1fr] gap-2 items-center">
            <PersonCard user={personA} label="Person A" onClear={() => { setPersonA(null); setResult(null); }} onSelect={() => setModal('A')} />
            <button onClick={swap} disabled={!personA && !personB}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-white/20 hover:bg-primary/10 disabled:opacity-40 transition-colors mx-auto">
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </button>
            <PersonCard user={personB} label="Person B" onClear={() => { setPersonB(null); setResult(null); }} onSelect={() => setModal('B')} />
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>}

          <Button onClick={handleFind} disabled={!personA || !personB || finding || loading}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-violet-500 hover:opacity-90 active:scale-95 transition-all">
            {finding ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Search className="h-5 w-5 mr-2" />}
            Find Relationship
          </Button>
        </CardContent>
      </Card>

      {result?.found && result.paths.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold">
              {result.paths.length === 1 ? '1 Connection' : `${result.paths.length} Connections Found`}
            </h2>
            <span className="text-sm font-semibold text-primary">{result.paths[0].labels.gujarati}</span>
          </div>

          {result.paths.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {result.paths.map((p, i) => (
                <button key={i} onClick={() => setActiveIdx(i)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                    activeIdx === i ? 'bg-primary text-primary-foreground border-primary' : 'border-white/20 text-muted-foreground hover:border-primary/40'
                  )}>
                  {i + 1} · {p.labels.gujarati}
                </button>
              ))}
            </div>
          )}

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
  const tree = useMemo(() => (root && users.length > 0 ? buildFamilyTree(root.id, users) : null), [root, users]);

  return (
    <div className="space-y-5">
      <Card className="bg-card/30 backdrop-blur-lg border-white/10 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Select a Person</CardTitle>
          {loading && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</p>}
        </CardHeader>
        <CardContent>
          {root ? (
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/30 rounded-xl px-4 py-3">
              <UserAvatar name={root.name} profilePictureUrl={root.profilePictureUrl} size={44} isDeceased={root.isDeceased} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{root.name} {root.surname}</p>
                {root.family && <p className="text-xs text-muted-foreground">{root.family}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setModalOpen(true)} className="text-xs">Change</Button>
                <button onClick={() => setRoot(null)} className="p-1 rounded-full hover:bg-white/10">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-xl border-2 border-dashed border-white/20 hover:border-primary/60 hover:bg-primary/5 active:scale-95 transition-all">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tap to choose a person</span>
            </button>
          )}
        </CardContent>
      </Card>

      {tree && (
        <Card className="bg-card/30 backdrop-blur-lg border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{root?.name} {root?.surname} — Family Tree</CardTitle>
            <p className="text-xs text-muted-foreground">{tree.nodes.length} people · Tap any photo to view profile</p>
          </CardHeader>
          <CardContent className="p-0 pb-4 overflow-x-auto">
            <FamilyTreeRenderer tree={tree} />
          </CardContent>
        </Card>
      )}

      {!root && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <TreePine className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a person to view their family tree</p>
        </div>
      )}

      <PersonSelectorModal open={modalOpen} onClose={() => setModalOpen(false)}
        onSelect={u => { setRoot(u); setModalOpen(false); }}
        users={users} title="Select Person" />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RelationshipFinderClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = (searchParams.get('view') ?? 'tree') as 'tree' | 'finder';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsersForPublic(1, 10000).then(({ users: u }) => setUsers(u)).finally(() => setLoading(false));
  }, []);

  const setView = useCallback((v: string) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('view', v);
    router.replace(`${pathname}?${p.toString()}`);
  }, [router, pathname, searchParams]);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex justify-center">
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="bg-card/40 border border-white/10 h-11">
            <TabsTrigger value="tree" className="gap-2 px-4 text-sm"><TreePine className="h-4 w-4" /> Family Tree</TabsTrigger>
            <TabsTrigger value="finder" className="gap-2 px-4 text-sm"><GitMerge className="h-4 w-4" /> Find Connection</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {view === 'tree'   && <TreeView   users={users} loading={loading} />}
      {view === 'finder' && <ConnectionFinder users={users} loading={loading} />}
    </div>
  );
}
