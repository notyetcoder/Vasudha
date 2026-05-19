'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import type { FamilyTree, TreeNode, TreeEdge } from '@/lib/tree-builder';
import UserAvatar from './UserAvatar';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// ─── Layout constants ─────────────────────────────────────────────────────────

const NODE_W  = 84;
const NODE_H  = 108;
const H_GAP   = 20;
const V_GAP   = 68;

// ─── Position calculator ──────────────────────────────────────────────────────

type GroupedNodes = Record<number, TreeNode[]>;

function groupByGeneration(nodes: TreeNode[]): GroupedNodes {
  const groups: GroupedNodes = {};
  for (const n of nodes) {
    if (!groups[n.generation]) groups[n.generation] = [];
    groups[n.generation].push(n);
  }
  const hintOrder = [
    'paternal-left','paternal-right','maternal-left','maternal-right',
    'father','mother',
    'sibling-left','self','spouse','sibling-right',
    'child','grandchild',
  ];
  for (const gen of Object.keys(groups)) {
    groups[Number(gen)].sort(
      (a, b) => hintOrder.indexOf(a.positionHint) - hintOrder.indexOf(b.positionHint)
    );
  }
  return groups;
}

function computePositions(
  groups: GroupedNodes,
  canvasW: number
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const PADDING = 16;

  for (let gen = -2; gen <= 2; gen++) {
    const row = groups[gen] ?? [];
    if (row.length === 0) continue;

    // Row Y: generation 0 is the anchor row (index 2 from top)
    const rowIndex = gen + 2;
    const rowY = rowIndex * (NODE_H + V_GAP) + 24;

    if (gen === -2) {
      // Split grandparents: paternal left, maternal right
      const paternal = row.filter(n => n.positionHint.startsWith('paternal'));
      const maternal  = row.filter(n => n.positionHint.startsWith('maternal'));

      const patW = paternal.length * NODE_W + Math.max(0, paternal.length - 1) * H_GAP;
      const matW = maternal.length  * NODE_W + Math.max(0, maternal.length  - 1) * H_GAP;

      const midX = canvasW / 2;
      let lx = midX - patW - 56;
      for (const n of paternal) { positions[n.id] = { x: lx, y: rowY }; lx += NODE_W + H_GAP; }
      let rx = midX + 56;
      for (const n of maternal)  { positions[n.id] = { x: rx, y: rowY }; rx += NODE_W + H_GAP; }
      continue;
    }

    const totalW = row.length * NODE_W + Math.max(0, row.length - 1) * H_GAP;
    let startX = Math.max(PADDING, (canvasW - totalW) / 2);
    for (const n of row) {
      positions[n.id] = { x: startX, y: rowY };
      startX += NODE_W + H_GAP;
    }
  }

  return positions;
}

// ─── Edge SVG lines ───────────────────────────────────────────────────────────

function Edges({
  edges,
  positions,
}: {
  edges: TreeEdge[];
  positions: Record<string, { x: number; y: number }>;
}) {
  return (
    <>
      {edges.map((edge, i) => {
        const from = positions[edge.from];
        const to   = positions[edge.to];
        if (!from || !to) return null;

        const fx = from.x + NODE_W / 2;
        const fy = from.y + NODE_H / 2;
        const tx = to.x   + NODE_W / 2;
        const ty = to.y   + NODE_H / 2;

        if (edge.type === 'spouse') {
          return (
            <line key={i} x1={fx} y1={fy} x2={tx} y2={ty}
              stroke="hsl(var(--primary) / 0.45)" strokeWidth={2}
              strokeDasharray="5 3" strokeLinecap="round" />
          );
        }

        // Parent → child: elbow
        const exitY  = from.y + NODE_H - 4;
        const enterY = to.y + 4;
        const midY   = (exitY + enterY) / 2;
        const d = `M ${fx} ${exitY} L ${fx} ${midY} L ${tx} ${midY} L ${tx} ${enterY}`;
        return (
          <path key={i} d={d} fill="none"
            stroke="hsl(var(--muted-foreground) / 0.4)" strokeWidth={1.5}
            strokeLinecap="round" strokeLinejoin="round" />
        );
      })}
    </>
  );
}

