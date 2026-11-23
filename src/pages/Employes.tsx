/**
 * Page Employés : liste de l'équipe, filtres par poste et ajout/modification.
 */
import { useMemo, useState } from 'react';
import type { Employe, Poste } from '../types';
import { useDonnees } from '../data/DonneesContext';
import { Fenetre } from '../components/Fenetre';
import { BadgePoste, BadgeStatut } from '../components/Badge';
import { Icone } from '../components/Icone';
import { LIBELLES_POSTE, POSTES, STATUTS } from '../lib/libelles';
import { FormulaireEmploye } from './FormulaireEmploye';

/** Fenêtre ouverte : création (`null`) ou modification d'un employé, ou fermée (`undefined`). */
type Edition = Employe | null | undefined;

export function Employes() {
  const { donnees, dispatch } = useDonnees();
  const [filtre, setFiltre] = useState<Poste | 'tous'>('tous');
  const [edition, setEdition] = useState<Edition>(undefined);

  // Employés filtrés et triés : actifs d'abord, puis par prénom.
  const employes = useMemo(
    () =>
      donnees.employes
        .filter((e) => filtre === 'tous' || e.postes.includes(filtre))
        .sort((a, b) => Number(b.actif) - Number(a.actif) || a.prenom.localeCompare(b.prenom, 'fr')),
    [donnees.employes, filtre],
  );

  const enregistrer = (employe: Employe) => {
    dispatch({ type: 'employe/enregistrer', employe });
    setEdition(undefined);
  };

  const supprimer = (employe: Employe) => {
    if (!confirm(`Supprimer ${employe.prenom} ? Ses créneaux de planning seront aussi supprimés.`)) return;
    dispatch({ type: 'employe/supprimer', id: employe.id });
    setEdition(undefined);
  };

  return (
    <section>
      <header className="entete-page">
        <h1>Employés</h1>
        <button className="bouton bouton-principal" onClick={() => setEdition(null)}>
          <Icone nom="plus" /> Ajouter
        </button>
      </header>

      <div className="filtres" role="group" aria-label="Filtrer par poste">
        {(['tous', ...POSTES] as const).map((valeur) => (
          <button
            key={valeur}
            className={`puce ${filtre === valeur ? 'puce-active' : ''}`}
            onClick={() => setFiltre(valeur)}
            aria-pressed={filtre === valeur}
          >
            {valeur === 'tous' ? 'Tous' : LIBELLES_POSTE[valeur]}
          </button>
        ))}
      </div>

      {employes.length === 0 ? (
        <p className="vide">Aucun employé pour le moment. Ajoutez le premier membre de l'équipe.</p>
      ) : (
        <ul className="grille-cartes">
          {employes.map((employe) => (
            <li key={employe.id}>
              <button className={`carte carte-cliquable ${employe.actif ? '' : 'inactif'}`} onClick={() => setEdition(employe)}>
                <div className="avatar" aria-hidden="true">
                  {employe.prenom.charAt(0)}
                  {employe.nom.charAt(0)}
                </div>
                <div className="carte-texte">
                  <strong>
                    {employe.prenom} {employe.nom}
                  </strong>
                  <div className="badges">
                    {STATUTS.filter((s) => employe.statuts.includes(s)).map((s) => (
                      <BadgeStatut key={s} statut={s} />
                    ))}
                    {employe.postes.map((p) => (
                      <BadgePoste key={p} poste={p} />
                    ))}
                    {!employe.majeur && <span className="badge badge-mineur">Mineur</span>}
                    {!employe.actif && <span className="badge">Inactif</span>}
                  </div>
                  {employe.telephone && <small>{employe.telephone}</small>}
                  {employe.notes && <small className="carte-notes">{employe.notes}</small>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Fenetre
        titre={edition ? `Modifier ${edition.prenom}` : 'Nouvel employé'}
        ouverte={edition !== undefined}
        onFermer={() => setEdition(undefined)}
      >
        <FormulaireEmploye
          key={edition?.id ?? 'nouveau'}
          employe={edition ?? undefined}
          onEnregistrer={enregistrer}
          onSupprimer={edition ? () => supprimer(edition) : undefined}
        />
      </Fenetre>
    </section>
  );
}
