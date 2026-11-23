/**
 * Point d'entrée : monte l'application React dans la page.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initialiserTheme } from './lib/theme';
import { activerMisesAJour } from './lib/miseAJour';
import './styles.css';

// Applique le thème mémorisé avant le premier affichage (évite un flash de couleur).
initialiserTheme();

// Service worker : hors-ligne et mise à jour automatique vers la dernière version.
activerMisesAJour();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
