/**
 * Client Supabase (serveur des comptes et des données partagées).
 *
 * L'adresse du projet et la clé publique sont lues dans les variables
 * d'environnement de Vite (fichier `.env.production` ou `.env.local`) :
 * - VITE_SUPABASE_URL : adresse du projet (https://xxxx.supabase.co) ;
 * - VITE_SUPABASE_CLE_PUBLIQUE : clé « publishable » (ou « anon »).
 * Ces deux valeurs sont publiques par nature : la sécurité repose sur les
 * règles RLS du serveur, pas sur leur secret.
 *
 * Sans ces variables, `supabase` vaut `null` et l'application fonctionne en
 * mode local (données dans le navigateur, sans comptes), comme avant.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { lireRetourLien, type RetourLien } from '../lib/retourLien';

/**
 * Paramètres laissés dans l'adresse par un lien reçu par e-mail (confirmation
 * d'inscription, mot de passe oublié). Lus avant la création du client, qui
 * les efface de l'adresse après les avoir traités.
 */
export const retourLien: RetourLien = lireRetourLien(window.location.search, window.location.hash);

const url = import.meta.env.VITE_SUPABASE_URL;
const clePublique = import.meta.env.VITE_SUPABASE_CLE_PUBLIQUE;

/** Client Supabase, ou `null` en mode local. */
export const supabase: SupabaseClient | null =
  url && clePublique
    ? createClient(url, clePublique, {
        auth: {
          // Flux PKCE : le lien de confirmation revient avec `?code=…` dans
          // l'URL, ce qui ne gêne pas le routeur « hash » (#/planning).
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

/**
 * Vrai si l'ouverture de l'app vient d'un lien « mot de passe oublié ».
 * L'abonnement est pris tout de suite après la création du client, pour ne
 * pas manquer l'événement émis pendant le traitement du lien.
 */
export let arriveeParRecuperation = false;
supabase?.auth.onAuthStateChange((evenement) => {
  if (evenement === 'PASSWORD_RECOVERY') arriveeParRecuperation = true;
});

