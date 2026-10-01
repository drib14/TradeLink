import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/common/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarketProvider } from './context/MarketContext';
import { ChatProvider } from './context/ChatContext';
import { FlashMarketProvider } from './context/FlashMarketContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { AuthModal } from './components/auth/AuthModal';
import { UnverifiedAccountModal } from './components/auth/UnverifiedAccountModal';
import { StudentVerificationModal } from './components/verification/StudentVerificationModal';
import { CookieConsent } from './components/common/CookieConsent';
import { MessagesPage } from './pages/MessagesPage';

// Pages
import { HomePage } from './pages/HomePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { SwapsPage } from './pages/SwapsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ProfilePage } from './pages/ProfilePage';
import { FlashMarketPage } from './pages/FlashMarketPage';
import { FlashRequestDetailPage } from './pages/FlashRequestDetailPage';
import { HelpSafetyPage } from './pages/HelpSafetyPage';
import { TermsPrivacyPage } from './pages/TermsPrivacyPage';
import { AboutPage } from './pages/AboutPage';
import { FAQPage } from './pages/FAQPage';
import { DevelopersPage } from './pages/DevelopersPage';
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
    if (parts[1] && !userId) {
      return { view: 'not-found', params: {} };
    }
    return { view: 'profile', params: { userId } };
  }
  if (cleanPath.startsWith('item/') || cleanPath === 'item') {
    const rawId = cleanPath.split('/')[1] || searchParams.get('id') || undefined;
    const id = rawId ? decodeHashedId(rawId) : undefined;
    if ((cleanPath.startsWith('item/') || cleanPath === 'item') && !id) {
      return { view: 'not-found', params: {} };
    }
    return { view: 'item-detail', params: { id } };
  }
  if (cleanPath.startsWith('flash/') || cleanPath.startsWith('flash-detail/') || cleanPath.startsWith('requests/')) {
    const rawId = cleanPath.split('/')[1] || searchParams.get('id') || undefined;
    const id = rawId ? decodeHashedId(rawId) : undefined;
    if (!id) {
      return { view: 'not-found', params: {} };
    }
    return { view: 'flash-detail', params: { id } };
  }

  const cleanLower = cleanPath.toLowerCase();
  if (!cleanLower || cleanLower === 'home' || cleanLower === 'index' || cleanLower === 'index.html') return { view: 'home', params: {} };
  if (cleanLower === 'marketplace' || cleanLower === 'catalog' || cleanLower === 'items' || cleanLower === 'shop' || cleanLower === 'browse') return { view: 'marketplace', params: {} };
  if (cleanLower === 'create-listing' || cleanLower === 'post' || cleanLower === 'sell' || cleanLower === 'swap-item' || cleanLower === 'post-swap') {
    const mode = searchParams.get('mode') || (cleanLower === 'swap-item' || cleanLower === 'post-swap' ? 'swap' : cleanLower === 'sell' ? 'sell' : undefined);
    return { view: 'create-listing', params: { mode } };
  }
  if (cleanLower === 'flash-market' || cleanLower === 'flash' || cleanLower === 'requests' || cleanLower === 'pasabuy' || cleanLower === 'urgent') return { view: 'flash-market', params: {} };
  if (cleanLower === 'swaps' || cleanLower === 'barter') return { view: 'swaps', params: {} };
  if (cleanLower === 'meetups' || cleanLower === 'transactions' || cleanLower === 'history') return { view: 'transactions', params: {} };
  if (cleanLower === 'about') return { view: 'about', params: {} };
  if (cleanLower === 'developers' || cleanLower === 'team' || cleanLower === 'devs' || cleanLower === 'resources') return { view: 'developers', params: {} };
  if (cleanLower === 'faq') return { view: 'faq', params: {} };
  if (cleanLower === 'help-safety' || cleanLower === 'safety' || cleanLower === 'help') return { view: 'help-safety', params: {} };
  if (cleanLower === 'terms' || cleanLower === 'guidelines') return { view: 'terms', params: { tab: 'honor-code' } };
  if (cleanLower === 'privacy') return { view: 'terms', params: { tab: 'privacy' } };
  if (cleanLower === 'maintenance') return { view: 'maintenance', params: {} };
  if (cleanLower === 'messages' || cleanLower === 'chat' || cleanLower.startsWith('messages/') || cleanLower.startsWith('chat/')) {
    const parts = cleanPath.split('/');
    const rawId = parts[1] || searchParams.get('id') || searchParams.get('conversationId') || undefined;
    const conversationId = rawId ? decodeHashedId(rawId) : undefined;
    return { view: 'messages', params: { conversationId } };
  }
  if (cleanLower === 'favorites' || cleanLower === 'saved') return { view: 'marketplace', params: {} };
  if (cleanLower === 'settings' || cleanLower === 'preferences') return { view: 'settings', params: {} };
  if (cleanLower === 'not-found' || cleanLower === '404') return { view: 'not-found', params: {} };
  return { view: 'not-found', params: {} };
};

