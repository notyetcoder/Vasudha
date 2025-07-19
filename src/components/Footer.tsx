
'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const router = useRouter();
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const navigateToAdmin = () => {
    router.push('/admin/login');
  };

  // For Desktop
  const handleDoubleClick = () => {
    navigateToAdmin();
  };

  // For Accessibility
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter') {
      navigateToAdmin();
    }
  };

  // For Mobile (Long Press)
  const handleTouchStart = () => {
    pressTimer.current = setTimeout(() => {
      navigateToAdmin();
    }, 1000); // 1-second long press
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };


  return (
    <footer className="w-full bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto py-4 px-6 flex flex-row justify-center items-center gap-2">
        <p className="text-sm text-muted-foreground">
          © {currentYear} वसुधैव कुटुम्बकम्. All rights reserved.
        </p>
        <button 
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          // Prevent context menu on long press on some devices
          onContextMenu={(e) => e.preventDefault()}
          tabIndex={0} // Make it focusable
          aria-label="Admin Login (activate with Enter, double-click, or long press)" 
          className="transition-transform duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
        >
          <Logo className="h-10 w-10" />
        </button>
      </div>
    </footer>
  );
}
