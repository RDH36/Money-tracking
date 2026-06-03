import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { DEV_RECOVERY_CODE } from '@/constants/appLock';

const PIN_HASH_KEY = 'app_lock_pin_hash';
const PIN_SALT_KEY = 'app_lock_pin_salt';
const ATTEMPTS_KEY = 'app_lock_attempts';

/**
 * Whether the device can use biometrics: it has the hardware AND the user has
 * enrolled at least one (Face ID / fingerprint).
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    return await LocalAuthentication.isEnrolledAsync();
  } catch {
    return false;
  }
}

/**
 * Prompt the user for biometrics. Falls back to the device passcode when
 * biometrics fail. Returns true on success.
 */
export async function authenticate(promptMessage: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`
  );
}

/** Store the app lock PIN as a salted SHA-256 hash in the secure keychain. */
export async function setPin(pin: string): Promise<void> {
  const saltBytes = Crypto.getRandomBytes(16);
  const salt = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hash = await hashPin(pin, salt);
  await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
}

/** Verify a candidate PIN against the stored hash. */
export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const [salt, stored] = await Promise.all([
      SecureStore.getItemAsync(PIN_SALT_KEY),
      SecureStore.getItemAsync(PIN_HASH_KEY),
    ]);
    if (!salt || !stored) return false;
    const hash = await hashPin(pin, salt);
    return hash === stored;
  } catch {
    return false;
  }
}

/** Whether a PIN has been set. */
export async function hasPin(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(PIN_HASH_KEY)) !== null;
  } catch {
    return false;
  }
}

/** Remove the stored PIN and attempt counter (when the app lock is disabled). */
export async function clearPin(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(PIN_HASH_KEY),
      SecureStore.deleteItemAsync(PIN_SALT_KEY),
      SecureStore.deleteItemAsync(ATTEMPTS_KEY),
    ]);
  } catch {
    // ignore — nothing to clear if the store is unavailable
  }
}

/** Number of consecutive failed PIN attempts (persists across restarts). */
export async function getFailedAttempts(): Promise<number> {
  try {
    const raw = await SecureStore.getItemAsync(ATTEMPTS_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/** Record a failed PIN attempt and return the new total. */
export async function recordFailedAttempt(): Promise<number> {
  const next = (await getFailedAttempts()) + 1;
  try {
    await SecureStore.setItemAsync(ATTEMPTS_KEY, String(next));
  } catch {
    // ignore
  }
  return next;
}

/** Reset the failed attempt counter (after a successful unlock). */
export async function resetFailedAttempts(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ATTEMPTS_KEY);
  } catch {
    // ignore
  }
}

/** Verify the developer recovery code. */
export function verifyRecoveryCode(code: string): boolean {
  return code === DEV_RECOVERY_CODE;
}
