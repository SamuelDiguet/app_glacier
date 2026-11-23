/**
 * Tests des règles de la liste « To do ».
 */
import { describe, expect, it } from 'vitest';
import type { Tache } from '../src/types';
import { groupeDe, grouperTaches, tachesDuJour } from '../src/lib/taches';

const JOUR = '2026-11-23';

/** Construit une tâche de test. */
function tache(titre: string, date = '', heure = '', faite = false): Tache {
  return { id: titre, titre, date, heure, note: '', faite };
}

describe('liste To do', () => {
  it('classe chaque tâche dans le bon groupe', () => {
    expect(groupeDe(tache('a', '2026-11-20'), JOUR)).toBe('retard');
    expect(groupeDe(tache('b', JOUR), JOUR)).toBe('aujourdhui');
    expect(groupeDe(tache('c', '2026-12-01'), JOUR)).toBe('avenir');
    expect(groupeDe(tache('d'), JOUR)).toBe('sansDate');
    expect(groupeDe(tache('e', '2026-11-20', '', true), JOUR)).toBe('faites');
  });

  it("trie les tâches du jour par heure, celles sans heure en premier", () => {
    const groupes = grouperTaches([tache('15h', JOUR, '15:00'), tache('matin', JOUR), tache('9h', JOUR, '09:00')], JOUR);
    expect(groupes.get('aujourdhui')!.map((t) => t.titre)).toEqual(['matin', '9h', '15h']);
  });

  it('trie les tâches sans date par ordre alphabétique', () => {
    const groupes = grouperTaches([tache('Zèbre'), tache('abricot')], JOUR);
    expect(groupes.get('sansDate')!.map((t) => t.titre)).toEqual(['abricot', 'Zèbre']);
  });

  it("donne pour l'accueil les tâches en retard puis celles du jour", () => {
    const taches = [tache('jour', JOUR), tache('retard', '2026-11-01'), tache('demain', '2026-11-24'), tache('fait', JOUR, '', true)];
    expect(tachesDuJour(taches, JOUR).map((t) => t.titre)).toEqual(['retard', 'jour']);
  });
});

describe('actions sur les tâches', () => {
  it('coche une tâche puis supprime les tâches faites', async () => {
    const { reducer } = await import('../src/data/DonneesContext');
    const { donneesVides } = await import('../src/data/stockage');
    let etat = { ...donneesVides(), taches: [tache('a'), tache('b')] };
    etat = reducer(etat, { type: 'tache/basculer', id: 'a' });
    expect(etat.taches.find((t) => t.id === 'a')!.faite).toBe(true);
    etat = reducer(etat, { type: 'tache/supprimerFaites' });
    expect(etat.taches.map((t) => t.id)).toEqual(['b']);
  });
});
