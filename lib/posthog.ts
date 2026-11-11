import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import { createSerialStorage } from './analytics/serialStorage';

const apiKey = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined;
const host = Constants.expoConfig?.extra?.posthogHost as string | undefined;
const isPostHogConfigured = !!apiKey && apiKey !== 'phc_your_project_token_here';

if (!isPostHogConfigured) {
  console.warn(
    'PostHog project token not configured. Analytics will be disabled. ' +
      'Set POSTHOG_PROJECT_TOKEN in your .env file to enable analytics.'
  );
}

// Suppress PostHog network errors that spam the console when offline
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('Error while flushing PostHog')) return;
  originalConsoleError(...args);
};

// Same file as the library default (Paths.document + key), so the identity persisted
// by earlier versions is kept; writes are queued instead of racing each other.
const customStorage = createSerialStorage((key) => new File(Paths.document, key));

export const posthog = new PostHog(apiKey || 'placeholder_key', {
  host,
  customStorage,
  disabled: !isPostHogConfigured,
  captureAppLifecycleEvents: true,
  flushAt: 20,
  flushInterval: 10000,
  maxBatchSize: 100,
  maxQueueSize: 1000,
  preloadFeatureFlags: true,
  sendFeatureFlagEvent: true,
  featureFlagsRequestTimeoutMs: 10000,
  requestTimeout: 10000,
  fetchRetryCount: 3,
  fetchRetryDelay: 3000,
});
