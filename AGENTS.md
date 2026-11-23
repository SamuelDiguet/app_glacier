# AGENTS.md

Contexte du projet pour les agents IA (Claude Code et autres) qui travaillent sur ce dépôt.

## Projet

Application de gestion pour un glacier : plannings, stocks et employés.

## Plateforme

- Interface web d'abord, sous forme de **PWA** (Progressive Web App).
- Doit être utilisable sur **PC et smartphone** (design responsive, mobile first).
- Conversion possible plus tard en applications natives via **Capacitor** : éviter les dépendances qui bloqueraient cette conversion.

## Points de vente

- Le glacier compte **deux points de vente dans le même bâtiment**.
- Ils doivent rester **dissociés dans les données** : chaque planning, stock et affectation est rattaché à un point de vente précis.
- Prévoir dès le départ une entité « point de vente » et filtrer les vues par point de vente.

## Fonctionnalités

1. **Plannings** : créer et consulter les plannings des employés, par point de vente.
2. **Stocks** : suivre les stocks (entrées, sorties, niveaux), séparément pour chaque point de vente.
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

## Conventions

- Langue de la documentation, des descriptions de PR et de l'interface : **français**.
