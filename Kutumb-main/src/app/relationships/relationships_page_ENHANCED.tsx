'use client';

/**
 * Relationships Page - ENHANCED
 * * Beautiful, emotional landing page for the Relationship Finder feature.
 * * Features:
 * - Gradient header with Gujarati messaging
 * - Feature cards explaining the purpose
 * - Relationship finder client component
 * - Language switching integration
 * - Responsive design
 * - Cultural and emotional tone
 */

import { RelationshipFinderClient } from './_components/RelationshipFinderClient';
import { useLanguage } from '@/context/LanguageContext';
import { Zap, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function RelationshipsPage() {
  const { language } = useLanguage();

  // Page translations
  const content = {
    gujarati: {
      title: '🌳 આપણો પરિવાર',
      subtitle: 'શોધો કે આપણે ક્યા જોડાયેલા છીએ',
      tagline: 'એક બીજાને સમજો, બંધતા વધારો',
      
      cards: [
        {
          icon: '🔍',
          title: 'સરળ શોધ',
          description: 'બે લોકોને પસંદ કરો અને તેમનો સંબંધ શોધો'
        },
        {
          icon: '🌍',
          title: 'પરિવારનો સંપર્ક',
          description: 'આપણા સમુદાયમાં લોકો કેવી રીતે જોડાયેલા છે તે જાણો'
        },
        {
          icon: '❤️',
          title: 'બંધતા માપો',
          description: 'સંબંધોની ગહનતા અને નજીકતા સમજો'
        }
      ],

      howItWorks: 'આ કેવી રીતે કામ કરે છે',
      steps: [
        {
          number: '1',
          title: 'પ્રથમ વ્યક્તિ પસંદ કરો',
          description: 'કમ્યુનિટીમાંથી કોઈ વ્યક્તિ શોધો અને પસંદ કરો'
        },
        {
          number: '2',
          title: 'બીજો વ્યક્તિ પસંદ કરો',
          description: 'અન્ય સભ્યને તમારા સંબંધ માટે પસંદ કરો'
        },
        {
          number: '3',
          title: 'સંબંધ શોધો',
          description: 'તમારા વચ્ચે કયો સંબંધ છે તે શોધો'
        },
        {
          number: '4',
          title: 'સંપર્ક જુઓ',
          description: 'જોડાણનો માર્ગ અને આ સંબંધ વિશે જાણો'
        }
      ],

      tips: 'ટીપ્સ',
      tipsList: [
        'બે અલગ-અલગ લોકોને પસંદ કરવાનું યાદ રાખો',
        'સમુદાયમાં વધુ ચોક્સાઇ શોધ માટે તમારો સમય લો',
        'દૂર સંબંધીઓને શોધવા માટે આ સરંજામ ઉપયોગ કરો',
        'આપણા વિશાળ પરિવાર કમ્યુનિટીમાં તમારું સ્થાન શોધો'
      ]
    },

    hindi: {
      title: '🌳 हमारा परिवार',
      subtitle: 'जानिए कि हम कैसे जुड़े हुए हैं',
      tagline: 'एक दूसरे को समझो, रिश्ते मजबूत करो',
      
      cards: [
        {
          icon: '🔍',
          title: 'आसान खोज',
          description: 'दो लोगों को चुनें और उनका रिश्ता खोजें'
        },
        {
          icon: '🌍',
          title: 'पारिवारिक जुड़ाव',
          description: 'समुदाय में लोग कैसे जुड़े हैं यह जानें'
        },
        {
          icon: '❤️',
          title: 'रिश्ते मापें',
          description: 'रिश्तों की गहराई और निकटता समझें'
        }
      ],

      howItWorks: 'यह कैसे काम करता है',
      steps: [
        {
          number: '1',
          title: 'पहला व्यक्ति चुनें',
          description: 'समुदाय से किसी को खोजें और चुनें'
        },
        {
          number: '2',
          title: 'दूसरा व्यक्ति चुनें',
          description: 'अपने रिश्ते के लिए किसी और को चुनें'
        },
        {
          number: '3',
          title: 'रिश्ता खोजें',
          description: 'जानिए आपके बीच क्या रिश्ता है'
        },
        {
          number: '4',
          title: 'जुड़ाव देखें',
          description: 'कनेक्शन पथ और रिश्ते के बारे में जानें'
        }
      ],

      tips: 'सुझाव',
      tipsList: [
        'दो अलग-अलग लोगों को चुनना याद रखें',
        'समुदाय में अधिक खोज के लिए समय लें',
        'दूर के रिश्तेदारों को खोजने के लिए इस उपकरण का उपयोग करें',
        'हमारे विशाल पारिवारिक समुदाय में अपनी जगह खोजें'
      ]
    },

    english: {
      title: '🌳 Our Family',
      subtitle: 'Discover how we are connected',
      tagline: 'Understand each other, strengthen bonds',
      
      cards: [
        {
          icon: '🔍',
          title: 'Simple Search',
          description: 'Select two people and find their relationship'
        },
        {
          icon: '🌍',
          title: 'Family Connection',
          description: 'See how people in our community are connected'
        },
        {
          icon: '❤️',
          title: 'Measure Bonds',
          description: 'Understand the depth and closeness of relationships'
        }
      ],

      howItWorks: 'How It Works',
      steps: [
        {
          number: '1',
          title: 'Select First Person',
          description: 'Find and select someone from the community'
        },
        {
          number: '2',
          title: 'Select Second Person',
          description: 'Choose another member for your relationship'
        },
        {
          number: '3',
          title: 'Find Relationship',
          description: 'Discover what relationship exists between them'
        },
        {
          number: '4',
          title: 'View Connection',
          description: 'See the connection path and learn about the relationship'
        }
      ],

      tips: 'Tips',
      tipsList: [
        'Remember to select two different people',
        'Take your time to explore the community database',
        'Use this tool to find distant relatives',
        'Discover your place in our large family community'
      ]
    }
  };

  const t = content[language] || content.english;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-pattern" />
        </div>

        <div className="relative z-10 container max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center text-white space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {t.title}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl opacity-90 max-w-2xl mx-auto">
              {t.subtitle}
            </p>
            <p className="text-base md:text-lg opacity-75 italic max-w-xl mx-auto pt-2">
              &quot;{t.tagline}&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {t.cards.map((card, idx) => (
            <Card key={idx} className="border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="text-4xl">{card.icon}</div>
                <h3 className="font-semibold text-lg text-gray-900">{card.title}</h3>
                <p className="text-gray-600 text-sm">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Finder Component */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            {language === 'gujarati' && 'સંબંધ શોધો'}
            {language === 'hindi' && 'रिश्ता खोजें'}
            {language === 'english' && 'Find Relationship'}
          </h2>
          <RelationshipFinderClient />
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          {t.howItWorks}
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          {t.steps.map((step, idx) => (
            <div key={idx} className="relative">
              {/* Card */}
              <Card className="h-full border-blue-200 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg mx-auto">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-center text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600 text-center">{step.description}</p>
                </CardContent>
              </Card>

              {/* Arrow between cards */}
              {idx < t.steps.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 transform -translate-y-1/2 z-10">
                  <div className="text-2xl text-blue-600">→</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
            <Info className="w-8 h-8 text-amber-600" />
            {t.tips}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {t.tipsList.map((tip, idx) => (
              <div key={idx} className="flex gap-3 bg-white rounded-lg p-4 border border-amber-200">
                <div className="text-2xl flex-shrink-0">✨</div>
                <p className="text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cultural Message */}
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="pt-8 text-center space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              {language === 'gujarati' && '💝 આપણો પરિવાર, આપણુ સંસ્કાર'}
              {language === 'hindi' && '💝 हमारा परिवार, हमारी परंपरा'}
              {language === 'english' && '💝 Our Family, Our Heritage'}
            </h3>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
              {language === 'gujarati' && 'આપણે એક મોટો પરિવાર છીએ જ્યાં દરેક સંબંધ મહત્વપૂર્ણ છે. આપણા સાથેના બંધતાઓ આપણને એક બીજાની નજીક લાવે છે અને આપણા સમુદાયને મજબુત કરે છે.'}
              {language === 'hindi' && 'हम एक बड़ा परिवार हैं जहाँ हर रिश्ता महत्वपूर्ण है। हमारे साथ के बंधन हमें एक दूसरे के करीब लाते हैं और हमारे समुदाय को मजबूत करते हैं।'}
              {language === 'english' && 'We are one large family where every relationship matters. The bonds we share bring us closer to each other and strengthen our community.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer Spacing */}
      <div className="h-8" />
    </div>
  );
}
