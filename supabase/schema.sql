-- ============================================================================
-- Base de données de l'application Gestion glacier (Supabase).
--
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.
-- Le script peut être relancé sans risque (il ne supprime aucune donnée).
--
-- Principe d'accès : seuls les propriétaires de glacier se connectent, et
-- chaque compte a ses propres données. Chaque ligne porte l'identifiant du
-- compte qui l'a créée (colonne `proprietaire`, remplie automatiquement par
-- le serveur) et les règles RLS ne laissent voir et modifier que ses lignes.
-- Ces règles sont appliquées par le serveur : l'application publique ne peut
-- pas les contourner.
-- ============================================================================

-- ---------- Données métier (mêmes champs que src/types.ts) ----------
-- Clé primaire (proprietaire, id) : deux comptes peuvent importer la même
-- sauvegarde sans conflit d'identifiants.
create table if not exists public.employes (
  proprietaire uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  prenom text not null,
  nom text not null default '',
  telephone text not null default '',
  postes text[] not null default '{}',
  statuts text[] not null default '{}',
  majeur boolean not null default true,
  notes text not null default '',
  actif boolean not null default true,
  primary key (proprietaire, id)
);

create table if not exists public.creneaux (
  proprietaire uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  employe_id text not null,
  poste text not null,
  date text not null,   -- AAAA-MM-JJ
  debut text not null,  -- HH:MM
  fin text not null,    -- HH:MM
  note text not null default '',
  primary key (proprietaire, id),
  foreign key (proprietaire, employe_id) references public.employes (proprietaire, id) on delete cascade
);

create table if not exists public.produits (
  proprietaire uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  famille text not null,
  nom text not null,
  categorie text not null default '',
  unite text not null,
  quantite double precision not null default 0,
  seuil_alerte double precision not null default 0,
  primary key (proprietaire, id)
);

create table if not exists public.mouvements (
  proprietaire uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  produit_id text not null,
  type text not null,
  quantite double precision not null,
  date text not null,   -- date et heure ISO
  motif text not null default '',
  primary key (proprietaire, id),
  foreign key (proprietaire, produit_id) references public.produits (proprietaire, id) on delete cascade
);

create index if not exists creneaux_employe on public.creneaux (proprietaire, employe_id);
create index if not exists mouvements_produit on public.mouvements (proprietaire, produit_id);

-- ---------- Règles d'accès ----------
-- Droits explicites : le projet n'accorde pas automatiquement l'accès API aux
-- nouvelles tables, et le rôle anonyme (non connecté) n'a accès à rien.
grant usage on schema public to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['employes', 'creneaux', 'produits', 'mouvements'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists mes_donnees on public.%I', t);
    -- (select auth.uid()) : évalué une seule fois par requête (recommandation Supabase).
    execute format(
      'create policy mes_donnees on public.%I for all to authenticated
         using (proprietaire = (select auth.uid())) with check (proprietaire = (select auth.uid()))',
      t
    );
  end loop;
end $$;
