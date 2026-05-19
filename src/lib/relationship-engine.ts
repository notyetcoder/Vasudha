/**
 * relationship-engine.ts — Single source of truth for relationship logic.
 * Previous duplicates (relationship-finder.ts, relationship-finder-enhanced.ts,
 * relationshipData.ts, relationshipTranslator.ts) have been deleted.
 *
 * Rules:
 *  — No English word "cousin" in any output label.
 *  — Pattern-based labelling (not distance-based).
 *  — Side detection from first edge.
 *  — Circular spouse traversal prevented.
 *  — Gujarati path: "name (relation)" format — name first.
 */

import { User } from './types';
import { isPerson1Older } from './user-utils';

// ─── EXPORTED TYPES ──────────────────────────────────────────────────────────

export interface PathStep {
  id: string;
  name: string;
  gender: 'male' | 'female';
  profilePictureUrl?: string | null;
  edgeLabel: string;
}

export type RelationSide =
  | 'પિતૃ પક્ષ'
  | 'માતૃ પક્ષ'
  | 'સસરિયું પક્ષ'
  | 'સ્વ પક્ષ';

export type RelationType =
  | 'direct'
  | 'grandparent'
  | 'grandchild'
  | 'uncle-aunt'
  | 'nephew-niece'
  | 'uncle-aunt-child'
  | 'in-law'
  | 'extended'
  | 'distant';

export interface FoundPath {
  steps: PathStep[];
  relationshipKey: string;
  labels: { gujarati: string; hindi: string; english: string };
  gujaratiPath: string;
  side: RelationSide;
  type: RelationType;
  distance: number;
}

export interface RelationshipResult {
  found: boolean;
  paths: FoundPath[];
}

// ─── SIDE DETECTION ──────────────────────────────────────────────────────────

function detectSide(edgeTypes: string[]): RelationSide {
  const first = edgeTypes[0];
  if (!first || first === 'son' || first === 'daughter') return 'સ્વ પક્ષ';
  if (first === 'father') return 'પિતૃ પક્ષ';
  if (first === 'mother') return 'માતૃ પક્ષ';
  if (first === 'spouse') return 'સસરિયું પક્ષ';
  return 'સ્વ પક્ષ';
}

// ─── GUJARATI PATH BUILDER (name first, relation second) ─────────────────────

const EDGE_GU: Record<string, string> = {
  father: 'પિતા', mother: 'માતા',
  son: 'દીકરો', daughter: 'દીકરી',
  spouse: 'જીવનસાથી',
};

function buildGujaratiPath(
  pathIds: string[],
  edgeTypes: string[],
  userMap: Map<string, User>
): string {
  const parts: string[] = [];
  for (let i = 0; i < pathIds.length; i++) {
    const u = userMap.get(pathIds[i]);
    if (!u) continue;
    if (i === 0) {
      parts.push(u.name);
    } else {
      const rel = EDGE_GU[edgeTypes[i - 1]] ?? edgeTypes[i - 1];
      parts.push(`${u.name} (${rel})`);
    }
  }
  return parts.join(' → ');
}

// ─── LABELS ──────────────────────────────────────────────────────────────────

interface LabelSet { gujarati: string; hindi: string; english: string }
const d = (g: string, h: string, e: string): LabelSet => ({ gujarati: g, hindi: h, english: e });

