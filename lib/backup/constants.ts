/**
 * Constantes du système de sauvegarde/transfert `.mitsitsy`.
 *
 * Un fichier `.mitsitsy` est une enveloppe JSON dont le `payload` est chiffré
 * (AES). Par défaut le chiffrement utilise une clé intégrée à l'app
 * (APP_SECRET) — aucun mot de passe requis, migration de téléphone fluide.
 * L'utilisateur peut aussi protéger le fichier avec son propre mot de passe.
 */

/** Extension du fichier de sauvegarde (avec le point). */
export const BACKUP_EXTENSION = '.mitsitsy';

/** Type MIME générique utilisé pour le partage / la sélection du fichier. */
export const BACKUP_MIME = 'application/octet-stream';

/** Identifiant de format présent dans l'enveloppe — garde-fou à l'import. */
export const BACKUP_FORMAT = 'mitsitsy-backup';

/** Version du format d'enveloppe. À incrémenter si la structure change. */
export const BACKUP_FILE_VERSION = 1;

/**
 * Clé embarquée servant à chiffrer/déchiffrer les fichiers non protégés par
 * mot de passe. Sécurité par obscurité : le fichier n'est pas lisible dans un
 * éditeur de texte et ne s'ouvre que via Mitsitsy. Ce n'est PAS une garantie
 * cryptographique forte (un attaquant décompilant l'app peut la retrouver) —
 * pour une vraie confidentialité, l'utilisateur doit choisir un mot de passe.
 */
export const APP_SECRET = 'mitsitsy::v1::b7f2c9a1e4d83f60a5c2::backup-key';

/** Itérations PBKDF2 pour dériver la clé AES depuis le secret/mot de passe. */
export const PBKDF2_ITERATIONS = 10000;

/**
 * Tables exportées, dans l'ordre d'INSERTION (parents avant enfants) pour
 * respecter les contraintes de clés étrangères à la restauration.
 */
export const BACKUP_TABLES = [
  'categories',
  'accounts',
  'planifications',
  'transactions',
  'planification_items',
  'budget_history',
  'settings',
  'sync_meta',
  'gamification',
  'badges',
  'unlocks',
  'quests',
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];

/**
 * Tables à vider avant restauration, dans l'ordre de SUPPRESSION (enfants
 * avant parents). `settings` est volontairement absente : on ne wipe pas les
 * réglages, on les upsert clé par clé (voir EXCLUDED_SETTING_KEYS).
 */
export const BACKUP_WIPE_TABLES = [
  'quests',
  'unlocks',
  'badges',
  'gamification',
  'sync_meta',
  'budget_history',
  'planification_items',
  'transactions',
  'planifications',
  'accounts',
  'categories',
] as const;

/**
 * Clés de la table `settings` NON importées : elles pilotent le verrouillage
 * de l'app dont le secret (PIN) vit dans expo-secure-store (device-local, non
 * exporté). Les importer verrouillerait le nouveau téléphone sans PIN valide.
 */
export const EXCLUDED_SETTING_KEYS = [
  'app_lock_enabled',
  'app_lock_biometric',
  // Dossier de téléchargement choisi (Android SAF) — propre à chaque appareil.
  'backup_dir_uri',
];
