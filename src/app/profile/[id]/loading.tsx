import { Skeleton } from '@/components/ui/skeleton';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';

export default function ProfileLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader />
      <main className="flex-1 container mx-auto pt-20 pb-12 px-3 sm:px-4">
        {/* Action bar skeleton */}
        <div className="mb-6 flex justify-between items-center">
          <Skeleton className="h-10 w-16 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>

        {/* Mobile hero skeleton */}
        <div className="lg:hidden mb-6">
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column — desktop only */}
          <div className="hidden lg:flex lg:col-span-1 flex-col gap-6">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-52 w-full rounded-xl" />
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-40 rounded" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Skeleton className="h-28 rounded-xl" />
                  <Skeleton className="h-28 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
