'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import { UserPlus, Search } from 'lucide-react';

const NavLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => (
    <Link href={href} className="group flex flex-col items-center gap-1 text-muted-foreground transition-colors duration-300 hover:text-primary">
        <div className="transition-transform duration-300 group-hover:scale-110">
            {icon}
        </div>
        <span className="text-xs font-medium">{label}</span>
    </Link>
);


export default function MainHeader() {
    const pathname = usePathname();

    if (pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2 transition-transform duration-300 hover:scale-105">
                    <Logo className="h-14 w-14 text-primary" />
                </Link>

                <div className="flex items-center gap-6">
                    <NavLink href="/register" icon={<UserPlus className="h-6 w-6" />} label="Register" />
                    <NavLink href="/explore" icon={<Search className="h-6 w-6" />} label="Explore" />
                </div>
            </div>
        </header>
    );
}
