# Mise en place de Supabase

L'application utilise [Supabase](https://supabase.com) pour les comptes des
propriétaires et pour stocker les données partagées (employés, planning,
stocks). Sans configuration Supabase, l'application reste en **mode local**
(données dans le navigateur, sans connexion).

## 1. Créer le projet

1. Créer un compte sur https://supabase.com puis un projet (région Europe).
2. Le mot de passe de base de données demandé reste privé : l'application n'en a pas besoin.

## 2. Créer les tables et les règles d'accès

1. Dans le projet : **SQL Editor** > **New query**.
2. Coller le contenu de [`schema.sql`](schema.sql) puis **Run**.
3. Ajouter le premier propriétaire (remplacer l'adresse) :

   ```sql
   insert into public.proprietaires (email) values ('adresse@exemple.fr') on conflict do nothing;
   ```

   Les propriétaires suivants s'ajoutent ensuite depuis l'application
   (Paramètres > Propriétaires).

## 3. Réglages de connexion

Dans **Authentication** :

- **Sign In / Providers > Email** : laisser « Confirm email » activé
  (indispensable : c'est la confirmation qui prouve que l'adresse appartient
  bien à la personne). Longueur minimale du mot de passe : 8.
- **URL Configuration** : *Site URL* = `https://samueldiguet.github.io/app_glacier/`,
  et ajouter `http://localhost:5173/` dans *Redirect URLs* pour le développement.
- **Emails > Templates** : dans « Confirm signup » et « Reset password »,
  ajouter le code à 6 chiffres que l'application demande, par exemple :

  ```html
  <h2>Gestion glacier</h2>
  <p>Votre code : <strong>{{ .Token }}</strong></p>
  <p>Ou cliquez sur ce lien : <a href="{{ .ConfirmationURL }}">confirmer</a></p>
  ```

  Le code fonctionne sur tous les appareils ; le lien ne fonctionne que dans
  le navigateur où le compte a été créé.

**Envoi des e-mails** : le service d'e-mail fourni par défaut par Supabase
n'envoie qu'aux membres de l'équipe du projet Supabase, et seulement quelques
e-mails par heure. Pour d'autres propriétaires, soit les inviter dans
l'équipe du projet (Organization > Team), soit brancher un service SMTP
(Authentication > Emails > SMTP Settings, par exemple Brevo ou Resend).

## 4. Brancher l'application

Récupérer dans le projet (bouton **Connect**, ou Project Settings > API Keys)
l'**URL du projet** et la **clé publishable** (ou « anon public »), puis les
mettre dans `.env.production` à la racine du dépôt (voir `.env.example`) :

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_CLE_PUBLIQUE=sb_publishable_...
```

Ces deux valeurs sont publiques par nature et peuvent être versionnées : la
sécurité repose sur les règles RLS de `schema.sql`. Ne jamais mettre dans le
dépôt la clé *secret* / *service_role* ni le mot de passe de la base.

Pour développer avec le serveur, mettre les mêmes lignes dans `.env.local`
(ignoré par git).

## 5. Reprendre les données saisies avant

Les données saisies en mode local restent dans le navigateur de l'appareil.
Après la première connexion sur cet appareil : Paramètres > Sauvegarde >
**Envoyer les données de cet appareil**. On peut aussi exporter un fichier
JSON depuis l'ancien appareil et l'importer une fois connecté.
