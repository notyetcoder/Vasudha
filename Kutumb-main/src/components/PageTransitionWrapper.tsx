
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
            // A timeout to ensure the loading screen doesn't get stuck
            const timer = setTimeout(() => setIsTransitioning(false), 3000); 
            return () => clearTimeout(timer);
        }
    }, [pathname]);

    // When the new page component has finished loading and Suspense is done,
    // this effect will run to hide the loader.
    useEffect(() => {
        // This effect runs after the component renders. If we are transitioning,
        // it means the new content is now visible, so we can stop transitioning.
        if (isTransitioning) {
            const timer = setTimeout(() => setIsTransitioning(false), 200); // short delay
            return () => clearTimeout(timer);
        }
    }, [isTransitioning, pathname]); 

    return isTransitioning ? <LoadingScreen /> : null;
};


export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    return (
        <>
            <Suspense fallback={<LoadingScreen />}>
                <PageLoader />
                {children}
            </Suspense>
        </>
    );
}
