/**
 * Chiffrement AES (crypto-js) du payload de sauvegarde.
 *
 * Clé dérivée via PBKDF2(secret, salt) puis AES-CBC avec IV aléatoire. Le
 * secret est le mot de passe utilisateur quand il est fourni, sinon la clé
 * intégrée APP_SECRET. `salt` et `iv` ne sont pas secrets : ils sont stockés
 * en clair dans l'enveloppe pour permettre le déchiffrement.
 */
import CryptoJS from 'crypto-js';
import { APP_SECRET, PBKDF2_ITERATIONS } from './constants';

export interface EncryptedPayload {
  /** true si un mot de passe utilisateur a été utilisé. */
  protected: boolean;
  /** Sel PBKDF2 en hexadécimal. */
  salt: string;
  /** Vecteur d'initialisation AES en hexadécimal. */
  iv: string;
  /** Texte chiffré (base64, format crypto-js). */
  ciphertext: string;
}

const KEY_SIZE_WORDS = 256 / 32; // clé AES-256

function deriveKey(secret: string, salt: CryptoJS.lib.WordArray) {
  return CryptoJS.PBKDF2(secret, salt, {
    keySize: KEY_SIZE_WORDS,
    iterations: PBKDF2_ITERATIONS,
  });
}

/**
 * Chiffre `plaintext`. Sans `password`, utilise la clé intégrée (fichier non
 * protégé mais illisible hors de l'app).
 */
export function encryptPayload(plaintext: string, password?: string): EncryptedPayload {
  const usePassword = !!(password && password.length > 0);
  const secret = usePassword ? (password as string) : APP_SECRET;

  const salt = CryptoJS.lib.WordArray.random(16);
  const iv = CryptoJS.lib.WordArray.random(16);
  const key = deriveKey(secret, salt);

  const cipher = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    protected: usePassword,
    salt: salt.toString(CryptoJS.enc.Hex),
    iv: iv.toString(CryptoJS.enc.Hex),
    ciphertext: cipher.toString(),
  };
}

/**
 * Déchiffre un payload. `password` requis seulement si le fichier a été
 * protégé. Lève `WRONG_PASSWORD` si la clé ne permet pas de retrouver un texte
 * UTF-8 valide (mauvais mot de passe ou fichier corrompu).
 */
export function decryptPayload(
  payload: Pick<EncryptedPayload, 'salt' | 'iv' | 'ciphertext'>,
  password?: string
): string {
  const secret = password && password.length > 0 ? password : APP_SECRET;
  const salt = CryptoJS.enc.Hex.parse(payload.salt);
  const iv = CryptoJS.enc.Hex.parse(payload.iv);
  const key = deriveKey(secret, salt);

  let text = '';
  try {
    const decrypted = CryptoJS.AES.decrypt(payload.ciphertext, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    text = decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    throw new Error('WRONG_PASSWORD');
  }

  if (!text) {
    throw new Error('WRONG_PASSWORD');
  }
  return text;
}
