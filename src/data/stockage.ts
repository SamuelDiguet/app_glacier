/**
 * Persistance locale des données dans le navigateur (localStorage).
 *
 * Toute l'application est sauvegardée sous une seule clé JSON. Ce module
 * est le seul à connaître le support de stockage : pour passer plus tard à
 * un back-end ou au stockage natif de Capacitor, il suffira de le remplacer.
 */
import type { DonneesGlacier } from '../types';

const CLE_STOCKAGE = 'gestion-glacier:donnees';

/** Version du format des données, à incrémenter en cas de changement de structure. */
export const VERSION_DONNEES = 1;

/** Données vides, utilisées au premier lancement ou après réinitialisation. */
export function donneesVides(): DonneesGlacier {
  return { version: VERSION_DONNEES, employes: [], creneaux: [], produits: [], mouvements: [] };
}

/**
 * Vérifie qu'un objet a bien la forme attendue (import de fichier, lecture
 * du stockage). Ne valide que la structure générale, pas chaque champ.
 */
export function estDonneesValides(valeur: unknown): valeur is DonneesGlacier {
  if (typeof valeur !== 'object' || valeur === null) return false;
  const v = valeur as Record<string, unknown>;
  return ['employes', 'creneaux', 'produits', 'mouvements'].every((cle) => Array.isArray(v[cle]));
}

/** Lit les données sauvegardées, ou `null` s'il n'y en a pas (ou si elles sont illisibles). */
export function chargerDonnees(): DonneesGlacier | null {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return null;
    const donnees: unknown = JSON.parse(brut);
    return estDonneesValides(donnees) ? donnees : null;
  } catch {
    // Stockage indisponible (navigation privée stricte) ou JSON corrompu.
    return null;
  }
}

/** Sauvegarde l'ensemble des données. Renvoie `false` si l'écriture a échoué. */
export function sauvegarderDonnees(donnees: DonneesGlacier): boolean {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(donnees));
    return true;
  } catch {
    return false;
  }
}
