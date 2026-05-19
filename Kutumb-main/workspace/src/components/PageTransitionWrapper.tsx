
'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import LoadingScreen from './LoadingScreen';

// This component uses Suspense to detect when the page is loading.
const PageLoader = () => {
    const pathname = usePathname();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const previousPathname = useRef(pathname);

    useEffect(() => {
        // When the pathname changes, we start the transition.
        if (previousPathname.current !== pathname) {
            setIsTransitioning(true);
            previousPathname.current = pathname;
        }
    }, [pathname]);

    // When the new page component has finished loading and Suspense is done,
    // this effect will run to hide the loader.
    useEffect(() => {
        if (isTransitioning) {
            setIsTransitioning(false);
        }
    }, [isTransitioning, pathname]); // Depend on pathname to re-evaluate when navigation completes.

    return isTransitioning ? <LoadingScreen /> : null;
};


export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Suspense fallback={<LoadingScreen />}>
                <PageLoader />
                {children}
            </Suspense>
        </>
    );
}
