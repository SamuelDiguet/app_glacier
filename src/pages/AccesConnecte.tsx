/**
 * Écrans de passage du mode connecté, affichés à la place de l'application :
 * chargement de la session et choix d'un nouveau mot de passe.
 */
import { useState, type FormEvent } from 'react';
import { useSession } from '../data/SessionContext';
import { changerMotDePasse } from '../data/comptes';
import { EcranCentre } from '../components/EcranCentre';
import { LONGUEUR_MIN_MOT_DE_PASSE } from './Connexion';

/** Attente pendant la vérification de la session. */
export function EcranChargement() {
  return (
    <EcranCentre titre="Chargement…">
      <p className="sous-titre">Connexion au serveur en cours.</p>
    </EcranCentre>
  );
}

/** Choix d'un nouveau mot de passe après un code « mot de passe oublié ». */
export function NouveauMotDePasse() {
  const session = useSession()!;
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    if (motDePasse.length < LONGUEUR_MIN_MOT_DE_PASSE) {
      return setErreur(`Le mot de passe doit faire au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`);
    }
    setEnvoi(true);
    try {
      await changerMotDePasse(session.client, motDePasse);
      session.finirReinitialisation();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : String(err));
      setEnvoi(false);
    }
  };

  return (
    <EcranCentre titre="Nouveau mot de passe">
      <form className="formulaire" onSubmit={soumettre}>
        <label>
          Nouveau mot de passe
          <input
            type="password"
            autoComplete="new-password"
            required
            autoFocus
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
          <small className="aide-champ">{LONGUEUR_MIN_MOT_DE_PASSE} caractères minimum.</small>
        </label>
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
        <button type="submit" className="bouton bouton-principal" disabled={envoi}>
          {envoi ? 'Patientez…' : 'Enregistrer'}
        </button>
      </form>
    </EcranCentre>
  );
}
