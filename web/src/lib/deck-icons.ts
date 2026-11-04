import {
  Flame,
  Heart,
  Home,
  MessageCircle,
  Moon,
  Plane,
  Sparkle,
  Sun,
  Users,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  flame: Flame,
  heart: Heart,
  house: Home,
  message: MessageCircle,
  moon: Moon,
  people: Users,
  plane: Plane,
  sparkles: Sparkle,
  sun: Sun,
};

export function deckIcon(name: string): LucideIcon {
  return ICONS[name] ?? Sparkle;
}