const NAMED: Record<string, LabelSet> = {
  self:                       d('પોતે',           'स्वयं',      'Self'),
  father:                     d('પિતા / બાપ',     'पिता',       'Father'),
  mother:                     d('માતા / બા',       'माता',       'Mother'),
  son:                        d('દીકરો',           'बेटा',       'Son'),
  daughter:                   d('દીકરી',           'बेटी',       'Daughter'),
  husband:                    d('પતિ',             'पति',        'Husband'),
  wife:                       d('પત્ની',           'पत्नी',      'Wife'),
  elder_brother:              d('મોટા ભાઈ',        'बड़े भाई',   'Elder Brother'),
  younger_brother:            d('નાના ભાઈ',        'छोटे भाई',   'Younger Brother'),
  brother:                    d('ભાઈ',             'भाई',        'Brother'),
  elder_sister:               d('મોટી બહેન',       'बड़ी बहन',   'Elder Sister'),
  younger_sister:             d('નાની બહેન',       'छोटी बहन',   'Younger Sister'),
  sister:                     d('બહેન',            'बहन',        'Sister'),
  half_brother:               d('સાવકા ભાઈ',       'सौतेला भाई', 'Half Brother'),
  half_sister:                d('સાવકી બહેન',      'सौतेली बहन', 'Half Sister'),
  paternal_grandfather:       d('દાદા',            'दादा',       'Paternal Grandfather (Dada)'),
  paternal_grandmother:       d('દાદી',            'दादी',       'Paternal Grandmother (Dadi)'),
  maternal_grandfather:       d('નાના',            'नाना',       'Maternal Grandfather (Nana)'),
  maternal_grandmother:       d('નાની',            'नानी',       'Maternal Grandmother (Nani)'),
  pardada:                    d('પરદાદા',          'परदादा',     'Paternal Great-Grandfather'),
  pardadi:                    d('પરદાદી',          'परदादी',     'Paternal Great-Grandmother'),
  parnana:                    d('પરનાના',          'परनाना',     'Maternal Great-Grandfather'),
  parnani:                    d('પરનાની',          'परनानी',     'Maternal Great-Grandmother'),
  grandson_son:               d('પૌત્ર',           'पोता',       "Grandson (Son's Son)"),
  granddaughter_son:          d('પૌત્રી',          'पोती',       "Granddaughter (Son's Daughter)"),
  grandson_daughter:          d('દોહિત્ર',         'नाती',       "Grandson (Daughter's Son)"),
  granddaughter_daughter:     d('દોહિત્રી',        'नातिन',      "Granddaughter (Daughter's Daughter)"),
  kaka:                       d('કાકા',            'चाचा',       'Paternal Uncle (Kaka)'),
  kaki:                       d('કાકી',            'काकी',       "Paternal Uncle's Wife (Kaki)"),
  foi:                        d('ફોઈ',             'बुआ',        'Paternal Aunt (Foi)'),
  fuwa:                       d('ફુઆ',             'फूफा',       "Paternal Aunt's Husband (Fuwa)"),
  mama:                       d('મામા',            'मामा',       'Maternal Uncle (Mama)'),
  mami:                       d('મામી',            'मामी',       "Maternal Uncle's Wife (Mami)"),
  masi:                       d('માસી',            'मौसी',       'Maternal Aunt (Masi)'),
  masa:                       d('માસા',            'मौसा',       "Maternal Aunt's Husband (Masa)"),
  bhatrijo:                   d('ભત્રીજો',         'भतीजा',      "Brother's Son (Bhatrijo)"),
  bhatiji:                    d('ભત્રીજી',         'भतीजी',      "Brother's Daughter (Bhatiji)"),
  bhano:                      d('ભાણો',            'भांजा',      "Sister's Son (Bhano)"),
  bhani:                      d('ભાણી',            'भांजी',      "Sister's Daughter (Bhani)"),
  sasro:                      d('સસરો',            'ससुर',       'Father-in-Law (Sasro)'),
  sasu:                       d('સાસુ',            'सास',        'Mother-in-Law (Sasu)'),
  jamai:                      d('જમાઈ',            'दामाद',      'Son-in-Law (Jamai)'),
  vahu:                       d('વહુ',             'बहू',        'Daughter-in-Law (Vahu)'),
  salo:                       d('સાળો',            'साला',       "Wife's Brother (Salo)"),
  sali:                       d('સાળી',            'साली',       "Wife's Sister (Sali)"),
  jeth:                       d('જેઠ',             'जेठ',        "Husband's Elder Brother (Jeth)"),
  devar:                      d('દિયર',            'देवर',       "Husband's Younger Brother (Devar)"),
  nanad:                      d('નણંદ',            'ननद',        "Husband's Sister (Nanad)"),
  banevi:                     d('બનેવી',           'जीजाजी',     "Sister's Husband (Banevi)"),
  bhabhi:                     d('ભાભી',            'भाभी',       "Brother's Wife (Bhabhi)"),
  nandoi:                     d('નંદોઈ',           'नंदोई',      "Husband's Sister's Husband (Nandoi)"),
};

function lbl(key: string): LabelSet {
  return NAMED[key] ?? { gujarati: 'સગો', hindi: 'रिश्तेदार', english: 'Relative' };
}

// ─── COUSIN-EQUIVALENT LABELS (Gujarati descriptive, no English "cousin") ────

type CousinSource = 'kaka' | 'foi' | 'mama' | 'masi';

const COUSIN_SOURCE_MAP: Record<CousinSource, {
  gu: string; hi: string; en: string; pos: 'no' | 'ni';
}> = {
  kaka: { gu: 'કાકા', hi: 'काका', en: "Kaka's",  pos: 'no' },
  foi:  { gu: 'ફોઈ',  hi: 'बुआ',  en: "Foi's",   pos: 'ni' },
  mama: { gu: 'મામા', hi: 'मामा', en: "Mama's",  pos: 'no' },
  masi: { gu: 'માસી', hi: 'मौसी', en: "Masi's",  pos: 'ni' },
};

