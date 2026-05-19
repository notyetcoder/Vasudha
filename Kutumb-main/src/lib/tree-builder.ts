/**
 * tree-builder.ts
 *
 * Converts a normalized family into a flat nodes+edges structure
 * ready for the SVG renderer.
 *
 * Generation scheme (rows top→bottom):
 *   -2 : Grandparents
 *   -1 : Parents
 *    0 : Self + Spouse + Siblings
 *   +1 : Children
 *   +2 : Grandchildren (children's children)
 *
 * positionHint guides horizontal layout inside a generation row:
 *   'paternal-left'  | 'paternal-right'  — paternal grandparents
 *   'maternal-left'  | 'maternal-right'  — maternal grandparents
 *   'father'         | 'mother'          — parents
 *   'sibling-left'   | 'sibling-right'   — siblings (left=elder, right=younger)
 *   'self'           | 'spouse'          — root unit
 *   'child'          | 'grandchild'
 */

import type { User } from './types';
import { normalizeFamily, findChildrenFromUsers } from './family-normalizer';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface TreeNode {
  id: string;
  name: string;
  surname: string;
  gender: 'male' | 'female';
  profilePictureUrl?: string | null;
  isDeceased?: boolean;
  generation: number;            // -2 to +2
  positionHint: string;
  /** Relationship label to display under the avatar (relative to root) */
  relationLabel: string;
  isRoot: boolean;
}

export interface TreeEdge {
  from: string;
  to: string;
  /** parent = vertical line (parent→child), spouse = horizontal double-line */
  type: 'parent' | 'spouse';
}

