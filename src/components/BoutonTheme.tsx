/**
 * Bouton lune / soleil pour basculer entre thème clair et thème sombre.
 * Affiche la lune en thème clair (passer au sombre) et le soleil en
 * thème sombre (passer au clair).
 */
import { useState } from 'react';
import { choisirTheme, themeActuel, type Theme } from '../lib/theme';
import { Icone } from './Icone';

export function BoutonTheme() {
  const [theme, setTheme] = useState<Theme>(themeActuel);
  const suivant: Theme = theme === 'clair' ? 'sombre' : 'clair';

  const basculer = () => {
    choisirTheme(suivant);
    setTheme(suivant);
  };

  return (
    <button
      type="button"
      className="bouton-icone"
      onClick={basculer}
      aria-label={suivant === 'sombre' ? 'Passer au thème sombre' : 'Passer au thème clair'}
      title={suivant === 'sombre' ? 'Thème sombre' : 'Thème clair'}
    >
      <Icone nom={theme === 'clair' ? 'lune' : 'soleil'} />
    </button>
  );
}
