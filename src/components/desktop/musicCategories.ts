import { Sun, Zap, Car, Leaf, Brain, Dumbbell } from 'lucide-react';

export const musicCategories = [
  { title: 'Daylist', description: 'Your personalized mix throughout the day', Icon: Sun, hue: 'amber' },
  { title: 'Hype Getting Ready Mix', description: 'Energy for your morning routine', Icon: Zap, hue: 'rose' },
  { title: 'Driving Mix', description: 'Music for the open road', Icon: Car, hue: 'steel' },
  { title: 'Chill Mix', description: 'Relax and unwind', Icon: Leaf, hue: 'sage' },
  { title: 'Focus Mix', description: 'A little room to concentrate', Icon: Brain, hue: 'violet' },
  { title: 'Workout Mix', description: 'Find your rhythm and keep moving', Icon: Dumbbell, hue: 'terracotta' },
] as const;

export type MusicCategory = typeof musicCategories[number];