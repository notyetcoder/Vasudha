'use client';
import type { ReactNode } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Loader2 } from "lucide-react";

// This layout wraps all protected admin pages.
// It relies on the AdminProvider from a higher-level layout to handle auth.
export default function AdminDashboardLayout({ children }: { children: ReactNode; }) {
  const { isLoading, adminUser } = useAdmin();

   if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-muted/40">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading administration...</p>
                </div>
            </div>
        );
    }

  // The AdminContext will handle redirecting if adminUser is null.
  // We just need to prevent content flash during the redirect.
  if (!adminUser) {
    return null;
  }

  return <>{children}</>;
}
