'use client';

import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
  // Common breakpoint for tablets/phones
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Check on mount
    checkDevice();

    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, [breakpoint]);

  return isMobile;
}
