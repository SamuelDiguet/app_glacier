/**
 * Fenêtre modale réutilisable, basée sur l'élément natif <dialog>
 * (gestion du focus et de la touche Échap fournie par le navigateur).
 * Sur mobile, elle s'affiche en plein écran depuis le bas (voir styles.css).
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { Icone } from './Icone';

interface Props {
  titre: string;
  ouverte: boolean;
  onFermer: () => void;
  children: ReactNode;
}

export function Fenetre({ titre, ouverte, onFermer, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  // Synchronise l'état React avec l'ouverture native du <dialog>.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (ouverte && !dialog.open) dialog.showModal();
    if (!ouverte && dialog.open) dialog.close();
  }, [ouverte]);

  return (
    <dialog
      ref={ref}
      className="fenetre"
      onClose={onFermer}
      // Un clic sur le fond (hors du contenu) ferme la fenêtre.
      onClick={(e) => e.target === ref.current && onFermer()}
    >
      <div className="fenetre-contenu">
        <header className="fenetre-entete">
          <h2>{titre}</h2>
          <button type="button" className="bouton-icone" onClick={onFermer} aria-label="Fermer">
            <Icone nom="fermer" />
          </button>
        </header>
        {ouverte && children}
      </div>
    </dialog>
  );
}
