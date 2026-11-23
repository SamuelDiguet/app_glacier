/**
 * Page Paramètres : mon compte (mode connecté), sauvegarde et
 * restauration des données (fichier JSON), données d'exemple et remise à zéro.
 *
 * En mode local, les données sont stockées dans le navigateur : l'export
 * est le moyen de les sauvegarder ou de les transférer vers un autre appareil.
 * En mode connecté, elles sont sur le serveur, propres à chaque compte.
 */
import { useRef, useState, type ChangeEvent } from 'react';
import { useDonnees } from '../data/DonneesContext';
import { useSession } from '../data/SessionContext';
import { chargerDonnees, donneesVides, estDonneesValides, migrerDonnees } from '../data/stockage';
import { SectionCompte } from './ParametresCompte';
import { donneesExemple } from '../data/exemple';
import { aujourdhui } from '../lib/dates';

export function Parametres() {
  const { donnees, dispatch } = useDonnees();
  const session = useSession();
  // Données saisies sur cet appareil avant le passage au mode connecté.
  const [donneesAppareil] = useState(() => (session ? chargerDonnees() : null));
  const champFichier = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  /** Télécharge toutes les données dans un fichier JSON. */
  const exporter = () => {
    const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' });
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(blob);
    lien.download = `glacier-sauvegarde-${aujourdhui()}.json`;
    lien.click();
    URL.revokeObjectURL(lien.href);
  };

  /** Remplace les données par celles d'un fichier JSON exporté auparavant. */
  const importer = async (e: ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    e.target.value = ''; // Permet de réimporter le même fichier.
    if (!fichier) return;
    try {
      const contenu: unknown = JSON.parse(await fichier.text());
      if (!estDonneesValides(contenu)) throw new Error();
      if (!confirm('Remplacer toutes les données actuelles par celles du fichier ?')) return;
      dispatch({ type: 'donnees/remplacer', donnees: migrerDonnees(contenu) });
      setMessage('Données importées.');
    } catch {
      setMessage("Ce fichier n'est pas une sauvegarde valide.");
    }
  };

  /** Remplace les données après confirmation. */
  const remplacer = (question: string, nouvelles: typeof donnees, confirmation: string) => {
    if (!confirm(question)) return;
    dispatch({ type: 'donnees/remplacer', donnees: nouvelles });
    setMessage(confirmation);
  };

  return (
    <section>
      <header className="entete-page">
        <h1>Paramètres</h1>
      </header>

      {session && <SectionCompte session={session} />}

      <div className="carte bloc">
        <h2>Sauvegarde</h2>
        <p>
          {session
            ? 'Les données de votre compte sont enregistrées sur le serveur : vous les retrouvez sur tous vos appareils. Un export permet d’en garder une copie de sécurité.'
            : 'Les données sont enregistrées sur cet appareil, dans le navigateur. Exportez-les régulièrement pour les sauvegarder ou les transférer vers un autre appareil.'}
        </p>
        <div className="actions">
          <button className="bouton bouton-principal" onClick={exporter}>
            Exporter les données
          </button>
          <button className="bouton" onClick={() => champFichier.current?.click()}>
            Importer une sauvegarde
          </button>
          <input ref={champFichier} type="file" accept="application/json,.json" hidden onChange={importer} />
          {donneesAppareil && (
            <button
              className="bouton"
              onClick={() =>
                remplacer(
                  'Remplacer les données du serveur par celles enregistrées sur cet appareil avant la connexion ?',
                  donneesAppareil,
                  'Données de cet appareil envoyées sur le serveur.',
                )
              }
            >
              Envoyer les données de cet appareil
            </button>
          )}
        </div>
      </div>

      <div className="carte bloc">
        <h2>Réinitialisation</h2>
        <div className="actions">
          <button
            className="bouton"
            onClick={() =>
              remplacer('Remplacer les données actuelles par les données d’exemple ?', donneesExemple(), 'Données d’exemple chargées.')
            }
          >
            Charger les données d'exemple
          </button>
          <button
            className="bouton bouton-danger"
            onClick={() =>
              remplacer(
                session
                  ? 'Effacer définitivement toutes les données de votre compte, sur tous vos appareils ?'
                  : 'Effacer définitivement toutes les données ?',
                donneesVides(), 'Toutes les données ont été effacées.')
            }
          >
            Tout effacer
          </button>
        </div>
      </div>

      {message && <p className="info" role="status">{message}</p>}

      <p className="aide">Gestion glacier · version {__VERSION_APP__}</p>
    </section>
  );
}
