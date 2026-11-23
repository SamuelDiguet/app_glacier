/**
 * Contexte React de la session (mode connecté uniquement).
 *
 * Suit le compte connecté via Supabase Auth. L'application n'affiche les
 * données qu'à un compte connecté ; sinon elle montre la page de connexion.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { arriveeParRecuperation, retourLien } from './supabase';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

/** État de la session tel qu'exposé aux composants. */
export interface EtatSession {
  client: SupabaseClient;
  /** Session ouverte, ou `null` si personne n'est connecté. */
  session: Session | null;
  /** Vrai tant qu'on ne sait pas encore si une session existe. */
  chargement: boolean;
  /** Vrai quand le compte arrive d'un e-mail « mot de passe oublié » et doit en choisir un nouveau. */
  reinitialisation: boolean;
  /** Message à afficher sur la page de connexion au retour d'un lien reçu par e-mail. */
  messageLien: { texte: string; erreur: boolean } | null;
  /** Signale le début d'une réinitialisation (avant de valider le code reçu). */
  demarrerReinitialisation: () => void;
  /** Termine l'étape « nouveau mot de passe ». */
  finirReinitialisation: () => void;
}

const SessionContext = createContext<EtatSession | null>(null);

/**
 * Message à afficher après l'ouverture d'un lien reçu par e-mail.
 * Un lien ouvert dans un autre navigateur que celui de la demande ne peut
 * pas ouvrir de session (sécurité du flux PKCE) ; pour une inscription,
 * l'adresse est pourtant bien confirmée : il suffit de se connecter.
 */
function messageRetourLien(sessionOuverte: boolean): EtatSession['messageLien'] {
  if (retourLien.erreur) return { texte: retourLien.erreur, erreur: true };
  if (retourLien.code && !sessionOuverte) {
    return {
      texte:
        'Si vous veniez de créer votre compte, votre adresse est confirmée : connectez-vous. ' +
        'Pour un mot de passe oublié, ouvrez le lien dans le navigateur où vous avez fait la demande.',
      erreur: false,
    };
  }
  return null;
}

/** Retire de l'adresse les paramètres laissés par le lien (en gardant la page en cours). */
function nettoyerAdresse() {
  if (!window.location.search && !window.location.hash.includes('error')) return;
  const route = window.location.hash.startsWith('#/') ? window.location.hash : '';
  window.history.replaceState(null, '', window.location.pathname + route);
}

/** Fournisseur à placer au-dessus de toute l'application en mode connecté. */
export function SessionProvider({ client, children }: { client: SupabaseClient; children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [chargement, setChargement] = useState(true);
  const [reinitialisation, setReinitialisation] = useState(false);
  const [messageLien, setMessageLien] = useState<EtatSession['messageLien']>(null);

  // Session existante au démarrage, puis suivi des connexions / déconnexions.
  useEffect(() => {
    // getSession attend la fin du traitement d'un éventuel lien reçu par e-mail.
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (arriveeParRecuperation) setReinitialisation(true);
      setMessageLien(messageRetourLien(data.session !== null));
      nettoyerAdresse();
      setChargement(false);
    });
    const { data } = client.auth.onAuthStateChange((evenement, nouvelle) => {
      // Ne remplace la session que si le compte change (le simple
      // renouvellement du jeton ne doit pas relancer les chargements).
      setSession((ancienne) => (ancienne?.user.id === nouvelle?.user.id ? (nouvelle ?? ancienne) : nouvelle));
      if (evenement === 'PASSWORD_RECOVERY') setReinitialisation(true);
    });
    return () => data.subscription.unsubscribe();
  }, [client]);

  const valeur: EtatSession = {
    client,
    session,
    chargement,
    reinitialisation,
    messageLien,
    demarrerReinitialisation: () => setReinitialisation(true),
    finirReinitialisation: () => setReinitialisation(false),
  };
  return <SessionContext.Provider value={valeur}>{children}</SessionContext.Provider>;
}

/** Session courante, ou `null` en mode local (pas de comptes). */
export function useSession(): EtatSession | null {
  return useContext(SessionContext);
}
