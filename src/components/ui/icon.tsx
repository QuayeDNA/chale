import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  AudioLines,
  Bell,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock,
  Globe,
  Heart,
  Home,
  Hourglass,
  House,
  Flame,
  Info,
  Layers,
  LayoutGrid,
  List,
  LoaderCircle,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Mic,
  Pencil,
  Moon,
  Palette,
  Pause,
  Plane,
  Play,
  Send,
  Search,
  Settings,
  Sparkles,
  Square,
  Sun,
  Trash2,
  User,
  Users,
  Waves,
  X,
} from 'lucide-react-native';
import { useEffect, type ComponentType } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

type ChaleIconName =
  | 'heart'
  | 'message'
  | 'mic'
  | 'pen'
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
  | 'chevron-down'
  | 'stats'
  | 'invite'
  | 'sun'
  | 'house'
  | 'pause'
  | 'trash-2'
  | 'send'
  | 'search'
  | 'lock'
  | 'layers'
  | 'grid'
  | 'list'
  | 'close'
  | 'moon'
  | 'plane'
  | 'flame';

const ICON_MAP: Record<ChaleIconName, SymbolViewProps['name']> = {
  heart: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  message: { ios: 'message.fill', android: 'chat_bubble', web: 'chat_bubble' },
  mic: { ios: 'mic.fill', android: 'mic', web: 'mic' },
  pen: { ios: 'square.and.pencil', android: 'edit', web: 'edit' },
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
  'chevron-down': { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  stats: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' },
  invite: { ios: 'envelope.fill', android: 'mail', web: 'mail' },
  sun: { ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' },
  house: { ios: 'house.fill', android: 'home', web: 'home' },
  pause: { ios: 'pause.fill', android: 'pause', web: 'pause' },
  'trash-2': { ios: 'trash.fill', android: 'delete', web: 'delete' },
  send: { ios: 'paperplane.fill', android: 'send', web: 'send' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
  layers: { ios: 'square.stack.3d.up.fill', android: 'layers', web: 'layers' },
  grid: { ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' },
  list: { ios: 'list.bullet', android: 'list', web: 'list' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  moon: { ios: 'moon.stars', android: 'dark_mode', web: 'dark_mode' },
  plane: { ios: 'airplane', android: 'flight', web: 'flight' },
  flame: { ios: 'flame', android: 'local_fire_department', web: 'local_fire_department' },
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

type LucideIconProps = {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  fill?: string;
};

type LucideComponent = ComponentType<LucideIconProps>;

type ExtraIconName =
  | 'hourglass'
  | 'loader'
  | 'waves'
  | 'audiolines'
  | 'chevron-left'
  | 'chevron-down';

export type ShowcaseIconName = ChaleIconName | ExtraIconName;

/**
 * Narrows an author-supplied string to a registered icon name, falling back to
 * `sparkles` instead of throwing. Deck identity (icon key) lives in the
 * database, so a typo there must degrade to a visible generic icon rather than
 * take a screen down.
 */
export function iconName(name: string | null | undefined): ShowcaseIconName {
  return name != null && Object.hasOwn(LUCIDE_MAP, name)
    ? (name as ShowcaseIconName)
    : 'sparkles';
}

const LUCIDE_MAP: Record<ShowcaseIconName, LucideComponent> = {
  heart: Heart,
  message: MessageCircle,
  mic: Mic,
  pen: Pencil,
  sparkles: Sparkles,
  settings: Settings,
  clock: Clock,
  play: Play,
  stop: Square,
  check: Check,
  home: Home,
  people: Users,
  user: User,
  bell: Bell,
  palette: Palette,
  globe: Globe,
  help: CircleHelp,
  info: Info,
  logout: LogOut,
  chevron: ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-down': ChevronDown,
  stats: AudioLines,
  invite: Mail,
  sun: Sun,
  house: House,
  pause: Pause,
  'trash-2': Trash2,
  send: Send,
  search: Search,
  lock: Lock,
  layers: Layers,
  grid: LayoutGrid,
  list: List,
  close: X,
  moon: Moon,
  plane: Plane,
  flame: Flame,
  hourglass: Hourglass,
  loader: LoaderCircle,
  waves: Waves,
  audiolines: AudioLines,
};

/**
 * Static Lucide icon — board spec is Lucide 2px rounded
 * (round caps are Lucide's default). `filled` paints the
 * shape for on-states like the favourited heart.
 */
export function LucideIcon({
  name,
  size = 24,
  color,
  strokeWidth = 2,
  filled = false,
}: {
  name: ShowcaseIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
}) {
  const { theme } = useUnistyles();
  const tint = color ?? theme.colors.ink;
  const Cmp = LUCIDE_MAP[name];
  return (
    <Cmp size={size} color={tint} strokeWidth={strokeWidth} fill={filled ? tint : 'none'} />
  );
}

export type IconAnimation = 'pulse' | 'beat' | 'ring' | 'spin' | 'twinkle';

const DEFAULT_ANIMATION: Partial<Record<ShowcaseIconName, IconAnimation>> = {
  mic: 'pulse',
  heart: 'beat',
  bell: 'ring',
  hourglass: 'spin',
  loader: 'spin',
  sparkles: 'twinkle',
};

/**
 * Looping Lucide icon for states that need motion:
 * mic/pulse = recording, heart/beat = favourite,
 * bell/ring = notification, hourglass/spin = waiting,
 * sparkles/twinkle = reveal.
 */
export function AnimatedIcon({
  name,
  size = 24,
  color,
  strokeWidth = 2,
  animation,
}: {
  name: ShowcaseIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  animation?: IconAnimation;
}) {
  const { theme } = useUnistyles();
  const preset = animation ?? DEFAULT_ANIMATION[name] ?? 'pulse';
  const progress = useSharedValue(0);

  useEffect(() => {
    if (preset === 'spin') {
      progress.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.linear }),
        -1,
      );
    } else if (preset === 'pulse' || preset === 'beat') {
      progress.value = withRepeat(
        withTiming(1, {
          duration: preset === 'beat' ? 900 : 1400,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      );
    } else if (preset === 'twinkle') {
      progress.value = withRepeat(withTiming(1, { duration: 1600 }), -1, true);
    } else {
      progress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 180 }),
          withTiming(-1, { duration: 240 }),
          withTiming(0, { duration: 180 }),
          withTiming(0, { duration: 1200 }),
        ),
        -1,
      );
    }
  }, [preset, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    if (preset === 'spin') {
      return { transform: [{ rotate: `${progress.value * 360}deg` }] };
    }
    if (preset === 'ring') {
      return { transform: [{ rotate: `${progress.value * 18}deg` }] };
    }
    if (preset === 'twinkle') {
      return { opacity: 1 - progress.value * 0.65 };
    }
    const amplitude = preset === 'beat' ? 0.22 : 0.15;
    const scale = 1 + amplitude * Math.sin(progress.value * Math.PI);
    return { transform: [{ scale }] };
  });

  const Cmp = LUCIDE_MAP[name];
  return (
    <Animated.View style={animatedStyle}>
      <Cmp size={size} color={color ?? theme.colors.ink} strokeWidth={strokeWidth} />
    </Animated.View>
  );
}
