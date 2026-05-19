
import { getAllUsersForPublic as getUsers } from "@/actions/users";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";
import UserSearch from "@/components/UserSearch";

export const dynamic = 'force-dynamic';

// Load a smaller initial batch for a fast first paint.
const INITIAL_PAGE_SIZE = 24;

export default async function ExplorePage() {
  const { users, total } = await getUsers(1, INITIAL_PAGE_SIZE);
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background">
          <div aria-hidden="true" className="aurora-background absolute--full-bleed pointer-events-none" />
      </div>
      <MainHeader />
      <main className="flex-1 container mx-auto pt-28 pb-12 px-4 md:px-6">
        <div className="text-center mb-8">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight text-primary mb-2">
            Explore the Community
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Search for anyone in the community to view their profile and family connections.
          </p>
        </div>
        <UserSearch 
            initialUsers={users}
            initialTotal={total}
            pageSize={INITIAL_PAGE_SIZE}
        />
      </main>
      <Footer />
    </div>
  );
}