function buildCousinLabel(source: CousinSource, targetGender: 'male' | 'female'): LabelSet {
  const s = COUSIN_SOURCE_MAP[source];
  const pos = s.pos === 'no' ? 'નો' : 'ની';
  const childGu = targetGender === 'male' ? 'દીકરો ભાઈ' : 'દીકરી બહેન';
  const childHi = targetGender === 'male' ? 'का बेटा भाई' : 'की बेटी बहन';
  const childEn = targetGender === 'male' ? 'Son (Brother)' : 'Daughter (Sister)';
  let note = '';
  if (source === 'masi' && targetGender === 'male')   note = ' (મસિયાઈ ભાઈ)';
  if (source === 'masi' && targetGender === 'female') note = ' (મસિયાઈ બહેન)';
  return {
    gujarati: `${s.gu}${pos} ${childGu}${note}`,
    hindi:    `${s.hi} ${childHi}`,
    english:  `${s.en} ${childEn}`,
  };
}

function buildExtendedLabel(
  source: CousinSource,
  interGender: 'male' | 'female',
  targetGender: 'male' | 'female'
): LabelSet {
  const base = buildCousinLabel(source, interGender);
  const pos  = interGender === 'male' ? 'નો' : 'ની';
  const childGu = targetGender === 'male' ? 'દીકરો' : 'દીકરી';
  return {
    gujarati: `${base.gujarati} ${pos} ${childGu}`,
    hindi:    `${base.hindi} का ${targetGender === 'male' ? 'बेटा' : 'बेटी'}`,
    english:  `${base.english}'s ${targetGender === 'male' ? 'Son' : 'Daughter'}`,
  };
}

function distantLabel(side: RelationSide, steps: number): LabelSet {
  return {
    gujarati: `દૂરનો સગો (${side})`,
    hindi:    `दूर के रिश्तेदार (${side})`,
    english:  `Distant Relative — ${side} (${steps} steps)`,
  };
}

// ─── BFS GRAPH SETUP ─────────────────────────────────────────────────────────

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
  childrenMap: Map<string, string[]>,
  lastEdge: string | null  // FIX Issue 3: prevent spouse→spouse circular loops
): Array<{ id: string; edgeType: string }> {
  const out: Array<{ id: string; edgeType: string }> = [];
  if (user.fatherId && userMap.has(user.fatherId))
    out.push({ id: user.fatherId, edgeType: 'father' });
  if (user.motherId && userMap.has(user.motherId))
    out.push({ id: user.motherId, edgeType: 'mother' });
  // Only traverse spouse if last edge was NOT spouse (prevents A→B→A circular)
  if (lastEdge !== 'spouse' && user.spouseId && userMap.has(user.spouseId))
    out.push({ id: user.spouseId, edgeType: 'spouse' });
  for (const cid of childrenMap.get(user.id) ?? []) {
    const child = userMap.get(cid);
    if (child) out.push({ id: cid, edgeType: child.gender === 'male' ? 'son' : 'daughter' });
  }
  return out;
}

// ─── PATTERN LABELLER ────────────────────────────────────────────────────────

