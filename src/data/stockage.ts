/**
 * Persistance locale des données dans le navigateur (localStorage).
 *
 * Toute l'application est sauvegardée sous une seule clé JSON. Ce module
 * est le seul à connaître le support de stockage : pour passer plus tard à
 * un back-end ou au stockage natif de Capacitor, il suffira de le remplacer.
 */
import type { DonneesGlacier, Produit } from '../types';

const CLE_STOCKAGE = 'gestion-glacier:donnees';

/** Version du format des données, à incrémenter en cas de changement de structure. */
export const VERSION_DONNEES = 2;

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

/**
 * Met à niveau des données d'une ancienne version vers le format actuel.
 * v1 → v2 : ajout de la famille des produits (les produits comptés en bacs
 * deviennent des parfums, les autres des matières premières).
 */
export function migrerDonnees(donnees: DonneesGlacier): DonneesGlacier {
  if (donnees.version >= VERSION_DONNEES) return donnees;
  const produits = donnees.produits.map(
    (p): Produit => ({ ...p, famille: p.famille ?? (p.unite === 'bac' ? 'bac' : 'matiere') }),
  );
  return { ...donnees, version: VERSION_DONNEES, produits };
}

/** Lit les données sauvegardées, ou `null` s'il n'y en a pas (ou si elles sont illisibles). */
export function chargerDonnees(): DonneesGlacier | null {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return null;
    const donnees: unknown = JSON.parse(brut);
    return estDonneesValides(donnees) ? migrerDonnees(donnees) : null;
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
