import { RelationshipTranslation } from './types';

export const RELATIONSHIP_DATA: Record<string, RelationshipTranslation> = {
  father: {
    gujarati: 'પિતા',
    hindi: 'पिता',
    english: 'Father',
    category: 'basic'
  },
  mother: {
    gujarati: 'માતા',
    hindi: 'माता',
    english: 'Mother',
    category: 'basic'
  },
  son: {
    gujarati: 'દીકરો',
    hindi: 'बेटा',
    english: 'Son',
    category: 'basic'
  },
  daughter: {
    gujarati: 'દીકરી',
    hindi: 'बेटी',
    english: 'Daughter',
    category: 'basic'
  },
  brother: {
    gujarati: 'ભાઈ',
    hindi: 'भाई',
    english: 'Brother',
    category: 'basic'
  },
  sister: {
    gujarati: 'બહેન',
    hindi: 'बहन',
    english: 'Sister',
    category: 'basic'
  },
  paternal_grandfather: {
    gujarati: 'દાદા',
    hindi: 'दादा',
    english: 'Grandfather (Paternal)',
    category: 'grandparent'
  },
  paternal_grandmother: {
    gujarati: 'દાદી',
    hindi: 'दादी',
    english: 'Grandmother (Paternal)',
    category: 'grandparent'
  },
  maternal_grandfather: {
    gujarati: 'નાના',
    hindi: 'नाना',
    english: 'Grandfather (Maternal)',
    category: 'grandparent'
  },
  maternal_grandmother: {
    gujarati: 'નાની',
    hindi: 'नानी',
    english: 'Grandmother (Maternal)',
    category: 'grandparent'
  },
  grandson_from_son: {
    gujarati: 'પૌત્ર',
    hindi: 'पोता',
    english: 'Grandson (Son\'s Son)',
    category: 'grandchild'
  },
  granddaughter_from_son: {
    gujarati: 'પૌત્રી',
    hindi: 'पोती',
    english: 'Granddaughter (Son\'s Daughter)',
    category: 'grandchild'
  },
  grandson_from_daughter: {
    gujarati: 'દોહિત્ર',
    hindi: 'नाती',
    english: 'Grandson (Daughter\'s Son)',
    category: 'grandchild'
  },
  granddaughter_from_daughter: {
    gujarati: 'દોહિત્રી',
    hindi: 'नातिन',
    english: 'Granddaughter (Daughter\'s Daughter)',
    category: 'grandchild'
  },
  paternal_uncle: {
    gujarati: 'કાકા',
    hindi: 'चाचा',
    english: 'Paternal Uncle',
    category: 'uncle-aunt'
  },
  paternal_aunt_wife: {
    gujarati: 'કાકી',
    hindi: 'चाची',
    english: 'Paternal Uncle\'s Wife',
    category: 'uncle-aunt'
  },
  elder_paternal_uncle: {
    gujarati: 'મોટા કાકા',
    hindi: 'बड़े चाचा',
    english: 'Elder Paternal Uncle',
    category: 'uncle-aunt'
  },
  maternal_uncle: {
    gujarati: 'મામા',
    hindi: 'मामा',
    english: 'Maternal Uncle',
    category: 'uncle-aunt'
  },
  maternal_aunt_wife: {
    gujarati: 'મામી',
    hindi: 'मामी',
    english: 'Maternal Uncle\'s Wife',
    category: 'uncle-aunt'
  },
  paternal_aunt: {
    gujarati: 'ફોઈ',
    hindi: 'बुआ',
    english: 'Paternal Aunt',
    category: 'uncle-aunt'
  },
  paternal_aunt_husband: {
    gujarati: 'ફૂફા',
    hindi: 'फूफा',
    english: 'Paternal Aunt\'s Husband',
    category: 'uncle-aunt'
  },
  maternal_aunt: {
    gujarati: 'માસી',
    hindi: 'मौसी',
    english: 'Maternal Aunt',
    category: 'uncle-aunt'
  },
  maternal_aunt_husband: {
    gujarati: 'માસા',
    hindi: 'मौसा',
    english: 'Maternal Aunt\'s Husband',
    category: 'uncle-aunt'
  },
  paternal_male_cousin: {
    gujarati: 'કાકાનો દીકરો',
    hindi: 'चाचा का बेटा',
    english: 'Paternal Cousin (Male)',
    category: 'cousin'
  },
  paternal_female_cousin: {
    gujarati: 'કાકાની દીકરી',
    hindi: 'चाचा की बेटी',
    english: 'Paternal Cousin (Female)',
    category: 'cousin'
  },
  maternal_male_cousin: {
    gujarati: 'મામાનો દીકરો',
    hindi: 'मामा का बेटा',
    english: 'Maternal Cousin (Male)',
    category: 'cousin'
  },
  maternal_female_cousin: {
    gujarati: 'મામાની દીકરી',
    hindi: 'मामा की बेटी',
    english: 'Maternal Cousin (Female)',
    category: 'cousin'
  },
  aunt_side_male_cousin: {
    gujarati: 'માસીનો દીકરો',
    hindi: 'मौसी का बेटा',
    english: 'Aunt\'s Son (Cousin)',
    category: 'cousin'
  },
  aunt_side_female_cousin: {
    gujarati: 'માસીની દીકરી',
    hindi: 'मौसी की बेटी',
    english: 'Aunt\'s Daughter (Cousin)',
    category: 'cousin'
  },
  husband: {
    gujarati: 'પતિ',
    hindi: 'पति',
    english: 'Husband',
    category: 'in-laws'
  },
  wife: {
    gujarati: 'પત્ની',
    hindi: 'पत्नी',
    english: 'Wife',
    category: 'in-laws'
  },
  son_in_law: {
    gujarati: 'જમાઈ',
    hindi: 'दामाद',
    english: 'Son-in-Law',
    category: 'in-laws'
  },
  daughter_in_law: {
    gujarati: 'પુત્રવધૂ',
    hindi: 'बहू',
    english: 'Daughter-in-Law',
    category: 'in-laws'
  },
  father_in_law: {
    gujarati: 'સસરા',
    hindi: 'ससुर',
    english: 'Father-in-Law',
    category: 'in-laws'
  },
  mother_in_law: {
    gujarati: 'સાસુ',
    hindi: 'सास',
    english: 'Mother-in-Law',
    category: 'in-laws'
  },
  wife_brother: {
    gujarati: 'સાળો',
    hindi: 'साला',
    english: 'Wife\'s Brother',
    category: 'in-laws'
  },
  wife_sister: {
    gujarati: 'સાળી',
    hindi: 'साली',
    english: 'Wife\'s Sister',
    category: 'in-laws'
  },
  sister_husband: {
    gujarati: 'જીજાજી',
    hindi: 'जीजा',
    english: 'Sister\'s Husband',
    category: 'in-laws'
  },
  husband_younger_brother: {
    gujarati: 'દિયર',
    hindi: 'देवर',
    english: 'Husband\'s Younger Brother',
    category: 'in-laws'
  },
  husband_elder_brother: {
    gujarati: 'જેઠ',
    hindi: 'जेठ',
    english: 'Husband\'s Elder Brother',
    category: 'in-laws'
  },
  husband_elder_brother_wife: {
    gujarati: 'જેઠાણી',
    hindi: 'जेठानी',
    english: 'Elder Brother\'s Wife',
    category: 'in-laws'
  },
  husband_younger_brother_wife: {
    gujarati: 'દેરાણી',
    hindi: 'देवरानी',
    english: 'Younger Brother\'s Wife',
    category: 'in-laws'
  },
  husband_sister: {
    gujarati: 'નણંદ',
    hindi: 'ननद',
    english: 'Husband\'s Sister',
    category: 'in-laws'
  },
  brother_wife: {
    gujarati: 'ભાભી',
    hindi: 'भाभी',
    english: 'Brother\'s Wife',
    category: 'in-laws'
  }
};

export function getAllRelationships() {
  return Object.entries(RELATIONSHIP_DATA).map(([key, data]) => ({
    key,
    data
  }));
}

export function getRelationshipsByCategory(category: string) {
  return Object.entries(RELATIONSHIP_DATA)
    .filter(([, data]) => data.category === category)
    .map(([key, data]) => ({ key, data }));
}
