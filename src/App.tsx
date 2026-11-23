/**
 * Composant racine : choisit le mode (local ou connecté), fournit les
 * données et déclare les routes.
 *
 * - Mode local (Supabase non configuré) : l'application s'ouvre directement,
 *   données dans le navigateur.
 * - Mode connecté : on arrive sur la page de connexion (ou de création de
 *   compte) ; chaque compte retrouve ensuite ses propres données sur le serveur.
 *
 * On utilise un routeur « hash » (#/planning…) : il fonctionne sans
 * configuration serveur, sur GitHub Pages comme dans une app Capacitor.
 */
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DonneesProvider } from './data/DonneesContext';
import { SessionProvider, useSession } from './data/SessionContext';
import { supabase } from './data/supabase';
import { MiseEnPage } from './components/MiseEnPage';
import { Accueil } from './pages/Accueil';
import { Planning } from './pages/Planning';
import { Stocks } from './pages/Stocks';
import { Employes } from './pages/Employes';
import { Parametres } from './pages/Parametres';
import { Taches } from './pages/Taches';
import { Connexion } from './pages/Connexion';
import { EcranChargement, NouveauMotDePasse } from './pages/AccesConnecte';

/** Pages de l'application. */
function Pages() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<MiseEnPage />}>
          <Route index element={<Accueil />} />
          <Route path="planning" element={<Planning />} />
          <Route path="stocks" element={<Stocks />} />
          <Route path="employes" element={<Employes />} />
          <Route path="taches" element={<Taches />} />
          <Route path="parametres" element={<Parametres />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

/** Mode connecté : affiche l'écran qui correspond à l'état de la session. */
function AppConnectee() {
  const { client, session, chargement, reinitialisation } = useSession()!;
  if (chargement) return <EcranChargement />;
  if (!session) return <Connexion />;
  if (reinitialisation) return <NouveauMotDePasse />;
  // La clé force un état neuf si un autre compte se connecte.
  return (
    <DonneesProvider key={session.user.id} client={client}>
      <Pages />
    </DonneesProvider>
  );
}

export function App() {
  if (!supabase) {
    return (
      <DonneesProvider>
        <Pages />
      </DonneesProvider>
    );
  }
  return (
    <SessionProvider client={supabase}>
      <AppConnectee />
    </SessionProvider>
  );
}
