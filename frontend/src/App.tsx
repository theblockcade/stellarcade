import React, { Suspense, lazy } from 'react';
import GameLobby from './pages/GameLobby';
import PaginationDemoPage from './pages/PaginationDemoPage';
import ProfileSettings from './pages/ProfileSettings';
import { RouteErrorBoundary } from './components/v1/RouteErrorBoundary';
import { I18nProvider, useI18n } from './i18n/provider';
import LocaleSwitcher from './components/LocaleSwitcher';
import AppSidebar, { type SidebarRouteKey } from './components/v1/AppSidebar';
import { ModalStackProvider } from './components/v1/modal-stack';
import { FeatureFlagsProvider } from './services/feature-flags';
import CommandPalette, { type Command } from './components/v1/CommandPalette';

const DevContractCallSimulatorPanel = import.meta.env.DEV
  ? lazy(() =>
      import('./components/dev/ContractCallSimulatorPanel').then((m) => ({
        default: m.ContractCallSimulatorPanel,
      })),
    )
  : undefined;

const AppContent: React.FC = () => {
  const { t } = useI18n();

  const searchParams = new URLSearchParams(window.location.search);
  const isPaginationDemoRoute = searchParams.get('demo') === 'pagination';

  const [route, setRoute] = React.useState<'lobby' | 'profile' | 'games'>('lobby');

  const commands: Command[] = [
    {
      id: 'go-lobby',
      label: 'Go to Lobby',
      description: 'Open the game lobby',
      action: () => setRoute('lobby'),
    },
    {
      id: 'go-profile',
      label: 'Go to Profile Settings',
      description: 'Open profile settings',
      action: () => setRoute('profile'),
    },
  ];

  const getActiveRoute = (): SidebarRouteKey => {
    if (isPaginationDemoRoute) return 'pagination-demo';
    if (route === 'games') return 'games';
    if (route === 'profile') return 'profile';
    return 'lobby';
  };

  return (
    <div className="app-container">
      <CommandPalette commands={commands} />

      <header className="app-header" role="banner">
        <div className="logo">{t('app.title')}</div>

        <nav>
          <button onClick={() => setRoute('lobby')}>{t('nav.lobby')}</button>
          <button onClick={() => setRoute('games')}>{t('nav.games')}</button>
          <button onClick={() => setRoute('profile')}>{t('nav.profile')}</button>
        </nav>

        <LocaleSwitcher />
      </header>

      <div className="app-shell">
        <AppSidebar activeRoute={getActiveRoute()} />

        <main className="app-content" id="main-content">
          <RouteErrorBoundary>
            {isPaginationDemoRoute ? (
              <PaginationDemoPage />
            ) : route === 'profile' ? (
              <ProfileSettings />
            ) : (
              <GameLobby />
            )}
          </RouteErrorBoundary>
        </main>
      </div>

      <footer className="app-footer">
        <p>{t('footer.copyright')}</p>
      </footer>

      {import.meta.env.DEV && DevContractCallSimulatorPanel ? (
        <Suspense fallback={null}>
          <DevContractCallSimulatorPanel />
        </Suspense>
      ) : null}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <FeatureFlagsProvider>
      <I18nProvider>
        <ModalStackProvider>
          <AppContent />
        </ModalStackProvider>
      </I18nProvider>
    </FeatureFlagsProvider>
  );
};

export default App;