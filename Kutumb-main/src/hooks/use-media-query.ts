
'use client';
import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      const updateMatch = () => {
        setMatches(media.matches);
      };
      
      // Set initial state
      updateMatch();

      // Deprecated `addListener` for broader browser support, `addEventListener` for modern ones.
      if (media.addEventListener) {
        media.addEventListener('change', updateMatch);
      } else {
        media.addListener(updateMatch); // For older browsers
      }

      return () => {
        if (media.removeEventListener) {
          media.removeEventListener('change', updateMatch);
        } else {
          media.removeListener(updateMatch); // For older browsers
        }
      };
    }
  }, [query]);

  return matches;
};
