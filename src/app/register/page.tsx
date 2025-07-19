import RegistrationForm from '@/components/RegistrationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';

export default function RegisterPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <MainHeader />
      <main className="flex-1 container mx-auto pt-24 pb-12 px-4">
        <div className="w-full max-w-3xl mx-auto">
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
                <h1 className="font-headline text-4xl sm:text-5xl text-primary">वसुधैव कुटुम्बकम्</h1>
                <CardTitle className="text-2xl font-semibold tracking-tight pt-2">Register Your Profile</CardTitle>
                <CardDescription>Fill out the form below to join our community network.</CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationForm />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
