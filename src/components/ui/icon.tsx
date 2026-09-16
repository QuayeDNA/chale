import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useUnistyles } from 'react-native-unistyles';

type ChaleIconName =
  | 'heart'
  | 'message'
  | 'mic'
  | 'sparkles'
  | 'settings'
  | 'clock'
  | 'play'
  | 'stop'
  | 'check';

const ICON_MAP: Record<ChaleIconName, SymbolViewProps['name']> = {
  heart: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  message: { ios: 'message.fill', android: 'chat_bubble', web: 'chat_bubble' },
  mic: { ios: 'mic.fill', android: 'mic', web: 'mic' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  clock: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
  play: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  stop: { ios: 'stop.fill', android: 'stop', web: 'stop' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
};

type IconProps = {
  name: ChaleIconName;
  size?: number;
  color?: string;
  weight?: SymbolViewProps['weight'];
};

/**
 * Expo-owned icon wrapper — uses SF Symbols on iOS and Material Symbols
 * on Android/web via expo-symbols. Keeps the icon set consistent and
 * avoids bundling 9k+ lucide icons on native.
 */
export function Icon({ name, size = 20, color, weight = 'regular' }: IconProps) {
  const { theme } = useUnistyles();
  const tintColor = color ?? theme.colors.ink;
  return <SymbolView name={ICON_MAP[name]} size={size} tintColor={tintColor} weight={weight} fallback={null} />;
}

export type { ChaleIconName };
