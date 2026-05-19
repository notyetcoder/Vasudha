
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
                "group relative inline-flex items-center justify-center h-10 pl-6 pr-4 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors hover:text-primary dark:hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                className
            )}
            aria-label="Go back to previous page"
        >
            <div className="absolute inset-0 z-0">
                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <defs>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="black" floodOpacity="0.1" />
                        </filter>
                    </defs>
                    <path
                        d="M10 0 H95 C97.7614 0 100 2.23858 100 5 V35 C100 37.7614 97.7614 40 95 40 H10 L0 20 Z"
                        className="fill-background/80 backdrop-blur-sm dark:fill-slate-800/70 drop-shadow-sm transition-colors group-hover:fill-accent/80 dark:group-hover:fill-slate-700/90"
                         filter="url(#shadow)"
                    />
                </svg>
            </div>
            <div className="relative z-10 flex items-center">
                <ChevronLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
                Back
            </div>
        </button>
    );
}
