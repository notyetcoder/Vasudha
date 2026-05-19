/**
 * family-normalizer.ts
 * Pure in-memory family resolution. Zero DB calls.
 * Works entirely from the allUsers array already loaded.
 */

import type { User } from './types';
import { findUserById, isPerson1Older } from './user-utils';

export interface UserWithSide {
  user: User;
  side: 'paternal' | 'maternal';
}

export interface UserWithSiblingType {
  user: User;
  type: 'full' | 'half';
  ageRelation: 'elder' | 'younger' | null;
}

export interface GrandparentGroup {
  grandfather: User | null;
  grandmother: User | null;
}

export interface NormalizedFamily {
  self: User;
  relations: {
    father:   { user: User; side: 'paternal' } | null;
    mother:   { user: User; side: 'maternal' } | null;
    spouse:   { user: User } | null;
    children: Array<{ user: User }>;
    siblings: UserWithSiblingType[];
    grandparents: {
      paternal: GrandparentGroup;
      maternal: GrandparentGroup;
    };
  };
}

export function findChildrenFromUsers(parentId: string, allUsers: User[]): User[] {
  return allUsers.filter(u => u.fatherId === parentId || u.motherId === parentId);
}

function buildSiblings(root: User, allUsers: User[]): UserWithSiblingType[] {
  if (!root.fatherId && !root.motherId) return [];
  const result: UserWithSiblingType[] = [];
  for (const u of allUsers) {
    if (u.id === root.id) continue;
    const sharesFather = !!(root.fatherId && root.fatherId === u.fatherId);
    const sharesMother = !!(root.motherId && root.motherId === u.motherId);
    if (!sharesFather && !sharesMother) continue;
    const type: 'full' | 'half' = sharesFather && sharesMother ? 'full' : 'half';
    const isRootOlder = isPerson1Older(root, u);
    const ageRelation: 'elder' | 'younger' | null =
      isRootOlder === true  ? 'younger'
      : isRootOlder === false ? 'elder'
      : null;
    result.push({ user: u, type, ageRelation });
  }
  return result;
}

export function normalizeFamily(rootId: string, allUsers: User[]): NormalizedFamily | null {
  const self = findUserById(rootId, allUsers);
  if (!self) return null;

  const father = self.fatherId ? (findUserById(self.fatherId, allUsers) ?? null) : null;
  const mother = self.motherId ? (findUserById(self.motherId, allUsers) ?? null) : null;
  const spouse = self.spouseId ? (findUserById(self.spouseId, allUsers) ?? null) : null;

  const paternalGrandfather = father?.fatherId ? (findUserById(father.fatherId, allUsers) ?? null) : null;
  const paternalGrandmother = father?.motherId ? (findUserById(father.motherId, allUsers) ?? null) : null;
  const maternalGrandfather = mother?.fatherId ? (findUserById(mother.fatherId, allUsers) ?? null) : null;
  const maternalGrandmother = mother?.motherId ? (findUserById(mother.motherId, allUsers) ?? null) : null;

  const children = findChildrenFromUsers(self.id, allUsers).map(u => ({ user: u }));
  const siblings = buildSiblings(self, allUsers);

  return {
    self,
    relations: {
      father: father ? { user: father, side: 'paternal' } : null,
      mother: mother ? { user: mother, side: 'maternal' } : null,
      spouse: spouse ? { user: spouse } : null,
      children,
      siblings,
      grandparents: {
        paternal: { grandfather: paternalGrandfather, grandmother: paternalGrandmother },
        maternal: { grandfather: maternalGrandfather, grandmother: maternalGrandmother },
      },
    },
  };
}
