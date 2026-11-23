/**
 * Page d'accueil : l'essentiel de la journée en un coup d'œil
 * (équipe du jour, alertes de stock, chiffres de la semaine).
 */
import { Link } from 'react-router-dom';
import type { Produit } from '../types';
import { useDonnees } from '../data/DonneesContext';
import { Icone } from '../components/Icone';
import { BadgePoste } from '../components/Badge';
import { produitsEnAlerte } from '../lib/stock';
import { heuresParEmploye, trierCreneaux } from '../lib/planning';
import { ajouterJours, aujourdhui, formaterHeures, formaterJourLong, lundiDeLaSemaine } from '../lib/dates';

export function Accueil() {
  const { donnees } = useDonnees();
  const jour = aujourdhui();
  const lundi = lundiDeLaSemaine(jour);
  const dimanche = ajouterJours(lundi, 6);

  const equipeDuJour = trierCreneaux(donnees.creneaux.filter((c) => c.date === jour));
  const alertes = produitsEnAlerte(donnees.produits);
  const creneauxSemaine = donnees.creneaux.filter((c) => c.date >= lundi && c.date <= dimanche);
  const heuresSemaine = [...heuresParEmploye(creneauxSemaine).values()].reduce((a, b) => a + b, 0);
  const employesActifs = donnees.employes.filter((e) => e.actif).length;
  const prenom = (id: string) => donnees.employes.find((e) => e.id === id)?.prenom ?? 'Employé supprimé';

  return (
    <section>
      <header className="entete-page">
        <div>
          <h1>Bonjour 👋</h1>
          <p className="sous-titre">{formaterJourLong(jour)}</p>
        </div>
      </header>

      <div className="chiffres">
        <Link to="/employes" className="chiffre carte">
          <strong>{employesActifs}</strong>
          <span>employés actifs</span>
        </Link>
        <Link to="/planning" className="chiffre carte">
          <strong>{formaterHeures(heuresSemaine)}</strong>
          <span>planifiées cette semaine</span>
        </Link>
        <Link to="/stocks" className={`chiffre carte ${alertes.length ? 'chiffre-alerte' : ''}`}>
          <strong>{alertes.length}</strong>
          <span>alertes de stock</span>
        </Link>
      </div>

      <div className="colonnes">
        <div className="carte bloc">
          <h2>Équipe du jour</h2>
          {equipeDuJour.length === 0 ? (
            <p className="vide">Personne n'est planifié aujourd'hui.</p>
          ) : (
            <ul className="liste-simple">
              {equipeDuJour.map((c) => (
                <li key={c.id}>
                  <span>
                    <strong>{prenom(c.employeId)}</strong> <BadgePoste poste={c.poste} />
                  </span>
                  <span>
                    {c.debut} – {c.fin}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/planning" className="lien-suite">Voir le planning</Link>
        </div>

        <div className="carte bloc">
          <h2>Bacs à produire</h2>
          <ListeAlertes produits={alertes.filter((p) => p.famille === 'bac')} vide="Tous les parfums ont assez de bacs." />
          <h2 className="sous-bloc">Matières à commander</h2>
          <ListeAlertes produits={alertes.filter((p) => p.famille === 'matiere')} vide="Aucune matière première sous son seuil." />
          <Link to="/stocks" className="lien-suite">Gérer les stocks</Link>
        </div>
      </div>
    </section>
  );
}

/** Liste de produits en alerte (quantité / seuil), ou un message s'il n'y en a aucun. */
function ListeAlertes({ produits, vide }: { produits: Produit[]; vide: string }) {
  if (produits.length === 0) return <p className="vide">{vide}</p>;
  return (
    <ul className="liste-simple">
      {produits.map((p) => (
        <li key={p.id} className="en-alerte">
          <span>
            <Icone nom="alerte" taille={16} /> {p.nom}
          </span>
          <strong>
            {p.quantite} / {p.seuilAlerte} {p.unite}
          </strong>
        </li>
      ))}
    </ul>
  );
}
