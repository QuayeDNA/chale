import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Device-local one-time decisions about chrome, as opposed to play state.
 *
 * These are not session data (`chale.session.v1.*`) and not seeds
 * (`chale.shuffle.v1.*`): they record that a person has actively dismissed a
 * piece of furniture and does not want it back. Same per-device reasoning as
 * the rest — a shared phone has shared furniture.
 */
const PREFIX = 'chale.flag.v1.';

export async function loadFlag(key: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(`${PREFIX}${key}`)) === 'true';
  } catch {
    return false;
  }
}

export async function saveFlag(key: string, value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(`${PREFIX}${key}`, value ? 'true' : 'false');
  } catch {
    // A failed write costs the dismissal, never the play.
  }
}
