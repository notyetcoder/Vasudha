import { RELATIONSHIP_DATA } from './relationshipData';
import { Language } from './types';

export function getRelationshipLabel(
  relationshipKey: string | undefined,
  language: Language = 'gujarati'
): string {
  if (!relationshipKey) {
    return 'Unknown Relationship';
  }

  const normalizedKey = relationshipKey.toLowerCase().replace(/\s+/g, '_');
  const data = RELATIONSHIP_DATA[normalizedKey];

  if (data) {
    return data[language];
  }

  // Fallback
  console.warn(`Translation not found for relationship: ${relationshipKey}`);
  return relationshipKey.charAt(0).toUpperCase() + relationshipKey.slice(1);
}

export function getRelationshipTranslations(relationshipKey: string | undefined) {
  if (!relationshipKey) {
    return {
      gujarati: 'Unknown',
      hindi: 'Unknown',
      english: 'Unknown Relationship'
    };
  }

  const normalizedKey = relationshipKey.toLowerCase().replace(/\s+/g, '_');
  const data = RELATIONSHIP_DATA[normalizedKey];

  if (data) {
    return {
      gujarati: data.gujarati,
      hindi: data.hindi,
      english: data.english
    };
  }

  return {
    gujarati: relationshipKey,
    hindi: relationshipKey,
    english: relationshipKey
  };
}

export function getRelationshipCategory(relationshipKey: string | undefined) {
  if (!relationshipKey) return null;

  const normalizedKey = relationshipKey.toLowerCase().replace(/\s+/g, '_');
  const data = RELATIONSHIP_DATA[normalizedKey];

  return data?.category || null;
}
