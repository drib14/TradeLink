import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/common/Toast';
import { AuthProvider } from './context/AuthContext';
import { MarketProvider } from './context/MarketContext';
import { ChatProvider } from './context/ChatContext';
import { AdminProvider } from './context/AdminContext';
import { WantedProvider } from './context/WantedContext';
import { DemoBanner } from './components/layout/DemoBanner';
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
  const initial = pathToView(window.location.pathname);
  const [currentView, setCurrentView] = useState<string>(initial.view);
  const [viewParams, setViewParams] = useState<any>(initial.params);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      const parsed = pathToView(window.location.pathname);
      setCurrentView(parsed.view);
      setViewParams(parsed.params);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (view: string, params: any = {}) => {
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
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* 3. Main Page Content View */}
      <main style={{ flex: 1, width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>{renderCurrentPage()}</main>

      {/* 4. Campus Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* 5. Live Campus Messaging Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onNavigateToItem={(id) => handleNavigate('item-detail', { id })}
      />

      {/* 6. Authentication Modal (Login / Register / Forgot Password / Admin Login) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* 7. Mobile Bottom Navigation Bar (Smartphones & Tablets) */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />
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
