/**
 * Formulaire de création / modification d'une tâche ou d'un rendez-vous.
 */
import { useState, type FormEvent } from 'react';
import type { Tache } from '../types';

interface Props {
  tache: Tache;
  /** Vrai si la tâche existe déjà (affiche le bouton Supprimer). */
  existante: boolean;
  onEnregistrer: (tache: Tache) => void;
  onSupprimer: () => void;
}

export function FormulaireTache({ tache, existante, onEnregistrer, onSupprimer }: Props) {
  const [valeurs, setValeurs] = useState<Tache>(tache);
  const [erreur, setErreur] = useState('');

  /** Met à jour un champ du formulaire. */
  const modifier = <K extends keyof Tache>(champ: K, valeur: Tache[K]) =>
    setValeurs((v) => ({ ...v, [champ]: valeur }));

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    if (!valeurs.titre.trim()) return setErreur('Le titre est obligatoire.');
    onEnregistrer({
      ...valeurs,
      titre: valeurs.titre.trim(),
      note: valeurs.note.trim(),
      // Une heure n'a de sens qu'avec une date.
      heure: valeurs.date ? valeurs.heure : '',
    });
  };

  return (
    <form className="formulaire" onSubmit={soumettre}>
      <label>
        Titre *
        <input
          value={valeurs.titre}
          onChange={(e) => modifier('titre', e.target.value)}
          placeholder="Rendez-vous, commande, appel…"
          autoFocus
        />
      </label>

      <div className="ligne-champs">
        <label>
          Date
          <input type="date" value={valeurs.date} onChange={(e) => modifier('date', e.target.value)} />
        </label>
        <label>
          Heure
          <input
            type="time"
            value={valeurs.heure}
            disabled={!valeurs.date}
            onChange={(e) => modifier('heure', e.target.value)}
          />
        </label>
      </div>

      <label>
        Notes
        <textarea
          rows={3}
          value={valeurs.note}
          onChange={(e) => modifier('note', e.target.value)}
          placeholder="Adresse, personne à contacter, détails…"
        />
      </label>

      <label className="case">
        <input type="checkbox" checked={valeurs.faite} onChange={(e) => modifier('faite', e.target.checked)} />
        Fait
      </label>

      {erreur && <p className="erreur" role="alert">{erreur}</p>}

      <div className="actions-formulaire">
        {existante && (
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
