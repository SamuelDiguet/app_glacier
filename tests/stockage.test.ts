/**
 * Tests de la mise à niveau des données sauvegardées (migrations).
 */
import { describe, expect, it } from 'vitest';
import type { DonneesGlacier } from '../src/types';
import { migrerDonnees, VERSION_DONNEES } from '../src/data/stockage';

describe('migration des données', () => {
  it('classe les anciens produits en bacs ou en matières premières selon leur unité', () => {
    const v1 = {
      version: 1,
      employes: [],
      creneaux: [],
      mouvements: [],
      produits: [
        { id: 'a', nom: 'Vanille', categorie: 'Glaces', unite: 'bac', quantite: 3, seuilAlerte: 2 },
        { id: 'b', nom: 'Sucre', categorie: 'Ingrédients', unite: 'kg', quantite: 10, seuilAlerte: 5 },
      ],
    } as unknown as DonneesGlacier;
    const v2 = migrerDonnees(v1);
    expect(v2.version).toBe(VERSION_DONNEES);
    expect(v2.produits.map((p) => p.famille)).toEqual(['bac', 'matiere']);
  });

  it('transforme le statut unique des employés en liste de statuts', () => {
    const v2 = {
      version: 2,
      creneaux: [],
      produits: [],
      mouvements: [],
      employes: [{ id: 'e1', prenom: 'Lucas', nom: '', telephone: '', postes: ['production'], statut: 'patissier', actif: true }],
    } as unknown as DonneesGlacier;
    const [lucas] = migrerDonnees(v2).employes;
    expect(lucas.statuts).toEqual(['patissier']);
    expect(lucas.majeur).toBe(true);
    expect(lucas.notes).toBe('');
    expect('statut' in lucas).toBe(false);
  });

  it('laisse intactes les données déjà à jour', () => {
    const actuelles: DonneesGlacier = { version: VERSION_DONNEES, employes: [], creneaux: [], produits: [], mouvements: [] };
    expect(migrerDonnees(actuelles)).toBe(actuelles);
  });
});
