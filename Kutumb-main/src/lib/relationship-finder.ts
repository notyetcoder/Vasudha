import { User, RelationshipResult } from './types';

const MAX_SEARCH_DEPTH = 6;

interface PathNode {
  userId: string;
  name: string;
  distance: number;
  path: Array<{ id: string; name: string }>;
}

/**
 * Find relationship between two people using BFS algorithm
 * @param personA Starting person
 * @param personB Target person
 * @param allUsers All users in the system
 * @returns Relationship result with path and type
 */
export function findRelationshipPath(
  personA: User,
  personB: User,
  allUsers: User[]
): RelationshipResult {
  if (!personA || !personB) {
    return { found: false };
  }

  if (personA.id === personB.id) {
    return {
      found: true,
      relationship: 'self',
      explanation: 'Same person',
      distance: 0
    };
  }

  // Create user map for quick lookup
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  // BFS to find shortest path
  const queue: PathNode[] = [
    {
      userId: personA.id,
      name: personA.name,
      distance: 0,
      path: [{ id: personA.id, name: personA.name }]
    }
  ];

  const visited = new Set([personA.id]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    // Check if we've found the target
    if (current.userId === personB.id) {
      return {
        found: true,
        relationship: getRelationshipType(personA, personB, userMap, current.path),
        path: current.path,
        distance: current.distance,
        explanation: `Found connection through ${current.distance} generations`
      };
    }

    // Don't search beyond max depth
    if (current.distance >= MAX_SEARCH_DEPTH) {
      continue;
    }

    const user = userMap.get(current.userId);
    if (!user) continue;

    // Get connected people
    const connectedIds = getConnectedPeople(user);

    for (const connectedId of connectedIds) {
      if (!visited.has(connectedId)) {
        visited.add(connectedId);
        const connectedUser = userMap.get(connectedId);
        if (connectedUser && !connectedUser.isDeleted) {
          queue.push({
            userId: connectedId,
            name: connectedUser.name,
            distance: current.distance + 1,
            path: [
              ...current.path,
              { id: connectedId, name: connectedUser.name }
            ]
          });
        }
      }
    }
  }

  return { found: false };
}

/**
 * Get IDs of people connected to the given user
 */
function getConnectedPeople(user: User): string[] {
  const connected: string[] = [];

  if (user.fatherId) connected.push(user.fatherId);
  if (user.motherId) connected.push(user.motherId);
  if (user.spouseId) connected.push(user.spouseId);

  return connected;
}

/**
 * Determine the relationship type between two people
 */
function getRelationshipType(
  personA: User,
  personB: User,
  userMap: Map<string, User>,
  path: Array<{ id: string; name: string }>
): string {
  // Direct relationships
  if (personB.id === personA.fatherId) return 'father';
  if (personB.id === personA.motherId) return 'mother';
  if (personB.id === personA.spouseId) return 'spouse';
  if (personB.id === personA.spouseId) return 'spouse';

  // Check if personB is a child of personA
  const childrenOfA = personA.id === personB.fatherId || personA.id === personB.motherId;
  if (childrenOfA) {
    return personB.gender === 'male' ? 'son' : 'daughter';
  }

  // Siblings
  if (
    (personA.fatherId && personA.fatherId === personB.fatherId) ||
    (personA.motherId && personA.motherId === personB.motherId)
  ) {
    return personB.gender === 'male' ? 'brother' : 'sister';
  }

  // Grandparents
  const fatherOfA = userMap.get(personA.fatherId || '');
  const motherOfA = userMap.get(personA.motherId || '');

  if (personB.id === fatherOfA?.fatherId) return 'paternal_grandfather';
  if (personB.id === fatherOfA?.motherId) return 'paternal_grandmother';
  if (personB.id === motherOfA?.fatherId) return 'maternal_grandfather';
  if (personB.id === motherOfA?.motherId) return 'maternal_grandmother';

  // Grandchildren
  const childrenOfPersonB = personB.id === personA.fatherId || personB.id === personA.motherId;
  if (childrenOfPersonB) {
    // Check if personA has children
    const grandchildrenOfB = allUsersWithParent(userMap, personA.id);
    if (grandchildrenOfB.some(g => g.id === personB.id)) {
      return personA.gender === 'male' ? 'grandson_from_son' : 'granddaughter_from_son';
    }
  }

  // Default: unknown relationship based on distance
  const distance = path.length - 1;
  if (distance === 2) return 'cousin';
  if (distance === 3) return 'second_cousin';
  return `relative_distance_${distance}`;
}

/**
 * Get all users with a specific parent
 */
function allUsersWithParent(userMap: Map<string, User>, parentId: string): User[] {
  return Array.from(userMap.values()).filter(
    u => u.fatherId === parentId || u.motherId === parentId
  );
}