interface Labelled { key: string; labels: LabelSet; type: RelationType }

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

  // Distance 1
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

  // Distance 2
  switch (pattern) {
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
    case 'son/son':           return { key: 'grandson_son',           labels: lbl('grandson_son'),           type: 'grandchild' };
    case 'son/daughter':      return { key: 'granddaughter_son',      labels: lbl('granddaughter_son'),      type: 'grandchild' };
    case 'daughter/son':      return { key: 'grandson_daughter',      labels: lbl('grandson_daughter'),      type: 'grandchild' };
    case 'daughter/daughter': return { key: 'granddaughter_daughter', labels: lbl('granddaughter_daughter'), type: 'grandchild' };
    case 'father/son':
    case 'father/daughter':
    case 'mother/son':
    case 'mother/daughter': {
      const sf = personA.fatherId && personA.fatherId === personB.fatherId;
      const sm = personA.motherId && personA.motherId === personB.motherId;
      if (sf !== sm) {
        return gB === 'male'
          ? { key: 'half_brother', labels: lbl('half_brother'), type: 'direct' }
          : { key: 'half_sister',  labels: lbl('half_sister'),  type: 'direct' };
      }
      const older = isPerson1Older(personA, personB);
      if (gB === 'male') {
        if (older === false) return { key: 'elder_brother',   labels: lbl('elder_brother'),   type: 'direct' };
        if (older === true)  return { key: 'younger_brother', labels: lbl('younger_brother'), type: 'direct' };
        return { key: 'brother', labels: lbl('brother'), type: 'direct' };
      } else {
        if (older === false) return { key: 'elder_sister',   labels: lbl('elder_sister'),   type: 'direct' };
        if (older === true)  return { key: 'younger_sister', labels: lbl('younger_sister'), type: 'direct' };
        return { key: 'sister', labels: lbl('sister'), type: 'direct' };
      }
    }
    case 'spouse/father': return { key: 'sasro', labels: lbl('sasro'), type: 'in-law' };
    case 'spouse/mother': return { key: 'sasu',  labels: lbl('sasu'),  type: 'in-law' };
    case 'spouse/son':
    case 'spouse/daughter': {
      if (gA === 'male') {
        return gB === 'male'
          ? { key: 'salo', labels: lbl('salo'), type: 'in-law' }
          : { key: 'sali', labels: lbl('sali'), type: 'in-law' };
      }
      const hub = at(1);
      if (gB === 'male') {
        const o = hub ? isPerson1Older(hub, personB) : null;
        if (o === true)  return { key: 'devar', labels: lbl('devar'), type: 'in-law' };
        if (o === false) return { key: 'jeth',  labels: lbl('jeth'),  type: 'in-law' };
        return { key: 'devar', labels: lbl('devar'), type: 'in-law' };
      }
      return { key: 'nanad', labels: lbl('nanad'), type: 'in-law' };
    }
    case 'son/spouse':
      return gB === 'female'
        ? { key: 'vahu',  labels: lbl('vahu'),  type: 'in-law' }
        : { key: 'jamai', labels: lbl('jamai'), type: 'in-law' };
    case 'daughter/spouse':
      return gB === 'male'
        ? { key: 'jamai', labels: lbl('jamai'), type: 'in-law' }
        : { key: 'vahu',  labels: lbl('vahu'),  type: 'in-law' };
  }

  // Distance 3
  switch (pattern) {
    case 'father/father/father': case 'father/mother/father': return { key: 'pardada', labels: lbl('pardada'), type: 'grandparent' };
    case 'father/father/mother': case 'father/mother/mother': return { key: 'pardadi', labels: lbl('pardadi'), type: 'grandparent' };
    case 'mother/father/father': case 'mother/mother/father': return { key: 'parnana', labels: lbl('parnana'), type: 'grandparent' };
    case 'mother/father/mother': case 'mother/mother/mother': return { key: 'parnani', labels: lbl('parnani'), type: 'grandparent' };
    case 'father/father/son': case 'father/father/daughter':
    case 'father/mother/son': case 'father/mother/daughter':
      return gB === 'male' ? { key: 'kaka', labels: lbl('kaka'), type: 'uncle-aunt' }
                           : { key: 'foi',  labels: lbl('foi'),  type: 'uncle-aunt' };
    case 'mother/father/son': case 'mother/father/daughter':
    case 'mother/mother/son': case 'mother/mother/daughter':
      return gB === 'male' ? { key: 'mama', labels: lbl('mama'), type: 'uncle-aunt' }
                           : { key: 'masi', labels: lbl('masi'), type: 'uncle-aunt' };
    case 'father/father/son/spouse': case 'father/mother/son/spouse':
      return gB === 'female' ? { key: 'kaki', labels: lbl('kaki'), type: 'uncle-aunt' }
                             : { key: 'fuwa', labels: lbl('fuwa'), type: 'uncle-aunt' };
    case 'father/father/daughter/spouse': case 'father/mother/daughter/spouse':
      return gB === 'male'   ? { key: 'fuwa', labels: lbl('fuwa'), type: 'uncle-aunt' }
                             : { key: 'kaki', labels: lbl('kaki'), type: 'uncle-aunt' };
    case 'mother/father/son/spouse': case 'mother/mother/son/spouse':
      return gB === 'female' ? { key: 'mami', labels: lbl('mami'), type: 'uncle-aunt' }
                             : { key: 'masa', labels: lbl('masa'), type: 'uncle-aunt' };
    case 'mother/father/daughter/spouse': case 'mother/mother/daughter/spouse':
      return gB === 'male'   ? { key: 'masa', labels: lbl('masa'), type: 'uncle-aunt' }
                             : { key: 'mami', labels: lbl('mami'), type: 'uncle-aunt' };
    case 'father/son/son': case 'mother/son/son':
    case 'father/son/daughter': case 'mother/son/daughter':
      return gB === 'male'
        ? { key: 'bhatrijo', labels: lbl('bhatrijo'), type: 'nephew-niece' }
        : { key: 'bhatiji',  labels: lbl('bhatiji'),  type: 'nephew-niece' };
    case 'father/daughter/son': case 'mother/daughter/son':
    case 'father/daughter/daughter': case 'mother/daughter/daughter':
      return gB === 'male'
        ? { key: 'bhano', labels: lbl('bhano'), type: 'nephew-niece' }
        : { key: 'bhani', labels: lbl('bhani'), type: 'nephew-niece' };
    case 'father/son/spouse': case 'mother/son/spouse':
      return { key: 'bhabhi', labels: lbl('bhabhi'), type: 'in-law' };
    case 'father/daughter/spouse': case 'mother/daughter/spouse':
      return { key: 'banevi', labels: lbl('banevi'), type: 'in-law' };
    case 'spouse/daughter/spouse':
      return gA === 'female' && gB === 'male'
        ? { key: 'nandoi', labels: lbl('nandoi'), type: 'in-law' }
        : { key: 'distant', labels: distantLabel(side, edgeTypes.length), type: 'distant' };
  }

  // Distance 4 — uncle/aunt's children
  if (edgeTypes.length === 4) {
    const e = edgeTypes;
    const patOrMat = e[0] === 'father' || e[0] === 'mother';
    const throughGP = e[1] === 'father' || e[1] === 'mother';
    const throughUA = e[2] === 'son' || e[2] === 'daughter';
    const endsChild = e[3] === 'son' || e[3] === 'daughter';
    if (patOrMat && throughGP && throughUA && endsChild) {
      const ua = at(2);
      const uaGender = ua?.gender ?? (e[2] === 'son' ? 'male' : 'female');
      const source: CousinSource =
        e[0] === 'father'
          ? (uaGender === 'male' ? 'kaka' : 'foi')
          : (uaGender === 'male' ? 'mama' : 'masi');
      return {
        key: `cousin_${source}_${gB}`,
        labels: buildCousinLabel(source, gB),
        type: 'uncle-aunt-child',
      };
    }
  }

  // Distance 5 — extended
  if (edgeTypes.length === 5) {
    const e = edgeTypes;
    const patOrMat = e[0] === 'father' || e[0] === 'mother';
    const throughGP = e[1] === 'father' || e[1] === 'mother';
    const throughUA = e[2] === 'son' || e[2] === 'daughter';
    const throughC  = e[3] === 'son' || e[3] === 'daughter';
    const endsGC    = e[4] === 'son' || e[4] === 'daughter';
    if (patOrMat && throughGP && throughUA && throughC && endsGC) {
      const ua = at(2);
      const uaGender = ua?.gender ?? (e[2] === 'son' ? 'male' : 'female');
      const interGender: 'male' | 'female' = e[3] === 'son' ? 'male' : 'female';
      const source: CousinSource =
        e[0] === 'father'
          ? (uaGender === 'male' ? 'kaka' : 'foi')
          : (uaGender === 'male' ? 'mama' : 'masi');
      return {
        key: `extended_${source}_${interGender}_${gB}`,
        labels: buildExtendedLabel(source, interGender, gB),
        type: 'extended',
      };
    }
  }

  return {
    key: 'distant',
    labels: distantLabel(side, edgeTypes.length),
    type: 'distant',
  };
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

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
        steps: [{ id: personA.id, name: personA.name, gender: personA.gender,
                  profilePictureUrl: personA.profilePictureUrl, edgeLabel: '' }],
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
  const foundPaths: FoundPath[]      = [];
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
          return { id, name: u.name, gender: u.gender,
                   profilePictureUrl: u.profilePictureUrl,
                   edgeLabel: i === 0 ? '' : edgeTypes[i - 1] };
        });
        foundPaths.push({ steps, relationshipKey: key, labels, gujaratiPath, side, type, distance: depth });
      }
      continue;
    }

    if (depth >= MAX_DEPTH) continue;

    const user = userMap.get(userId);
    if (!user) continue;

    const lastEdge = edgeTypes.length > 0 ? edgeTypes[edgeTypes.length - 1] : null;

    for (const { id, edgeType } of getNeighbors(user, userMap, childrenMap, lastEdge)) {
      const existingDepth = visitedAtDepth.get(id);
      if (existingDepth !== undefined && existingDepth < depth) continue;
      visitedAtDepth.set(id, depth + 1);
      queue.push({ userId: id, path: [...path, id], edgeTypes: [...edgeTypes, edgeType] });
    }
  }

  if (foundPaths.length === 0) return { found: false, paths: [] };
  foundPaths.sort((a, b) => a.distance - b.distance);
  return { found: true, paths: foundPaths };
}
