/**
 * Page Stocks : liste des produits avec niveaux et alertes, entrées et
 * sorties rapides, et historique des derniers mouvements.
 */
import { useMemo, useState } from 'react';
import type { Mouvement, Produit, TypeMouvement } from '../types';
import { useDonnees } from '../data/DonneesContext';
import { Fenetre } from '../components/Fenetre';
import { Icone } from '../components/Icone';
import { estEnAlerte } from '../lib/stock';
import { formaterDateHeure } from '../lib/dates';
import { FormulaireProduit } from './FormulaireProduit';
import { FormulaireMouvement } from './FormulaireMouvement';

/** Nombre de mouvements affichés dans l'historique. */
const TAILLE_HISTORIQUE = 30;

/** Fenêtre actuellement ouverte sur la page. */
type FenetreOuverte =
  | { genre: 'produit'; produit?: Produit }
  | { genre: 'mouvement'; produit: Produit; type: TypeMouvement }
  | null;

export function Stocks() {
  const { donnees, dispatch } = useDonnees();
  const [recherche, setRecherche] = useState('');
  const [alertesSeules, setAlertesSeules] = useState(false);
  const [onglet, setOnglet] = useState<'produits' | 'historique'>('produits');
  const [fenetre, setFenetre] = useState<FenetreOuverte>(null);

  // Produits filtrés puis regroupés par catégorie (ordre alphabétique).
  const categories = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    const groupes = new Map<string, Produit[]>();
    donnees.produits
      .filter((p) => (!alertesSeules || estEnAlerte(p)) && p.nom.toLowerCase().includes(terme))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
      .forEach((p) => groupes.set(p.categorie, [...(groupes.get(p.categorie) ?? []), p]));
    return [...groupes.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'));
  }, [donnees.produits, recherche, alertesSeules]);

  const nombreAlertes = donnees.produits.filter(estEnAlerte).length;
  const nomsProduits = useMemo(() => new Map(donnees.produits.map((p) => [p.id, p])), [donnees.produits]);

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

  return (
    <section>
      <header className="entete-page">
        <h1>Stocks</h1>
        <button className="bouton bouton-principal" onClick={() => setFenetre({ genre: 'produit' })}>
          <Icone nom="plus" /> Produit
        </button>
      </header>

      <div className="bascule onglets" role="tablist">
        <button role="tab" aria-selected={onglet === 'produits'} className={onglet === 'produits' ? 'actif' : ''} onClick={() => setOnglet('produits')}>
          Produits
        </button>
        <button role="tab" aria-selected={onglet === 'historique'} className={onglet === 'historique' ? 'actif' : ''} onClick={() => setOnglet('historique')}>
          Historique
        </button>
      </div>

      {onglet === 'produits' ? (
        <>
          <div className="filtres">
            <input
              type="search"
              className="recherche"
              placeholder="Rechercher un produit…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
            <button
              className={`puce ${alertesSeules ? 'puce-active' : ''}`}
              onClick={() => setAlertesSeules(!alertesSeules)}
              aria-pressed={alertesSeules}
            >
              <Icone nom="alerte" taille={16} /> En alerte ({nombreAlertes})
            </button>
          </div>

          {categories.length === 0 && <p className="vide">Aucun produit à afficher.</p>}

          {categories.map(([categorie, produits]) => (
            <div key={categorie} className="groupe">
              <h2>{categorie}</h2>
              <ul className="liste-produits">
                {produits.map((p) => (
                  <li key={p.id} className={`produit ${estEnAlerte(p) ? 'en-alerte' : ''}`}>
                    <button className="produit-infos" onClick={() => setFenetre({ genre: 'produit', produit: p })}>
                      <strong>{p.nom}</strong>
                      <small>
                        Seuil : {p.seuilAlerte} {p.unite}
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
      ) : donnees.mouvements.length === 0 ? (
        <p className="vide">Aucun mouvement enregistré pour le moment.</p>
      ) : (
        <ul className="liste-simple carte">
          {donnees.mouvements.slice(0, TAILLE_HISTORIQUE).map((m) => (
            <li key={m.id}>
              <span>
                <strong>{nomsProduits.get(m.produitId)?.nom ?? 'Produit supprimé'}</strong>
                <br />
                <small>
                  {formaterDateHeure(m.date)}
                  {m.motif && ` · ${m.motif}`}
                </small>
              </span>
              <strong className={m.type}>
                {m.type === 'entree' ? '+' : '−'}
                {m.quantite} {nomsProduits.get(m.produitId)?.unite}
              </strong>
            </li>
          ))}
        </ul>
      )}

      <Fenetre
        titre={
          fenetre?.genre === 'mouvement'
            ? fenetre.produit.nom
            : fenetre?.produit
              ? `Modifier ${fenetre.produit.nom}`
              : 'Nouveau produit'
        }
        ouverte={fenetre !== null}
        onFermer={() => setFenetre(null)}
      >
        {fenetre?.genre === 'produit' && (
          <FormulaireProduit
            key={fenetre.produit?.id ?? 'nouveau'}
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
