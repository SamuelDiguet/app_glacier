/**
 * Structure commune à toutes les pages : barre latérale sur ordinateur,
 * barre d'onglets en bas de l'écran sur smartphone, et barre du haut
 * avec le bouton de thème clair / sombre.
 */
import { NavLink, Outlet } from 'react-router-dom';
import { Icone, type NomIcone } from './Icone';
import { BoutonTheme } from './BoutonTheme';

/** Entrées du menu principal. */
const LIENS: { chemin: string; libelle: string; icone: NomIcone }[] = [
  { chemin: '/', libelle: 'Accueil', icone: 'accueil' },
  { chemin: '/planning', libelle: 'Planning', icone: 'planning' },
  { chemin: '/stocks', libelle: 'Stocks', icone: 'stocks' },
  { chemin: '/employes', libelle: 'Employés', icone: 'employes' },
  { chemin: '/parametres', libelle: 'Paramètres', icone: 'parametres' },
];

/** Logo et nom de l'application. */
function Marque() {
  return (
    <div className="marque">
      <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={32} height={32} />
      <span>Glacier</span>
    </div>
  );
}

export function MiseEnPage() {
  return (
    <div className="app">
      <nav className="navigation" aria-label="Menu principal">
        <Marque />
        {LIENS.map((lien) => (
          <NavLink key={lien.chemin} to={lien.chemin} end={lien.chemin === '/'} className="lien-nav">
            <Icone nom={lien.icone} />
            <span>{lien.libelle}</span>
          </NavLink>
        ))}
      </nav>
      <main className="contenu">
        <div className="barre-haut">
          <Marque />
          <BoutonTheme />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
