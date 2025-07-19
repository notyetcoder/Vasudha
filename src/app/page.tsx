
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MainHeader from '@/components/MainHeader';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { UserPlus, Search } from 'lucide-react';
import Footer from '@/components/Footer';

const languages = [
  { lang: 'sanskrit', motto: 'एकं विश्वम्, एकं कुटुम्बम्।' },
  { lang: 'gujarati', motto: 'એક વિશ્વ, એક પરિવાર.' },
  { lang: 'english', motto: 'One World, One Family.' },
  { lang: 'hindi', motto: 'एक दुनिया, एक परिवार।' },
];

export default function Home() {
  const [currentLangIndex, setCurrentLangIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLangIndex((prevIndex) => (prevIndex + 1) % languages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentLang = languages[currentLangIndex];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <MainHeader />
      
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        {/* Headline Section */}
        <div className="text-center mb-10">
          <h1 className="font-headline text-4xl sm:text-6xl font-bold tracking-tight text-primary">
            वसुधैव कुटुम्बकम्
          </h1>
          <p
            key={currentLangIndex}
            className="mt-3 text-base sm:text-xl leading-7 text-muted-foreground max-w-2xl mx-auto animate-fade-in"
          >
            {currentLang.motto}
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-xl w-full">
          {/* Register Card */}
          <Link href="/register" className="group block">
            <div className="relative p-4 rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm h-28 sm:h-32 flex flex-col items-center justify-center text-center overflow-hidden transition-all duration-300 ease-in-out hover:bg-card/70 hover:border-primary/50 hover:shadow-lg hover:scale-105">
              <div className="transition-all duration-300 group-hover:-translate-y-2">
                <UserPlus className="h-6 w-6 text-primary mx-auto" />
                <CardTitle className="mt-2 font-headline text-base">Register Profile</CardTitle>
              </div>
              <div className="absolute bottom-3 left-4 right-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <CardDescription className="text-xs">
                  Create your profile to join the community and connect with your roots.
                </CardDescription>
              </div>
            </div>
          </Link>

          {/* Explore Card */}
          <Link href="/explore" className="group block">
            <div className="relative p-4 rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm h-28 sm:h-32 flex flex-col items-center justify-center text-center overflow-hidden transition-all duration-300 ease-in-out hover:bg-card/70 hover:border-primary/50 hover:shadow-lg hover:scale-105">
              <div className="transition-all duration-300 group-hover:-translate-y-2">
                <Search className="h-6 w-6 text-primary mx-auto" />
                <CardTitle className="mt-2 font-headline text-base">Explore Community</CardTitle>
              </div>
              <div className="absolute bottom-3 left-4 right-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <CardDescription className="text-xs">
                  Search for relatives, view family trees, and discover your heritage.
                </CardDescription>
              </div>
            </div>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
