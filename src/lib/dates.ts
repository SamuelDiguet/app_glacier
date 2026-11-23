/**
 * Fonctions utilitaires sur les dates et les heures.
 *
 * Les jours sont manipulés sous forme de chaînes AAAA-MM-JJ en heure
 * locale, ce qui évite les décalages liés aux fuseaux horaires.
 */

/** Convertit une date en chaîne AAAA-MM-JJ (heure locale). */
export function versJour(date: Date): string {
  const a = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const j = String(date.getDate()).padStart(2, '0');
  return `${a}-${m}-${j}`;
}

/** Convertit une chaîne AAAA-MM-JJ en objet Date (minuit, heure locale). */
export function depuisJour(jour: string): Date {
  const [a, m, j] = jour.split('-').map(Number);
  return new Date(a, m - 1, j);
}

/** Ajoute (ou retire si négatif) un nombre de jours à une date AAAA-MM-JJ. */
export function ajouterJours(jour: string, nombre: number): string {
  const date = depuisJour(jour);
  date.setDate(date.getDate() + nombre);
  return versJour(date);
}

/** Renvoie le lundi de la semaine contenant le jour donné. */
export function lundiDeLaSemaine(jour: string): string {
  const date = depuisJour(jour);
  // getDay() : 0 = dimanche, 1 = lundi… On ramène au lundi précédent.
  const decalage = (date.getDay() + 6) % 7;
  return ajouterJours(jour, -decalage);
}

/** Renvoie les 7 jours (lundi → dimanche) de la semaine commençant au lundi donné. */
export function joursDeLaSemaine(lundi: string): string[] {
  return Array.from({ length: 7 }, (_, i) => ajouterJours(lundi, i));
}

/** Jour courant au format AAAA-MM-JJ. */
export function aujourdhui(): string {
  return versJour(new Date());
}

/** Convertit une heure HH:MM en minutes depuis minuit. */
export function enMinutes(heure: string): number {
  const [h, m] = heure.split(':').map(Number);
  return h * 60 + m;
}

/** Durée d'un créneau en heures (décimales). */
export function dureeHeures(debut: string, fin: string): number {
  return Math.max(0, enMinutes(fin) - enMinutes(debut)) / 60;
}

/** Formate un nombre d'heures, ex. 7.5 → « 7 h 30 ». */
export function formaterHeures(heures: number): string {
  const totalMinutes = Math.round(heures * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

/** Formate un jour pour l'affichage, ex. « lun. 24 nov. ». */
export function formaterJourCourt(jour: string): string {
  return depuisJour(jour).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Formate un jour en toutes lettres, ex. « lundi 24 novembre 2026 ». */
export function formaterJourLong(jour: string): string {
  return depuisJour(jour).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Formate une date ISO avec l'heure, ex. « 24/11/2026 14:05 ». */
export function formaterDateHeure(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
