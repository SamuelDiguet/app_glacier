/**
 * Tests des fonctions de dates (semaines, durées, formatage des heures).
 */
import { describe, expect, it } from 'vitest';
import { ajouterJours, dureeHeures, formaterHeures, joursDeLaSemaine, lundiDeLaSemaine } from '../src/lib/dates';

describe('dates', () => {
  it('trouve le lundi de la semaine, y compris un dimanche', () => {
    expect(lundiDeLaSemaine('2026-11-23')).toBe('2026-11-23'); // lundi
    expect(lundiDeLaSemaine('2026-11-29')).toBe('2026-11-23'); // dimanche
    expect(lundiDeLaSemaine('2026-11-25')).toBe('2026-11-23'); // mercredi
  });

  it('ajoute des jours en changeant de mois et d’année', () => {
    expect(ajouterJours('2026-12-30', 3)).toBe('2027-01-02');
    expect(ajouterJours('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('liste les 7 jours de la semaine', () => {
    const jours = joursDeLaSemaine('2026-11-23');
    expect(jours).toHaveLength(7);
    expect(jours[6]).toBe('2026-11-29');
  });

  it('calcule et formate les durées', () => {
    expect(dureeHeures('08:00', '12:30')).toBe(4.5);
    expect(dureeHeures('12:00', '10:00')).toBe(0);
    expect(formaterHeures(4.5)).toBe('4 h 30');
    expect(formaterHeures(8)).toBe('8 h');
  });
});
