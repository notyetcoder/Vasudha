'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';

export default function TransparentBackButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={cn(
        // Meets 44px touch target on mobile, looks minimal on desktop
        'group inline-flex items-center gap-1 h-11 px-3 text-sm font-medium',
        'text-muted-foreground hover:text-primary transition-colors',
        'rounded-lg hover:bg-white/5 active:bg-white/10',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      aria-label="Go back to previous page"
    >
      <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      <span>Back</span>
    </button>
  );
}
