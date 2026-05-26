'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import LoadingScreen from './LoadingScreen';

function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prev = useRef(pathname);
  const mounted = useRef(false);

  useEffect(() => {
    // Skip the very first mount — Suspense handles that
    if (!mounted.current) { mounted.current = true; return; }
    if (prev.current === pathname) return;
    prev.current = pathname;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, [pathname]);

  return loading ? <LoadingScreen /> : null;
}

export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <PageLoader />
      {children}
    </Suspense>
  );
}
