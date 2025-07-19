
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, KeyRound, LogOut, Link2, PlusCircle, Menu, Trash2, RefreshCw } from 'lucide-react';
import Logo from './Logo';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import UserFormModal from './UserFormModal';
import { useState } from 'react';
import { adminCreateUser } from '@/actions/users';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { useAdmin } from '@/context/AdminContext';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type AdminLayoutProps = {
  children: ReactNode;
  onDataChange?: () => void;
};

export default function AdminLayout({ children, onDataChange }: AdminLayoutProps) {
  const { adminUser } = useAdmin();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Default to collapsed
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  const handleSaveNewUser = async (formData: any) => {
    const result = await adminCreateUser(formData);
    if (result.success) {
        toast({ title: "Success", description: "New user created and is now approved." });
        setIsCreateModalOpen(false);
        if (onDataChange) {
            onDataChange();
        }
    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
    }
  };

  const NavLink = ({ href, children, label, onClick }: { href: string; children: ReactNode; label: string; onClick?: () => void }) => {
    const pathname = usePathname();
    const isActive = href === '/admin' ? pathname === href : pathname.startsWith(href);

    const linkContent = (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
          isActive && "bg-muted text-primary",
          isSidebarCollapsed && "justify-center"
        )}
      >
        {children}
        <span className={cn(isSidebarCollapsed && "hidden")}>{label}</span>
      </Link>
    );

    if (isSidebarCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return linkContent;
  };

  const AdminNavLinks = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      <NavLink href="/admin" label="Dashboard" onClick={onLinkClick}><Home className="h-4 w-4" /></NavLink>
      <NavLink href="/admin/connect" label="Connect Relations" onClick={onLinkClick}><Link2 className="h-4 w-4" /></NavLink>
      {adminUser?.role === 'super-admin' && (
        <NavLink href="/admin/permissions" label="Permissions" onClick={onLinkClick}><KeyRound className="h-4 w-4" /></NavLink>
      )}
      <NavLink href="/admin/dustbin" label="Dustbin" onClick={onLinkClick}><Trash2 className="h-4 w-4" /></NavLink>
    </nav>
  );

  return (
    <>
      <TooltipProvider>
        <div className={cn(
          "grid min-h-screen w-full transition-[grid-template-columns] duration-300",
          isSidebarCollapsed ? "md:grid-cols-[60px_1fr]" : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
        )}>
          <aside className="hidden border-r bg-background md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <Logo className="h-8 w-8" />
                  <span className={cn(isSidebarCollapsed && "hidden")}>वसुधैव कुटुम्बकम्</span>
                </Link>
              </div>
              {adminUser && (
                <>
                  <div className="flex-1 overflow-y-auto">
                    <AdminNavLinks />
                  </div>
                  <div className="mt-auto p-4">
                    <Button size={isSidebarCollapsed ? "icon" : "sm"} className="w-full" onClick={() => setIsCreateModalOpen(true)}>
                      <PlusCircle className={cn(!isSidebarCollapsed && "mr-2", "h-4 w-4")} />
                      <span className={cn(isSidebarCollapsed && "hidden")}>Add New Person</span>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </aside>
          <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                  {adminUser && (
                    <>
                      <SheetHeader>
                        <SheetTitle className="sr-only">Admin Menu</SheetTitle>
                         <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 -mx-6">
                          <Link href="/" className="flex items-center gap-2 font-semibold">
                            <Logo className="h-8 w-8" />
                            <span>वसुधैव कुटुम्बकम्</span>
                          </Link>
                        </div>
                      </SheetHeader>
                      <div className="flex-1 overflow-y-auto py-4">
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                          <Link href="/admin" onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", usePathname() === '/admin' && "bg-muted text-primary")}><Home className="h-4 w-4" /> Dashboard</Link>
                          <Link href="/admin/connect" onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", usePathname().startsWith('/admin/connect') && "bg-muted text-primary")}><Link2 className="h-4 w-4" /> Connect Relations</Link>
                          {adminUser?.role === 'super-admin' && (
                            <Link href="/admin/permissions" onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", usePathname().startsWith('/admin/permissions') && "bg-muted text-primary")}><KeyRound className="h-4 w-4" /> Permissions</Link>
                          )}
                          <Link href="/admin/dustbin" onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", usePathname().startsWith('/admin/dustbin') && "bg-muted text-primary")}><Trash2 className="h-4 w-4" /> Dustbin</Link>
                        </nav>
                      </div>
                      <div className="mt-auto">
                        <Button size="sm" className="w-full" onClick={() => { setIsCreateModalOpen(true); setIsMobileMenuOpen(false); }}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add New Person
                        </Button>
                      </div>
                    </>
                  )}
                </SheetContent>
              </Sheet>

              <Button variant="outline" size="icon" className="shrink-0 hidden md:flex" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>

              <div className="w-full flex-1"></div>
              {adminUser && (
                <div className="flex items-center gap-4">
                  {onDataChange && (
                    <Button onClick={onDataChange} variant="outline" size="sm" title="Refresh Data">
                      <RefreshCw className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only sm:ml-2">Refresh</span>
                    </Button>
                  )}
                  <div className='text-right'>
                    <p className='text-sm font-semibold'>{adminUser.name}</p>
                    <p className='text-xs text-muted-foreground capitalize'>{adminUser.role.replace('-', ' ')}</p>
                  </div>
                  <Button onClick={handleLogout} variant="ghost" size="icon" title="Logout">
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Logout</span>
                  </Button>
                </div>
              )}
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
      {adminUser && <UserFormModal mode="create" isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={handleSaveNewUser} />}
    </>
  );
}
