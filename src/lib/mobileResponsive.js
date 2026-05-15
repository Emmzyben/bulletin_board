// Mobile-friendly breakpoints and utility styles
export const responsiveStyles = {
  // Padding that scales with viewport
  containerPadding: 'max(16px, 4vw)',
  cardPadding: 'max(16px, 3vw)',
  
  // Touch-friendly button size (minimum 44x44 for mobile)
  touchButton: {
    minHeight: '44px',
    minWidth: '44px',
    padding: 'max(8px, 2vh)',
  },

  // Responsive gap/spacing
  gapSmall: 'max(8px, 1.5vw)',
  gapMedium: 'max(12px, 2.5vw)',
  gapLarge: 'max(16px, 3vw)',

  // Responsive font sizes
  fontSmall: 'clamp(12px, 2.5vw, 14px)',
  fontBase: 'clamp(14px, 3vw, 16px)',
  fontLarge: 'clamp(16px, 4vw, 18px)',
  fontXL: 'clamp(20px, 5vw, 24px)',

  // Responsive grid for mobile-first
  responsiveGrid: (itemMinWidth = '280px') => ({
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${itemMinWidth}, 1fr))`,
    gap: 'max(12px, 2.5vw)',
  }),

  // Safe area insets for notched devices
  safeAreaInsetTop: 'max(0px, env(safe-area-inset-top))',
  safeAreaInsetBottom: 'max(0px, env(safe-area-inset-bottom))',
  safeAreaInsetLeft: 'max(0px, env(safe-area-inset-left))',
  safeAreaInsetRight: 'max(0px, env(safe-area-inset-right))',
};

// Media query helpers
export const mobileBreakpoints = {
  sm: '640px',  // Small phones
  md: '768px',  // Tablets
  lg: '1024px', // Desktops
  xl: '1280px', // Large desktops
};

// Mobile detection utility
export const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

// Viewport height utility for mobile (accounting for address bar)
export const getViewportHeight = () => {
  if (typeof window === 'undefined') return 0;
  return window.innerHeight - (window.innerHeight - window.document.documentElement.clientHeight);
};