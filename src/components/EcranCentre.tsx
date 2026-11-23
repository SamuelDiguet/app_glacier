/**
 * Écran plein, centré, avec le logo : utilisé hors de la mise en page
 * principale (connexion, chargement, compte non autorisé…).
 */
import type { ReactNode } from 'react';
import { BoutonTheme } from './BoutonTheme';

export function EcranCentre({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <main className="ecran-centre">
      <div className="ecran-centre-theme">
        <BoutonTheme />
      </div>
      <div className="carte bloc carte-centre">
        <div className="marque-centre">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={48} height={48} />
          <span>Glacier</span>
        </div>
        <h1>{titre}</h1>
        {children}
      </div>
    </main>
  );
}
