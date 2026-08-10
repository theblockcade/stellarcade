import ProfileSettings from "../../src/components/ProfileSettings";

/**
 * Thin Next route wrapper — ProfileSettings itself has no router
 * dependency (its "use client" directive is for hooks/state, not
 * routing), so unlike the Portfolio route this needs no wiring beyond
 * rendering the component.
 */
export default function ProfilePage() {
  return <ProfileSettings />;
}
