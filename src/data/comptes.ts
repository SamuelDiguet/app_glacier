/**
 * Opérations sur les comptes : inscription, confirmation par code reçu par
 * e-mail, connexion, mot de passe oublié, téléphone et déconnexion.
 *
 * Fines enveloppes autour de Supabase Auth qui traduisent les messages
 * d'erreur en français. Toutes lèvent une `ErreurCompte` lisible en cas d'échec.
 */
import type { AuthError, SupabaseClient } from '@supabase/supabase-js';
import { CLE_CACHE, effacerDonnees } from './stockage';

/** Traductions des erreurs Supabase les plus courantes (par code d'erreur). */
const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Adresse e-mail ou mot de passe incorrect.',
  email_not_confirmed: "Ce compte n'est pas encore confirmé : saisissez le code reçu par e-mail.",
  user_already_exists: 'Un compte existe déjà avec cette adresse.',
  weak_password: 'Mot de passe trop faible : 8 caractères minimum.',
  otp_expired: 'Ce code est incorrect ou a expiré. Demandez-en un nouveau.',
  over_email_send_rate_limit: "Trop d'e-mails envoyés. Réessayez dans quelques minutes.",
  over_request_rate_limit: 'Trop de tentatives. Réessayez dans quelques minutes.',
  same_password: "Le nouveau mot de passe doit être différent de l'ancien.",
};

/** Erreur de compte : message en français et code Supabase d'origine (ex. `email_not_confirmed`). */
export class ErreurCompte extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

/** Lève une erreur en français si Supabase a renvoyé une erreur. */
function verifier(erreur: AuthError | null): void {
  if (!erreur) return;
  // Pas de réponse du serveur (hors ligne, serveur injoignable).
  if (erreur.name === 'AuthRetryableFetchError') {
    throw new ErreurCompte('Serveur injoignable. Vérifiez votre connexion internet.', 'reseau');
  }
  const message = (erreur.code && MESSAGES[erreur.code]) || erreur.message;
  throw new ErreurCompte(message || 'Une erreur est survenue. Vérifiez votre connexion internet.', erreur.code);
}

/** Adresse où revient le lien de confirmation (la page d'accueil de l'app). */
function adresseRetour(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

/**
 * Crée un compte. Supabase envoie alors un e-mail de confirmation (lien,
 * et code si le modèle d'e-mail le contient). Le téléphone se renseigne
 * ensuite, facultativement, dans Paramètres > Mon compte.
 */
export async function inscrire(client: SupabaseClient, email: string, motDePasse: string) {
  const { error } = await client.auth.signUp({
    email: email.trim(),
    password: motDePasse,
    options: { emailRedirectTo: adresseRetour() },
  });
  verifier(error);
}

/** Valide un compte (ou une réinitialisation) avec le code reçu par e-mail. */
export async function verifierCode(
  client: SupabaseClient,
  email: string,
  code: string,
  type: 'signup' | 'recovery',
) {
  const { error } = await client.auth.verifyOtp({ email: email.trim(), token: code.trim(), type });
  verifier(error);
}

/** Renvoie l'e-mail de confirmation d'inscription. */
export async function renvoyerCode(client: SupabaseClient, email: string) {
  const { error } = await client.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: { emailRedirectTo: adresseRetour() },
  });
  verifier(error);
}

/** Ouvre une session avec e-mail et mot de passe. */
export async function connecter(client: SupabaseClient, email: string, motDePasse: string) {
  const { error } = await client.auth.signInWithPassword({ email: email.trim(), password: motDePasse });
  verifier(error);
}

/** Envoie un code pour choisir un nouveau mot de passe. */
export async function demanderReinitialisation(client: SupabaseClient, email: string) {
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: adresseRetour() });
  verifier(error);
}

/** Change le mot de passe du compte connecté. */
export async function changerMotDePasse(client: SupabaseClient, motDePasse: string) {
  const { error } = await client.auth.updateUser({ password: motDePasse });
  verifier(error);
}

/** Enregistre (ou efface) le numéro de téléphone du compte connecté. */
export async function modifierTelephone(client: SupabaseClient, telephone: string) {
  const { error } = await client.auth.updateUser({ data: { telephone: telephone.trim() } });
  verifier(error);
}

/** Ferme la session sur cet appareil et efface la copie hors ligne des données. */
export async function deconnecter(client: SupabaseClient) {
  effacerDonnees(CLE_CACHE);
  const { error } = await client.auth.signOut();
  verifier(error);
}
