'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronDown } from 'lucide-react';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'gujarati' as const, name: 'ગુજરાતી', label: 'Gujarati' },
    { code: 'hindi' as const, name: 'हिंदी', label: 'Hindi' },
    { code: 'english' as const, name: 'English', label: 'English' }
  ];

  const currentLang = languages.find(l => l.code === language);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
        title="Change language"
        aria-label="Language selector"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20H7m6-4h.01M9 3h.01"
          />
        </svg>

        <span className="text-xs font-semibold">{currentLang?.code.slice(0, 2).toUpperCase()}</span>

        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-max"
          role="menu"
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-2 text-left text-sm font-medium transition-colors duration-150
                ${
                  language === lang.code
                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50'
                }
                ${lang.code !== 'gujarati' ? 'border-t border-gray-100' : ''}
                first:rounded-t-lg last:rounded-b-lg
              `}
              role="menuitem"
              title={`Switch to ${lang.label}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{lang.name}</div>
                  <div className="text-xs text-gray-500">{lang.label}</div>
                </div>
                {language === lang.code && (
                  <span className="text-blue-600 font-bold">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
