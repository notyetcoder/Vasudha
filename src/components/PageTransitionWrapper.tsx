'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import LoadingScreen from './LoadingScreen';

// Shows the loading screen only during navigation between routes.
// Clears automatically once the new page content mounts.
function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prev = useRef(pathname);

  useEffect(() => {
    if (prev.current === pathname) return;
    prev.current = pathname;
    // Show loading briefly during route transition
    setLoading(true);
    // Clear after a short delay — new page content will be mounted by then
    const t = setTimeout(() => setLoading(false), 400);
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
