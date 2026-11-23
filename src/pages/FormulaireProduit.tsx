/**
 * Formulaire de création / modification d'un produit en stock.
 * La quantité n'est saisie qu'à la création : ensuite, elle évolue
 * uniquement par des mouvements d'entrée et de sortie (traçabilité).
 */
import { useState, type FormEvent } from 'react';
import type { Produit } from '../types';
import { CATEGORIES_PRODUIT, UNITES } from '../lib/libelles';
import { nouvelId } from '../lib/ids';

interface Props {
  produit?: Produit;
  onEnregistrer: (produit: Produit) => void;
  onSupprimer?: () => void;
}

function nouveauProduit(): Produit {
  return { id: nouvelId(), nom: '', categorie: 'Glaces', unite: 'bac', quantite: 0, seuilAlerte: 1 };
}

export function FormulaireProduit({ produit, onEnregistrer, onSupprimer }: Props) {
  const [valeurs, setValeurs] = useState<Produit>(produit ?? nouveauProduit());
  const [erreur, setErreur] = useState('');

  const modifier = <K extends keyof Produit>(champ: K, valeur: Produit[K]) =>
    setValeurs((v) => ({ ...v, [champ]: valeur }));

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    if (!valeurs.nom.trim()) return setErreur('Le nom est obligatoire.');
    if (valeurs.quantite < 0 || valeurs.seuilAlerte < 0) return setErreur('Les quantités ne peuvent pas être négatives.');
    onEnregistrer({ ...valeurs, nom: valeurs.nom.trim(), categorie: valeurs.categorie.trim() || 'Autres' });
  };

  return (
    <form className="formulaire" onSubmit={soumettre}>
      <label>
        Nom *
        <input value={valeurs.nom} onChange={(e) => modifier('nom', e.target.value)} autoFocus />
      </label>

      <div className="ligne-champs">
        <label>
          Catégorie
          <input
            list="categories-produit"
            value={valeurs.categorie}
            onChange={(e) => modifier('categorie', e.target.value)}
          />
          <datalist id="categories-produit">
            {CATEGORIES_PRODUIT.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label>
          Unité
          <select value={valeurs.unite} onChange={(e) => modifier('unite', e.target.value as Produit['unite'])}>
            {UNITES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="ligne-champs">
        {!produit && (
          <label>
            Quantité initiale
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={valeurs.quantite}
              onChange={(e) => modifier('quantite', Number(e.target.value))}
            />
          </label>
        )}
        <label>
          Seuil d'alerte
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={valeurs.seuilAlerte}
            onChange={(e) => modifier('seuilAlerte', Number(e.target.value))}
          />
        </label>
      </div>
      <p className="aide">Le produit est signalé quand son stock descend au seuil ou en dessous.</p>

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
