'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { login } from '@/actions/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Logo from '@/components/Logo';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    // Client-side basic validation
    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const result = await login({ email: email.trim(), password });

    if (result.success) {
      router.push('/admin/dashboard');
      router.refresh();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      // Give progressively more helpful error messages
      if (newAttempts >= 3) {
        setErrorMsg('Multiple failed attempts. Make sure you are using the correct admin email and password. Contact the system owner if you have forgotten your credentials.');
      } else {
        setErrorMsg(result.error ?? 'Invalid email or password. Please try again.');
      }

      setPassword(''); // Clear password on failure for security
      setIsLoading(false);
    }
  };

  const isValid = email.trim().includes('@') && password.length >= 6;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 pb-safe">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background">
        <div aria-hidden="true" className="aurora-background absolute--full-bleed pointer-events-none" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" aria-label="Go to home">
          <Logo className="h-14 w-14" />
        </Link>
        <div>
          <h1 className="font-headline text-3xl sm:text-4xl text-primary">वसुधैव कुटुम्बकम्</h1>
          <p className="text-sm text-muted-foreground">Administrator Access</p>
        </div>
      </div>

      <Card className="w-full max-w-sm bg-card/50 backdrop-blur-lg border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">Admin Login</CardTitle>
          <CardDescription className="text-sm">
            Enter your credentials to access the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Error message */}
            {errorMsg && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5" role="alert">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                ref={emailRef}
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                required
                placeholder="admin@example.com"
                className="h-11"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                  required
                  className="h-11 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading || !isValid}
            >
              {isLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</>
                : <><LogIn className="mr-2 h-4 w-4" /> Sign In</>
              }
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">← Back to site</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
