/**
 * Règles métier des stocks : application d'un mouvement et alertes.
 */
import type { Mouvement, Produit } from '../types';

/** Un produit est en alerte quand sa quantité atteint ou passe sous le seuil. */
export function estEnAlerte(produit: Produit): boolean {
  return produit.quantite <= produit.seuilAlerte;
}

/** Produits en alerte, du plus critique (rupture) au moins critique. */
export function produitsEnAlerte(produits: Produit[]): Produit[] {
  return produits
    .filter(estEnAlerte)
    .sort((a, b) => a.quantite - a.seuilAlerte - (b.quantite - b.seuilAlerte));
}

/**
 * Calcule la nouvelle quantité d'un produit après un mouvement.
 * Une sortie ne peut pas faire passer le stock sous zéro : on lève
 * une erreur explicite pour l'afficher à l'utilisateur.
 */
export function appliquerMouvement(produit: Produit, mouvement: Pick<Mouvement, 'type' | 'quantite'>): number {
  if (mouvement.quantite <= 0) {
    throw new Error('La quantité doit être supérieure à zéro.');
  }
  const delta = mouvement.type === 'entree' ? mouvement.quantite : -mouvement.quantite;
  const nouvelle = arrondir(produit.quantite + delta);
  if (nouvelle < 0) {
    throw new Error(`Stock insuffisant : il reste ${produit.quantite} ${produit.unite}.`);
  }
  return nouvelle;
}

/** Arrondit à 2 décimales pour éviter les erreurs de calcul flottant (0,1 + 0,2…). */
export function arrondir(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}
