/**
 * Formulaire d'entrée ou de sortie de stock pour un produit.
 */
import { useState, type FormEvent } from 'react';
import type { FamilleStock, Mouvement, Produit, TypeMouvement } from '../types';
import { appliquerMouvement } from '../lib/stock';
import { nouvelId } from '../lib/ids';

interface Props {
  produit: Produit;
  typeInitial: TypeMouvement;
  onEnregistrer: (mouvement: Mouvement) => void;
}

/** Motifs proposés selon la famille et le sens du mouvement (saisie libre possible). */
export const MOTIFS: Record<FamilleStock, Record<TypeMouvement, string[]>> = {
  bac: {
    entree: ['Production', 'Inventaire'],
    sortie: ['Bac terminé', 'Perte', 'Inventaire'],
  },
  matiere: {
    entree: ['Livraison', 'Inventaire'],
    sortie: ['Utilisé en production', 'Perte / casse', 'Inventaire'],
  },
};

export function FormulaireMouvement({ produit, typeInitial, onEnregistrer }: Props) {
  const [type, setType] = useState<TypeMouvement>(typeInitial);
  const [quantite, setQuantite] = useState(1);
  const motifs = MOTIFS[produit.famille];
  const [motif, setMotif] = useState(motifs[typeInitial][0]);
  const [erreur, setErreur] = useState('');

  /** Change le sens du mouvement et propose le motif par défaut correspondant. */
  const changerType = (nouveau: TypeMouvement) => {
    setType(nouveau);
    setMotif(motifs[nouveau][0]);
  };

  // Aperçu de la quantité après le mouvement (ou message d'erreur).
  let apercu: string;
  try {
    apercu = `Nouveau stock : ${appliquerMouvement(produit, { type, quantite })} ${produit.unite}`;
  } catch (e) {
    apercu = (e as Error).message;
  }

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    try {
      // Vérifie le mouvement avant de l'envoyer (quantité positive, stock suffisant).
      appliquerMouvement(produit, { type, quantite });
    } catch (err) {
      return setErreur((err as Error).message);
    }
    onEnregistrer({
      id: nouvelId(),
      produitId: produit.id,
      type,
      quantite,
      date: new Date().toISOString(),
      motif: motif.trim(),
    });
  };

  return (
    <form className="formulaire" onSubmit={soumettre}>
      <p>
        Stock actuel : <strong>{produit.quantite} {produit.unite}</strong>
      </p>

      <div className="bascule" role="group" aria-label="Sens du mouvement">
        <button type="button" className={type === 'entree' ? 'actif entree' : ''} onClick={() => changerType('entree')} aria-pressed={type === 'entree'}>
          Entrée
        </button>
        <button type="button" className={type === 'sortie' ? 'actif sortie' : ''} onClick={() => changerType('sortie')} aria-pressed={type === 'sortie'}>
          Sortie
        </button>
      </div>

      <label>
        Quantité ({produit.unite})
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={quantite}
          onChange={(e) => setQuantite(Number(e.target.value))}
          autoFocus
        />
      </label>

      <label>
        Motif
        <input list={`motifs-${type}`} value={motif} onChange={(e) => setMotif(e.target.value)} />
        <datalist id={`motifs-${type}`}>
          {motifs[type].map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </label>

      <p className="aide">{apercu}</p>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}

      <div className="actions-formulaire">
        <button type="submit" className="bouton bouton-principal">
          Valider
        </button>
      </div>
    </form>
  );
}
