
import type { ReactNode } from "react";

export const dynamic = 'force-dynamic';

// This layout no longer needs client-side logic or context providers.
export default function AdminSectionLayout({ children }: { children: ReactNode; }) {
  return <>{children}</>;
}
