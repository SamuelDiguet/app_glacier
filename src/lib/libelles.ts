/**
 * Libellés affichés dans l'interface pour les valeurs techniques
 * (postes, statuts, unités…). Centralisés ici pour rester cohérents.
 */
import type { Poste, Statut, Unite } from '../types';

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
export const UNITES: Unite[] = ['bac', 'kg', 'L', 'pièce', 'carton'];

/** Catégories proposées par défaut pour les produits (saisie libre possible). */
export const CATEGORIES_PRODUIT = ['Glaces', 'Sorbets', 'Ingrédients', 'Emballages', 'Boissons'];
