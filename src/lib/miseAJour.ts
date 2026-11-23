/**
 * Mise à jour automatique de l'application installée (PWA).
 *
 * Le service worker garde une copie de l'app pour le hors-ligne. Sans
 * vérification, une app restée ouverte (ou installée sur l'écran d'accueil)
 * peut continuer d'afficher l'ancienne version. Ici, on vérifie s'il existe
 * une nouvelle version au démarrage, à chaque retour sur l'app et toutes les
 * 30 minutes ; en mode « autoUpdate », la page se recharge d'elle-même dès
 * que la nouvelle version est installée.
 */
import { registerSW } from 'virtual:pwa-register';

/** Intervalle entre deux vérifications quand l'app reste ouverte. */
const INTERVALLE_VERIFICATION_MS = 30 * 60 * 1000;

/** Enregistre le service worker et programme les vérifications de mise à jour. */
export function activerMisesAJour(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, enregistrement) {
      if (!enregistrement) return;
      const verifier = () => {
        // Hors ligne, inutile de tenter : on réessaiera plus tard.
        if (navigator.onLine) enregistrement.update().catch(() => undefined);
      };
      setInterval(verifier, INTERVALLE_VERIFICATION_MS);
      // Retour sur l'app (onglet réaffiché, app rouverte sur le téléphone).
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') verifier();
      });
    },
  });
}
