import { getUsers } from "@/actions/users";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";
import UserSearch from "@/components/UserSearch";

export default async function ExplorePage() {
  // Fetch only approved users for the public page, and also pass them for the search context
  const approvedUsers = await getUsers({ status: 'approved' });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <MainHeader />
      <main className="flex-1 container mx-auto pt-28 pb-12 px-4 md:px-6">
        <div className="text-center mb-8">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight text-primary mb-2">
            वसुधैव कुटुम्बकम्
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Search for anyone in the community to view their profile and family connections.
          </p>
        </div>
        <UserSearch users={approvedUsers} allUsers={approvedUsers} />
      </main>
      <Footer />
    </div>
  );
}
