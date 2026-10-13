import { useMemo } from 'react';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export function useTimeTheme() {
  return useMemo(() => {
    const hour = new Date().getHours();
    const timeOfDay: TimeOfDay = hour >= 5 && hour < 10 ? 'morning' : hour >= 10 && hour < 15 ? 'afternoon' : hour >= 15 && hour < 18 ? 'evening' : 'night';
    return { timeOfDay, greeting: `Good ${timeOfDay}`, gradient: 'from-shell-top to-background', accentColor: 'text-primary', accentColorHover: 'hover:text-primary/80', accentBg: 'bg-primary', accentText: 'text-primary', buttonBg: 'bg-primary hover:bg-primary/90', buttonText: 'text-primary-foreground' };
  }, []);
}
