'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import { UserPlus, Search, Mail, Shield, GitMerge, Menu, X, Home } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/',             label: 'Home',             icon: Home },
  { href: '/explore',      label: 'Explore',          icon: Search },
  { href: '/relationships',label: 'Find Connection',  icon: GitMerge },
  { href: '/contact',      label: 'Contact',          icon: Mail },
  { href: '/admin/login',  label: 'Admin',            icon: Shield },
];

export default function MainHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  if (pathname.startsWith('/admin')) return null;

  const isRegisterPage = pathname === '/register';

  return (
    <>
      <header className="fixed top-0 z-50 w-full bg-background/60 backdrop-blur-xl border-b border-white/10 safe-area-inset-top">
        <div className="container flex h-16 items-center px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-auto" aria-label="Go to home">
            <Logo className="h-9 w-9" priority={pathname === '/'} />
            <span className="font-headline text-sm font-bold text-primary hidden xs:block">Vasudha</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 mr-3">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Register button — desktop */}
          {!isRegisterPage && (
            <Button asChild size="sm" className="hidden md:flex">
              <Link href="/register"><UserPlus className="h-4 w-4 mr-1.5" /> Register</Link>
            </Button>
          )}

          {/* Mobile: Register + Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            {!isRegisterPage && (
              <Button asChild size="sm" className="h-9 px-3 text-xs">
                <Link href="/register"><UserPlus className="h-3.5 w-3.5 mr-1" /> Register</Link>
              </Button>
            )}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'fixed top-16 right-0 z-50 h-[calc(100vh-4rem)] w-72 bg-background/95 backdrop-blur-xl border-l border-white/10 transition-transform duration-300 md:hidden safe-area-inset-right',
        mobileOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <nav className="flex flex-col p-4 gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-colors',
                pathname === href
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}>
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
          <div className="mt-4 pt-4 border-t border-white/10">
            {!isRegisterPage && (
              <Button asChild className="w-full" size="lg">
                <Link href="/register"><UserPlus className="h-5 w-5 mr-2" /> Register a Profile</Link>
              </Button>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
