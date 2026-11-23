/**
 * Gestion du thème clair / sombre.
 *
 * Sans choix explicite, l'application suit le réglage du système.
 * Le choix de l'utilisateur est mémorisé sur l'appareil et appliqué via
 * l'attribut data-theme de <html>, lu par les variables CSS de styles.css.
 */

export type Theme = 'clair' | 'sombre';

const CLE_THEME = 'gestion-glacier:theme';

/** Thème choisi par l'utilisateur, ou `null` s'il suit le système. */
function themeMemorise(): Theme | null {
  try {
    const valeur = localStorage.getItem(CLE_THEME);
    return valeur === 'clair' || valeur === 'sombre' ? valeur : null;
  } catch {
    return null; // stockage indisponible : on suit le système
  }
}

/** Thème du système (réglage clair / sombre de l'appareil). */
function themeSysteme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'sombre' : 'clair';
}

/** Thème réellement affiché : le choix mémorisé, sinon celui du système. */
export function themeActuel(): Theme {
  return themeMemorise() ?? themeSysteme();
}

/** Pose l'attribut data-theme sur <html> (valeurs attendues par le CSS). */
function poserAttribut(theme: Theme | null): void {
  const racine = document.documentElement;
  if (theme) racine.dataset.theme = theme === 'sombre' ? 'dark' : 'light';
  else delete racine.dataset.theme;
}

/** Applique le thème mémorisé au démarrage (avant le premier affichage). */
export function initialiserTheme(): void {
  poserAttribut(themeMemorise());
}

/** Change de thème, l'applique et le mémorise. */
export function choisirTheme(theme: Theme): void {
  poserAttribut(theme);
  try {
    localStorage.setItem(CLE_THEME, theme);
  } catch {
    // Pas de mémorisation possible : le thème reste appliqué pour la session.
  }
}
