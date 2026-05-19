/**
 * relationship-engine.ts
 *
 * Gujarati family relationship finder using BFS + pattern-based labelling.
 *
 * RULES:
 *  — No English word "cousin" anywhere in output.
 *  — Cousin-equivalents use the full Gujarati descriptive form:
 *      [uncle/aunt] + નો/ની + દીકરો/દીકરી + ભાઈ/બહેન
 *  — Side detection from the FIRST edge step:
 *      father first  → પિતૃ પક્ષ
 *      mother first  → માતૃ પક્ષ
 *      spouse first  → સસરિયું પક્ષ
 *      child/self    → સ્વ પક્ષ
 *  — Fallback: "દૂરનો સગો (પિતૃ/માતૃ/સસરિયું પક્ષ)"
 *
 * Output per path: { labels: { gujarati, hindi, english }, side, type, gujaratiPath }
 */

import { User } from './types';
import { isPerson1Older } from './user-utils';

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PathStep {
  id: string;
  name: string;
  gender: 'male' | 'female';
  profilePictureUrl?: string | null;
  edgeLabel: string;
}

export type RelationSide =
  | 'પિતૃ પક્ષ'      // father side
  | 'માતૃ પક્ષ'      // mother side
  | 'સસરિયું પક્ષ'   // spouse/in-law side
  | 'સ્વ પક્ષ';      // direct / self

export type RelationType =
  | 'direct'       // parent, child, sibling, spouse
  | 'grandparent'  // dada, dadi, nana, nani, pardada...
  | 'grandchild'   // pautra, dohitra...
  | 'uncle-aunt'   // kaka, foi, mama, masi + their spouses
  | 'nephew-niece' // bhatrijo, bhatiji, bhano, bhani
  | 'uncle-aunt-child' // kakano dikro bhai, foino dikro bhai etc.
  | 'in-law'       // sasro, sasu, jamai, vahu, salo, sali, jeth, devar...
  | 'extended'     // one generation beyond uncle-aunt children
  | 'distant';     // too far — duro sago

export interface FoundPath {
  steps: PathStep[];
  relationshipKey: string;
  labels: {
    gujarati: string;   // primary display — always Gujarati
    hindi: string;
    english: string;
  };
  gujaratiPath: string;   // human-readable Gujarati path e.g. "પિતા → કાકા → તેમનો દીકરો"
  side: RelationSide;
  type: RelationType;
  distance: number;
}