export interface FamilyTree {
  nodes: TreeNode[];
  edges: TreeEdge[];
  /** true if root has NO parents and NO children — renders just [self] */
  isMinimal: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeNode(
  user: User,
  generation: number,
  positionHint: string,
  relationLabel: string,
  isRoot = false
): TreeNode {
  return {
    id: user.id,
    name: user.name,
    surname: user.surname,
    gender: user.gender,
    profilePictureUrl: user.profilePictureUrl,
    isDeceased: user.isDeceased,
    generation,
    positionHint,
    relationLabel,
    isRoot,
  };
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildFamilyTree(rootId: string, allUsers: User[]): FamilyTree | null {
  const family = normalizeFamily(rootId, allUsers);
  if (!family) return null;

  const { self, relations } = family;
  const visited = new Set<string>();
  const nodes: TreeNode[] = [];
  const edges: TreeEdge[] = [];

  function addNode(node: TreeNode) {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    nodes.push(node);
  }

  function addEdge(from: string, to: string, type: 'parent' | 'spouse') {
    // Prevent duplicate spouse edges (A↔B and B↔A)
    if (type === 'spouse') {
      const exists = edges.some(
        e => e.type === 'spouse' && ((e.from === from && e.to === to) || (e.from === to && e.to === from))
      );
      if (exists) return;
    }
    // Prevent duplicate parent edges
    const dup = edges.some(e => e.from === from && e.to === to && e.type === type);
    if (!dup) edges.push({ from, to, type });
  }

  // ── Generation -2: Grandparents ───────────────────────────────────────────
  const { paternal, maternal } = relations.grandparents;

  if (paternal.grandfather) {
    addNode(makeNode(paternal.grandfather, -2, 'paternal-left', 'દાદા'));
  }
  if (paternal.grandmother) {
    addNode(makeNode(paternal.grandmother, -2, 'paternal-right', 'દાદી'));
    if (paternal.grandfather) {
      addEdge(paternal.grandfather.id, paternal.grandmother.id, 'spouse');
    }
  }
  if (maternal.grandfather) {
    addNode(makeNode(maternal.grandfather, -2, 'maternal-left', 'નાના'));
  }
  if (maternal.grandmother) {
    addNode(makeNode(maternal.grandmother, -2, 'maternal-right', 'નાની'));
    if (maternal.grandfather) {
      addEdge(maternal.grandfather.id, maternal.grandmother.id, 'spouse');
    }
  }

  // ── Generation -1: Parents ────────────────────────────────────────────────
  const father = relations.father?.user ?? null;
  const mother = relations.mother?.user ?? null;

  if (father) {
    addNode(makeNode(father, -1, 'father', 'પિતા'));
    // father → self
    addEdge(father.id, self.id, 'parent');
    // paternal grandparents → father
    if (paternal.grandfather) addEdge(paternal.grandfather.id, father.id, 'parent');
    if (paternal.grandmother) addEdge(paternal.grandmother.id, father.id, 'parent');
  }
  if (mother) {
    addNode(makeNode(mother, -1, 'mother', 'માતા'));
    // mother → self
    addEdge(mother.id, self.id, 'parent');
    // maternal grandparents → mother
    if (maternal.grandfather) addEdge(maternal.grandfather.id, mother.id, 'parent');
    if (maternal.grandmother) addEdge(maternal.grandmother.id, mother.id, 'parent');
  }
  if (father && mother) {
    addEdge(father.id, mother.id, 'spouse');
  }

  // ── Generation 0: Siblings (same row as self) ────────────────────────────
  const elderSiblings = relations.siblings.filter(s => s.ageRelation === 'elder' || s.ageRelation === null).slice(0, 3);
  const youngerSiblings = relations.siblings.filter(s => s.ageRelation === 'younger').slice(0, 3);

  for (const sib of elderSiblings) {
    const u = sib.user;
    const label = u.gender === 'male' ? 'મોટા ભાઈ' : 'મોટી બહેન';
    addNode(makeNode(u, 0, 'sibling-left', label));
    if (father) addEdge(father.id, u.id, 'parent');
    if (mother) addEdge(mother.id, u.id, 'parent');
  }

  // ── Generation 0: Self ────────────────────────────────────────────────────
  addNode(makeNode(self, 0, 'self', 'You', true));

  // ── Generation 0: Spouse (rendered as a unit with self) ──────────────────
  const spouse = relations.spouse?.user ?? null;
  if (spouse) {
    addNode(makeNode(spouse, 0, 'spouse', self.gender === 'male' ? 'પત્ની' : 'પતિ'));
    addEdge(self.id, spouse.id, 'spouse');
  }

  for (const sib of youngerSiblings) {
    const u = sib.user;
    const label = u.gender === 'male' ? 'નાના ભાઈ' : 'નાની બહેન';
    addNode(makeNode(u, 0, 'sibling-right', label));
    if (father) addEdge(father.id, u.id, 'parent');
    if (mother) addEdge(mother.id, u.id, 'parent');
  }

  // ── Generation +1: Children ───────────────────────────────────────────────
  for (const { user: child } of relations.children) {
    if (visited.has(child.id)) continue;
    const label = child.gender === 'male' ? 'દીકરો' : 'દીકરી';
    addNode(makeNode(child, 1, 'child', label));
    addEdge(self.id, child.id, 'parent');
    if (spouse) addEdge(spouse.id, child.id, 'parent');

    // ── Generation +2: Grandchildren (children's children) ─────────────────
    const grandchildren = findChildrenFromUsers(child.id, allUsers).slice(0, 4);
    for (const gc of grandchildren) {
      if (visited.has(gc.id)) continue;
      const gcLabel = gc.gender === 'male'
        ? (child.gender === 'male' ? 'પૌત્ર' : 'દોહિત્ર')
        : (child.gender === 'male' ? 'પૌત્રી' : 'દોહિત્રી');
      addNode(makeNode(gc, 2, 'grandchild', gcLabel));
      addEdge(child.id, gc.id, 'parent');
    }
  }

  const isMinimal =
    !father && !mother && relations.children.length === 0 && relations.siblings.length === 0;

  return { nodes, edges, isMinimal };
}
