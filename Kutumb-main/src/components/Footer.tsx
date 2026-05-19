
'use client';

import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-transparent">
      <div className="container mx-auto py-4 px-6 flex flex-row justify-center items-center gap-2">
        <p className="text-sm text-foreground/60">
          © {currentYear} वसुधैव कुटुम्बकम्. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
