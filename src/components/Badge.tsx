/**
 * Pastilles de couleur pour les postes et statuts des employés.
 */
import type { Poste, Statut } from '../types';
import { LIBELLES_POSTE, LIBELLES_STATUT } from '../lib/libelles';

export function BadgePoste({ poste }: { poste: Poste }) {
  return <span className={`badge badge-${poste}`}>{LIBELLES_POSTE[poste]}</span>;
}

export function BadgeStatut({ statut }: { statut: Statut }) {
  return <span className={`badge badge-statut-${statut}`}>{LIBELLES_STATUT[statut]}</span>;
}
