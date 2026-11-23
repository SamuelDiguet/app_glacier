/**
 * Génération d'identifiants uniques pour les enregistrements.
 */

/** Renvoie un identifiant unique (UUID quand le navigateur le permet). */
export function nouvelId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Repli pour les anciens navigateurs : horodatage + aléa.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
