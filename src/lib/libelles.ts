/**
 * Libellés affichés dans l'interface pour les valeurs techniques
 * (postes, statuts, unités…). Centralisés ici pour rester cohérents.
 */
import type { FamilleStock, Poste, Statut, Unite } from '../types';

export const LIBELLES_POSTE: Record<Poste, string> = {
  vente: 'Vente',
  production: 'Production',
};

export const LIBELLES_STATUT: Record<Statut, string> = {
  standard: 'Standard',
  patissier: 'Pâtissier',
  manager: 'Manager',
};

export const POSTES: Poste[] = ['vente', 'production'];
export const STATUTS: Statut[] = ['standard', 'patissier', 'manager'];
/** Unités proposées pour les matières premières (les parfums se comptent en bacs). */
export const UNITES_MATIERE: Unite[] = ['kg', 'L', 'pièce', 'carton'];

/** Libellés courts des familles de stock (onglets, qui doivent tenir sur mobile). */
export const LIBELLES_FAMILLE: Record<FamilleStock, string> = {
  bac: 'Bacs de glace',
  matiere: 'Matières',
};

/** Catégories proposées par famille (saisie libre possible). */
export const CATEGORIES_PAR_FAMILLE: Record<FamilleStock, string[]> = {
  bac: ['Glaces', 'Sorbets'],
  matiere: ['Produits laitiers', 'Fruits', 'Pâtes et arômes', 'Sucres', 'Emballages'],
};
