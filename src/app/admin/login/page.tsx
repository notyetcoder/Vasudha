
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAdmin } from '@/context/AdminContext';
import Link from 'next/link';

// This component uses useSearchParams, so it must be wrapped in Suspense
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { adminUser, isLoading: isAuthLoading } = useAdmin();

  useEffect(() => {
    // If the user is already logged in (and the auth state is not loading),
    // redirect them away from the login page.
    if (!isAuthLoading && adminUser) {
      router.push(callbackUrl);
    }
  }, [adminUser, isAuthLoading, router, callbackUrl]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Success! The onAuthStateChanged listener in AdminContext will now handle
      // fetching the admin data. The useEffect above will handle the redirect.
      // A manual push is here as a fallback.
      router.push(callbackUrl);
    } catch (error: any) {
        let errorMessage = "An unknown error occurred.";
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage = "Invalid email or password.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Please enter a valid email address.";
                break;
            default:
                errorMessage = "Failed to sign in. Please try again.";
                break;
        }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
      setIsSubmitting(false);
    }
  };

  // While auth is loading, or if the user is logged in and we are waiting for redirect, show a loader.
  if (isAuthLoading || adminUser) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
         <Loader2 className="h-10 w-10 animate-spin text-primary" />
       </div>
     );
  }
  
  // Only show the form if auth is done loading and there is no admin user.
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" aria-label="Back to homepage" className="inline-block mx-auto">
            <Logo className="h-20 w-20" />
          </Link>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Set page to be dynamic to allow useSearchParams
export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-muted/40 p-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
