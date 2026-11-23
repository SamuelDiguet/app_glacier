/**
 * Règles de la liste « To do » : ordre d'affichage et regroupement des
 * tâches et rendez-vous. Fonctions pures, testées dans tests/taches.test.ts.
 */
import type { Tache } from '../types';

/** Groupes affichés sur la page To do, dans cet ordre. */
export type GroupeTache = 'retard' | 'aujourdhui' | 'avenir' | 'sansDate' | 'faites';

/** Libellé de chaque groupe. */
export const LIBELLES_GROUPE: Record<GroupeTache, string> = {
  retard: 'En retard',
  aujourdhui: "Aujourd'hui",
  avenir: 'À venir',
  sansDate: 'Sans date',
  faites: 'Faites',
};

/** Clé de tri chronologique (date puis heure ; sans heure = début de journée). */
function moment(tache: Tache): string {
  return `${tache.date} ${tache.heure || '00:00'}`;
}

/** Groupe d'une tâche par rapport au jour donné (AAAA-MM-JJ). */
export function groupeDe(tache: Tache, jour: string): GroupeTache {
  if (tache.faite) return 'faites';
  if (!tache.date) return 'sansDate';
  if (tache.date < jour) return 'retard';
  return tache.date === jour ? 'aujourdhui' : 'avenir';
}

/**
 * Range les tâches par groupe. Dans chaque groupe : ordre chronologique,
 * sauf « Sans date » (ordre alphabétique) et « Faites » (les plus récentes d'abord).
 */
export function grouperTaches(taches: Tache[], jour: string): Map<GroupeTache, Tache[]> {
  const groupes = new Map<GroupeTache, Tache[]>(
    (Object.keys(LIBELLES_GROUPE) as GroupeTache[]).map((g) => [g, []]),
  );
  for (const tache of taches) groupes.get(groupeDe(tache, jour))!.push(tache);
  for (const [groupe, liste] of groupes) {
    if (groupe === 'sansDate') liste.sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
    else if (groupe === 'faites') liste.sort((a, b) => moment(b).localeCompare(moment(a)));
    else liste.sort((a, b) => moment(a).localeCompare(moment(b)));
  }
  return groupes;
}

/** Tâches à traiter aujourd'hui (en retard ou du jour), pour l'accueil. */
export function tachesDuJour(taches: Tache[], jour: string): Tache[] {
  const groupes = grouperTaches(taches, jour);
  return [...groupes.get('retard')!, ...groupes.get('aujourdhui')!];
}
