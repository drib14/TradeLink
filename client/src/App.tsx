import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/common/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarketProvider } from './context/MarketContext';
import { ChatProvider } from './context/ChatContext';
import { WantedProvider } from './context/WantedContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ChatDrawer } from './components/chat/ChatDrawer';
import { AuthModal } from './components/auth/AuthModal';
import { UnverifiedAccountModal } from './components/auth/UnverifiedAccountModal';
import { StudentVerificationModal } from './components/verification/StudentVerificationModal';

// Pages
import { HomePage } from './pages/HomePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { SwapsPage } from './pages/SwapsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ProfilePage } from './pages/ProfilePage';
import { WantedBoardPage } from './pages/WantedBoardPage';
import { CampusMapPage } from './pages/CampusMapPage';
import { HelpSafetyPage } from './pages/HelpSafetyPage';
import { TermsPrivacyPage } from './pages/TermsPrivacyPage';
import { AboutPage } from './pages/AboutPage';
import { FAQPage } from './pages/FAQPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SettingsPage } from './pages/SettingsPage';
import { encodeHashedId, decodeHashedId } from './utils/security';

const pathToView = (path: string, search: string = window.location.search): { view: string; params: any } => {
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const searchParams = new URLSearchParams(search);

  if (cleanPath.startsWith('profile/') || cleanPath === 'profile') {
    const parts = cleanPath.split('/');
    const rawUserId = parts[1] || searchParams.get('userId') || searchParams.get('id') || undefined;
    const userId = rawUserId ? decodeHashedId(rawUserId) : undefined;
    return { view: 'profile', params: { userId } };
  }
  if (cleanPath.startsWith('item/') || cleanPath === 'item') {
    const rawId = cleanPath.split('/')[1] || searchParams.get('id') || undefined;
    const id = rawId ? decodeHashedId(rawId) : undefined;
    return { view: 'item-detail', params: { id } };
  }

  const cleanLower = cleanPath.toLowerCase();
  if (!cleanLower || cleanLower === 'home') return { view: 'home', params: {} };
  if (cleanLower === 'marketplace' || cleanLower === 'market' || cleanLower === 'catalog') return { view: 'marketplace', params: {} };
  if (cleanLower === 'create-listing' || cleanLower === 'post' || cleanLower === 'sell') return { view: 'create-listing', params: {} };
  if (cleanLower === 'wanted' || cleanLower === 'requests' || cleanLower === 'pasabuy') return { view: 'wanted', params: {} };
  if (cleanLower === 'swaps' || cleanLower === 'barter') return { view: 'swaps', params: {} };
  if (cleanLower === 'meetups' || cleanLower === 'handshake' || cleanLower === 'transactions' || cleanLower === 'history') return { view: 'transactions', params: {} };
  if (cleanLower === 'campus-map' || cleanLower === 'landmarks' || cleanLower === 'map') return { view: 'campus-map', params: {} };
  if (cleanLower === 'about') return { view: 'about', params: {} };
  if (cleanLower === 'faq') return { view: 'faq', params: {} };
  if (cleanLower === 'help-safety' || cleanLower === 'safety' || cleanLower === 'help') return { view: 'help-safety', params: {} };
  if (cleanLower === 'terms' || cleanLower === 'guidelines' || cleanLower === 'privacy') return { view: 'terms', params: {} };
  if (cleanLower === 'maintenance') return { view: 'maintenance', params: {} };
  if (cleanLower === 'favorites' || cleanLower === 'saved') return { view: 'marketplace', params: {} };
  if (cleanLower === 'settings' || cleanLower === 'preferences') return { view: 'settings', params: {} };
  return { view: 'not-found', params: {} };
};