export interface RelationshipResult {
  found: boolean;
  paths: FoundPath[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDE DETECTOR
// ─────────────────────────────────────────────────────────────────────────────

function detectSide(edgeTypes: string[]): RelationSide {
  const first = edgeTypes[0];
  if (!first || first === 'son' || first === 'daughter') return 'સ્વ પક્ષ';
  if (first === 'father') return 'પિતૃ પક્ષ';
  if (first === 'mother') return 'માતૃ પક્ષ';
  if (first === 'spouse') return 'સસરિયું પક્ષ';
  return 'સ્વ પક્ષ';
}

// ─────────────────────────────────────────────────────────────────────────────
// GUJARATI PATH BUILDER
// builds a readable Gujarati explanation of the traversal steps
// ─────────────────────────────────────────────────────────────────────────────

const EDGE_GUJARATI: Record<string, string> = {
  father:   'પિતા',
  mother:   'માતા',
  son:      'દીકરો',
  daughter: 'દીકરી',
  spouse:   'જીવનસાથી',
};

function buildGujaratiPath(pathIds: string[], edgeTypes: string[], userMap: Map<string, User>): string {
  const parts: string[] = [];
  for (let i = 0; i < pathIds.length; i++) {
    const user = userMap.get(pathIds[i]);
    if (!user) continue;
    const edgeIn = i === 0 ? '' : (EDGE_GUJARATI[edgeTypes[i - 1]] ?? edgeTypes[i - 1]);
    if (i === 0) {
      parts.push(user.name);
    } else {
      parts.push(`${edgeIn}(${user.name})`);
    }
  }
  return parts.join(' → ');
}

// ─────────────────────────────────────────────────────────────────────────────
// LABEL BUILDER — returns gujarati, hindi, english strings
// ─────────────────────────────────────────────────────────────────────────────

interface LabelSet { gujarati: string; hindi: string; english: string }

function direct(g: string, h: string, e: string): LabelSet {
  return { gujarati: g, hindi: h, english: e };
}

// All named relationships
const NAMED: Record<string, LabelSet> = {
  self:                       direct('પોતે',                'स्वयं',          'Self'),
  father:                     direct('પિતા / બાપ',          'पिता',           'Father'),
  mother:                     direct('માતા / બા',            'माता',           'Mother'),
  son:                        direct('દીકરો',                'बेटा',           'Son'),
  daughter:                   direct('દીકરી',                'बेटी',           'Daughter'),
  husband:                    direct('પતિ',                  'पति',            'Husband'),
  wife:                       direct('પત્ની',                'पत्नी',          'Wife'),
  elder_brother:              direct('મોટા ભાઈ',             'बड़े भाई',        'Elder Brother'),
  younger_brother:            direct('નાના ભાઈ',             'छोटे भाई',        'Younger Brother'),
  brother:                    direct('ભાઈ',                  'भाई',            'Brother'),
  elder_sister:               direct('મોટી બહેન',            'बड़ी बहन',        'Elder Sister'),
  younger_sister:             direct('નાની બહેન',            'छोटी बहन',        'Younger Sister'),
  sister:                     direct('બહેન',                 'बहन',            'Sister'),
  half_brother:               direct('સાવકા ભાઈ',            'सौतेला भाई',     'Half Brother'),
  half_sister:                direct('સાવકી બહેન',           'सौतेली बहन',     'Half Sister'),
  paternal_grandfather:       direct('દાદા',                 'दादा',           'Paternal Grandfather (Dada)'),
  paternal_grandmother:       direct('દાદી',                 'दादी',           'Paternal Grandmother (Dadi)'),
  maternal_grandfather:       direct('નાના',                 'नाना',           'Maternal Grandfather (Nana)'),
  maternal_grandmother:       direct('નાની',                 'नानी',           'Maternal Grandmother (Nani)'),
  pardada:                    direct('પરદાદા',               'परदादा',         'Paternal Great-Grandfather'),
  pardadi:                    direct('પરદાદી',               'परदादी',         'Paternal Great-Grandmother'),
  parnana:                    direct('પરનાના',               'परनाना',         'Maternal Great-Grandfather'),
  parnani:                    direct('પરનાની',               'परनानी',         'Maternal Great-Grandmother'),
  grandson_son:               direct('પૌત્ર',                'पोता',           "Grandson (Son's Son)"),
  granddaughter_son:          direct('પૌત્રી',               'पोती',           "Granddaughter (Son's Daughter)"),
  grandson_daughter:          direct('દોહિત્ર',              'नाती',           "Grandson (Daughter's Son)"),
  granddaughter_daughter:     direct('દોહિત્રી',             'नातिन',          "Granddaughter (Daughter's Daughter)"),
  kaka:                       direct('કાકા',                 'चाचा',           'Paternal Uncle (Kaka)'),
  kaki:                       direct('કાકી',                 'काकी',           "Paternal Uncle's Wife (Kaki)"),
  foi:                        direct('ફોઈ',                  'बुआ',            'Paternal Aunt (Foi)'),
  fuwa:                       direct('ફુઆ',                  'फूफा',           "Paternal Aunt's Husband (Fuwa)"),
  mama:                       direct('મામા',                 'मामा',           'Maternal Uncle (Mama)'),
  mami:                       direct('મામી',                 'मामी',           "Maternal Uncle's Wife (Mami)"),
  masi:                       direct('માસી',                 'मौसी',           'Maternal Aunt (Masi)'),
  masa:                       direct('માસા',                 'मौसा',           "Maternal Aunt's Husband (Masa)"),
  // Nephews / Nieces
  bhatrijo:                   direct('ભત્રીજો',              'भतीजा',          "Brother's Son (Bhatrijo)"),
  bhatiji:                    direct('ભત્રીજી',              'भतीजी',          "Brother's Daughter (Bhatiji)"),
  bhano:                      direct('ભાણો',                 'भांजा',          "Sister's Son (Bhano)"),
  bhani:                      direct('ભાણી',                 'भांजी',          "Sister's Daughter (Bhani)"),
  // In-laws
  sasro:                      direct('સસરો',                 'ससुर',           'Father-in-Law (Sasro)'),
  sasu:                       direct('સાસુ',                  'सास',            'Mother-in-Law (Sasu)'),
  jamai:                      direct('જમાઈ',                 'दामाद',          'Son-in-Law (Jamai)'),
  vahu:                       direct('વહુ',                   'बहू',            'Daughter-in-Law (Vahu)'),
  salo:                       direct('સાળો',                 'साला',           "Wife's Brother (Salo)"),
  sali:                       direct('સાળી',                 'साली',           "Wife's Sister (Sali)"),
  jeth:                       direct('જેઠ',                  'जेठ',            "Husband's Elder Brother (Jeth)"),
  devar:                      direct('દિયર',                 'देवर',           "Husband's Younger Brother (Devar)"),
  nanad:                      direct('નણંદ',                 'ननद',            "Husband's Sister (Nanad)"),
  banevi:                     direct('બનેવી',                'जीजाजी',         "Sister's Husband (Banevi)"),
  bhabhi:                     direct('ભાભી',                 'भाभी',           "Brother's Wife (Bhabhi)"),
  nandoi:                     direct('નંદોઈ',                'नंदोई',          "Husband's Sister's Husband (Nandoi)"),
};

function lbl(key: string): LabelSet {
  return NAMED[key] ?? { gujarati: 'સગો', hindi: 'रिश्तेदार', english: 'Relative' };
}

// ─────────────────────────────────────────────────────────────────────────────
// COUSIN-EQUIVALENT LABEL BUILDER
// Produces the full Gujarati descriptive form, never using English "cousin"
// Format: [uncle/aunt Gujarati name] + નો/ની + દીકરો/દીકરી + ભાઈ/બહેન
// ─────────────────────────────────────────────────────────────────────────────

type CousinSource = 'kaka' | 'foi' | 'mama' | 'masi';

function buildCousinLabel(source: CousinSource, targetGender: 'male' | 'female'): LabelSet {
  // Gujarati possessive: male noun → નો, female noun → ની
  // kaka (m) → કાકાનો/ની, mama (m) → મામાનો/ની, foi (f) → ફોઈનો/ની, masi (f) → માસીનો/ની
  const sourceMap: Record<CousinSource, { gu: string; hi: string; en: string; possessive: 'no' | 'ni' }> = {
    kaka: { gu: 'કાકા',  hi: 'काका',  en: "Kaka's",  possessive: 'no' },
    foi:  { gu: 'ફોઈ',   hi: 'बुआ',   en: "Foi's",   possessive: 'ni' },
    mama: { gu: 'મામા',  hi: 'मामा',  en: "Mama's",  possessive: 'no' },
    masi: { gu: 'માસી',  hi: 'मौसी',  en: "Masi's",  possessive: 'ni' },
  };

  const s = sourceMap[source];
  const pos = s.possessive === 'no' ? 'નો' : 'ની';
  const childGu = targetGender === 'male' ? 'દીકરો ભાઈ' : 'દીકરી બહેન';
  const childHi = targetGender === 'male' ? 'का बेटा भाई' : 'की बेटी बहन';
  const childEn = targetGender === 'male' ? 'Son (Brother)' : 'Daughter (Sister)';

  // Special case: Masi's son also has the compact term "મસિયાઈ ભાઈ"
  let compactNote = '';
  if (source === 'masi' && targetGender === 'male')  compactNote = ' (મસિયાઈ ભાઈ)';
  if (source === 'masi' && targetGender === 'female') compactNote = ' (મસિયાઈ બહેન)';

  return {
    gujarati: `${s.gu}${pos} ${childGu}${compactNote}`,
    hindi:    `${s.hi} ${childHi}`,
    english:  `${s.en} ${childEn}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED LABEL BUILDER (one level beyond uncle-aunt children)
// Format: [cousin label] + નો દીકરો/ભાઈ or ની દીકરી/બહેન
// ─────────────────────────────────────────────────────────────────────────────

function buildExtendedLabel(
  source: CousinSource,
  intermediaryGender: 'male' | 'female',
  targetGender: 'male' | 'female'
): LabelSet {
  const cousinBase = buildCousinLabel(source, intermediaryGender);
  // Possessive suffix based on intermediary gender
  const pos = intermediaryGender === 'male' ? 'નો' : 'ની';
  const childGu = targetGender === 'male' ? 'દીકરો' : 'દીકરી';
  const childEn = targetGender === 'male' ? 'Son' : 'Daughter';

  return {
    gujarati: `${cousinBase.gujarati} ${pos} ${childGu}`,
    hindi:    `${cousinBase.hindi} का ${targetGender === 'male' ? 'बेटा' : 'बेटी'}`,
    english:  `${cousinBase.english}'s ${childEn}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DISTANT FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

function distantLabel(side: RelationSide, steps: number): LabelSet {
  return {
    gujarati: `દૂરનો સગો (${side})`,
    hindi:    `दूर के रिश्तेदार (${side})`,
    english:  `Distant Relative — ${side} (${steps} steps)`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BFS GRAPH SETUP
// ─────────────────────────────────────────────────────────────────────────────

interface BFSNode {
  userId: string;
  path: string[];
  edgeTypes: string[];
}

const MAX_DEPTH = 8;
const MAX_PATHS = 5;

function buildChildrenMap(allUsers: User[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const u of allUsers) {
    if (u.fatherId) {
      if (!map.has(u.fatherId)) map.set(u.fatherId, []);
      map.get(u.fatherId)!.push(u.id);
    }
    if (u.motherId) {
      if (!map.has(u.motherId)) map.set(u.motherId, []);
      map.get(u.motherId)!.push(u.id);
    }
  }
  return map;
}

function getNeighbors(
  user: User,
  userMap: Map<string, User>,
  childrenMap: Map<string, string[]>
): Array<{ id: string; edgeType: string }> {
  const out: Array<{ id: string; edgeType: string }> = [];
  if (user.fatherId && userMap.has(user.fatherId))
    out.push({ id: user.fatherId, edgeType: 'father' });
  if (user.motherId && userMap.has(user.motherId))
    out.push({ id: user.motherId, edgeType: 'mother' });
  if (user.spouseId && userMap.has(user.spouseId))
    out.push({ id: user.spouseId, edgeType: 'spouse' });
  for (const cid of childrenMap.get(user.id) ?? []) {
    const child = userMap.get(cid);
    if (child) out.push({ id: cid, edgeType: child.gender === 'male' ? 'son' : 'daughter' });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE PATTERN LABELLER
// reads the edge-type sequence → returns labels + type
// ─────────────────────────────────────────────────────────────────────────────

interface Labelled {
  key: string;
  labels: LabelSet;
  type: RelationType;
}

function labelByPattern(
  personA: User,
  personB: User,
  edgeTypes: string[],
  pathIds: string[],
  userMap: Map<string, User>,
  side: RelationSide
): Labelled {
  const pattern = edgeTypes.join('/');
  const gB = personB.gender;
  const gA = personA.gender;
  const at = (i: number) => userMap.get(pathIds[i]);

  // ── Distance 1 ─────────────────────────────────────────────────────────
  switch (pattern) {
    case 'father':   return { key: 'father',   labels: lbl('father'),   type: 'direct' };
    case 'mother':   return { key: 'mother',   labels: lbl('mother'),   type: 'direct' };
    case 'son':      return { key: 'son',      labels: lbl('son'),      type: 'direct' };
    case 'daughter': return { key: 'daughter', labels: lbl('daughter'), type: 'direct' };
    case 'spouse':
      return gB === 'male'
        ? { key: 'husband', labels: lbl('husband'), type: 'direct' }
        : { key: 'wife',    labels: lbl('wife'),    type: 'direct' };
  }

  // ── Distance 2 ─────────────────────────────────────────────────────────
  switch (pattern) {
    // Grandparents
    case 'father/father': return { key: 'paternal_grandfather', labels: lbl('paternal_grandfather'), type: 'grandparent' };
    case 'father/mother': return { key: 'paternal_grandmother', labels: lbl('paternal_grandmother'), type: 'grandparent' };
    case 'father/spouse':
      return gB === 'female'
        ? { key: 'paternal_grandmother', labels: lbl('paternal_grandmother'), type: 'grandparent' }
        : { key: 'paternal_grandfather', labels: lbl('paternal_grandfather'), type: 'grandparent' };
    case 'mother/father': return { key: 'maternal_grandfather', labels: lbl('maternal_grandfather'), type: 'grandparent' };
    case 'mother/mother': return { key: 'maternal_grandmother', labels: lbl('maternal_grandmother'), type: 'grandparent' };
    case 'mother/spouse':
      return gB === 'male'
        ? { key: 'maternal_grandfather', labels: lbl('maternal_grandfather'), type: 'grandparent' }
        : { key: 'maternal_grandmother', labels: lbl('maternal_grandmother'), type: 'grandparent' };

    // Grandchildren
    case 'son/son':           return { key: 'grandson_son',          labels: lbl('grandson_son'),          type: 'grandchild' };
    case 'son/daughter':      return { key: 'granddaughter_son',     labels: lbl('granddaughter_son'),     type: 'grandchild' };
    case 'daughter/son':      return { key: 'grandson_daughter',     labels: lbl('grandson_daughter'),     type: 'grandchild' };
    case 'daughter/daughter': return { key: 'granddaughter_daughter',labels: lbl('granddaughter_daughter'),type: 'grandchild' };

    // Siblings via shared parent — with elder/younger logic
    case 'father/son':
    case 'father/daughter':
    case 'mother/son':
    case 'mother/daughter': {
      // Check if this is a half-sibling (only one shared parent)
      const sharesFather = personA.fatherId && personA.fatherId === personB.fatherId;
      const sharesMother = personA.motherId && personA.motherId === personB.motherId;
      if (sharesFather && !sharesMother || !sharesFather && sharesMother) {
        // half sibling
        return gB === 'male'
          ? { key: 'half_brother', labels: lbl('half_brother'), type: 'direct' }
          : { key: 'half_sister',  labels: lbl('half_sister'),  type: 'direct' };
      }
      const isAOlder = isPerson1Older(personA, personB);
      if (gB === 'male') {
        if (isAOlder === false) return { key: 'elder_brother',   labels: lbl('elder_brother'),   type: 'direct' };
        if (isAOlder === true)  return { key: 'younger_brother', labels: lbl('younger_brother'), type: 'direct' };
        return { key: 'brother', labels: lbl('brother'), type: 'direct' };
      } else {
        if (isAOlder === false) return { key: 'elder_sister',   labels: lbl('elder_sister'),   type: 'direct' };
        if (isAOlder === true)  return { key: 'younger_sister', labels: lbl('younger_sister'), type: 'direct' };
        return { key: 'sister', labels: lbl('sister'), type: 'direct' };
      }
    }

    // In-laws via spouse
    case 'spouse/father': return { key: 'sasro', labels: lbl('sasro'), type: 'in-law' };
    case 'spouse/mother': return { key: 'sasu',  labels: lbl('sasu'),  type: 'in-law' };

    // Spouse's siblings (via shared grandparent traversal)
    case 'spouse/son':
    case 'spouse/daughter': {
      if (gA === 'male') {
        return gB === 'male'
          ? { key: 'salo', labels: lbl('salo'), type: 'in-law' }
          : { key: 'sali', labels: lbl('sali'), type: 'in-law' };
      } else {
        // female user — husband's sibling
        const hub = at(1);
        if (gB === 'male') {
          const olderResult = hub ? isPerson1Older(hub, personB) : null;
          if (olderResult === true)  return { key: 'devar', labels: lbl('devar'), type: 'in-law' };
          if (olderResult === false) return { key: 'jeth',  labels: lbl('jeth'),  type: 'in-law' };
          return { key: 'devar', labels: lbl('devar'), type: 'in-law' };
        } else {
          return { key: 'nanad', labels: lbl('nanad'), type: 'in-law' };
        }
      }
    }

    // Child-in-law
    case 'son/spouse':
      return gB === 'female'
        ? { key: 'vahu',  labels: lbl('vahu'),  type: 'in-law' }
        : { key: 'jamai', labels: lbl('jamai'), type: 'in-law' };
    case 'daughter/spouse':
      return gB === 'male'
        ? { key: 'jamai', labels: lbl('jamai'), type: 'in-law' }
        : { key: 'vahu',  labels: lbl('vahu'),  type: 'in-law' };
  }

  // ── Distance 3 ─────────────────────────────────────────────────────────
  switch (pattern) {
    // Great grandparents
    case 'father/father/father': return { key: 'pardada', labels: lbl('pardada'), type: 'grandparent' };
    case 'father/father/mother': return { key: 'pardadi', labels: lbl('pardadi'), type: 'grandparent' };
    case 'father/mother/father': return { key: 'pardada', labels: lbl('pardada'), type: 'grandparent' };
    case 'father/mother/mother': return { key: 'pardadi', labels: lbl('pardadi'), type: 'grandparent' };
    case 'mother/father/father': return { key: 'parnana', labels: lbl('parnana'), type: 'grandparent' };
    case 'mother/father/mother': return { key: 'parnani', labels: lbl('parnani'), type: 'grandparent' };
    case 'mother/mother/father': return { key: 'parnana', labels: lbl('parnana'), type: 'grandparent' };
    case 'mother/mother/mother': return { key: 'parnani', labels: lbl('parnani'), type: 'grandparent' };

    // Paternal uncles/aunts (father's siblings)
    // Path: father → dada/dadi → their child (who is not the father)
    case 'father/father/son':
    case 'father/father/daughter':
    case 'father/mother/son':
    case 'father/mother/daughter':
      return gB === 'male'
        ? { key: 'kaka', labels: lbl('kaka'), type: 'uncle-aunt' }
        : { key: 'foi',  labels: lbl('foi'),  type: 'uncle-aunt' };

    // Maternal uncles/aunts (mother's siblings)
    case 'mother/father/son':
    case 'mother/father/daughter':
    case 'mother/mother/son':
    case 'mother/mother/daughter':
      return gB === 'male'
        ? { key: 'mama', labels: lbl('mama'), type: 'uncle-aunt' }
        : { key: 'masi', labels: lbl('masi'), type: 'uncle-aunt' };

    // Uncle/Aunt spouses
    case 'father/father/son/spouse':
    case 'father/mother/son/spouse':
      // father's brother's spouse
      return gB === 'female'
        ? { key: 'kaki', labels: lbl('kaki'), type: 'uncle-aunt' }
        : { key: 'fuwa', labels: lbl('fuwa'), type: 'uncle-aunt' };

    case 'father/father/daughter/spouse':
    case 'father/mother/daughter/spouse':
      // father's sister's spouse
      return gB === 'male'
        ? { key: 'fuwa', labels: lbl('fuwa'), type: 'uncle-aunt' }
        : { key: 'kaki', labels: lbl('kaki'), type: 'uncle-aunt' };

    case 'mother/father/son/spouse':
    case 'mother/mother/son/spouse':
      // mother's brother's spouse
      return gB === 'female'
        ? { key: 'mami', labels: lbl('mami'), type: 'uncle-aunt' }
        : { key: 'masa', labels: lbl('masa'), type: 'uncle-aunt' };

    case 'mother/father/daughter/spouse':
    case 'mother/mother/daughter/spouse':
      // mother's sister's spouse
      return gB === 'male'
        ? { key: 'masa', labels: lbl('masa'), type: 'uncle-aunt' }
        : { key: 'mami', labels: lbl('mami'), type: 'uncle-aunt' };

    // Nephews / Nieces (sibling's children)
    case 'father/son/son':
    case 'mother/son/son':
    case 'father/son/daughter':
    case 'mother/son/daughter':
      return gB === 'male'
        ? { key: 'bhatrijo', labels: lbl('bhatrijo'), type: 'nephew-niece' }
        : { key: 'bhatiji',  labels: lbl('bhatiji'),  type: 'nephew-niece' };

    case 'father/daughter/son':
    case 'mother/daughter/son':
    case 'father/daughter/daughter':
    case 'mother/daughter/daughter':
      return gB === 'male'
        ? { key: 'bhano', labels: lbl('bhano'), type: 'nephew-niece' }
        : { key: 'bhani', labels: lbl('bhani'), type: 'nephew-niece' };

    // Sibling's spouse
    case 'father/son/spouse':
    case 'mother/son/spouse':
      return { key: 'bhabhi', labels: lbl('bhabhi'), type: 'in-law' };
    case 'father/daughter/spouse':
    case 'mother/daughter/spouse':
      return { key: 'banevi', labels: lbl('banevi'), type: 'in-law' };

    // Nanad's husband (Nandoi)
    case 'spouse/daughter/spouse':
      return gA === 'female' && gB === 'male'
        ? { key: 'nandoi', labels: lbl('nandoi'), type: 'in-law' }
        : { key: 'distant', labels: distantLabel(side, edgeTypes.length), type: 'distant' };
  }

  // ── Distance 4 — Uncle/Aunt's Children (cousin-equivalents) ────────────
  // Pattern: [parent] / [grandparent] / [uncle or aunt] / [their child]
  // We read the uncle/aunt (position 2 in path, which is pathIds[2])
  // to determine which specific term to use.

  if (edgeTypes.length === 4) {
    const e = edgeTypes;
    // Must start with father or mother, go through grandparent, then uncle/aunt, then child
    const startsPaternal = e[0] === 'father';
    const startsMaternal = e[0] === 'mother';
    const throughGrandparent = e[1] === 'father' || e[1] === 'mother';
    const throughUncleAunt = e[2] === 'son' || e[2] === 'daughter';
    const endsChild = e[3] === 'son' || e[3] === 'daughter';

    if ((startsPaternal || startsMaternal) && throughGrandparent && throughUncleAunt && endsChild) {
      // The intermediate person at index 2 is the uncle/aunt
      const uncleOrAunt = at(2);
      const uncleAuntGender = uncleOrAunt?.gender ?? (e[2] === 'son' ? 'male' : 'female');

      let source: CousinSource;
      if (startsPaternal) {
        source = uncleAuntGender === 'male' ? 'kaka' : 'foi';
      } else {
        source = uncleAuntGender === 'male' ? 'mama' : 'masi';
      }

      const cousinLabels = buildCousinLabel(source, gB);
      return {
        key: `cousin_${source}_${gB}`,
        labels: cousinLabels,
        type: 'uncle-aunt-child',
      };
    }
  }

  // ── Distance 5 — Extended (uncle/aunt's grandchildren) ─────────────────
  // Pattern: [parent] / [grandparent] / [uncle/aunt] / [their child] / [their grandchild]

  if (edgeTypes.length === 5) {
    const e = edgeTypes;
    const startsPaternal = e[0] === 'father';
    const startsMaternal = e[0] === 'mother';
    const throughGrandparent = e[1] === 'father' || e[1] === 'mother';
    const throughUncleAunt = e[2] === 'son' || e[2] === 'daughter';
    const throughCousinChild = e[3] === 'son' || e[3] === 'daughter';
    const endsGrandchild = e[4] === 'son' || e[4] === 'daughter';

    if ((startsPaternal || startsMaternal) && throughGrandparent && throughUncleAunt && throughCousinChild && endsGrandchild) {
      const uncleOrAunt = at(2);
      const uncleAuntGender = uncleOrAunt?.gender ?? (e[2] === 'son' ? 'male' : 'female');
      const intermediaryGender: 'male' | 'female' = e[3] === 'son' ? 'male' : 'female';

      let source: CousinSource;
      if (startsPaternal) {
        source = uncleAuntGender === 'male' ? 'kaka' : 'foi';
      } else {
        source = uncleAuntGender === 'male' ? 'mama' : 'masi';
      }

      const extLabels = buildExtendedLabel(source, intermediaryGender, gB);
      return {
        key: `extended_${source}_${intermediaryGender}_${gB}`,
        labels: extLabels,
        type: 'extended',
      };
    }
  }

  // ── Distant fallback ────────────────────────────────────────────────────
  return {
    key: 'distant',
    labels: distantLabel(side, edgeTypes.length),
    type: 'distant',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORTED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function findAllRelationshipPaths(
  personA: User,
  personB: User,
  allUsers: User[]
): RelationshipResult {
  if (!personA || !personB) return { found: false, paths: [] };

  if (personA.id === personB.id) {
    return {
      found: true,
      paths: [{
        steps: [{
          id: personA.id, name: personA.name, gender: personA.gender,
          profilePictureUrl: personA.profilePictureUrl, edgeLabel: '',
        }],
        relationshipKey: 'self',
        labels: lbl('self'),
        gujaratiPath: personA.name,
        side: 'સ્વ પક્ષ',
        type: 'direct',
        distance: 0,
      }],
    };
  }

  const userMap     = new Map(allUsers.map(u => [u.id, u]));
  const childrenMap = buildChildrenMap(allUsers);
  const foundPaths: FoundPath[] = [];
  const seenPathSigs = new Set<string>();

  const queue: BFSNode[] = [{ userId: personA.id, path: [personA.id], edgeTypes: [] }];
  const visitedAtDepth = new Map<string, number>();
  visitedAtDepth.set(personA.id, 0);

  while (queue.length > 0 && foundPaths.length < MAX_PATHS) {
    const current = queue.shift()!;
    const { userId, path, edgeTypes } = current;
    const depth = path.length - 1;

    if (userId === personB.id) {
      const sig = path.join('>');
      if (!seenPathSigs.has(sig)) {
        seenPathSigs.add(sig);
        const side = detectSide(edgeTypes);
        const { key, labels, type } = labelByPattern(personA, personB, edgeTypes, path, userMap, side);
        const gujaratiPath = buildGujaratiPath(path, edgeTypes, userMap);

        const steps: PathStep[] = path.map((id, i) => {
          const u = userMap.get(id)!;
          return {
            id,
            name: u.name,
            gender: u.gender,
            profilePictureUrl: u.profilePictureUrl,
            edgeLabel: i === 0 ? '' : edgeTypes[i - 1],
          };
        });

        foundPaths.push({ steps, relationshipKey: key, labels, gujaratiPath, side, type, distance: depth });
      }
      continue;
    }

    if (depth >= MAX_DEPTH) continue;

    const user = userMap.get(userId);
    if (!user) continue;

    for (const { id, edgeType } of getNeighbors(user, userMap, childrenMap)) {
      const existingDepth = visitedAtDepth.get(id);
      if (existingDepth !== undefined && existingDepth < depth) continue;
      visitedAtDepth.set(id, depth + 1);
      queue.push({
        userId: id,
        path: [...path, id],
        edgeTypes: [...edgeTypes, edgeType],
      });
    }
  }

  if (foundPaths.length === 0) return { found: false, paths: [] };

  foundPaths.sort((a, b) => a.distance - b.distance);
  return { found: true, paths: foundPaths };
}
