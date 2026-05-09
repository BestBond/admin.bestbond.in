import { useEffect, useRef } from 'react';

/**
 * Refetch when the browser tab becomes visible again (multi-device / multi-tab sync).
 */
export function useRefetchOnDocumentVisible(effect: () => void): void {
  const ref = useRef(effect);
  ref.current = effect;

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') ref.current();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
}
