/**
 * Contexte React qui détient toutes les données de l'application et
 * expose les actions pour les modifier.
 *
 * Les modifications passent par un reducer (fonction pure). L'état est
 * ensuite sauvegardé dans le navigateur et, en mode connecté, les lignes
 * modifiées sont envoyées au serveur (voir distant.ts).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Creneau, DonneesGlacier, Employe, Mouvement, Produit, Tache } from '../types';
import { appliquerMouvement } from '../lib/stock';
import { ajouterJours } from '../lib/dates';
import { nouvelId } from '../lib/ids';
import { CLE_CACHE, CLE_STOCKAGE, chargerDonnees, donneesVides, sauvegarderDonnees } from './stockage';
import { calculerChangements, chargerDonneesDistantes, envoyerChangements, estVide } from './distant';
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
  | { type: 'tache/enregistrer'; tache: Tache }
  | { type: 'tache/basculer'; id: string }
  | { type: 'tache/supprimer'; id: string }
  | { type: 'tache/supprimerFaites' }
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

    case 'tache/enregistrer':
      return { ...etat, taches: remplacerOuAjouter(etat.taches, action.tache) };

    case 'tache/basculer':
      // Coche ou décoche « fait ».
      return { ...etat, taches: etat.taches.map((t) => (t.id === action.id ? { ...t, faite: !t.faite } : t)) };

    case 'tache/supprimer':
      return { ...etat, taches: etat.taches.filter((t) => t.id !== action.id) };

    case 'tache/supprimerFaites':
      return { ...etat, taches: etat.taches.filter((t) => !t.faite) };

    case 'donnees/remplacer':
      return action.donnees;
  }
}

/** État de la liaison avec le serveur (mode connecté). */
export interface Synchro {
  /** Vrai pendant le premier chargement depuis le serveur. */
  chargement: boolean;
  /** Message d'erreur à afficher (serveur injoignable, écriture refusée…), ou chaîne vide. */
  erreur: string;
  /** Masque le message d'erreur. */
  effacerErreur: () => void;
}

/** Ce que le contexte met à disposition des composants. */
interface ValeurContexte {
  donnees: DonneesGlacier;
  dispatch: (action: Action) => void;
  synchro: Synchro;
}

const DonneesContext = createContext<ValeurContexte | null>(null);

/**
 * État au démarrage :
 * - mode local : données sauvegardées, ou données d'exemple au premier lancement ;
 * - mode connecté : dernière copie hors ligne en attendant le serveur.
 */
function etatInitial(client: SupabaseClient | null): DonneesGlacier {
  if (client) return chargerDonnees(CLE_CACHE) ?? donneesVides();
  return chargerDonnees() ?? donneesExemple();
}

const ERREUR_CHARGEMENT = 'Serveur injoignable : affichage des dernières données connues. Les modifications ne seront pas enregistrées.';
const ERREUR_ENVOI = "La dernière modification n'a pas pu être enregistrée sur le serveur. Vérifiez la connexion internet puis recommencez.";

/**
 * Fournisseur à placer à la racine de l'application.
 * Avec un `client` Supabase, les données viennent du serveur et chaque
 * modification y est envoyée ; sans client, tout reste dans le navigateur.
 */
export function DonneesProvider({ client = null, children }: { client?: SupabaseClient | null; children: ReactNode }) {
  const [donnees, setDonnees] = useState(() => etatInitial(client));
  const [chargement, setChargement] = useState(client !== null);
  const [erreur, setErreur] = useState('');
  // Copie toujours à jour de l'état, pour calculer les changements sans attendre un rendu.
  const etatRef = useRef(donnees);
  // File d'attente : les échanges avec le serveur partent un par un, dans l'ordre.
  const fileRef = useRef<Promise<void>>(Promise.resolve());

  /** Remplace l'état affiché. */
  const appliquer = useCallback((nouvelles: DonneesGlacier) => {
    etatRef.current = nouvelles;
    setDonnees(nouvelles);
  }, []);

  /** Ajoute une tâche à la file des échanges avec le serveur. */
  const enFile = useCallback((tache: () => Promise<void>) => {
    fileRef.current = fileRef.current.then(tache, tache);
  }, []);

  /** Recharge toutes les données depuis le serveur. */
  const recharger = useCallback(() => {
    if (!client) return;
    enFile(async () => {
      try {
        const reference = etatRef.current;
        const serveur = await chargerDonneesDistantes(client);
        // Si une modification a eu lieu pendant le chargement, on garde l'état
        // à l'écran : elle part juste après et le prochain chargement l'inclura.
        if (etatRef.current === reference) appliquer(serveur);
      } catch {
        setErreur(ERREUR_CHARGEMENT);
      } finally {
        setChargement(false);
      }
    });
  }, [client, enFile, appliquer]);

  // Mode connecté : chargement initial, puis à chaque retour sur l'app
  // (un autre propriétaire a pu modifier les données entre-temps).
  useEffect(() => {
    if (!client) return;
    recharger();
    const auRetour = () => document.visibilityState === 'visible' && recharger();
    document.addEventListener('visibilitychange', auRetour);
    return () => document.removeEventListener('visibilitychange', auRetour);
  }, [client, recharger]);

  // Sauvegarde locale après chaque modification (données de référence en
  // mode local, copie hors ligne en mode connecté).
  useEffect(() => {
    sauvegarderDonnees(donnees, client ? CLE_CACHE : CLE_STOCKAGE);
  }, [donnees, client]);

  /** Applique une action tout de suite à l'écran, puis l'envoie au serveur s'il y en a un. */
  const dispatch = useCallback(
    (action: Action) => {
      const avant = etatRef.current;
      const apres = reducer(avant, action);
      appliquer(apres);
      if (!client) return;
      const changements = calculerChangements(avant, apres);
      if (estVide(changements)) return;
      enFile(async () => {
        try {
          await envoyerChangements(client, changements);
        } catch {
          // Échec : on revient à l'état réel du serveur.
          setErreur(ERREUR_ENVOI);
          recharger();
        }
      });
    },
    [client, appliquer, enFile, recharger],
  );

  const valeur = useMemo(
    () => ({ donnees, dispatch, synchro: { chargement, erreur, effacerErreur: () => setErreur('') } }),
    [donnees, dispatch, chargement, erreur],
  );
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
