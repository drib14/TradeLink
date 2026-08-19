import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook that detects clicks outside a referenced element and calls the provided handler.
 * Used globally across all dropdowns, modals, drawers, and popup elements.
 *
 * @param handler - Callback to invoke when a click outside is detected
 * @param enabled - Optional flag to enable/disable the listener (default: true)
 * @returns A ref to attach to the element you want to monitor
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  enabled: boolean = true
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const handlerRef = useRef(handler);

  // Keep handler ref current without re-subscribing the effect
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      handlerRef.current();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handlerRef.current();
      }
    };

    // Use mousedown (not click) so it fires before any blur events
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    document.addEventListener('keydown', handleEscape, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [enabled]);

  return ref;
}
