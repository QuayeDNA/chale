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
  | 'check'
  | 'home'
  | 'people'
  | 'user'
  | 'bell'
  | 'palette'
  | 'globe'
  | 'help'
  | 'info'
  | 'logout'
  | 'chevron'
  | 'stats'
  | 'invite';

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
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  people: { ios: 'person.2.fill', android: 'group', web: 'group' },
  user: { ios: 'person.fill', android: 'person', web: 'person' },
  bell: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  palette: { ios: 'circle.lefthalf.filled', android: 'palette', web: 'palette' },
  globe: { ios: 'globe', android: 'language', web: 'language' },
  help: { ios: 'questionmark.circle.fill', android: 'help', web: 'help' },
  info: { ios: 'info.circle.fill', android: 'info', web: 'info' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  chevron: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  stats: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' },
  invite: { ios: 'envelope.fill', android: 'mail', web: 'mail' },
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
