/**
 * Page Paramètres : sauvegarde et restauration des données (fichier JSON),
 * données d'exemple et remise à zéro.
 *
 * Les données étant stockées dans le navigateur, l'export est le moyen
 * de les sauvegarder ou de les transférer vers un autre appareil.
 */
import { useRef, useState, type ChangeEvent } from 'react';
import { useDonnees } from '../data/DonneesContext';
import { donneesVides, estDonneesValides } from '../data/stockage';
import { donneesExemple } from '../data/exemple';
import { aujourdhui } from '../lib/dates';

export function Parametres() {
  const { donnees, dispatch } = useDonnees();
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
      dispatch({ type: 'donnees/remplacer', donnees: contenu });
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

      <div className="carte bloc">
        <h2>Sauvegarde</h2>
        <p>
          Les données sont enregistrées sur cet appareil, dans le navigateur. Exportez-les régulièrement
          pour les sauvegarder ou les transférer vers un autre appareil.
        </p>
        <div className="actions">
          <button className="bouton bouton-principal" onClick={exporter}>
            Exporter les données
          </button>
          <button className="bouton" onClick={() => champFichier.current?.click()}>
            Importer une sauvegarde
          </button>
          <input ref={champFichier} type="file" accept="application/json,.json" hidden onChange={importer} />
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
              remplacer('Effacer définitivement toutes les données ?', donneesVides(), 'Toutes les données ont été effacées.')
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
