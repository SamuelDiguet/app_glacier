/**
 * Section « Mon compte » de la page Paramètres (mode connecté) :
 * e-mail, téléphone, mot de passe et déconnexion.
 */
import { useState, type FormEvent } from 'react';
import type { EtatSession } from '../data/SessionContext';
import { changerMotDePasse, deconnecter, modifierTelephone } from '../data/comptes';
import { LONGUEUR_MIN_MOT_DE_PASSE } from './Connexion';

/** Texte d'une erreur quelconque. */
function texteErreur(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Compte connecté : coordonnées, mot de passe et déconnexion. */
export function SectionCompte({ session }: { session: EtatSession }) {
  const utilisateur = session.session!.user;
  const [telephone, setTelephone] = useState<string>(utilisateur.user_metadata.telephone ?? '');
  const [motDePasse, setMotDePasse] = useState('');
  const [message, setMessage] = useState('');

  /** Lance une opération et affiche son résultat. */
  const executer = async (operation: () => Promise<void>, succes: string) => {
    try {
      await operation();
      setMessage(succes);
    } catch (e) {
      setMessage(texteErreur(e));
    }
  };

  const enregistrerTelephone = (e: FormEvent) => {
    e.preventDefault();
    executer(() => modifierTelephone(session.client, telephone), 'Téléphone enregistré.');
  };

  const enregistrerMotDePasse = (e: FormEvent) => {
    e.preventDefault();
    if (motDePasse.length < LONGUEUR_MIN_MOT_DE_PASSE) {
      return setMessage(`Le mot de passe doit faire au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`);
    }
    executer(async () => {
      await changerMotDePasse(session.client, motDePasse);
      setMotDePasse('');
    }, 'Mot de passe modifié.');
  };

  return (
    <div className="carte bloc">
      <h2>Mon compte</h2>
      <p>
        Connecté avec <strong>{utilisateur.email}</strong>
      </p>
      <form className="formulaire formulaire-ligne" onSubmit={enregistrerTelephone}>
        <label>
          Téléphone (facultatif)
          <input type="tel" inputMode="tel" autoComplete="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        </label>
        <button type="submit" className="bouton">Enregistrer</button>
      </form>
      <form className="formulaire formulaire-ligne" onSubmit={enregistrerMotDePasse}>
        <label>
          Nouveau mot de passe
          <input type="password" autoComplete="new-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
        </label>
        <button type="submit" className="bouton">Modifier</button>
      </form>
      {message && <p className="info" role="status">{message}</p>}
      <div className="actions">
        <button className="bouton bouton-danger" onClick={() => executer(() => deconnecter(session.client), '')}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
