import Constants from "expo-constants";

// App constants.
// APP_VERSION est dérivé de app.json (expo.version) — source de vérité unique.
// Un oubli de bump ici ne peut donc plus désactiver la pastille « Quoi de neuf ».
export const APP_VERSION = Constants.expoConfig?.version ?? "0.0.0";
export const PROJECT_NAME = "mitsitsy";

// Conseil « Ton mois » (analyse, cycle de paye) : masqué en prod tant que la
// feature n'est pas prête — le code complet vit sur la branche feat/conseil-analyse.
export const ANALYSIS_ENABLED = false;

// Import d'opérations depuis une capture d'écran (OCR hors ligne, MCB Juice
// pour l'instant) : future feature Mitsitsy Plus, activée en debug seulement.
// La cible de partage Android suit la même règle (manifeste debug, voir
// modules/mitsitsy-ocr/app.plugin.js) : passer les deux ensemble en prod.
export const OCR_IMPORT_ENABLED = __DEV__;

// Mitsitsy Plus, lot 0 : licence vérifiée hors ligne (jeton long collé ou
// lien profond), seul droit branché = lectures illimitées de l'import. Suit
// l'import : la ligne Réglages et le lien profond n'existent que s'il existe.
export const PLUS_ENABLED = OCR_IMPORT_ENABLED;

// Clé PUBLIQUE Ed25519 (base64url) des jetons Plus. La clé privée n'est
// jamais dans le dépôt (script local scripts/plus/sign-license.mjs).
export const LICENSE_PUBLIC_KEY = "F7WjaRUFSYdJ4c-WVagPU0t6oToJYBwQjmX78hvoZmI";

// Supabase configuration
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
