/**
 * Point d'entrée : monte l'application React dans la page.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initialiserTheme } from './lib/theme';
import './styles.css';

// Applique le thème mémorisé avant le premier affichage (évite un flash de couleur).
initialiserTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
