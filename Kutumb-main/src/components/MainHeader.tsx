
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import { UserPlus, Search, Mail, Shield, GitMerge } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const NavIconButton = ({ href, label, children }: { href: string; label: string; children: React.ReactNode }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon">
                <Link href={href}>{children}</Link>
            </Button>
        </TooltipTrigger>
        <TooltipContent>
            <p>{label}</p>
        </TooltipContent>
    </Tooltip>
);

export default function MainHeader() {
    const pathname = usePathname();
    const isRegisterPage = pathname === '/register';
    const isHomePage = pathname === '/';
    
    // Do not render the header on admin pages or the login page
    if (pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <header className="fixed top-0 z-50 w-full bg-background/30 backdrop-blur-lg border-b border-white/10">
            <div className="container flex h-16 items-center">
                <Link href="/" className="flex items-center gap-2 mr-6">
                    <Logo className="h-10 w-10" priority={isHomePage} />
                </Link>

                <TooltipProvider delayDuration={0}>
                    <div className="ml-auto flex items-center gap-1 sm:gap-2">
                        <NavIconButton href="/explore" label="Explore Community">
                            <Search />
                        </NavIconButton>

                        <NavIconButton href="/relationships" label="Find Connection">
                            <GitMerge />
                        </NavIconButton>

                        <NavIconButton href="/contact" label="Contact Us">
                            <Mail />
                        </NavIconButton>
                        
                        <NavIconButton href="/admin/login" label="Admin Login">
                            <Shield />
                        </NavIconButton>

                        {!isRegisterPage && (
                          <Button asChild size="sm" className="ml-2">
                              <Link href="/register">
                                  <UserPlus className="mr-2" /> Register
                              </Link>
                          </Button>
                        )}
                    </div>
                </TooltipProvider>
            </div>
        </header>
    );
}
