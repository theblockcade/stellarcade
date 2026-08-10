import AppShell from "../../src/components/AppShell";
import type { ReactNode } from "react";

/**
 * Route-group layout — wraps /app, /portfolio, /profile in one shared
 * AppShell (sidebar, header, command palette, notifications) without
 * affecting the URL structure. The landing page at "/" deliberately sits
 * outside this group; it's a public marketing page, not part of the
 * dashboard shell.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
