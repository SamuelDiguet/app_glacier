/**
 * Structure commune à toutes les pages : barre latérale sur ordinateur,
 * barre d'onglets en bas de l'écran sur smartphone.
 */
import { NavLink, Outlet } from 'react-router-dom';
import { Icone, type NomIcone } from './Icone';

/** Entrées du menu principal. */
const LIENS: { chemin: string; libelle: string; icone: NomIcone }[] = [
  { chemin: '/', libelle: 'Accueil', icone: 'accueil' },
  { chemin: '/planning', libelle: 'Planning', icone: 'planning' },
  { chemin: '/stocks', libelle: 'Stocks', icone: 'stocks' },
  { chemin: '/employes', libelle: 'Employés', icone: 'employes' },
  { chemin: '/parametres', libelle: 'Paramètres', icone: 'parametres' },
];

export function MiseEnPage() {
  return (
    <div className="app">
      <nav className="navigation" aria-label="Menu principal">
        <div className="marque">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={32} height={32} />
          <span>Glacier</span>
        </div>
        {LIENS.map((lien) => (
          <NavLink key={lien.chemin} to={lien.chemin} end={lien.chemin === '/'} className="lien-nav">
            <Icone nom={lien.icone} />
            <span>{lien.libelle}</span>
          </NavLink>
        ))}
      </nav>
      <main className="contenu">
        <Outlet />
      </main>
    </div>
  );
}
