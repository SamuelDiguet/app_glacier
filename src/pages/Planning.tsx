/**
 * Page Planning : vue de la semaine (lundi → dimanche), navigation entre
 * semaines, ajout et modification de créneaux, total d'heures par employé.
 */
import { useMemo, useState } from 'react';
import type { Creneau, Poste } from '../types';
import { useDonnees } from '../data/DonneesContext';
import { Fenetre } from '../components/Fenetre';
import { Icone } from '../components/Icone';
import { LIBELLES_POSTE, POSTES } from '../lib/libelles';
import { heuresParEmploye, trierCreneaux } from '../lib/planning';
import { nouvelId } from '../lib/ids';
import {
  ajouterJours,
  aujourdhui,
  formaterHeures,
  formaterJourCourt,
  joursDeLaSemaine,
  lundiDeLaSemaine,
} from '../lib/dates';
import { FormulaireCreneau } from './FormulaireCreneau';

/** Créneau en cours d'édition et indication s'il existe déjà. */
interface Edition {
  creneau: Creneau;
  existant: boolean;
}

export function Planning() {
  const { donnees, dispatch } = useDonnees();
  const [lundi, setLundi] = useState(() => lundiDeLaSemaine(aujourdhui()));
  const [filtre, setFiltre] = useState<Poste | 'tous'>('tous');
  const [edition, setEdition] = useState<Edition | null>(null);

  const jours = joursDeLaSemaine(lundi);
  const dimanche = jours[6];
  const jourCourant = aujourdhui();

  // Index des employés par id, pour afficher les noms rapidement.
  const employesParId = useMemo(
    () => new Map(donnees.employes.map((e) => [e.id, e])),
    [donnees.employes],
  );

  // Créneaux de la semaine affichée (filtrés par poste), triés.
  const creneauxSemaine = useMemo(
    () =>
      trierCreneaux(
        donnees.creneaux.filter(
          (c) => c.date >= lundi && c.date <= dimanche && (filtre === 'tous' || c.poste === filtre),
        ),
      ),
    [donnees.creneaux, lundi, dimanche, filtre],
  );

  const totaux = useMemo(() => heuresParEmploye(creneauxSemaine), [creneauxSemaine]);

  /** Ouvre le formulaire pour un nouveau créneau sur le jour choisi. */
  const ajouter = (date: string) =>
    setEdition({
      creneau: {
        id: nouvelId(),
        employeId: '',
        poste: filtre === 'tous' ? 'vente' : filtre,
        date,
        debut: '10:00',
        fin: '14:00',
        note: '',
      },
      existant: false,
    });

  const enregistrer = (creneau: Creneau) => {
    dispatch({ type: 'creneau/enregistrer', creneau });
    setEdition(null);
  };

  const supprimer = (id: string) => {
    if (!confirm('Supprimer ce créneau ?')) return;
    dispatch({ type: 'creneau/supprimer', id });
    setEdition(null);
  };

  /** Recopie les créneaux de la semaine précédente sur la semaine affichée. */
  const copierSemainePrecedente = () => {
    const lundiPrecedent = ajouterJours(lundi, -7);
    const nombre = donnees.creneaux.filter((c) => c.date >= lundiPrecedent && c.date < lundi).length;
    if (nombre === 0) return alert('La semaine précédente est vide.');
    if (!confirm(`Copier les ${nombre} créneaux de la semaine précédente sur cette semaine ?`)) return;
    dispatch({ type: 'creneau/copierSemaine', lundiSource: lundiPrecedent, lundiCible: lundi });
  };

  return (
    <section>
      <header className="entete-page">
        <h1>Planning</h1>
        <button className="bouton bouton-principal" onClick={() => ajouter(jours.includes(jourCourant) ? jourCourant : lundi)}>
          <Icone nom="plus" /> Créneau
        </button>
      </header>

      <div className="navigation-semaine">
        <button className="bouton-icone" onClick={() => setLundi(ajouterJours(lundi, -7))} aria-label="Semaine précédente">
          <Icone nom="gauche" />
        </button>
        <button className="bouton bouton-discret" onClick={() => setLundi(lundiDeLaSemaine(jourCourant))}>
          Du {formaterJourCourt(lundi)} au {formaterJourCourt(dimanche)}
        </button>
        <button className="bouton-icone" onClick={() => setLundi(ajouterJours(lundi, 7))} aria-label="Semaine suivante">
          <Icone nom="droite" />
        </button>
      </div>

      <div className="filtres" role="group" aria-label="Filtrer par poste">
        {(['tous', ...POSTES] as const).map((valeur) => (
          <button
            key={valeur}
            className={`puce ${filtre === valeur ? 'puce-active' : ''}`}
            onClick={() => setFiltre(valeur)}
            aria-pressed={filtre === valeur}
          >
            {valeur === 'tous' ? 'Tous les postes' : LIBELLES_POSTE[valeur]}
          </button>
        ))}
        <button className="puce" onClick={copierSemainePrecedente}>
          Copier la semaine précédente
        </button>
      </div>

      <div className="semaine">
        {jours.map((jour) => {
          const creneauxDuJour = creneauxSemaine.filter((c) => c.date === jour);
          return (
            <div key={jour} className={`jour ${jour === jourCourant ? 'jour-courant' : ''}`}>
              <div className="jour-entete">
                <span>{formaterJourCourt(jour)}</span>
                <button className="bouton-icone petit" onClick={() => ajouter(jour)} aria-label={`Ajouter un créneau le ${formaterJourCourt(jour)}`}>
                  <Icone nom="plus" taille={16} />
                </button>
              </div>
              {creneauxDuJour.length === 0 && <p className="jour-vide">Personne</p>}
              {creneauxDuJour.map((c) => {
                const employe = employesParId.get(c.employeId);
                return (
                  <button
                    key={c.id}
                    className={`creneau creneau-${c.poste}`}
                    onClick={() => setEdition({ creneau: c, existant: true })}
                  >
                    <strong>{employe ? employe.prenom : 'Employé supprimé'}</strong>
                    <span>
                      {c.debut} – {c.fin}
                    </span>
                    <small>
                      {LIBELLES_POSTE[c.poste]}
                      {c.note && ` · ${c.note}`}
                    </small>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {totaux.size > 0 && (
        <div className="carte bloc">
          <h2>Heures de la semaine</h2>
          <ul className="liste-simple">
            {[...totaux.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([id, heures]) => {
                const e = employesParId.get(id);
                return (
                  <li key={id}>
                    <span>{e ? `${e.prenom} ${e.nom}` : 'Employé supprimé'}</span>
                    <strong>{formaterHeures(heures)}</strong>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      <Fenetre
        titre={edition?.existant ? 'Modifier le créneau' : 'Nouveau créneau'}
        ouverte={edition !== null}
        onFermer={() => setEdition(null)}
      >
        {edition && (
          <FormulaireCreneau
            key={edition.creneau.id}
            creneau={edition.creneau}
            existant={edition.existant}
            onEnregistrer={enregistrer}
            onSupprimer={() => supprimer(edition.creneau.id)}
          />
        )}
      </Fenetre>
    </section>
  );
}
