/**
 * Composant racine : fournit les données et déclare les routes.
 *
 * On utilise un routeur « hash » (#/planning…) : il fonctionne sans
 * configuration serveur, sur GitHub Pages comme dans une app Capacitor.
 */
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DonneesProvider } from './data/DonneesContext';
import { MiseEnPage } from './components/MiseEnPage';
import { Accueil } from './pages/Accueil';
import { Planning } from './pages/Planning';
import { Stocks } from './pages/Stocks';
import { Employes } from './pages/Employes';
import { Parametres } from './pages/Parametres';

export function App() {
  return (
    <DonneesProvider>
      <HashRouter>
        <Routes>
          <Route element={<MiseEnPage />}>
            <Route index element={<Accueil />} />
            <Route path="planning" element={<Planning />} />
            <Route path="stocks" element={<Stocks />} />
            <Route path="employes" element={<Employes />} />
            <Route path="parametres" element={<Parametres />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </DonneesProvider>
  );
}
