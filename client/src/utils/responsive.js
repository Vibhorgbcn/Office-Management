/**
 * Responsive utility functions for mobile/tablet optimization
 */

export const isMobile = () => {
  return window.innerWidth < 600;
};

export const isTablet = () => {
  return window.innerWidth >= 600 && window.innerWidth < 960;
};

export const isDesktop = () => {
  return window.innerWidth >= 960;
};

/**
 * Get responsive spacing
 */
export const getSpacing = (mobile, tablet = null, desktop = null) => {
  if (isMobile()) return mobile;
  if (isTablet() && tablet !== null) return tablet;
  if (isDesktop() && desktop !== null) return desktop;
  return tablet || mobile;
};

/**
 * Responsive table props for mobile
 */
export const getTableProps = () => {
  if (isMobile()) {
    return {
      size: 'small',
      stickyHeader: true,
    };
  }
  return {};
};

/**
 * Responsive card props
 */
export const getCardProps = () => {
  if (isMobile()) {
    return {
      elevation: 0,
      sx: {
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      },
    };
  }
  return {};
};

