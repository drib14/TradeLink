import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/common/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarketProvider } from './context/MarketContext';
import { ChatProvider } from './context/ChatContext';
import { AdminProvider } from './context/AdminContext';
import { WantedProvider } from './context/WantedContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ChatDrawer } from './components/chat/ChatDrawer';
import { AuthModal } from './components/auth/AuthModal';

// Pages
import { HomePage } from './pages/HomePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { SwapsPage } from './pages/SwapsPage';
import { MeetupsPage } from './pages/MeetupsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { PricingAdvisorPage } from './pages/PricingAdvisorPage';
import { WantedBoardPage } from './pages/WantedBoardPage';
import { CampusMapPage } from './pages/CampusMapPage';
import { HelpSafetyPage } from './pages/HelpSafetyPage';
import { TermsPrivacyPage } from './pages/TermsPrivacyPage';
import { AboutPage } from './pages/AboutPage';
import { FAQPage } from './pages/FAQPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { NotFoundPage } from './pages/NotFoundPage';

const pathToView = (path: string): { view: string; params: any } => {
  const cleanPath = path.toLowerCase().replace(/^\/+|\/+$/g, '');
  if (!cleanPath || cleanPath === 'home') return { view: 'home', params: {} };
  if (cleanPath === 'marketplace' || cleanPath === 'market' || cleanPath === 'catalog') return { view: 'marketplace', params: {} };
  if (cleanPath === 'create-listing' || cleanPath === 'post' || cleanPath === 'sell') return { view: 'create-listing', params: {} };
  if (cleanPath === 'wanted' || cleanPath === 'requests' || cleanPath === 'pasabuy') return { view: 'wanted', params: {} };
  if (cleanPath === 'swaps' || cleanPath === 'barter') return { view: 'swaps', params: {} };
  if (cleanPath === 'meetups' || cleanPath === 'handshake') return { view: 'meetups', params: {} };
  if (cleanPath === 'campus-map' || cleanPath === 'landmarks' || cleanPath === 'map') return { view: 'campus-map', params: {} };
  if (cleanPath === 'profile') return { view: 'profile', params: {} };
  if (cleanPath === 'admin') return { view: 'admin', params: {} };
  if (cleanPath === 'superadmin' || cleanPath === 'super-admin' || cleanPath === 'sa') return { view: 'superadmin', params: {} };
  if (cleanPath === 'price-advisor' || cleanPath === 'advisor') return { view: 'price-advisor', params: {} };
  if (cleanPath === 'about') return { view: 'about', params: {} };
  if (cleanPath === 'faq') return { view: 'faq', params: {} };
  if (cleanPath === 'help-safety' || cleanPath === 'safety' || cleanPath === 'help') return { view: 'help-safety', params: {} };
  if (cleanPath === 'terms' || cleanPath === 'guidelines' || cleanPath === 'privacy') return { view: 'terms', params: {} };
  if (cleanPath === 'maintenance') return { view: 'maintenance', params: {} };
  if (cleanPath.startsWith('item/')) {
    const id = cleanPath.split('/')[1];
    return { view: 'item-detail', params: { id } };
  }
  // Any unrecognized route renders 404
  return { view: 'not-found', params: {} };
};

