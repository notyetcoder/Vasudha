/**
 * server-utils.ts
 *
 * Pure in-memory helpers for the profile page server component.
 * These replace the old DB-calling findChildren/findSiblings functions.
 * Using the already-loaded allUsers array means zero extra DB calls.
 */

import type { User } from './types';

export function findChildren(parentId: string, allUsers: User[]): User[] {
  return allUsers.filter(
    u => u.fatherId === parentId || u.motherId === parentId
  );
}

export function findSiblings(user: User, allUsers: User[]): User[] {
  if (!user.fatherId && !user.motherId) return [];
  return allUsers.filter(u => {
    if (u.id === user.id) return false;
    const sharesFather = !!(user.fatherId && user.fatherId === u.fatherId);
    const sharesMother = !!(user.motherId && user.motherId === u.motherId);
    return sharesFather || sharesMother;
  });
}
