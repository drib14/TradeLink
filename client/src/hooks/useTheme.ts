import { useEffect } from 'react';

/**
 * TradeLink is designed strictly with a modern University of Cebu light aesthetic.
 * This hook ensures any legacy dark-mode attributes are cleared.
 */
export function useTheme() {
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    try {
      window.localStorage.removeItem('tradelink_theme');
    } catch {
      // Ignore
    }
  }, []);

  return {
    theme: 'light' as const,
    isDark: false,
    toggleTheme: () => {},
    setTheme: () => {}
  };
}
