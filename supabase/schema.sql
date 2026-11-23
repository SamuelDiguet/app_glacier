-- ============================================================================
-- Base de données partagée de l'application Gestion glacier (Supabase).
--
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.
-- Le script peut être relancé sans risque (il ne supprime aucune donnée).
--
-- Principe d'accès : seuls les propriétaires du glacier se connectent.
-- Un compte n'a accès aux données que si son adresse e-mail figure dans la
-- table `proprietaires`. Un compte créé avec une autre adresse ne voit rien.
-- Ces règles (RLS) sont appliquées par le serveur : l'application publique
-- ne peut pas les contourner.
-- ============================================================================

-- ---------- Propriétaires autorisés ----------
create table if not exists public.proprietaires (
  email text primary key check (email = lower(email))
);

-- ---------- Données métier (mêmes champs que src/types.ts) ----------
create table if not exists public.employes (
  id text primary key,
  prenom text not null,
  nom text not null default '',
  telephone text not null default '',
  postes text[] not null default '{}',
  statuts text[] not null default '{}',
  majeur boolean not null default true,
  notes text not null default '',
  actif boolean not null default true
);

create table if not exists public.creneaux (
  id text primary key,
  employe_id text not null references public.employes (id) on delete cascade,
  poste text not null,
  date text not null,   -- AAAA-MM-JJ
  debut text not null,  -- HH:MM
  fin text not null,    -- HH:MM
  note text not null default ''
);

create table if not exists public.produits (
  id text primary key,
  famille text not null,
  nom text not null,
  categorie text not null default '',
  unite text not null,
  quantite double precision not null default 0,
  seuil_alerte double precision not null default 0
);

create table if not exists public.mouvements (
  id text primary key,
  produit_id text not null references public.produits (id) on delete cascade,
  type text not null,
  quantite double precision not null,
  date text not null,   -- date et heure ISO
  motif text not null default ''
);

create index if not exists creneaux_date on public.creneaux (date);
create index if not exists mouvements_produit on public.mouvements (produit_id);

-- ---------- Règle d'accès ----------
-- Vrai si le compte connecté est un propriétaire autorisé.
-- `security definer` : la fonction lit la liste même si le compte n'y a pas accès.
create or replace function public.est_proprietaire()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.proprietaires
    where email = lower(auth.jwt() ->> 'email')
  );
$$;

-- Active la sécurité par ligne et n'autorise que les propriétaires.
do $$
declare
  t text;
begin
  foreach t in array array['proprietaires', 'employes', 'creneaux', 'produits', 'mouvements'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists proprietaires_tout on public.%I', t);
    execute format(
      'create policy proprietaires_tout on public.%I for all to authenticated
         using (public.est_proprietaire()) with check (public.est_proprietaire())',
      t
    );
  end loop;
end $$;

-- ---------- Premier propriétaire ----------
-- Remplacer l'adresse ci-dessous puis exécuter cette ligne (une par propriétaire).
-- Les propriétaires suivants peuvent aussi être ajoutés depuis la page Paramètres.
-- insert into public.proprietaires (email) values ('adresse@exemple.fr') on conflict do nothing;