export const MainApp: React.FC = () => {
  const { currentUser, isAdmin, isSuperAdmin } = useAuth();
  const initial = pathToView(window.location.pathname);
  const defaultAdminView = isSuperAdmin ? 'superadmin' : 'admin';
  const [currentView, setCurrentView] = useState<string>(isAdmin ? defaultAdminView : initial.view);
  const [viewParams, setViewParams] = useState<any>(initial.params);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // If user is superadmin or admin, strictly lock and enforce the corresponding dashboard view
  useEffect(() => {
    if (isSuperAdmin && currentView !== 'superadmin') {
      setCurrentView('superadmin');
      try {
        window.history.replaceState(null, '', '/superadmin');
      } catch (e) {}
    } else if (isAdmin && !isSuperAdmin && currentView !== 'admin') {
      setCurrentView('admin');
      try {
        window.history.replaceState(null, '', '/admin');
      } catch (e) {}
    }
  }, [isAdmin, isSuperAdmin, currentView]);

  useEffect(() => {
    const handlePopState = () => {
      if (isSuperAdmin) {
        setCurrentView('superadmin');
        return;
      }
      if (isAdmin) {
        setCurrentView('admin');
        return;
      }
      const parsed = pathToView(window.location.pathname);
      setCurrentView(parsed.view);
      setViewParams(parsed.params);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdmin, isSuperAdmin]);

  const handleNavigate = (view: string, params: any = {}) => {
    // If logged in as super admin or admin, strictly stay on their respective console
    if (isSuperAdmin) {
      setCurrentView('superadmin');
      setViewParams({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        window.history.pushState(null, '', '/superadmin');
      } catch (e) {}
      return;
    }

    if (isAdmin) {
      setCurrentView('admin');
      setViewParams({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        window.history.pushState(null, '', '/admin');
      } catch (e) {}
      return;
    }

    setCurrentView(view);
    setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update browser address bar path
    let newPath = `/${view}`;
    if (view === 'home') newPath = '/';
    if (view === 'item-detail' && params.id) newPath = `/item/${params.id}`;
    if (view === 'not-found') newPath = '/404';

    try {
      window.history.pushState(null, '', newPath);
    } catch (e) {
      // Ignore if iframe/file protocol
    }
  };

  const renderCurrentPage = () => {
    if (isSuperAdmin) {
      return <SuperAdminDashboard onNavigate={handleNavigate} />;
    }

    if (isAdmin) {
      return <AdminDashboard onNavigate={handleNavigate} />;
    }

    switch (currentView) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'marketplace':
        return <MarketplacePage onNavigate={handleNavigate} />;
      case 'item-detail':
        return (
          <ItemDetailPage
            listingId={viewParams.id}
            onNavigate={handleNavigate}
            onOpenChat={() => setIsChatOpen(true)}
          />
        );
      case 'create-listing':
        return <CreateListingPage onNavigate={handleNavigate} />;
      case 'wanted':
        return <WantedBoardPage onNavigate={handleNavigate} onOpenChat={() => setIsChatOpen(true)} />;
      case 'swaps':
        return <SwapsPage onNavigate={handleNavigate} onOpenChat={() => setIsChatOpen(true)} />;
      case 'meetups':
        return <MeetupsPage onNavigate={handleNavigate} />;
      case 'campus-map':
        return <CampusMapPage onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfilePage userId={viewParams.userId} onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'price-advisor':
        return <PricingAdvisorPage onNavigate={handleNavigate} />;
      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;
      case 'faq':
        return <FAQPage onNavigate={handleNavigate} />;
      case 'help-safety':
        return <HelpSafetyPage onNavigate={handleNavigate} />;
      case 'terms':
        return <TermsPrivacyPage onNavigate={handleNavigate} />;
      case 'maintenance':
        return <MaintenancePage onNavigate={handleNavigate} />;
      case 'not-found':
      default:
        return <NotFoundPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F8FAFC', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* 1. Official Campus Navbar */}
      <Navbar
        currentView={isAdmin ? 'admin' : currentView}
        onNavigate={handleNavigate}
        onOpenChat={() => !isAdmin && setIsChatOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* 2. Main Page Content View */}
      <main style={{ flex: 1, width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>{renderCurrentPage()}</main>

      {/* 3. Campus Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* 4. Live Campus Messaging Drawer (Disabled for Admin) */}
      {!isAdmin && (
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onNavigateToItem={(id) => handleNavigate('item-detail', { id })}
        />
      )}

      {/* 5. Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* 6. Mobile Bottom Navigation Bar (Disabled for Admin) */}
      {!isAdmin && (
        <MobileBottomNav
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenChat={() => setIsChatOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MarketProvider>
          <ChatProvider>
            <WantedProvider>
              <AdminProvider>
                <MainApp />
              </AdminProvider>
            </WantedProvider>
          </ChatProvider>
        </MarketProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
