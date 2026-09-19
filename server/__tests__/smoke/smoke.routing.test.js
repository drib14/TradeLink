const { decodeId, encodeId } = require('../../src/utils/idHasher');

/**
 * Pure client routing function extracted from client/src/App.tsx (lines 36-69)
 * Used to verify complete SPA route resolution and URL mapping.
 */
const pathToView = (path, search = '') => {
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const searchParams = new URLSearchParams(search);

  if (cleanPath.startsWith('profile/') || cleanPath === 'profile') {
    const parts = cleanPath.split('/');
    const rawUserId = parts[1] || searchParams.get('userId') || searchParams.get('id') || undefined;
    const userId = rawUserId ? decodeId(rawUserId) : undefined;
    return { view: 'profile', params: { userId } };
  }
  if (cleanPath.startsWith('item/') || cleanPath === 'item') {
    const rawId = cleanPath.split('/')[1] || searchParams.get('id') || undefined;
    const id = rawId ? decodeId(rawId) : undefined;
    return { view: 'item-detail', params: { id } };
  }

  const cleanLower = cleanPath.toLowerCase();
  if (!cleanLower || cleanLower === 'home') return { view: 'home', params: {} };
  if (cleanLower === 'marketplace' || cleanLower === 'market' || cleanLower === 'catalog') return { view: 'marketplace', params: {} };
  if (cleanLower === 'create-listing' || cleanLower === 'post' || cleanLower === 'sell') return { view: 'create-listing', params: {} };
  if (cleanLower === 'wanted' || cleanLower === 'requests' || cleanLower === 'pasabuy') return { view: 'wanted', params: {} };
  if (cleanLower === 'swaps' || cleanLower === 'barter') return { view: 'swaps', params: {} };
  if (cleanLower === 'meetups' || cleanLower === 'transactions' || cleanLower === 'history') return { view: 'transactions', params: {} };
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

describe('Tier 4: Client SPA Routing Smoke Tests (pathToView)', () => {
  describe('Primary Navigation Routes', () => {
    it('should route root / to home view', () => {
      expect(pathToView('/')).toEqual({ view: 'home', params: {} });
      expect(pathToView('')).toEqual({ view: 'home', params: {} });
      expect(pathToView('/home')).toEqual({ view: 'home', params: {} });
    });

    it('should route /marketplace to marketplace view', () => {
      expect(pathToView('/marketplace')).toEqual({ view: 'marketplace', params: {} });
    });

    it('should route /create-listing to create-listing view', () => {
      expect(pathToView('/create-listing')).toEqual({ view: 'create-listing', params: {} });
    });

    it('should route /wanted to wanted view', () => {
      expect(pathToView('/wanted')).toEqual({ view: 'wanted', params: {} });
    });

    it('should route /swaps to swaps view', () => {
      expect(pathToView('/swaps')).toEqual({ view: 'swaps', params: {} });
    });

    it('should route /meetups to transactions view', () => {
      expect(pathToView('/meetups')).toEqual({ view: 'transactions', params: {} });
    });

    it('should route /campus-map to campus-map view', () => {
      expect(pathToView('/campus-map')).toEqual({ view: 'campus-map', params: {} });
    });

    it('should route /favorites to marketplace view', () => {
      expect(pathToView('/favorites')).toEqual({ view: 'marketplace', params: {} });
    });

    it('should route /transactions to transactions view', () => {
      expect(pathToView('/transactions')).toEqual({ view: 'transactions', params: {} });
    });

    it('should route /settings to settings view', () => {
      expect(pathToView('/settings')).toEqual({ view: 'settings', params: {} });
    });
  });

  describe('Informational and Policy Pages', () => {
    it('should route /about to about view', () => {
      expect(pathToView('/about')).toEqual({ view: 'about', params: {} });
    });

    it('should route /faq to faq view', () => {
      expect(pathToView('/faq')).toEqual({ view: 'faq', params: {} });
    });

    it('should route /help-safety to help-safety view', () => {
      expect(pathToView('/help-safety')).toEqual({ view: 'help-safety', params: {} });
    });

    it('should route /terms to terms view', () => {
      expect(pathToView('/terms')).toEqual({ view: 'terms', params: {} });
    });

    it('should route /maintenance to maintenance view', () => {
      expect(pathToView('/maintenance')).toEqual({ view: 'maintenance', params: {} });
    });
  });

  describe('Dynamic Entity Parameter Routes with ID Decoding', () => {
    it('should route /item/:id and decode the listing identifier', () => {
      const encodedListingId = encodeId('listing_456', 'listing');
      const result = pathToView(`/item/${encodedListingId}`);
      expect(result.view).toBe('item-detail');
      expect(result.params.id).toBe('listing_456');
    });

    it('should route /item with search query param ?id=...', () => {
      const encodedListingId = encodeId('listing_789', 'listing');
      const result = pathToView('/item/', `?id=${encodedListingId}`);
      expect(result.view).toBe('item-detail');
      expect(result.params.id).toBe('listing_789');
    });

    it('should route /profile/:userId and decode the user identifier', () => {
      const encodedUserId = encodeId('usr_test_999', 'user');
      const result = pathToView(`/profile/${encodedUserId}`);
      expect(result.view).toBe('profile');
      expect(result.params.userId).toBe('usr_test_999');
    });

    it('should route /profile with query param ?userId=...', () => {
      const encodedUserId = encodeId('usr_test_888', 'user');
      const result = pathToView('/profile', `?userId=${encodedUserId}`);
      expect(result.view).toBe('profile');
      expect(result.params.userId).toBe('usr_test_888');
    });
  });

  describe('User-Friendly Route Aliases & Fallbacks', () => {
    it('should resolve alternative route aliases correctly', () => {
      expect(pathToView('/market').view).toBe('marketplace');
      expect(pathToView('/catalog').view).toBe('marketplace');
      expect(pathToView('/post').view).toBe('create-listing');
      expect(pathToView('/sell').view).toBe('create-listing');
      expect(pathToView('/requests').view).toBe('wanted');
      expect(pathToView('/pasabuy').view).toBe('wanted');
      expect(pathToView('/barter').view).toBe('swaps');
      expect(pathToView('/meetups').view).toBe('transactions');
      expect(pathToView('/saved').view).toBe('marketplace');
      expect(pathToView('/history').view).toBe('transactions');
      expect(pathToView('/map').view).toBe('campus-map');
    });

    it('should route unknown paths to not-found view', () => {
      expect(pathToView('/unrecognized-page-404')).toEqual({ view: 'not-found', params: {} });
      expect(pathToView('/api/internal/secret')).toEqual({ view: 'not-found', params: {} });
    });
  });
});
