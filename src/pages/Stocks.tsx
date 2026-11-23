/**
 * Page Stocks, en trois onglets :
 * - Bacs de glace : nombre de bacs restants par parfum, avec boutons −1 / +1
 *   immédiats (bac terminé, bac produit) ;
 * - Matières premières : ingrédients et fournitures de production, avec
 *   entrées / sorties saisies dans une fenêtre (quantité, motif) ;
 * - Historique : derniers mouvements, toutes familles confondues.
 */
import { useMemo, useState } from 'react';
import type { FamilleStock, Mouvement, Produit, TypeMouvement } from '../types';
import { useDonnees } from '../data/DonneesContext';
import { Fenetre } from '../components/Fenetre';
import { Icone } from '../components/Icone';
import { appliquerMouvement, estEnAlerte } from '../lib/stock';
import { formaterDateHeure } from '../lib/dates';
import { LIBELLES_FAMILLE } from '../lib/libelles';
import { nouvelId } from '../lib/ids';
import { FormulaireProduit } from './FormulaireProduit';
import { FormulaireMouvement, MOTIFS } from './FormulaireMouvement';

/** Nombre de mouvements affichés dans l'historique. */
const TAILLE_HISTORIQUE = 50;

type Onglet = FamilleStock | 'historique';

/** Fenêtre actuellement ouverte sur la page. */
type FenetreOuverte =
  | { genre: 'produit'; famille: FamilleStock; produit?: Produit }
  | { genre: 'mouvement'; produit: Produit; type: TypeMouvement }
  | null;

