import { getAllUsersForPublic as getUsers } from "@/actions/users";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";
import UserSearch from "@/components/UserSearch";

export const dynamic = 'force-dynamic';

// Smaller initial batch = fast first paint, background fetch handles the rest
const INITIAL_PAGE_SIZE = 24;

export default async function ExplorePage() {
  const { users, total } = await getUsers(1, INITIAL_PAGE_SIZE);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background">
        <div aria-hidden="true" className="aurora-background absolute--full-bleed pointer-events-none" />
      </div>
      <MainHeader />
      <main className="flex-1 container mx-auto pt-20 pb-12 px-3 sm:px-4 md:px-6">
        <div className="text-center mb-6">
          <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2">
            Explore the Community
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Search or filter to find anyone in the community.
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
