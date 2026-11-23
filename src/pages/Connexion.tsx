/**
 * Écran de connexion (mode connecté) : connexion, création de compte,
 * confirmation par code reçu par e-mail et mot de passe oublié.
 *
 * Affiché tant que personne n'est connecté. Une fois la session ouverte,
 * App affiche l'application (ou « compte non autorisé »).
 */
import { useState, type FormEvent, type ReactNode } from 'react';
import { useSession } from '../data/SessionContext';
import { ErreurCompte, connecter, demanderReinitialisation, inscrire, renvoyerCode, verifierCode } from '../data/comptes';
import { EcranCentre } from '../components/EcranCentre';

/** Étapes possibles de l'écran. */
type Etape = 'connexion' | 'inscription' | 'confirmation' | 'oubli' | 'oubli-code';

/** Longueur minimale d'un mot de passe (identique au réglage Supabase). */
export const LONGUEUR_MIN_MOT_DE_PASSE = 8;

export function Connexion() {
  const session = useSession()!;
  const [etape, setEtape] = useState<Etape>('connexion');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [envoi, setEnvoi] = useState(false);

  /** Change d'étape en effaçant les messages. */
  const aller = (suivante: Etape, message = '') => {
    setEtape(suivante);
    setErreur('');
    setInfo(message);
    setCode('');
  };

  /** Exécute une opération en affichant l'attente puis l'éventuelle erreur. */
  const executer = async (operation: () => Promise<void>) => {
    setEnvoi(true);
    setErreur('');
    try {
      await operation();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnvoi(false);
    }
  };

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    const { client } = session;
    switch (etape) {
      case 'connexion':
        return executer(async () => {
          try {
            await connecter(client, email, motDePasse);
          } catch (err) {
            // Compte pas encore confirmé : on propose directement la saisie du code.
            if (err instanceof ErreurCompte && err.code === 'email_not_confirmed') {
              await renvoyerCode(client, email);
              aller('confirmation', 'Un nouveau code vient de vous être envoyé par e-mail.');
              return;
            }
            throw err;
          }
        });
      case 'inscription':
        if (motDePasse.length < LONGUEUR_MIN_MOT_DE_PASSE) {
          return setErreur(`Le mot de passe doit faire au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`);
        }
        return executer(async () => {
          await inscrire(client, email, motDePasse, telephone);
          aller('confirmation', `Un code de confirmation a été envoyé à ${email.trim()}.`);
        });
      case 'confirmation':
        // La validation du code ouvre la session : App bascule alors sur l'application.
        return executer(() => verifierCode(client, email, code, 'signup'));
      case 'oubli':
        return executer(async () => {
          await demanderReinitialisation(client, email);
          aller('oubli-code', `Si un compte existe pour ${email.trim()}, un code vient de lui être envoyé.`);
        });
      case 'oubli-code':
        return executer(async () => {
          session.demarrerReinitialisation();
          try {
            await verifierCode(client, email, code, 'recovery');
          } catch (err) {
            session.finirReinitialisation();
            throw err;
          }
        });
    }
  };

  return (
    <EcranCentre titre={TITRES[etape]}>
      <form className="formulaire" onSubmit={soumettre}>
        {info && <p className="info" role="status">{info}</p>}

        {(etape === 'connexion' || etape === 'inscription' || etape === 'oubli') && (
          <label>
            E-mail
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </label>
        )}

        {(etape === 'connexion' || etape === 'inscription') && (
          <label>
            Mot de passe
            <input
              type="password"
              autoComplete={etape === 'inscription' ? 'new-password' : 'current-password'}
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
            {etape === 'inscription' && <small className="aide-champ">{LONGUEUR_MIN_MOT_DE_PASSE} caractères minimum.</small>}
          </label>
        )}

        {etape === 'inscription' && (
          <label>
            Téléphone (facultatif)
            <input type="tel" inputMode="tel" autoComplete="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
          </label>
        )}

        {(etape === 'confirmation' || etape === 'oubli-code') && (
          <label>
            Code reçu par e-mail
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
              autoFocus
            />
          </label>
        )}

        {erreur && <p className="erreur" role="alert">{erreur}</p>}

        <button type="submit" className="bouton bouton-principal" disabled={envoi}>
          {envoi ? 'Patientez…' : BOUTONS[etape]}
        </button>

        <div className="liens-connexion">
          {etape === 'connexion' && (
            <>
              <Lien onClick={() => aller('inscription')}>Créer un compte</Lien>
              <Lien onClick={() => aller('oubli')}>Mot de passe oublié ?</Lien>
            </>
          )}
          {etape === 'confirmation' && (
            <Lien
              onClick={() =>
                executer(async () => {
                  await renvoyerCode(session.client, email);
                  setInfo('Nouveau code envoyé.');
                })
              }
            >
              Renvoyer le code
            </Lien>
          )}
          {etape !== 'connexion' && <Lien onClick={() => aller('connexion')}>Retour à la connexion</Lien>}
        </div>
      </form>
    </EcranCentre>
  );
}

/** Titre affiché pour chaque étape. */
const TITRES: Record<Etape, string> = {
  connexion: 'Connexion',
  inscription: 'Créer un compte',
  confirmation: 'Confirmer votre adresse',
  oubli: 'Mot de passe oublié',
  'oubli-code': 'Mot de passe oublié',
};

/** Libellé du bouton principal pour chaque étape. */
const BOUTONS: Record<Etape, string> = {
  connexion: 'Se connecter',
  inscription: 'Créer le compte',
  confirmation: 'Valider',
  oubli: 'Recevoir un code',
  'oubli-code': 'Valider le code',
};

/** Bouton présenté comme un lien, pour passer d'une étape à l'autre. */
function Lien({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="lien-bouton" onClick={onClick}>
      {children}
    </button>
  );
}
