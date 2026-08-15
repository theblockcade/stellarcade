"use client";

import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/components/dashboard";

/**
 * Standalone composition of the app shell + dashboard, matching the
 * efferd-dashboard-2 registry component's contract.
 *
 * Routes under app/(dashboard) already get AppShell from the route-group
 * layout, so they render <Dashboard /> directly — wrapping again here would
 * nest two shells. Use this export only where the shell is *not* already
 * present (a standalone demo page, Storybook, a preview route).
 */
export function EfferdDashboard2() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

export default EfferdDashboard2;
