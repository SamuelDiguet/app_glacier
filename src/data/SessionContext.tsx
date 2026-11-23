/**
 * Contexte React de la session (mode connecté uniquement).
 *
 * Suit le compte connecté via Supabase Auth et vérifie qu'il figure dans
 * la liste des propriétaires. L'application n'affiche les données qu'à un
 * propriétaire connecté ; sinon elle montre la page de connexion ou un
 * message « compte non autorisé ».
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { estProprietaire } from './proprietaires';

/** État de la session tel qu'exposé aux composants. */
export interface EtatSession {
  client: SupabaseClient;
  /** Session ouverte, ou `null` si personne n'est connecté. */
  session: Session | null;
  /** Vrai tant qu'on ne sait pas encore si une session existe. */
  chargement: boolean;
  /** Le compte est-il propriétaire ? `null` tant que la vérification n'est pas faite. */
  autorise: boolean | null;
  /** Vrai quand le compte arrive d'un e-mail « mot de passe oublié » et doit en choisir un nouveau. */
  reinitialisation: boolean;
  /** Signale le début d'une réinitialisation (avant de valider le code reçu). */
  demarrerReinitialisation: () => void;
  /** Termine l'étape « nouveau mot de passe ». */
  finirReinitialisation: () => void;
}

const SessionContext = createContext<EtatSession | null>(null);

/** Fournisseur à placer au-dessus de toute l'application en mode connecté. */
export function SessionProvider({ client, children }: { client: SupabaseClient; children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState<boolean | null>(null);
  const [reinitialisation, setReinitialisation] = useState(false);

  // Session existante au démarrage, puis suivi des connexions / déconnexions.
  useEffect(() => {
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
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

  // Vérifie les droits à chaque changement de compte.
  const idCompte = session?.user.id;
  useEffect(() => {
    setAutorise(null);
    if (!idCompte) return;
    estProprietaire(client)
      .then(setAutorise)
      // Hors ligne : on laisse entrer (les données en cache restent protégées
      // par le serveur, qui refusera toute écriture non autorisée).
      .catch(() => setAutorise(true));
  }, [client, idCompte]);

  const valeur: EtatSession = {
    client,
    session,
    chargement,
    autorise,
    reinitialisation,
    demarrerReinitialisation: () => setReinitialisation(true),
    finirReinitialisation: () => setReinitialisation(false),
  };
  return <SessionContext.Provider value={valeur}>{children}</SessionContext.Provider>;
}

/** Session courante, ou `null` en mode local (pas de comptes). */
export function useSession(): EtatSession | null {
  return useContext(SessionContext);
}
