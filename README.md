# Gestion glacier

Application de gestion pour un glacier : **plannings**, **stocks** et **employés**.
Application web installable (PWA), utilisable sur ordinateur et sur smartphone.

## Fonctionnalités (v0.2)

- **Accueil** : équipe du jour, alertes de stock, heures planifiées de la semaine.
- **Employés** : ajout, modification, postes (vente, production), statuts cumulables (standard, pâtissier, manager), activation.
- **Planning** : vue par semaine, créneaux par employé et par poste, contrôle des conflits
  (double affectation, poste non tenu, horaires incohérents), total d'heures, copie de la semaine précédente.
- **Stocks** : deux familles séparées. **Bacs de glace** par parfum (compteur −1 / +1, alerte « à produire ») et **matières premières** de production (entrées et sorties avec motif, alerte « à commander »), plus l'historique des mouvements.
- **Thème clair / sombre** : bouton lune / soleil en haut de l'écran (suit le système par défaut).
- **Paramètres** : export et import des données (JSON), données d'exemple, remise à zéro.

Les données sont enregistrées **dans le navigateur de l'appareil** (pas encore de serveur) :
utiliser l'export pour les sauvegarder ou les transférer.

## Développement

Prérequis : Node.js 22 ou plus.

```bash
npm install        # installe les dépendances
npm run dev        # serveur de développement (http://localhost:5173)
npm test           # tests unitaires (Vitest)
npm run build      # vérification des types + build de production dans dist/
```

## Structure

```
src/
  types.ts            Types métier (Employe, Creneau, Produit, Mouvement…)
  lib/                Règles métier pures et testées (dates, planning, stock)
  data/               Données : stockage local, contexte React, données d'exemple
  components/         Composants réutilisables (mise en page, fenêtre, icônes)
  pages/              Une page par fonctionnalité, avec ses formulaires
tests/                Tests unitaires
```

## Déploiement

Chaque fusion sur `main` publie l'application sur GitHub Pages via GitHub Actions
(`.github/workflows/ci.yml`) : https://samueldiguet.github.io/app_glacier/
