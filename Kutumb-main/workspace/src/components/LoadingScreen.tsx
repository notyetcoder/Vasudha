'use client';
import Logo from './Logo';

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300">
            <Logo className="h-24 w-24" />
            <div className="mt-4 w-40 h-2 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-loading-wave rounded-full"></div>
            </div>
        </div>
    );
}
