/**
 * Nom d'icône sûr : une valeur venue de la base (compte créé par une ancienne
 * version, import, sauvegarde) peut ne pas exister dans la police d'icônes.
 * Code pur (glyphes injectés) pour rester testable sans React Native.
 */
export function safeIconName<T extends string>(
  name: unknown,
  glyphs: Record<string, unknown>,
  fallback: T,
): string {
  return typeof name === 'string' && name !== '' && Object.prototype.hasOwnProperty.call(glyphs, name)
    ? name
    : fallback;
}
