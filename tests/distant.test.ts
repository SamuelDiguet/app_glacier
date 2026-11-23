/**
 * Tests de la synchronisation avec le serveur : conversion des champs et
 * calcul des changements à envoyer après une action.
 */
import { describe, expect, it } from 'vitest';
import type { DonneesGlacier, Employe, Produit } from '../src/types';
import { calculerChangements, depuisLigne, enPaquets, estVide, versLigne } from '../src/data/distant';
import { reducer } from '../src/data/DonneesContext';
import { VERSION_DONNEES } from '../src/data/stockage';

const lea: Employe = {
  id: 'e1', prenom: 'Léa', nom: 'Martin', telephone: '', postes: ['vente'], statuts: ['standard'], majeur: true, notes: '', actif: true,
};
const vanille: Produit = { id: 'p1', famille: 'bac', nom: 'Vanille', categorie: '', unite: 'bac', quantite: 4, seuilAlerte: 2 };

/** Données de départ des tests. */
function depart(): DonneesGlacier {
  return {
    version: VERSION_DONNEES,
    employes: [lea],
    creneaux: [{ id: 'c1', employeId: 'e1', poste: 'vente', date: '2026-11-23', debut: '10:00', fin: '14:00', note: '' }],
    produits: [vanille],
    mouvements: [],
  };
}

describe('conversion des champs', () => {
  it('passe du camelCase du code au snake_case de la base, et inversement', () => {
    const ligne = versLigne(vanille);
    expect(ligne.seuil_alerte).toBe(2);
    expect('seuilAlerte' in ligne).toBe(false);
    expect(depuisLigne<Produit>(ligne)).toEqual(vanille);
  });
});

describe('calcul des changements', () => {
  it("ne trouve rien quand l'état n'a pas changé", () => {
    const etat = depart();
    expect(estVide(calculerChangements(etat, etat))).toBe(true);
  });

  it("n'envoie que l'élément modifié", () => {
    const avant = depart();
    const apres = reducer(avant, { type: 'employe/enregistrer', employe: { ...lea, nom: 'Durand' } });
    const changements = calculerChangements(avant, apres);
    expect(changements.employes.enregistrer).toEqual([versLigne({ ...lea, nom: 'Durand' })]);
    expect(changements.creneaux.enregistrer).toEqual([]);
  });

  it('envoie le mouvement et la nouvelle quantité du produit', () => {
    const avant = depart();
    const mouvement = { id: 'm1', produitId: 'p1', type: 'sortie' as const, quantite: 1, date: '2026-11-23T10:00:00.000Z', motif: '' };
    const changements = calculerChangements(avant, reducer(avant, { type: 'mouvement/ajouter', mouvement }));
    expect(changements.mouvements.enregistrer).toEqual([versLigne(mouvement)]);
    expect(changements.produits.enregistrer[0].quantite).toBe(3);
  });

  it("supprime l'employé et ses créneaux", () => {
    const avant = depart();
    const changements = calculerChangements(avant, reducer(avant, { type: 'employe/supprimer', id: 'e1' }));
    expect(changements.employes.supprimer).toEqual(['e1']);
    expect(changements.creneaux.supprimer).toEqual(['c1']);
  });

  it("ignore un objet recréé à l'identique", () => {
    const avant = depart();
    const apres = { ...avant, employes: [{ ...lea }] };
    expect(estVide(calculerChangements(avant, apres))).toBe(true);
  });
});

describe('découpage en paquets', () => {
  it('découpe une liste en paquets de taille maximale donnée', () => {
    expect(enPaquets([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(enPaquets([], 2)).toEqual([]);
  });
});
