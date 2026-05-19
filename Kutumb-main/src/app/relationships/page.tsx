import { Suspense } from 'react';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import RelationshipFinderClient from './_components/RelationshipFinderClient';
import { GitMerge, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

function PageFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Loading…</p>
    </div>
  );
}

export default function RelationshipsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background">
        <div aria-hidden="true" className="aurora-background absolute--full-bleed pointer-events-none" />
      </div>
      <MainHeader />
      <main className="flex-1 container mx-auto pt-28 pb-12 px-4 md:px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/20 rounded-full mb-4">
            <GitMerge className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight text-primary mb-2">
            Relations &amp; Family Tree
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            View anyone's full family tree, or discover how any two people in the community are connected — with Gujarati, Hindi and English names.
          </p>
        </div>
        {/* Suspense required because RelationshipFinderClient uses useSearchParams */}
        <Suspense fallback={<PageFallback />}>
          <RelationshipFinderClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
