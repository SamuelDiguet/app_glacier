/**
 * Contexte React qui détient toutes les données de l'application et
 * expose les actions pour les modifier.
 *
 * Les modifications passent par un reducer (fonction pure), puis l'état
 * est sauvegardé automatiquement dans le stockage local à chaque changement.
 */
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { Creneau, DonneesGlacier, Employe, Mouvement, Produit } from '../types';
import { appliquerMouvement } from '../lib/stock';
import { ajouterJours } from '../lib/dates';
import { nouvelId } from '../lib/ids';
import { chargerDonnees, sauvegarderDonnees } from './stockage';
import { donneesExemple } from './exemple';

/** Toutes les actions possibles sur les données. */
type Action =
  | { type: 'employe/enregistrer'; employe: Employe }
  | { type: 'employe/supprimer'; id: string }
  | { type: 'creneau/enregistrer'; creneau: Creneau }
  | { type: 'creneau/supprimer'; id: string }
  | { type: 'creneau/copierSemaine'; lundiSource: string; lundiCible: string }
  | { type: 'produit/enregistrer'; produit: Produit }
  | { type: 'produit/supprimer'; id: string }
  | { type: 'mouvement/ajouter'; mouvement: Mouvement }
  | { type: 'donnees/remplacer'; donnees: DonneesGlacier };

/** Remplace l'élément de même id dans la liste, ou l'ajoute s'il est nouveau. */
function remplacerOuAjouter<T extends { id: string }>(liste: T[], element: T): T[] {
  const existe = liste.some((e) => e.id === element.id);
  return existe ? liste.map((e) => (e.id === element.id ? element : e)) : [...liste, element];
}

/** Reducer : calcule le nouvel état à partir de l'état courant et d'une action. */
function reducer(etat: DonneesGlacier, action: Action): DonneesGlacier {
  switch (action.type) {
    case 'employe/enregistrer':
      return { ...etat, employes: remplacerOuAjouter(etat.employes, action.employe) };

    case 'employe/supprimer':
      // On retire aussi ses créneaux pour ne pas laisser de planning orphelin.
      return {
        ...etat,
        employes: etat.employes.filter((e) => e.id !== action.id),
        creneaux: etat.creneaux.filter((c) => c.employeId !== action.id),
      };

    case 'creneau/enregistrer':
      return { ...etat, creneaux: remplacerOuAjouter(etat.creneaux, action.creneau) };

    case 'creneau/supprimer':
      return { ...etat, creneaux: etat.creneaux.filter((c) => c.id !== action.id) };

    case 'creneau/copierSemaine': {
      // Décale chaque créneau de la semaine source vers la semaine cible.
      const ecart = Math.round(
        (new Date(action.lundiCible).getTime() - new Date(action.lundiSource).getTime()) / 86_400_000,
      );
      const finSource = ajouterJours(action.lundiSource, 6);
      const copies = etat.creneaux
        .filter((c) => c.date >= action.lundiSource && c.date <= finSource)
        .map((c) => ({ ...c, id: nouvelId(), date: ajouterJours(c.date, ecart) }));
      return { ...etat, creneaux: [...etat.creneaux, ...copies] };
    }

    case 'produit/enregistrer':
      return { ...etat, produits: remplacerOuAjouter(etat.produits, action.produit) };

    case 'produit/supprimer':
      return {
        ...etat,
        produits: etat.produits.filter((p) => p.id !== action.id),
        mouvements: etat.mouvements.filter((m) => m.produitId !== action.id),
      };

    case 'mouvement/ajouter': {
      // La quantité du produit est mise à jour en même temps que l'historique.
      const { mouvement } = action;
      return {
        ...etat,
        produits: etat.produits.map((p) =>
          p.id === mouvement.produitId ? { ...p, quantite: appliquerMouvement(p, mouvement) } : p,
        ),
        mouvements: [mouvement, ...etat.mouvements],
      };
    }

    case 'donnees/remplacer':
      return action.donnees;
  }
}

/** Ce que le contexte met à disposition des composants. */
interface ValeurContexte {
  donnees: DonneesGlacier;
  dispatch: (action: Action) => void;
}

const DonneesContext = createContext<ValeurContexte | null>(null);

/** Charge les données sauvegardées, ou les données d'exemple au premier lancement. */
function etatInitial(): DonneesGlacier {
  return chargerDonnees() ?? donneesExemple();
}

/** Fournisseur à placer à la racine de l'application. */
export function DonneesProvider({ children }: { children: ReactNode }) {
  const [donnees, dispatch] = useReducer(reducer, undefined, etatInitial);

  // Sauvegarde automatique après chaque modification.
  useEffect(() => {
    sauvegarderDonnees(donnees);
  }, [donnees]);

  const valeur = useMemo(() => ({ donnees, dispatch }), [donnees]);
  return <DonneesContext.Provider value={valeur}>{children}</DonneesContext.Provider>;
}

/** Hook d'accès aux données et aux actions depuis n'importe quel composant. */
export function useDonnees(): ValeurContexte {
  const contexte = useContext(DonneesContext);
  if (!contexte) {
    throw new Error('useDonnees doit être utilisé à l’intérieur de <DonneesProvider>.');
  }
  return contexte;
}

export type { Action };
export { reducer };
