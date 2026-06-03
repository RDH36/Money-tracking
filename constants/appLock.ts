// App lock configuration.

/** Number of wrong PIN attempts before the developer recovery code is required. */
export const MAX_PIN_ATTEMPTS = 6;

/** Length of the user PIN. */
export const PIN_LENGTH = 4;

/**
 * Developer recovery code (6 digits). Give this to a user who has forgotten
 * their PIN and exhausted their attempts — entering it removes the lock so they
 * can set it up again.
 *
 * SECURITY NOTE: this is a static, support-level recovery code shipped in the
 * app bundle. It protects against casual snoopers, not a determined attacker
 * who decompiles the app. CHANGE THIS VALUE before each release if needed.
 */
export const DEV_RECOVERY_CODE = '492025';
export const RECOVERY_CODE_LENGTH = 6;
