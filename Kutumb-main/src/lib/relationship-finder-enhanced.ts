import { User } from './types';

interface RelationshipPath {
  path: User[];
  relationship: string;
  gujaratiName: string;
  distance: number;
}

const gujaratiRelationships: Record<string, string> = {
  father: 'પિતા',
  mother: 'માતા',
  son: 'દીકરો',
  daughter: 'દીકરી',
  brother: 'ભાઈ',
  sister: 'બહેન',
  grandfather: 'દાદા / નાના',
  grandmother: 'દાદી / નાની',
  grandson: 'પૌત્ર / દોહિત્ર',
  granddaughter: 'પૌત્રી / દોહિત્રી',
  uncle: 'કાકા / મામા',
  aunt: 'કાકી / માસી',
  nephew: 'ભતીજો',
  niece: 'ભતીજી',
  cousin_male: 'કાકાનો દીકરો / મામાનો દીકરો',
  cousin_female: 'કાકાની દીકરી / મામાની દીકરી',
  husband: 'પતિ',
  wife: 'પત્ની',
  son_in_law: 'જમાઈ',
  daughter_in_law: 'પુત્રવધૂ',
  father_in_law: 'સસરા',
  mother_in_law: 'સાસુ',
  brother_in_law: 'જીજાજી / સાળો',
  sister_in_law: 'જેઠાણી / દેરાણી / સાળી',
};

export function findMultiplePaths(
  personA: User,
  personB: User,
  allUsers: User[],
  maxPaths: number = 5
): RelationshipPath[] {
  const paths: RelationshipPath[] = [];
  const userMap = new Map(allUsers.map(u => [u.id, u]));
  const visited = new Set<string>();

  interface BFSNode {
    userId: string;
    path: User[];
    distance: number;
  }

  const queue: BFSNode[] = [{
    userId: personA.id,
    path: [personA],
    distance: 0,
  }];

  visited.add(personA.id);

  while (queue.length > 0 && paths.length < maxPaths) {
    const current = queue.shift();
    if (!current) break;

    if (current.userId === personB.id) {
      const relationship = getRelationshipLabel(personA, personB, userMap, current.path);
      const gujaratiName = gujaratiRelationships[relationship] || relationship;
      
      paths.push({
        path: current.path,
        relationship,
        gujaratiName,
        distance: current.distance,
      });
      continue;
    }

    if (current.distance >= 6) continue;

    const user = userMap.get(current.userId);
    if (!user) continue;

    const relatives = getConnectedPeople(user);
    for (const relativeId of relatives) {
      if (!visited.has(relativeId)) {
        visited.add(relativeId);
        const relativeUser = userMap.get(relativeId);
        if (relativeUser) {
          queue.push({
            userId: relativeId,
            path: [...current.path, relativeUser],
            distance: current.distance + 1,
          });
        }
      }
    }
  }

  return paths;
}

function getConnectedPeople(user: User): string[] {
  const connected: string[] = [];
  if (user.fatherId) connected.push(user.fatherId);
  if (user.motherId) connected.push(user.motherId);
  if (user.spouseId) connected.push(user.spouseId);
  return connected;
}

function getRelationshipLabel(
  personA: User,
  personB: User,
  userMap: Map<string, User>,
  path: User[]
): string {
  if (path.length === 2) {
    if (personB.id === personA.fatherId) return 'father';
    if (personB.id === personA.motherId) return 'mother';
    if (personA.id === personB.fatherId) return personB.gender === 'male' ? 'son' : 'daughter';
    if (personA.id === personB.motherId) return personB.gender === 'male' ? 'son' : 'daughter';
    if (personB.id === personA.spouseId) return personB.gender === 'male' ? 'husband' : 'wife';
    
    const sameParent = (personA.fatherId && personA.fatherId === personB.fatherId) ||
                       (personA.motherId && personA.motherId === personB.motherId);
    if (sameParent) return personB.gender === 'male' ? 'brother' : 'sister';
  }

  if (path.length === 3) {
    const middle = path[1];
    if (middle.id === personA.fatherId || middle.id === personA.motherId) {
      if (personB.id === middle.fatherId) return 'grandfather';
      if (personB.id === middle.motherId) return 'grandmother';
      if (middle.id === personB.fatherId || middle.id === personB.motherId) {
        return personB.gender === 'male' ? 'uncle' : 'aunt';
      }
    }
  }

  return `relative_distance_${path.length - 1}`;
}
