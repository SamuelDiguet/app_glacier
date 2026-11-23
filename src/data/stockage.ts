/**
 * Persistance locale des données dans le navigateur (localStorage).
 *
 * Toute l'application est sauvegardée sous une seule clé JSON. Ce module
 * est le seul à connaître le support de stockage local.
 *
 * - Mode local (sans comptes) : `CLE_STOCKAGE` contient les données de référence.
 * - Mode connecté : les données de référence sont sur le serveur (voir
 *   distant.ts) ; `CLE_CACHE` en garde une copie pour consulter l'app hors
 *   ligne. Ce cache est effacé à la déconnexion.
 */
import type { DonneesGlacier, Employe, Produit, Statut } from '../types';

/** Clé des données en mode local. */
export const CLE_STOCKAGE = 'gestion-glacier:donnees';

/** Clé de la copie hors ligne des données du serveur, en mode connecté. */
export const CLE_CACHE = 'gestion-glacier:cache';

/** Version du format des données, à incrémenter en cas de changement de structure. */
export const VERSION_DONNEES = 4;

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
 * Les étapes s'enchaînent : des données v1 passent par v2 puis v3.
 * - v1 → v2 : ajout de la famille des produits (les produits comptés en bacs
 *   deviennent des parfums, les autres des matières premières) ;
 * - v2 → v3 : le statut unique d'un employé devient une liste de statuts ;
 * - v3 → v4 : ajout de « majeur » (vrai par défaut) et des notes (vides).
 */
export function migrerDonnees(donnees: DonneesGlacier): DonneesGlacier {
  if (donnees.version >= VERSION_DONNEES) return donnees;
  const produits = donnees.produits.map(
    (p): Produit => ({ ...p, famille: p.famille ?? (p.unite === 'bac' ? 'bac' : 'matiere') }),
  );
  const employes = donnees.employes.map((e): Employe => {
    // Ancien format : champ `statut` (une seule valeur).
    const { statut, ...reste } = e as Employe & { statut?: Statut };
    return {
      ...reste,
      statuts: e.statuts ?? [statut ?? 'standard'],
      majeur: e.majeur ?? true,
      notes: e.notes ?? '',
    };
  });
  return { ...donnees, version: VERSION_DONNEES, produits, employes };
}

/** Lit les données sauvegardées, ou `null` s'il n'y en a pas (ou si elles sont illisibles). */
export function chargerDonnees(cle = CLE_STOCKAGE): DonneesGlacier | null {
  try {
    const brut = localStorage.getItem(cle);
    if (!brut) return null;
    const donnees: unknown = JSON.parse(brut);
    return estDonneesValides(donnees) ? migrerDonnees(donnees) : null;
  } catch {
    // Stockage indisponible (navigation privée stricte) ou JSON corrompu.
    return null;
  }
}

/** Sauvegarde l'ensemble des données. Renvoie `false` si l'écriture a échoué. */
export function sauvegarderDonnees(donnees: DonneesGlacier, cle = CLE_STOCKAGE): boolean {
  try {
    localStorage.setItem(cle, JSON.stringify(donnees));
    return true;
  } catch {
    return false;
  }
}

/** Supprime les données enregistrées sous une clé (ex. cache à la déconnexion). */
export function effacerDonnees(cle: string): void {
  try {
    localStorage.removeItem(cle);
  } catch {
    // Stockage indisponible : rien à effacer.
  }
}
