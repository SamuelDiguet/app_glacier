/**
 * Formulaire de création / modification d'un employé.
 */
import { useState, type FormEvent } from 'react';
import type { Employe, Poste } from '../types';
import { LIBELLES_POSTE, LIBELLES_STATUT, POSTES, STATUTS } from '../lib/libelles';
import { nouvelId } from '../lib/ids';

interface Props {
  /** Employé à modifier, ou `undefined` pour en créer un nouveau. */
  employe?: Employe;
  onEnregistrer: (employe: Employe) => void;
  onSupprimer?: () => void;
}

/** Valeurs par défaut d'un nouvel employé. */
function nouvelEmploye(): Employe {
  return { id: nouvelId(), prenom: '', nom: '', telephone: '', postes: ['vente'], statut: 'standard', actif: true };
}

export function FormulaireEmploye({ employe, onEnregistrer, onSupprimer }: Props) {
  const [valeurs, setValeurs] = useState<Employe>(employe ?? nouvelEmploye());
  const [erreur, setErreur] = useState('');

  /** Met à jour un champ du formulaire. */
  const modifier = <K extends keyof Employe>(champ: K, valeur: Employe[K]) =>
    setValeurs((v) => ({ ...v, [champ]: valeur }));

  /** Coche ou décoche un poste. */
  const basculerPoste = (poste: Poste) =>
    modifier(
      'postes',
      valeurs.postes.includes(poste) ? valeurs.postes.filter((p) => p !== poste) : [...valeurs.postes, poste],
    );

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    if (!valeurs.prenom.trim()) return setErreur('Le prénom est obligatoire.');
    if (valeurs.postes.length === 0) return setErreur('Choisissez au moins un poste.');
    onEnregistrer({ ...valeurs, prenom: valeurs.prenom.trim(), nom: valeurs.nom.trim() });
  };

  return (
    <form className="formulaire" onSubmit={soumettre}>
      <div className="ligne-champs">
        <label>
          Prénom *
          <input value={valeurs.prenom} onChange={(e) => modifier('prenom', e.target.value)} autoFocus />
        </label>
        <label>
          Nom
          <input value={valeurs.nom} onChange={(e) => modifier('nom', e.target.value)} />
        </label>
      </div>

      <label>
        Téléphone
        <input
          type="tel"
          inputMode="tel"
          value={valeurs.telephone}
          onChange={(e) => modifier('telephone', e.target.value)}
        />
      </label>

      <fieldset>
        <legend>Postes *</legend>
        <div className="choix">
          {POSTES.map((poste) => (
            <label key={poste} className="case">
              <input
                type="checkbox"
                checked={valeurs.postes.includes(poste)}
                onChange={() => basculerPoste(poste)}
              />
              {LIBELLES_POSTE[poste]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Statut</legend>
        <div className="choix">
          {STATUTS.map((statut) => (
            <label key={statut} className="case">
              <input
                type="radio"
                name="statut"
                checked={valeurs.statut === statut}
                onChange={() => modifier('statut', statut)}
              />
              {LIBELLES_STATUT[statut]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="case">
        <input type="checkbox" checked={valeurs.actif} onChange={(e) => modifier('actif', e.target.checked)} />
        Actif (proposé dans le planning)
      </label>

      {erreur && <p className="erreur" role="alert">{erreur}</p>}

      <div className="actions-formulaire">
        {onSupprimer && (
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
