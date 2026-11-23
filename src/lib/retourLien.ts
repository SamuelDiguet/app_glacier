/**
 * Lecture des paramètres qu'ajoute Supabase à l'adresse de l'app quand on
 * clique sur un lien reçu par e-mail (confirmation d'inscription, mot de
 * passe oublié).
 *
 * - Succès : `?code=…` (flux PKCE), échangé ensuite contre une session.
 * - Échec : `error_description=…`, dans la requête ou dans le fragment (#),
 *   par exemple pour un lien expiré ou déjà utilisé.
 *
 * Fonction pure, testée dans tests/retourLien.test.ts.
 */

/** Ce que l'adresse indique au retour d'un lien. */
export interface RetourLien {
  /** Vrai si l'adresse contient un code à échanger contre une session. */
  code: boolean;
  /** Message d'erreur transmis par Supabase, ou chaîne vide. */
  erreur: string;
}

/** Traductions des erreurs de lien les plus courantes (par code d'erreur). */
const ERREURS: Record<string, string> = {
  otp_expired: 'Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.',
  access_denied: 'Ce lien n’est plus valable. Demandez-en un nouveau.',
};

/** Analyse la partie requête (`?…`) et le fragment (`#…`) de l'adresse. */
export function lireRetourLien(requete: string, fragment: string): RetourLien {
  const parametres = new URLSearchParams(requete);
  // Le fragment peut contenir une route (#/planning) : on ne lit que s'il ressemble à des paramètres.
  const fragmentParametres = new URLSearchParams(fragment.replace(/^#\/?/, '').includes('=') ? fragment.replace(/^#\/?/, '') : '');
  const lire = (cle: string) => parametres.get(cle) ?? fragmentParametres.get(cle) ?? '';
  const description = lire('error_description');
  const codeErreur = lire('error_code') || lire('error');
  return {
    code: parametres.has('code'),
    erreur: description ? (ERREURS[codeErreur] ?? description.replace(/\+/g, ' ')) : '',
  };
}
