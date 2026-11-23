# AGENTS.md

Contexte du projet pour les agents IA (Claude Code et autres) qui travaillent sur ce dépôt.

## Projet

Application de gestion pour un glacier : plannings, stocks et employés.

## Plateforme

- Interface web d'abord, sous forme de **PWA** (Progressive Web App).
- Doit être utilisable sur **PC et smartphone** (design responsive, mobile first).
- Conversion possible plus tard en applications natives via **Capacitor** : éviter les dépendances qui bloqueraient cette conversion.

## Point de vente

- Le glacier a physiquement deux points de vente dans le même bâtiment, mais l'application les traite comme **un seul point de vente**.
- Ne pas séparer les données (plannings, stocks, employés) par point de vente.

## Fonctionnalités

1. **Plannings** : créer et consulter les plannings des employés.
2. **Stocks** : suivre les stocks (entrées, sorties, niveaux), en deux familles distinctes :
   - **Bacs de glace** : nombre de bacs restants **par parfum** (prêts à la vente), alerte « à produire » sous un seuil ;
   - **Matières premières** : ingrédients et fournitures pour la production (Nutella, pâte de pistache, crème, sucre, cornets…), avec unité au choix (kg, L, pièce, carton) et alerte « à commander ».
3. **Employés** : ajouter des employés et leur attribuer des postes.
   - **Postes** : vente, production.
   - **Statuts** : standard, pâtissier, manager.

## Stack technique

- **PWA** : React 19 + TypeScript, construite avec **Vite** ; manifeste et service worker générés par `vite-plugin-pwa` (installable, fonctionne hors ligne).
- **Routage** : `react-router-dom` en mode *hash* (`#/planning`), qui fonctionne sans configuration serveur, sur GitHub Pages comme dans Capacitor.
- **Styles** : CSS simple (`src/styles.css`) avec variables, mobile first ; pas de framework CSS.
- **Thèmes** : clair et sombre, définis uniquement par les variables CSS (`:root`, `@media (prefers-color-scheme: dark)` et `[data-theme='dark']`). Le bouton lune / soleil (`src/components/BoutonTheme.tsx`, logique dans `src/lib/theme.ts`) mémorise le choix ; sans choix, l'app suit le système. Toute nouvelle couleur doit être une variable définie dans les deux thèmes.
- **Données (v1)** : stockage local du navigateur (`localStorage`), isolé dans `src/data/stockage.ts`. Export/import JSON depuis la page Paramètres. Pas de back-end pour l'instant : le jour où il en faudra un (partage entre appareils, comptes), seul ce module sera à remplacer.
- **Format des données** : versionné (`VERSION_DONNEES` dans `src/data/stockage.ts`). Toute évolution de structure incrémente la version et ajoute une étape dans `migrerDonnees`, pour ne pas perdre les données déjà saisies.
- **Tests** : Vitest, sur les règles métier de `src/lib/` et le reducer.
- **Hébergement** : GitHub Pages via GitHub Actions, prévu mais désactivé pour l'instant (dépôt privé) ; s'active avec la variable de dépôt `DEPLOY_PAGES` = `true`. En attendant, un aperçu est publié sous forme d'artifact Claude.
- **Commandes** : `npm run dev`, `npm test`, `npm run build`.

## Workflow GitHub

- Claude gère le dépôt de façon autonome : branches, commits, pull requests.
- Claude **valide et fusionne lui-même ses pull requests**, avec l'autorisation explicite de Samuel.
- Une pull request par sujet, avec une description claire en français.
- Branche principale : `main`.

## Qualité du code

- Écrire un code **propre et lisible** : noms explicites, fonctions courtes, une responsabilité par module.
- **Commenter tout le code** : rôle de chaque fichier, fonction et bloc non trivial (commentaires en français).
- **Optimiser régulièrement**, sans le faire à chaque modification : faire des passes ponctuelles (par exemple à la fin d'une fonctionnalité) pour supprimer les doublons et le code mort et éviter les calculs et requêtes inutiles.

## Conventions

- Langue de la documentation, des descriptions de PR et de l'interface : **français**.
