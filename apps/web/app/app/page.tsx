import GameLobby from "../../src/components/GameLobby";

/**
 * The arcade lobby route — what the landing page's "Enter the arcade" CTA
 * links to. GameLobby itself has no router dependency (navigation between
 * lobby/profile/portfolio was handled by AppSidebar + App.tsx in the
 * original app, not yet wired into apps/web's routing — see MIGRATION.md).
 */
export default function AppPage() {
  return <GameLobby />;
}
