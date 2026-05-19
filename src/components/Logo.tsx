
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  priority?: boolean;
}

export default function Logo({ className, priority = false }: LogoProps) {
  return (
    <div className={cn("relative w-12 h-12", className)}>
      <Image 
        src="https://upload.wikimedia.org/wikipedia/commons/7/7f/Rotating_earth_animated_transparent.gif"
        alt="Spinning Earth Logo"
        fill
        style={{objectFit: 'contain'}}
        unoptimized
        priority={priority}
      />
    </div>
  );
}
