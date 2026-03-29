import React, { Suspense, lazy } from 'react';
import GameLobby from './pages/GameLobby';
import PaginationDemoPage from './pages/PaginationDemoPage';
import { I18nProvider, useI18n } from './i18n/provider';
import LocaleSwitcher from './components/LocaleSwitcher';
import AppSidebar, { type SidebarRouteKey } from './components/v1/AppSidebar';

const DevContractCallSimulatorPanel = import.meta.env.DEV
  ? lazy(() =>
      import('./components/dev/ContractCallSimulatorPanel').then((m) => ({
        default: m.ContractCallSimulatorPanel,
      })),
    )
  : undefined;

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="route-fallback" role="alert" aria-live="assertive">
          <h2>Lobby temporarily unavailable</h2>
          <p>Reload the route to try fetching the latest game state again.</p>
          <div className="route-fallback-actions">
            <button type="button" onClick={this.handleRetry}>
              Try Again
            </button>
            <button type="button" onClick={this.handleReload}>
              Reload
            </button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { t } = useI18n();
  const searchParams = new URLSearchParams(window.location.search);
  const isPaginationDemoRoute = searchParams.get('demo') === 'pagination';

  const getActiveRoute = (): SidebarRouteKey => {
    const { pathname } = window.location;

    if (isPaginationDemoRoute) {
      return 'pagination-demo';
    }

    if (pathname.startsWith('/games')) {
      return 'games';
    }

    if (pathname.startsWith('/profile')) {
      return 'profile';
    }

    return 'lobby';
  };

  return (
    <div className="app-container">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header className="app-header" role="banner">
        <div className="logo">{t('app.title')}</div>
        <nav aria-label="Main navigation">
          <ul>
            <li className={window.location.pathname === '/' ? 'active' : ''}>{t('nav.lobby')}</li>
            <li className={window.location.pathname.startsWith('/games') ? 'active' : ''}>{t('nav.games')}</li>
            <li className={window.location.pathname.startsWith('/profile') ? 'active' : ''}>{t('nav.profile')}</li>
          </ul>
        </nav>
        <LocaleSwitcher />
      </header>

      <div className="app-shell">
        <AppSidebar activeRoute={getActiveRoute()} />

        <main className="app-content" id="main-content">
          <RouteErrorBoundary>
            {isPaginationDemoRoute ? <PaginationDemoPage /> : <GameLobby />}
          </RouteErrorBoundary>
        </main>
      </div>

      <footer className="app-footer" role="contentinfo">
        <div className="footer-content">
          <p>{t('footer.copyright')}</p>
          <div className="footer-links">
            <a href="/terms">{t('footer.terms')}</a>
            <a href="/privacy">{t('footer.privacy')}</a>
          </div>
        </div>
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
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
};

export default App;