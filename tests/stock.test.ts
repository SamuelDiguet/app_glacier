/**
 * Tests des règles de stock (mouvements, alertes) et du reducer.
 */
import { describe, expect, it } from 'vitest';
import type { Produit } from '../src/types';
import { appliquerMouvement, estEnAlerte, produitsEnAlerte } from '../src/lib/stock';
import { reducer } from '../src/data/DonneesContext';
import { donneesVides } from '../src/data/stockage';

const vanille: Produit = { id: 'p1', nom: 'Vanille', categorie: 'Glaces', unite: 'bac', quantite: 3, seuilAlerte: 2 };

describe('stock', () => {
  it('applique les entrées et les sorties', () => {
    expect(appliquerMouvement(vanille, { type: 'entree', quantite: 2 })).toBe(5);
    expect(appliquerMouvement(vanille, { type: 'sortie', quantite: 1.5 })).toBe(1.5);
  });

  it('refuse un stock négatif ou une quantité nulle', () => {
    expect(() => appliquerMouvement(vanille, { type: 'sortie', quantite: 4 })).toThrow(/insuffisant/);
    expect(() => appliquerMouvement(vanille, { type: 'entree', quantite: 0 })).toThrow();
  });

  it('évite les erreurs d’arrondi', () => {
    expect(appliquerMouvement({ ...vanille, quantite: 0.1 }, { type: 'entree', quantite: 0.2 })).toBe(0.3);
  });

  it('signale les produits au seuil ou en dessous, les plus critiques d’abord', () => {
    expect(estEnAlerte({ ...vanille, quantite: 2 })).toBe(true);
    const liste = produitsEnAlerte([
      { ...vanille, id: 'a', quantite: 2 },
      { ...vanille, id: 'b', quantite: 0 },
      { ...vanille, id: 'c', quantite: 10 },
    ]);
    expect(liste.map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('met à jour la quantité et l’historique via le reducer', () => {
    const etat = reducer({ ...donneesVides(), produits: [vanille] }, {
      type: 'mouvement/ajouter',
      mouvement: { id: 'm1', produitId: 'p1', type: 'sortie', quantite: 1, date: '2026-11-23T10:00:00Z', motif: 'Vente' },
    });
    expect(etat.produits[0].quantite).toBe(2);
    expect(etat.mouvements).toHaveLength(1);
  });

  it('copie les créneaux d’une semaine sur la suivante', () => {
    const etat = reducer(
      { ...donneesVides(), creneaux: [{ id: 'c1', employeId: 'e1', poste: 'vente', date: '2026-11-25', debut: '10:00', fin: '12:00', note: '' }] },
      { type: 'creneau/copierSemaine', lundiSource: '2026-11-23', lundiCible: '2026-11-30' },
    );
    expect(etat.creneaux.map((c) => c.date)).toEqual(['2026-11-25', '2026-12-02']);
  });
});
