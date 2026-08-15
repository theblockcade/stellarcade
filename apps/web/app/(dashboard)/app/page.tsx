import { Dashboard } from "../../../src/components/dashboard";

/**
 * The arcade lobby route — what the landing page's "Enter the arcade" CTA
 * links to.
 *
 * Renders <Dashboard /> rather than <EfferdDashboard2 />: the (dashboard)
 * route-group layout already wraps every route in AppShell, and
 * EfferdDashboard2 is that same shell plus this dashboard, so using it here
 * would mount two nested shells (two sidebars, two headers).
 */
export default function AppPage() {
  return <Dashboard />;
}
