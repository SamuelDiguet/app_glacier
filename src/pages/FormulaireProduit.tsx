/**
 * Formulaire de création / modification d'un produit en stock :
 * un parfum (compté en bacs) ou une matière première (unité au choix).
 * La quantité n'est saisie qu'à la création : ensuite, elle évolue
 * uniquement par des mouvements d'entrée et de sortie (traçabilité).
 */
import { useState, type FormEvent } from 'react';
import type { FamilleStock, Produit } from '../types';
import { CATEGORIES_PAR_FAMILLE, UNITES_MATIERE } from '../lib/libelles';
import { nouvelId } from '../lib/ids';

interface Props {
  /** Famille du produit à créer (ignorée en modification). */
  famille: FamilleStock;
  produit?: Produit;
  onEnregistrer: (produit: Produit) => void;
  onSupprimer?: () => void;
}

/** Valeurs par défaut d'un nouveau produit selon sa famille. */
function nouveauProduit(famille: FamilleStock): Produit {
  const base = { id: nouvelId(), famille, nom: '', categorie: CATEGORIES_PAR_FAMILLE[famille][0], quantite: 0 };
  return famille === 'bac'
    ? { ...base, unite: 'bac', seuilAlerte: 2 }
    : { ...base, unite: 'kg', seuilAlerte: 1 };
}

export function FormulaireProduit({ famille, produit, onEnregistrer, onSupprimer }: Props) {
  const [valeurs, setValeurs] = useState<Produit>(produit ?? nouveauProduit(famille));
  const estBac = valeurs.famille === 'bac';
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
        {estBac ? 'Parfum *' : 'Matière première *'}
        <input
          placeholder={estBac ? 'Ex. : Pistache' : 'Ex. : Pâte de pistache'} value={valeurs.nom} onChange={(e) => modifier('nom', e.target.value)} autoFocus />
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
            {CATEGORIES_PAR_FAMILLE[valeurs.famille].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        {/* Les parfums se comptent toujours en bacs : l'unité n'est choisie que pour les matières. */}
        {!estBac && (
          <label>
            Unité
            <select value={valeurs.unite} onChange={(e) => modifier('unite', e.target.value as Produit['unite'])}>
              {UNITES_MATIERE.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="ligne-champs">
        {!produit && (
          <label>
            {estBac ? 'Bacs en stock' : 'Quantité initiale'}
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
      <p className="aide">
        {estBac
          ? 'Le parfum est signalé « à produire » quand il reste ce nombre de bacs ou moins.'
          : 'La matière est signalée « à commander » quand son stock descend au seuil ou en dessous.'}
      </p>

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
