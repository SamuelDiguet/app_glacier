/**
 * Déclarations globales injectées par Vite au moment du build.
 */

/** Numéro de version de l'application, lu dans package.json. */
declare const __VERSION_APP__: string;

/// <reference types="vite/client" />

/** Variables d'environnement lues par Vite (voir src/data/supabase.ts). */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_CLE_PUBLIQUE?: string;
}
