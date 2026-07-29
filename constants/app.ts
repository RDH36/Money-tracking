import Constants from "expo-constants";

// App constants.
// APP_VERSION est dérivé de app.json (expo.version) — source de vérité unique.
// Un oubli de bump ici ne peut donc plus désactiver la pastille « Quoi de neuf ».
export const APP_VERSION = Constants.expoConfig?.version ?? "0.0.0";
export const PROJECT_NAME = "mitsitsy";

// Supabase configuration
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
