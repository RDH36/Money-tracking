/**
 * File storage for PostHog that writes one at a time.
 *
 * posthog-react-native persists its whole cache on every `setItem`, without waiting
 * for the previous write. Its default expo-file-system storage runs those writes on
 * parallel native threads: when the file does not exist yet (first launch), two of
 * them both try to create it and the loser is rejected with "it already exists"
 * ("PostHog storage persist failed"). Queueing the writes removes the race and
 * guarantees the last value written is the last value asked.
 *
 * Pure module (no Expo import) so it can be tested with node:test.
 */

export interface StorageFile {
  text(): Promise<string>;
  write(content: string): Promise<void>;
}

export interface SerialStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export function createSerialStorage(open: (key: string) => StorageFile): SerialStorage {
  const tails = new Map<string, Promise<void>>();

  return {
    async getItem(key) {
      try {
        return await open(key).text();
      } catch {
        // Missing or unreadable file: PostHog starts from an empty cache.
        return null;
      }
    },

    setItem(key, value) {
      const previous = tails.get(key) ?? Promise.resolve();
      const write = previous.then(() => open(key).write(value));
      // A failed write must not block the next ones; the caller still gets the rejection.
      tails.set(key, write.catch(() => undefined));
      return write;
    },
  };
}
