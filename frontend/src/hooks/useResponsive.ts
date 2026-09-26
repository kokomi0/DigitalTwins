import { useState, useEffect } from 'react';

export interface ResponsiveState {
  isMobile: boolean;          // < 1024px
  isTablet: boolean;          // 768px - 1023px
  isDesktop: boolean;         // >= 1024px
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
  recommendedLOD: 'HIGH' | 'MEDIUM' | 'LOW';
  screenWidth: number;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isMobile = width < 1024;
    const isTablet = width >= 768 && width < 1024;
    const isTouch = typeof window !== 'undefined' ? ('ontouchstart' in window || navigator.maxTouchPoints > 0) : false;

    return {
      isMobile,
      isTablet,
      isDesktop: !isMobile,
      isTouch,
      orientation: width >= height ? 'landscape' : 'portrait',
      recommendedLOD: isMobile ? 'LOW' : 'HIGH',
      screenWidth: width
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 1024;
      const isTablet = width >= 768 && width < 1024;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setState({
        isMobile,
        isTablet,
        isDesktop: !isMobile,
        isTouch,
        orientation: width >= height ? 'landscape' : 'portrait',
        recommendedLOD: isMobile ? 'LOW' : 'HIGH',
        screenWidth: width
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return state;
}
