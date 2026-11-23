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

## Utilisateurs

- L'application est destinée **uniquement aux propriétaires de glacier**. Les employés ne se connectent pas.
- On arrive sur la page de connexion ; **inscription libre** : e-mail + mot de passe, téléphone facultatif, confirmée par un **code reçu par e-mail**.
- **Chaque compte a son propre espace** : il ne voit que ses données (employés, planning, stocks), sur tous ses appareils. Pas de partage entre comptes pour l'instant.
- Côté base, chaque ligne porte la colonne `proprietaire` (= `auth.uid()`, remplie par le serveur) et les règles RLS filtrent dessus.

## Fonctionnalités

1. **Plannings** : créer et consulter les plannings des employés.
2. **Stocks** : suivre les stocks (entrées, sorties, niveaux), en deux familles distinctes :
   - **Bacs de glace** : nombre de bacs restants **par parfum** (prêts à la vente), alerte « à produire » sous un seuil ;
   - **Matières premières** : ingrédients et fournitures pour la production (Nutella, pâte de pistache, crème, sucre, cornets…), avec unité au choix (kg, L, pièce, carton) et alerte « à commander ».
3. **Employés** : ajouter des employés et leur attribuer des postes.
   - **Postes** : vente, production.
   - **Statuts** : standard, pâtissier, manager — **cumulables** (un employé peut en avoir plusieurs, au moins un).
   - **Âge** : majeur ou mineur (badge « Mineur » sur la liste).
   - **Notes** : champ libre par employé (disponibilités, remarques).

## Stack technique

- **PWA** : React 19 + TypeScript, construite avec **Vite** ; manifeste et service worker générés par `vite-plugin-pwa` (installable, fonctionne hors ligne).
- **Routage** : `react-router-dom` en mode *hash* (`#/planning`), qui fonctionne sans configuration serveur, sur GitHub Pages comme dans Capacitor.
- **Styles** : CSS simple (`src/styles.css`) avec variables, mobile first ; pas de framework CSS.
- **Thèmes** : clair et sombre, définis uniquement par les variables CSS (`:root`, `@media (prefers-color-scheme: dark)` et `[data-theme='dark']`). Le bouton lune / soleil (`src/components/BoutonTheme.tsx`, logique dans `src/lib/theme.ts`) mémorise le choix ; sans choix, l'app suit le système. Toute nouvelle couleur doit être une variable définie dans les deux thèmes.
- **Back-end** : **Supabase** (Auth + Postgres). Client dans `src/data/supabase.ts`, configuré par `VITE_SUPABASE_URL` et `VITE_SUPABASE_CLE_PUBLIQUE` (fichier `.env.production`, valeurs publiques). Schéma et règles d'accès (RLS) dans `supabase/schema.sql`, guide dans `supabase/README.md`. La sécurité repose sur la RLS, jamais sur le code client ; ne jamais versionner la clé *secret* / *service_role*.
- **Deux modes** : sans variables Supabase, **mode local** (données dans `localStorage`, sans connexion, comme en v1) ; avec, **mode connecté** (`App.tsx` affiche la connexion, puis les données du serveur).
- **Données** : l'état complet reste en mémoire dans `DonneesContext` (reducer). En mode connecté, chaque action est comparée à l'état précédent (`calculerChangements` dans `src/data/distant.ts`) et seules les lignes modifiées sont envoyées ; rechargement au retour sur l'app. Une copie hors ligne est gardée dans `localStorage` (effacée à la déconnexion). Comptes : `src/data/comptes.ts`, session : `src/data/SessionContext.tsx`. Export/import JSON depuis la page Paramètres.
- **Évolution de structure** : toute nouvelle colonne ou table doit être ajoutée à la fois dans `src/types.ts` et dans `supabase/schema.sql` (avec un `alter table … add column if not exists` pour les bases existantes ; garder la colonne `proprietaire`, la clé `(proprietaire, id)` et la règle RLS `mes_donnees`) ; les champs camelCase dont le nom de colonne diffère vont dans `COLONNES` de `distant.ts`.
- **Format des données** : versionné (`VERSION_DONNEES` dans `src/data/stockage.ts`). Toute évolution de structure incrémente la version et ajoute une étape dans `migrerDonnees`, pour ne pas perdre les données déjà saisies.
- **Tests** : Vitest, sur les règles métier de `src/lib/`, le reducer et le calcul des changements envoyés au serveur.
- **Mises à jour** : `src/lib/miseAJour.ts` enregistre le service worker et vérifie les nouvelles versions (démarrage, retour sur l'app, toutes les 30 min) ; la page se recharge seule quand une version est installée.
- **Hébergement** : dépôt public, application publiée sur GitHub Pages (https://samueldiguet.github.io/app_glacier/) par GitHub Actions à chaque fusion sur `main`. Dans Settings > Pages, la source doit être « GitHub Actions » (et non « Deploy from a branch », qui publierait le code source brut).
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