export const MainApp: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParams, setViewParams] = useState<any>({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUnverifiedModalOpen, setIsUnverifiedModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      const { view, params } = pathToView(window.location.pathname, window.location.search);
      setCurrentView(view);
      setViewParams(params);
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const PUBLIC_VIEWS = [
    'home',
    'marketplace',
    'item-detail',
    'campus-map',
    'wanted',
    'profile',
    'create-listing',
    'about',
    'faq',
    'help-safety',
    'terms',
    'maintenance',
    'not-found'
  ];



  const handleNavigate = (view: string, params: any = {}) => {
    setCurrentView(view);
    setViewParams(params);

    let path = `/${view}`;
    if (view === 'home') path = '/';
    if (view === 'item-detail' && params.id) path = `/item/${encodeHashedId(params.id, 'listing')}`;
    if (view === 'profile' && params.userId) path = `/profile/${encodeHashedId(params.userId, 'user')}`;

    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-base, #F8FAFC)', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* 1. Official Campus Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenVerification={() => setIsVerificationModalOpen(true)}
      />

      <main style={{ flex: 1, width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
        {(() => {
          switch (currentView) {
            case 'home':
              return <HomePage onNavigate={handleNavigate} onOpenChat={() => setIsChatOpen(true)} />;
            case 'marketplace':
              return <MarketplacePage onNavigate={handleNavigate} />;
            case 'item-detail':
              return (
                <ItemDetailPage
                  listingId={viewParams.id}
                  onNavigate={handleNavigate}
                  onOpenChat={() => setIsChatOpen(true)}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onOpenVerification={() => setIsVerificationModalOpen(true)}
                />
              );
            case 'create-listing':
              return (
                <CreateListingPage
                  onNavigate={handleNavigate}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />
              );
            case 'wanted':
              return (
                <WantedBoardPage
                  onNavigate={handleNavigate}
                  onOpenChat={() => setIsChatOpen(true)}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />
              );
            case 'swaps':
              return (
                <SwapsPage
                  onNavigate={handleNavigate}
                  onOpenChat={() => setIsChatOpen(true)}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onOpenVerification={() => setIsVerificationModalOpen(true)}
                />
              );
            case 'meetups':
            case 'transactions':
              return (
                <TransactionsPage
                  onNavigate={handleNavigate}
                  onOpenChat={() => setIsChatOpen(true)}
                />
              );
            case 'campus-map':
              return <CampusMapPage onNavigate={handleNavigate} />;
            case 'profile':
              return (
                <ProfilePage
                  userId={viewParams.userId}
                  onNavigate={handleNavigate}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onOpenVerification={() => setIsVerificationModalOpen(true)}
                />
              );
            case 'about':
              return <AboutPage onNavigate={handleNavigate} />;
            case 'faq':
              return <FAQPage onNavigate={handleNavigate} />;
            case 'help-safety':
              return <HelpSafetyPage onNavigate={handleNavigate} />;
            case 'terms':
              return <TermsPrivacyPage onNavigate={handleNavigate} />;
            case 'favorites':
              return <MarketplacePage onNavigate={handleNavigate} />;
            case 'settings':
              return (
                <SettingsPage
                  onNavigate={handleNavigate}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />
              );
            case 'maintenance':
              return <MaintenancePage onNavigate={handleNavigate} />;
            case 'not-found':
            default:
              return <NotFoundPage onNavigate={handleNavigate} />;
          }
        })()}
      </main>

      {/* 3. Campus Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* 4. Live Campus Messaging Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onNavigateToItem={(id) => handleNavigate('item-detail', { id })}
      />

      {/* 5. Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onRegisterSuccess={() => {
          setIsAuthModalOpen(false);
          setIsUnverifiedModalOpen(true);
        }}
      />

      {/* 6. Unverified Student Account Explanation Modal */}
      <UnverifiedAccountModal
        isOpen={isUnverifiedModalOpen}
        onClose={() => setIsUnverifiedModalOpen(false)}
        onStartVerification={() => {
          setIsUnverifiedModalOpen(false);
          setIsVerificationModalOpen(true);
        }}
      />

      {/* 7. Two-Step Student Verification Modal (ID + Live Selfie) */}
      <StudentVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />

      {/* 8. Mobile Bottom Navigation Bar */}
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
              <MainApp />
            </WantedProvider>
          </ChatProvider>
        </MarketProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
