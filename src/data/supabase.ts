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

