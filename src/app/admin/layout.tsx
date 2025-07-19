'use server';
import type { ReactNode } from "react";
import { AdminProvider } from "@/context/AdminContext";

export default async function AdminSectionLayout({ children }: { children: ReactNode; }) {
  // The redirection logic is now fully handled within AdminProvider and its context.
  // This layout simply provides the context to all admin-related pages.
  return (
    <AdminProvider>
      {children}
    </AdminProvider>
  );
}
