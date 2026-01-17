import { useMemo } from 'react';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface TimeTheme {
  timeOfDay: TimeOfDay;
  greeting: string;
  gradient: string;
  accentColor: string;
  accentColorHover: string;
  accentBg: string;
  accentText: string;
  buttonBg: string;
  buttonText: string;
}

export function useTimeTheme(): TimeTheme {
  return useMemo(() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 10) {
      // Morning - warm orange/rose sunrise
      return {
        timeOfDay: 'morning',
        greeting: 'Good morning',
        gradient: 'from-orange-500/30 via-rose-400/20 to-background',
        accentColor: 'text-orange-400',
        accentColorHover: 'hover:text-orange-300',
        accentBg: 'bg-orange-500',
        accentText: 'text-orange-500',
        buttonBg: 'bg-orange-500 hover:bg-orange-400',
        buttonText: 'text-black',
      };
    }
    
    if (hour >= 10 && hour < 15) {
      // Afternoon - bright blue/cyan
      return {
        timeOfDay: 'afternoon',
        greeting: 'Good afternoon',
        gradient: 'from-sky-500/30 via-cyan-400/20 to-background',
        accentColor: 'text-cyan-400',
        accentColorHover: 'hover:text-cyan-300',
        accentBg: 'bg-cyan-500',
        accentText: 'text-cyan-500',
        buttonBg: 'bg-cyan-500 hover:bg-cyan-400',
        buttonText: 'text-black',
      };
    }
    
    if (hour >= 15 && hour < 18) {
      // Evening - golden/amber sunset
      return {
        timeOfDay: 'evening',
        greeting: 'Good evening',
        gradient: 'from-amber-500/30 via-orange-400/20 to-background',
        accentColor: 'text-amber-400',
        accentColorHover: 'hover:text-amber-300',
        accentBg: 'bg-amber-500',
        accentText: 'text-amber-500',
        buttonBg: 'bg-amber-500 hover:bg-amber-400',
        buttonText: 'text-black',
      };
    }
    
    // Night - deep purple/indigo
    return {
      timeOfDay: 'night',
      greeting: 'Good night',
      gradient: 'from-indigo-600/30 via-purple-500/20 to-background',
      accentColor: 'text-purple-400',
      accentColorHover: 'hover:text-purple-300',
      accentBg: 'bg-purple-500',
      accentText: 'text-purple-500',
      buttonBg: 'bg-purple-500 hover:bg-purple-400',
      buttonText: 'text-white',
    };
  }, []);
}