export const MainApp: React.FC = () => {
  const { currentUser: _currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<string>(() => {
    const { view } = pathToView(window.location.pathname, window.location.search);
    if (view === 'not-found' && window.location.pathname !== '/404') {
      window.history.replaceState({}, '', '/404');
    }
    return view;
  });
  const [viewParams, setViewParams] = useState<any>(() => {
    const { params } = pathToView(window.location.pathname, window.location.search);
    return params;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUnverifiedModalOpen, setIsUnverifiedModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      const { view, params } = pathToView(window.location.pathname, window.location.search);
      if (view === 'not-found' && window.location.pathname !== '/404') {
        window.history.replaceState({}, '', '/404');
      }
      setCurrentView(view);
      setViewParams(params);
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (view: string, params: any = {}) => {
    const validViews = [
      'home', 'marketplace', 'item-detail', 'create-listing', 'flash-market',
      'flash-detail', 'swaps', 'meetups', 'transactions', 'profile', 'about',
      'developers', 'faq', 'help-safety', 'terms', 'privacy', 'favorites',
      'settings', 'maintenance', 'messages', 'not-found'
    ];
    let targetView = validViews.includes(view) ? view : 'not-found';

    if (targetView === 'item-detail' && !params?.id) {
      targetView = 'not-found';
    }
    if (targetView === 'flash-detail' && !params?.id) {
      targetView = 'not-found';
    }

    setCurrentView(targetView);
    setViewParams(params);

    let path = `/${targetView}`;
    if (targetView === 'home') path = '/';
    if (targetView === 'item-detail' && params?.id) path = `/item/${encodeHashedId(params.id, 'listing')}`;
    if (targetView === 'flash-detail' && params?.id) path = `/flash/${encodeHashedId(params.id, 'flash')}`;
    if (targetView === 'create-listing' && params?.mode) path = `/create-listing?mode=${params.mode}`;
    if (targetView === 'profile') {
      path = params?.userId ? `/profile/${encodeHashedId(params.userId, 'user')}` : '/profile';
    }
    if (targetView === 'messages') {
      path = params?.conversationId ? `/messages/${encodeHashedId(params.conversationId, 'conversation')}` : '/messages';
    }
    if (targetView === 'not-found') path = '/404';

    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-base, #F8FAFC)', width: '100%', maxWidth: '100vw', overflowX: 'clip' }}>
      {/* 1. Official Campus Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenChat={() => handleNavigate('messages')}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenVerification={() => setIsVerificationModalOpen(true)}
      />

      <main style={{ flex: 1, width: '100%', maxWidth: '100vw', overflowX: 'clip' }}>
        {(() => {
          switch (currentView) {
            case 'home':
              return <HomePage onNavigate={handleNavigate} onOpenChat={() => handleNavigate('messages')} />;
            case 'marketplace':
              return (
                <MarketplacePage
                  onNavigate={handleNavigate}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onOpenVerification={() => setIsVerificationModalOpen(true)}
                  onOpenChat={() => handleNavigate('messages')}
                />
              );
            case 'item-detail':
              return (
                <ItemDetailPage
                  listingId={viewParams.id}
                  onNavigate={handleNavigate}
                  onOpenChat={() => handleNavigate('messages')}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onOpenVerification={() => setIsVerificationModalOpen(true)}
                />
              );
            case 'create-listing':
              return (
                <CreateListingPage
                  onNavigate={handleNavigate}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  initialMode={viewParams?.mode === 'swap' ? 'swap' : 'sell'}
                />
              );
            case 'flash-market':
              return (
                <FlashMarketPage
                  onNavigate={handleNavigate}
                  onOpenChat={() => handleNavigate('messages')}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />
              );
            case 'flash-detail':
              return (
                <FlashRequestDetailPage
                  requestId={viewParams?.id}
                  onNavigate={handleNavigate}
                  onOpenChat={() => handleNavigate('messages')}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />
              );
            case 'swaps':
              return (
                <SwapsPage
                  onNavigate={handleNavigate}
                  onOpenChat={() => handleNavigate('messages')}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onOpenVerification={() => setIsVerificationModalOpen(true)}
                />
              );
            case 'meetups':
            case 'transactions':
              return (
                <TransactionsPage
                  onNavigate={handleNavigate}
                  onOpenChat={() => handleNavigate('messages')}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />
              );
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
            case 'developers':
              return <DevelopersPage onNavigate={handleNavigate} />;
            case 'faq':
              return <FAQPage onNavigate={handleNavigate} />;
            case 'help-safety':
              return <HelpSafetyPage onNavigate={handleNavigate} />;
            case 'terms':
              return <TermsPrivacyPage onNavigate={handleNavigate} initialTab={viewParams?.tab} />;
            case 'favorites':
              return (
                <MarketplacePage
                  onNavigate={handleNavigate}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onOpenVerification={() => setIsVerificationModalOpen(true)}
                  onOpenChat={() => handleNavigate('messages')}
                />
              );
            case 'messages':
              return (
                <MessagesPage
                  conversationId={viewParams?.conversationId}
                  onNavigate={handleNavigate}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />
              );
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

      {/* 5. Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onRegisterSuccess={() => {
          setIsAuthModalOpen(false);
        }}
      />

      {/* 6. Unverified Student Account Explanation Modal (Preserved for future, disabled for MVP) */}
      <UnverifiedAccountModal
        isOpen={false}
        onClose={() => setIsUnverifiedModalOpen(false)}
        onStartVerification={() => {
          setIsUnverifiedModalOpen(false);
          setIsVerificationModalOpen(false);
        }}
      />

      {/* 7. Two-Step Student Verification Modal (Preserved for future, disabled for MVP) */}
      <StudentVerificationModal
        isOpen={false}
        onClose={() => setIsVerificationModalOpen(false)}
      />

      {/* 8. Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenChat={() => handleNavigate('messages')}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* 9. Cookie Consent Banner */}
      <CookieConsent onNavigate={handleNavigate} />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MarketProvider>
          <ChatProvider>
            <FlashMarketProvider>
              <MainApp />
            </FlashMarketProvider>
          </ChatProvider>
        </MarketProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
