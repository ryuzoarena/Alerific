import { useEffect, useState } from 'react';

export function useShellBreakpoint() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return { isPhone: width < 768, isDesktop: width >= 1100 };
}