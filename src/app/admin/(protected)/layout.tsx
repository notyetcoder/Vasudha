
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Menu, ChevronsLeft, ChevronsRight, LogOut, Users, LayoutDashboard, MessageSquareQuote } from 'lucide-react';
import Logo from '@/components/Logo';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { logout } from '@/actions/auth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useMediaQuery } from '@/hooks/use-media-query';

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  useEffect(() => {
    // Collapse sidebar by default on mobile-sized desktop windows
    if (!isDesktop) {
        setIsSidebarCollapsed(true);
    }
  }, [isDesktop]);

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };
  
  const NavLink = ({ href, children, label, onClick }: { href: string; children: ReactNode; label: string; onClick?: () => void }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    const linkContent = (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-4 rounded-lg px-3 py-2 text-foreground/70 transition-all hover:text-foreground hover:bg-white/5",
          isActive && "bg-primary/10 text-primary font-semibold",
          isSidebarCollapsed && "justify-center"
        )}
      >
        {children}
        <span className={cn("transition-opacity", isSidebarCollapsed ? "sr-only" : "opacity-100")}>{label}</span>
      </Link>
    );

    if (isSidebarCollapsed && isDesktop) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={5}>{label}</TooltipContent>
        </Tooltip>
      );
    }
    return linkContent;
  };

  const AdminNavLinks = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <nav className="flex flex-col gap-2 px-2 lg:px-4">
      <NavLink href="/admin/dashboard" label="Dashboard" onClick={onLinkClick}><LayoutDashboard className="h-5 w-5" /></NavLink>
      <NavLink href="/admin/connect" label="User Management" onClick={onLinkClick}><Users className="h-5 w-5" /></NavLink>
      <NavLink href="/admin/suggestions" label="Suggestions Log" onClick={onLinkClick}><MessageSquareQuote className="h-5 w-5" /></NavLink>
    </nav>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "grid min-h-screen w-full transition-[grid-template-columns] duration-300 ease-in-out",
        isSidebarCollapsed ? "md:grid-cols-[80px_1fr]" : "md:grid-cols-[280px_1fr]"
      )}>
        <aside className="hidden border-r bg-background/30 backdrop-blur-xl md:block">
          <div className="flex h-full max-h-screen flex-col gap-2 relative">
             <div className={cn("flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6", !isSidebarCollapsed && "justify-start")}>
               <Link href="/" className={cn("flex items-center gap-2 font-semibold", isSidebarCollapsed && "justify-center")}>
                <Logo className="h-8 w-8" />
                <span className={cn("transition-opacity", isSidebarCollapsed ? "sr-only" : "opacity-100")}>Vasudha</span>
              </Link>
            </div>
            <div className={cn("p-2", isSidebarCollapsed && "flex justify-center")}>
                <Button variant="ghost" size={isSidebarCollapsed ? "icon" : "default"} className="w-full" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                  {isSidebarCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
                  <span className={cn(isSidebarCollapsed && "sr-only")}>Toggle Sidebar</span>
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <AdminNavLinks />
            </div>

            <div className="mt-auto p-4 border-t space-y-2">
                 <Button variant="outline" size={isSidebarCollapsed ? "icon" : "default"} className="w-full" onClick={handleLogout}>
                      <LogOut className={cn("h-5 w-5", !isSidebarCollapsed && "mr-2")} />
                      <span className={cn(isSidebarCollapsed && "sr-only")}>Logout</span>
                 </Button>
            </div>
          
          </div>
        </aside>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-background/30 backdrop-blur-xl px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col bg-background/80 backdrop-blur-xl p-0">
                    <div className="flex h-14 items-center border-b px-4">
                      <Link href="/" className="flex items-center gap-2 font-semibold">
                          <Logo className="h-8 w-8" />
                          <span>Vasudha Connect</span>
                      </Link>
                    </div>
                    <div className="flex-1 overflow-y-auto py-4">
                      <AdminNavLinks onLinkClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)} />
                    </div>
                    <div className="mt-auto p-4 border-t">
                      <Button variant="outline" className="w-full" onClick={handleLogout}>
                         <LogOut className="mr-2 h-4 w-4" /> Logout
                      </Button>
                    </div>
              </SheetContent>
            </Sheet>

            <div className='hidden md:block'>
               <Link href="/admin/dashboard" className="font-semibold text-lg">Admin Panel</Link>
            </div>
          </header>
          <main className="flex-1 flex flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-y-auto bg-muted/20">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