// ─── Node rendered as foreignObject ──────────────────────────────────────────

function NodeFO({
  node,
  pos,
  onClick,
}: {
  node: TreeNode;
  pos: { x: number; y: number };
  onClick: (id: string) => void;
}) {
  return (
    <foreignObject x={pos.x} y={pos.y} width={NODE_W} height={NODE_H}
      style={{ overflow: 'visible' }}>
      {/* @ts-ignore — xmlns needed for SVG foreignObject in some environments */}
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        onClick={() => onClick(node.id)}
        className={cn(
          'flex flex-col items-center gap-[3px] p-1 rounded-xl cursor-pointer select-none',
          'transition-all duration-150 hover:scale-105 hover:bg-white/5',
          node.isRoot && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
        )}
        style={{ width: NODE_W }}
        title={`${node.name} ${node.surname}`}
      >
        <UserAvatar
          name={node.name}
          profilePictureUrl={node.profilePictureUrl}
          size={50}
          isDeceased={node.isDeceased}
        />
        <p style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2, textAlign: 'center',
                    width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: 'hsl(var(--foreground))' }}>
          {node.name}
        </p>
        <p style={{ fontSize: 10, textAlign: 'center', color: 'hsl(var(--primary))', lineHeight: 1.2 }}>
          {node.relationLabel}
        </p>
      </div>
    </foreignObject>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground px-4 pb-2 flex-wrap">
      <span className="flex items-center gap-1">
        <span className="inline-block w-6 border-t-2 border-dashed border-primary/50" />
        Married
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-6 border-t-[1.5px] border-muted-foreground/40" />
        Parent / Child
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded-full ring-2 ring-primary ring-offset-1" />
        You (root)
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FamilyTreeRenderer({ tree }: { tree: FamilyTree }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(760);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w) setCanvasW(Math.max(w, 380));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const groups    = useMemo(() => groupByGeneration(tree.nodes), [tree.nodes]);
  const positions = useMemo(() => computePositions(groups, canvasW), [groups, canvasW]);

  const occupiedGens = Object.keys(groups).map(Number);
  if (occupiedGens.length === 0) return null;
  const minGen = Math.min(...occupiedGens);
  const maxGen = Math.max(...occupiedGens);
  const rowCount = maxGen - minGen + 1;
  const canvasH = (maxGen + 2 + 1) * (NODE_H + V_GAP) + 48;

  const handleNodeClick = (id: string) => router.push(`/profile/${id}`);

  if (tree.isMinimal) {
    const solo = tree.nodes[0];
    if (!solo) return null;
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div onClick={() => handleNodeClick(solo.id)} className="cursor-pointer">
          <UserAvatar name={solo.name} profilePictureUrl={solo.profilePictureUrl} size={80} isDeceased={solo.isDeceased} />
        </div>
        <p className="text-sm text-muted-foreground max-w-xs">
          No family connections are linked yet for <strong>{solo.name}</strong>. An admin can add parents, spouse or children.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1">
      <Legend />
      <div ref={containerRef} className="w-full overflow-x-auto rounded-b-xl">
        <svg width={canvasW} height={canvasH} style={{ display: 'block', minWidth: 360 }}>
          {/* Edges first (drawn behind nodes) */}
          <Edges edges={tree.edges} positions={positions} />
          {/* Nodes */}
          {tree.nodes.map(node => {
            const pos = positions[node.id];
            if (!pos) return null;
            return <NodeFO key={node.id} node={node} pos={pos} onClick={handleNodeClick} />;
          })}
        </svg>
      </div>
    </div>
  );
}
