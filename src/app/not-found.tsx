import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background">
        <div aria-hidden="true" className="aurora-background absolute--full-bleed pointer-events-none" />
      </div>
      <MainHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center pb-safe">
        <p className="text-6xl sm:text-8xl font-headline text-primary/20 font-bold select-none mb-4">
          404
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
          Profile Not Found
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-sm mb-8">
          This profile may have been removed, or the link you followed is no longer valid.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button asChild className="w-full">
            <Link href="/"><Home className="h-4 w-4 mr-2" /> Go Home</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/explore"><Search className="h-4 w-4 mr-2" /> Explore</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
