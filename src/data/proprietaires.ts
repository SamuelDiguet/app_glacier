/**
 * Liste des propriétaires autorisés à se connecter (table `proprietaires`).
 *
 * Seul un propriétaire peut lire ou modifier cette liste (règles RLS de
 * supabase/schema.sql). Un compte dont l'adresse n'y figure pas ne voit
 * aucune donnée.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

/** Vrai si le compte connecté figure dans la liste des propriétaires. */
export async function estProprietaire(client: SupabaseClient): Promise<boolean> {
  const { data, error } = await client.rpc('est_proprietaire');
  if (error) throw new Error(error.message);
  return data === true;
}

/** Adresses e-mail des propriétaires, triées. */
export async function listerProprietaires(client: SupabaseClient): Promise<string[]> {
  const { data, error } = await client.from('proprietaires').select('email').order('email');
  if (error) throw new Error(error.message);
  return (data ?? []).map((ligne: { email: string }) => ligne.email);
}

/** Autorise une nouvelle adresse (enregistrée en minuscules). */
export async function ajouterProprietaire(client: SupabaseClient, email: string): Promise<void> {
  const { error } = await client.from('proprietaires').upsert({ email: email.trim().toLowerCase() });
  if (error) throw new Error(error.message);
}

/** Retire une adresse de la liste. */
export async function retirerProprietaire(client: SupabaseClient, email: string): Promise<void> {
  const { error } = await client.from('proprietaires').delete().eq('email', email);
  if (error) throw new Error(error.message);
}
