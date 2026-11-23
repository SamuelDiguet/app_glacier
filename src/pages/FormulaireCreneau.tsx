/**
 * Formulaire de création / modification d'un créneau de planning.
 * Les problèmes (horaires, poste, double affectation) sont vérifiés
 * avant l'enregistrement.
 */
import { useState, type FormEvent } from 'react';
import type { Creneau, Employe } from '../types';
import { useDonnees } from '../data/DonneesContext';
import { LIBELLES_POSTE } from '../lib/libelles';
import { verifierCreneau } from '../lib/planning';
import { dureeHeures, formaterHeures } from '../lib/dates';

interface Props {
  creneau: Creneau;
  /** Vrai si le créneau existe déjà (affiche le bouton Supprimer). */
  existant: boolean;
  onEnregistrer: (creneau: Creneau) => void;
  onSupprimer: () => void;
}

export function FormulaireCreneau({ creneau, existant, onEnregistrer, onSupprimer }: Props) {
  const { donnees } = useDonnees();
  const [valeurs, setValeurs] = useState<Creneau>(creneau);
  const [problemes, setProblemes] = useState<string[]>([]);

  // Employés proposés : les actifs, plus celui déjà affecté s'il est devenu inactif.
  const employesProposes = donnees.employes
    .filter((e) => e.actif || e.id === creneau.employeId)
    .sort((a, b) => a.prenom.localeCompare(b.prenom, 'fr'));
  const employe: Employe | undefined = donnees.employes.find((e) => e.id === valeurs.employeId);

  const modifier = <K extends keyof Creneau>(champ: K, valeur: Creneau[K]) =>
    setValeurs((v) => ({ ...v, [champ]: valeur }));

  /** Au changement d'employé, on choisit d'office un poste qu'il sait tenir. */
  const choisirEmploye = (id: string) => {
    const choisi = donnees.employes.find((e) => e.id === id);
    setValeurs((v) => ({
      ...v,
      employeId: id,
      poste: choisi && !choisi.postes.includes(v.poste) ? choisi.postes[0] : v.poste,
    }));
  };

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    if (!valeurs.employeId) return setProblemes(['Choisissez un employé.']);
    const trouves = verifierCreneau(valeurs, employe, donnees.creneaux);
    if (trouves.length > 0) return setProblemes(trouves);
    onEnregistrer(valeurs);
  };

  if (employesProposes.length === 0) {
    return <p className="vide">Ajoutez d'abord des employés (actifs) pour construire le planning.</p>;
  }

  return (
    <form className="formulaire" onSubmit={soumettre}>
      <label>
        Employé *
        <select value={valeurs.employeId} onChange={(e) => choisirEmploye(e.target.value)}>
          <option value="">— Choisir —</option>
          {employesProposes.map((e) => (
            <option key={e.id} value={e.id}>
              {e.prenom} {e.nom}
            </option>
          ))}
        </select>
      </label>

      <label>
        Poste
        <select value={valeurs.poste} onChange={(e) => modifier('poste', e.target.value as Creneau['poste'])}>
          {(employe?.postes ?? (['vente', 'production'] as const)).map((p) => (
            <option key={p} value={p}>
              {LIBELLES_POSTE[p]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Jour
        <input type="date" value={valeurs.date} onChange={(e) => modifier('date', e.target.value)} required />
      </label>

      <div className="ligne-champs">
        <label>
          Début
          <input type="time" value={valeurs.debut} onChange={(e) => modifier('debut', e.target.value)} required />
        </label>
        <label>
          Fin
          <input type="time" value={valeurs.fin} onChange={(e) => modifier('fin', e.target.value)} required />
        </label>
      </div>
      <p className="aide">Durée : {formaterHeures(dureeHeures(valeurs.debut, valeurs.fin))}</p>

      <label>
        Note
        <input value={valeurs.note} onChange={(e) => modifier('note', e.target.value)} placeholder="Facultatif" />
      </label>

      {problemes.length > 0 && (
        <ul className="erreur" role="alert">
          {problemes.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      <div className="actions-formulaire">
        {existant && (
          <button type="button" className="bouton bouton-danger" onClick={onSupprimer}>
            Supprimer
          </button>
        )}
        <button type="submit" className="bouton bouton-principal">
          Enregistrer
        </button>
      </div>
    </form>
  );
}
