/**
 * Règles métier du planning : tri des créneaux, détection des conflits
 * et calcul des heures travaillées.
 */
import type { Creneau, Employe } from '../types';
import { dureeHeures, enMinutes } from './dates';

/** Trie les créneaux par jour puis par heure de début. */
export function trierCreneaux(creneaux: Creneau[]): Creneau[] {
  return [...creneaux].sort(
    (a, b) => a.date.localeCompare(b.date) || a.debut.localeCompare(b.debut),
  );
}

/** Indique si deux créneaux du même jour se chevauchent. */
export function seChevauchent(a: Creneau, b: Creneau): boolean {
  if (a.date !== b.date) return false;
  return enMinutes(a.debut) < enMinutes(b.fin) && enMinutes(b.debut) < enMinutes(a.fin);
}

/**
 * Liste les problèmes d'un créneau avant de l'enregistrer :
 * horaires incohérents, poste non tenu par l'employé, double affectation.
 * Renvoie une liste de messages (vide si tout va bien).
 */
export function verifierCreneau(
  creneau: Creneau,
  employe: Employe | undefined,
  autresCreneaux: Creneau[],
): string[] {
  const problemes: string[] = [];

  if (enMinutes(creneau.fin) <= enMinutes(creneau.debut)) {
    problemes.push("L'heure de fin doit être après l'heure de début.");
  }

  if (employe && !employe.postes.includes(creneau.poste)) {
    problemes.push(`${employe.prenom} n'est pas affecté(e) à ce poste.`);
  }

  const conflit = autresCreneaux.find(
    (autre) =>
      autre.id !== creneau.id &&
      autre.employeId === creneau.employeId &&
      seChevauchent(autre, creneau),
  );
  if (conflit) {
    problemes.push(
      `Déjà planifié(e) ce jour-là de ${conflit.debut} à ${conflit.fin}.`,
    );
  }

  return problemes;
}

/** Total des heures planifiées par employé (clé : identifiant de l'employé). */
export function heuresParEmploye(creneaux: Creneau[]): Map<string, number> {
  const totaux = new Map<string, number>();
  for (const c of creneaux) {
    totaux.set(c.employeId, (totaux.get(c.employeId) ?? 0) + dureeHeures(c.debut, c.fin));
  }
  return totaux;
}
