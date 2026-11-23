/**
 * Page To do : tâches et rendez-vous à noter (livraison, comptable,
 * commande…), rangés par groupe (en retard, aujourd'hui, à venir, sans
 * date, faites), avec ajout, modification et case « fait ».
 */
import { useMemo, useState } from 'react';
import type { Tache } from '../types';
import { useDonnees } from '../data/DonneesContext';
import { Fenetre } from '../components/Fenetre';
import { Icone } from '../components/Icone';
import { LIBELLES_GROUPE, grouperTaches } from '../lib/taches';
import { aujourdhui, formaterJourCourt } from '../lib/dates';
import { nouvelId } from '../lib/ids';
import { FormulaireTache } from './FormulaireTache';

/** Tâche en cours d'édition et indication si elle existe déjà. */
interface Edition {
  tache: Tache;
  existante: boolean;
}

/** Valeurs d'une nouvelle tâche. */
function nouvelleTache(): Tache {
  return { id: nouvelId(), titre: '', date: '', heure: '', note: '', faite: false };
}

export function Taches() {
  const { donnees, dispatch } = useDonnees();
  const [edition, setEdition] = useState<Edition | null>(null);
  const jour = aujourdhui();
  const groupes = useMemo(() => grouperTaches(donnees.taches, jour), [donnees.taches, jour]);

  const enregistrer = (tache: Tache) => {
    dispatch({ type: 'tache/enregistrer', tache });
    setEdition(null);
  };

  const supprimer = (id: string) => {
    if (!confirm('Supprimer cette tâche ?')) return;
    dispatch({ type: 'tache/supprimer', id });
    setEdition(null);
  };

  /** Supprime d'un coup toutes les tâches cochées « fait ». */
  const supprimerFaites = () => {
    if (!confirm(`Supprimer les ${groupes.get('faites')!.length} tâches faites ?`)) return;
    dispatch({ type: 'tache/supprimerFaites' });
  };

  return (
    <section>
      <header className="entete-page">
        <h1>To do</h1>
        <button className="bouton bouton-principal" onClick={() => setEdition({ tache: nouvelleTache(), existante: false })}>
          <Icone nom="plus" /> Ajouter
        </button>
      </header>

      {donnees.taches.length === 0 && (
        <p className="vide">Rien à faire pour le moment. Notez ici vos rendez-vous, commandes et choses à ne pas oublier.</p>
      )}

      {[...groupes].map(
        ([groupe, taches]) =>
          taches.length > 0 && (
            <div key={groupe} className={`groupe groupe-${groupe}`}>
              <div className="groupe-entete">
                <h2>{LIBELLES_GROUPE[groupe]}</h2>
                {groupe === 'faites' && (
                  <button className="bouton bouton-discret" onClick={supprimerFaites}>
                    Tout supprimer
                  </button>
                )}
              </div>
              <ul className="liste-taches">
                {taches.map((t) => (
                  <li key={t.id} className={`tache ${t.faite ? 'tache-faite' : ''}`}>
                    <input
                      type="checkbox"
                      className="tache-case"
                      checked={t.faite}
                      onChange={() => dispatch({ type: 'tache/basculer', id: t.id })}
                      aria-label={`${t.titre} : ${t.faite ? 'marquer à faire' : 'marquer comme fait'}`}
                    />
                    <button className="tache-texte" onClick={() => setEdition({ tache: t, existante: true })}>
                      <strong>{t.titre}</strong>
                      {t.date && (
                        <small>
                          {formaterJourCourt(t.date)}
                          {t.heure && ` · ${t.heure}`}
                        </small>
                      )}
                      {t.note && <span className="tache-note">{t.note}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ),
      )}

      <Fenetre
        titre={edition?.existante ? 'Modifier la tâche' : 'Nouvelle tâche'}
        ouverte={edition !== null}
        onFermer={() => setEdition(null)}
      >
        {edition && (
          <FormulaireTache
            key={edition.tache.id}
            tache={edition.tache}
            existante={edition.existante}
            onEnregistrer={enregistrer}
            onSupprimer={() => supprimer(edition.tache.id)}
          />
        )}
      </Fenetre>
    </section>
  );
}
