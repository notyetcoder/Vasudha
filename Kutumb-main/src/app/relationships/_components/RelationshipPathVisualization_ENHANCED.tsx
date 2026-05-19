'use client';

/**
 * Relationship Path Visualization Component - ENHANCED
 * 
 * Displays relationship results with:
 * - Translated relationship names
 * - Emotional, family-focused messaging
 * - Beautiful path visualization
 * - Responsive design (desktop/mobile)
 * - Cultural respect and honor
 */

import { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Zap, GitBranch, ArrowRight, MapPin } from 'lucide-react';
import { Language } from '@/lib/relationshipData';
import { getRelationshipLabel, getRelationshipDescription } from '@/lib/relationshipTranslator';
import { useLanguage } from '@/context/LanguageContext';

interface RelationshipResult {
  found: boolean;
  relationship?: string;
  explanation?: string;
  path?: Array<{ id: string; name: string }>;
  distance?: number;
}

interface Props {
  relationship: RelationshipResult;
  personA: User | null;
  personB: User | null;
  language?: Language;
}

export default function RelationshipPathVisualization({
  relationship,
  personA,
  personB,
  language: propLanguage
}: Props) {
  // Fallback to context if prop not provided
  const contextLanguage = useLanguage?.() ? useLanguage().language : 'gujarati';
  const language = propLanguage || contextLanguage || 'gujarati';

  if (!relationship) {
    return null;
  }

  // Translations for UI text
  const translations = {
    gujarati: {
      connectionFound: '🔗 તમારો સંબંધ',
      howConnected: 'આપણે ક્યા જોડાયેલા છીએ?',
      relationshipType: 'સંબંધનો પ્રકાર',
      connectionPath: 'જોડાણનો માર્ગ',
      generationGap: 'પેઢીઓ વચ્ચે',
      notRelated: '❌ સંબંધિત નથી',
      noConnection: 'આપણે સીધો સંબંધ શોધી શક્યા નથી',
      sameFamily: 'સમાન પરિવાર',
      distant: 'દૂર સંબંધી',
      close: 'નજીક સંબંધી',
      veryClose: 'ખૂબ જ નજીક સંબંધી',
      description: 'આ સંબંધનો અર્થ'
    },
    hindi: {
      connectionFound: '🔗 आपका रिश्ता',
      howConnected: 'हम कहाँ जुड़े हैं?',
      relationshipType: 'रिश्ते का प्रकार',
      connectionPath: 'कनेक्शन पथ',
      generationGap: 'पीढ़ियों में अंतर',
      notRelated: '❌ संबंधित नहीं',
      noConnection: 'हम सीधा रिश्ता नहीं खोज सके',
      sameFamily: 'एक ही परिवार',
      distant: 'दूर संबंधी',
      close: 'पास संबंधी',
      veryClose: 'बहुत ही पास संबंधी',
      description: 'इस रिश्ते का मतलब'
    },
    english: {
      connectionFound: '🔗 Your Relationship',
      howConnected: 'How are we connected?',
      relationshipType: 'Relationship Type',
      connectionPath: 'Connection Path',
      generationGap: 'Generation Gap',
      notRelated: '❌ Not Related',
      noConnection: 'We could not find a direct connection',
      sameFamily: 'Same Family',
      distant: 'Distant Relation',
      close: 'Close Relation',
      veryClose: 'Very Close Relation',
      description: 'What this relationship means'
    }
  };

  const t = translations[language] || translations.english;

  // Determine closeness color
  const getClosenessColor = (distance?: number): string => {
    if (!distance) return 'bg-gray-100';
    if (distance === 1) return 'bg-red-100 border-red-300';
    if (distance <= 2) return 'bg-orange-100 border-orange-300';
    if (distance <= 3) return 'bg-yellow-100 border-yellow-300';
    return 'bg-blue-100 border-blue-300';
  };

  const getClosenessLabel = (distance?: number): string => {
    if (!distance) return t.distant;
    if (distance === 1) return t.veryClose;
    if (distance <= 2) return t.close;
    if (distance <= 3) return t.sameFamily;
    return t.distant;
  };

  const getClosenessIcon = (distance?: number) => {
    if (!distance) return '🌲';
    if (distance === 1) return '❤️';
    if (distance <= 2) return '🧡';
    if (distance <= 3) return '💛';
    return '💙';
  };

  // Not related case
  if (!relationship.found) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="text-5xl">❌</div>
            </div>
            <h3 className="text-xl font-bold text-red-900">{t.notRelated}</h3>
            <p className="text-red-700">{relationship.explanation || t.noConnection}</p>
            <div className="pt-4 text-sm text-red-600">
              {language === 'gujarati' && 'આ બંને લોકો સીધો સંબંધ ધરાવતા નથી.'}
              {language === 'hindi' && 'ये दोनों लोग सीधा रिश्ता नहीं रखते हैं।'}
              {language === 'english' && 'These two people do not have a direct relationship.'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Related case
  return (
    <div className="space-y-4">
      {/* Main Result Card */}
      <Card className={`border-2 ${getClosenessColor(relationship.distance)} transition-all`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                {getClosenessIcon(relationship.distance)} {t.connectionFound}
              </CardTitle>
              <p className="text-sm text-gray-600">{t.howConnected}</p>
            </div>
            <Badge className="bg-green-600 text-white">
              ✓ {t.sameFamily}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Relationship Type Section */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              {t.relationshipType}
            </h4>
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {getRelationshipLabel(relationship.relationship, language)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {relationship.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Connection Path Section */}
          {relationship.path && relationship.path.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                {t.connectionPath}
              </h4>

              {/* Desktop View - Horizontal */}
              <div className="hidden md:flex overflow-x-auto gap-2 pb-2">
                {relationship.path.map((person, idx) => (
                  <div key={person.id} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {person.name.charAt(0)}
                      </div>
                      <p className="text-xs text-gray-700 mt-1 max-w-16 text-center truncate">
                        {person.name}
                      </p>
                    </div>
                    {idx < relationship.path!.length - 1 && (
                      <div className="mx-2 text-gray-400">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile View - Vertical */}
              <div className="md:hidden space-y-2">
                {relationship.path.map((person, idx) => (
                  <div key={person.id}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {person.name.charAt(0)}
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{person.name}</p>
                    </div>
                    {idx < relationship.path!.length - 1 && (
                      <div className="ml-5 my-1">
                        <div className="text-gray-400">↓</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4">
            {relationship.distance !== undefined && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {relationship.distance}
                </div>
                <p className="text-xs text-gray-600 mt-1">{t.generationGap}</p>
              </div>
            )}
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
              <div className="text-3xl">
                {getClosenessIcon(relationship.distance)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {getClosenessLabel(relationship.distance)}
              </p>
            </div>
          </div>

          {/* Description Section - Cultural Context */}
          {language === 'gujarati' && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-700 leading-relaxed italic">
                {language === 'gujarati' && '🎊 આ સંબંધ આપણા પરિવારના તાણે છે, જે આપણને એક બીજાની નજીક લાવે છે.'}
                {language === 'hindi' && '🎊 यह रिश्ता हमारे परिवार की नींव है, जो हमें एक दूसरे के करीब लाता है।'}
                {language === 'english' && '🎊 This relationship is the foundation of our family, bringing us closer to one another.'}
              </p>
            </div>
          )}

          {language === 'hindi' && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-700 leading-relaxed italic">
                🎊 यह रिश्ता हमारे परिवार की नींव है, जो हमें एक दूसरे के करीब लाता है।
              </p>
            </div>
          )}

          {language === 'english' && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-700 leading-relaxed italic">
                🎊 This relationship is the foundation of our family, bringing us closer to one another.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* People Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {personA && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {personA.profilePictureUrl && (
                  <img
                    src={personA.profilePictureUrl}
                    alt={personA.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-300"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{personA.name}</p>
                  <p className="text-sm text-gray-600">{personA.surname}</p>
                  {personA.birthYear && (
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'gujarati' && 'જન્મ:'}
                      {language === 'hindi' && 'जन्म:'}
                      {language === 'english' && 'Born:'} {personA.birthYear}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {personB && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {personB.profilePictureUrl && (
                  <img
                    src={personB.profilePictureUrl}
                    alt={personB.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-green-300"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{personB.name}</p>
                  <p className="text-sm text-gray-600">{personB.surname}</p>
                  {personB.birthYear && (
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'gujarati' && 'જન્મ:'}
                      {language === 'hindi' && 'जन्म:'}
                      {language === 'english' && 'Born:'} {personB.birthYear}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
