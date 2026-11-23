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
2. **Stocks** : suivre les stocks (entrées, sorties, niveaux).
3. **Employés** : ajouter des employés et leur attribuer des postes.
   - **Postes** : vente, production.
   - **Statuts** : standard, pâtissier, manager.

## Stack technique

- PWA (décidé).
- Framework front, back-end, base de données, hébergement : **à définir**.

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