/** Regroupe des produits par catégorie, catégories et produits triés par ordre alphabétique. */
function grouperParCategorie(produits: Produit[]): [string, Produit[]][] {
  const groupes = new Map<string, Produit[]>();
  [...produits]
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    .forEach((p) => groupes.set(p.categorie, [...(groupes.get(p.categorie) ?? []), p]));
  return [...groupes.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'));
}

export function Stocks() {
  const { donnees, dispatch } = useDonnees();
  const [onglet, setOnglet] = useState<Onglet>('bac');
  const [recherche, setRecherche] = useState('');
  const [alertesSeules, setAlertesSeules] = useState(false);
  const [fenetre, setFenetre] = useState<FenetreOuverte>(null);

  // Nombre d'alertes par famille, affiché sur les onglets.
  const alertesParFamille = useMemo(() => {
    const compte: Record<FamilleStock, number> = { bac: 0, matiere: 0 };
    donnees.produits.filter(estEnAlerte).forEach((p) => compte[p.famille]++);
    return compte;
  }, [donnees.produits]);

  // Produits de l'onglet courant, filtrés et groupés par catégorie.
  const categories = useMemo(() => {
    if (onglet === 'historique') return [];
    const terme = recherche.trim().toLowerCase();
    return grouperParCategorie(
      donnees.produits.filter(
        (p) => p.famille === onglet && (!alertesSeules || estEnAlerte(p)) && p.nom.toLowerCase().includes(terme),
      ),
    );
  }, [donnees.produits, onglet, recherche, alertesSeules]);

  const produitsParId = useMemo(() => new Map(donnees.produits.map((p) => [p.id, p])), [donnees.produits]);

  const enregistrerProduit = (produit: Produit) => {
    dispatch({ type: 'produit/enregistrer', produit });
    setFenetre(null);
  };

  const supprimerProduit = (produit: Produit) => {
    if (!confirm(`Supprimer « ${produit.nom} » et son historique ?`)) return;
    dispatch({ type: 'produit/supprimer', id: produit.id });
    setFenetre(null);
  };

  const enregistrerMouvement = (mouvement: Mouvement) => {
    dispatch({ type: 'mouvement/ajouter', mouvement });
    setFenetre(null);
  };

  /** Ajoute ou retire un bac d'un parfum immédiatement (motif par défaut). */
  const bougerUnBac = (produit: Produit, type: TypeMouvement) => {
    try {
      appliquerMouvement(produit, { type, quantite: 1 }); // refuse un stock négatif
    } catch {
      return;
    }
    dispatch({
      type: 'mouvement/ajouter',
      mouvement: {
        id: nouvelId(),
        produitId: produit.id,
        type,
        quantite: 1,
        date: new Date().toISOString(),
        motif: MOTIFS.bac[type][0],
      },
    });
  };

  /** Libellé d'un onglet, avec le nombre d'alertes s'il y en a. */
  const libelleOnglet = (famille: FamilleStock) =>
    alertesParFamille[famille] > 0 ? `${LIBELLES_FAMILLE[famille]} (${alertesParFamille[famille]})` : LIBELLES_FAMILLE[famille];

  return (
    <section>
      <header className="entete-page">
        <h1>Stocks</h1>
        {onglet !== 'historique' && (
          <button className="bouton bouton-principal" onClick={() => setFenetre({ genre: 'produit', famille: onglet })}>
            <Icone nom="plus" /> {onglet === 'bac' ? 'Parfum' : 'Matière'}
          </button>
        )}
      </header>

      <div className="bascule onglets" role="tablist">
        {(['bac', 'matiere', 'historique'] as const).map((valeur) => (
          <button
            key={valeur}
            role="tab"
            aria-selected={onglet === valeur}
            className={onglet === valeur ? 'actif' : ''}
            onClick={() => setOnglet(valeur)}
          >
            {valeur === 'historique' ? 'Historique' : libelleOnglet(valeur)}
          </button>
        ))}
      </div>

      {onglet !== 'historique' && (
        <div className="filtres">
          <input
            type="search"
            className="recherche"
            placeholder={onglet === 'bac' ? 'Rechercher un parfum…' : 'Rechercher une matière…'}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          <button
            className={`puce ${alertesSeules ? 'puce-active' : ''}`}
            onClick={() => setAlertesSeules(!alertesSeules)}
            aria-pressed={alertesSeules}
          >
            <Icone nom="alerte" taille={16} /> {onglet === 'bac' ? 'À produire' : 'À commander'}
          </button>
        </div>
      )}

      {onglet === 'bac' && (
        <>
          {categories.length === 0 && <p className="vide">Aucun parfum à afficher.</p>}
          {categories.map(([categorie, parfums]) => (
            <div key={categorie} className="groupe">
              <h2>{categorie}</h2>
              <ul className="grille-bacs">
                {parfums.map((p) => (
                  <li key={p.id} className={`bac ${estEnAlerte(p) ? 'en-alerte' : ''}`}>
                    <button className="bac-nom" onClick={() => setFenetre({ genre: 'produit', famille: 'bac', produit: p })}>
                      {p.nom}
                    </button>
                    <div className="bac-compteur">
                      <button
                        className="bouton-icone sortie"
                        onClick={() => bougerUnBac(p, 'sortie')}
                        disabled={p.quantite < 1}
                        aria-label={`Un bac de ${p.nom} terminé`}
                      >
                        <Icone nom="moins" />
                      </button>
                      <span className="bac-nombre" aria-live="polite">
                        {p.quantite}
                        <small>{p.quantite > 1 ? 'bacs' : 'bac'}</small>
                      </span>
                      <button
                        className="bouton-icone entree"
                        onClick={() => bougerUnBac(p, 'entree')}
                        aria-label={`Un bac de ${p.nom} produit`}
                      >
                        <Icone nom="plus" />
                      </button>
                    </div>
                    <small className="bac-etat">
                      {estEnAlerte(p) ? (
                        <>
                          <Icone nom="alerte" taille={14} /> À produire
                        </>
                      ) : (
                        `Seuil : ${p.seuilAlerte}`
                      )}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      {onglet === 'matiere' && (
        <>
          {categories.length === 0 && <p className="vide">Aucune matière première à afficher.</p>}
          {categories.map(([categorie, produits]) => (
            <div key={categorie} className="groupe">
              <h2>{categorie}</h2>
              <ul className="liste-produits">
                {produits.map((p) => (
                  <li key={p.id} className={`produit ${estEnAlerte(p) ? 'en-alerte' : ''}`}>
                    <button className="produit-infos" onClick={() => setFenetre({ genre: 'produit', famille: 'matiere', produit: p })}>
                      <strong>{p.nom}</strong>
                      <small>
                        {estEnAlerte(p) ? 'À commander · ' : ''}Seuil : {p.seuilAlerte} {p.unite}
                      </small>
                    </button>
                    <div className="produit-quantite">
                      {estEnAlerte(p) && <Icone nom="alerte" taille={16} />}
                      <span>
                        {p.quantite} <small>{p.unite}</small>
                      </span>
                    </div>
                    <div className="produit-actions">
                      <button
                        className="bouton-icone sortie"
                        onClick={() => setFenetre({ genre: 'mouvement', produit: p, type: 'sortie' })}
                        aria-label={`Sortie de ${p.nom}`}
                      >
                        <Icone nom="moins" />
                      </button>
                      <button
                        className="bouton-icone entree"
                        onClick={() => setFenetre({ genre: 'mouvement', produit: p, type: 'entree' })}
                        aria-label={`Entrée de ${p.nom}`}
                      >
                        <Icone nom="plus" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      {onglet === 'historique' &&
        (donnees.mouvements.length === 0 ? (
          <p className="vide">Aucun mouvement enregistré pour le moment.</p>
        ) : (
          <ul className="liste-simple carte">
            {donnees.mouvements.slice(0, TAILLE_HISTORIQUE).map((m) => {
              const produit = produitsParId.get(m.produitId);
              return (
                <li key={m.id}>
                  <span>
                    <strong>{produit?.nom ?? 'Produit supprimé'}</strong>{' '}
                    {produit && <span className="badge">{produit.famille === 'bac' ? 'Bac' : 'Matière'}</span>}
                    <br />
                    <small>
                      {formaterDateHeure(m.date)}
                      {m.motif && ` · ${m.motif}`}
                    </small>
                  </span>
                  <strong className={m.type}>
                    {m.type === 'entree' ? '+' : '−'}
                    {m.quantite} {produit?.unite}
                  </strong>
                </li>
              );
            })}
          </ul>
        ))}

      <Fenetre
        titre={
          fenetre?.genre === 'mouvement'
            ? fenetre.produit.nom
            : fenetre?.produit
              ? `Modifier ${fenetre.produit.nom}`
              : fenetre?.famille === 'bac'
                ? 'Nouveau parfum'
                : 'Nouvelle matière première'
        }
        ouverte={fenetre !== null}
        onFermer={() => setFenetre(null)}
      >
        {fenetre?.genre === 'produit' && (
          <FormulaireProduit
            key={fenetre.produit?.id ?? `nouveau-${fenetre.famille}`}
            famille={fenetre.famille}
            produit={fenetre.produit}
            onEnregistrer={enregistrerProduit}
            onSupprimer={fenetre.produit ? () => supprimerProduit(fenetre.produit!) : undefined}
          />
        )}
        {fenetre?.genre === 'mouvement' && (
          <FormulaireMouvement
            key={`${fenetre.produit.id}-${fenetre.type}`}
            produit={fenetre.produit}
            typeInitial={fenetre.type}
            onEnregistrer={enregistrerMouvement}
          />
        )}
      </Fenetre>
    </section>
  );
}
