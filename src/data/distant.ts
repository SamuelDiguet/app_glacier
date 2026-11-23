/**
 * Échanges avec la base (Supabase) en mode connecté. Chaque compte n'y voit
 * que ses propres lignes (règles RLS de supabase/schema.sql).
 *
 * L'application garde toutes les données en mémoire, comme en mode local.
 * À chaque modification, on compare l'état avant / après pour n'envoyer au
 * serveur que les lignes ajoutées, modifiées ou supprimées.
 *
 * Les colonnes de la base sont en snake_case (`employe_id`) alors que le code
 * utilise le camelCase (`employeId`) : les fonctions `versLigne` / `depuisLigne`
 * font la traduction pour les quelques champs concernés.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DonneesGlacier } from '../types';
import { VERSION_DONNEES } from './stockage';

/** Collections de données synchronisées, chacune stockée dans une table du même nom. */
export const COLLECTIONS = ['employes', 'produits', 'creneaux', 'mouvements'] as const;
export type Collection = (typeof COLLECTIONS)[number];

/** Champs dont le nom diffère entre le code et la base (code → base). */
const COLONNES: Record<string, string> = {
  employeId: 'employe_id',
  produitId: 'produit_id',
  seuilAlerte: 'seuil_alerte',
};

/** Correspondance inverse (base → code). */
const CHAMPS = Object.fromEntries(Object.entries(COLONNES).map(([champ, colonne]) => [colonne, champ]));

/** Renomme les clés d'un objet selon la table de correspondance fournie. */
function renommer(objet: object, correspondance: Record<string, string>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(objet).map(([cle, valeur]) => [correspondance[cle] ?? cle, valeur]));
}

/** Convertit un élément de l'application en ligne de la base. */
export function versLigne(element: object): Record<string, unknown> {
  return renommer(element, COLONNES);
}

/**
 * Convertit une ligne de la base en élément de l'application. La colonne
 * `proprietaire` (compte auquel appartient la ligne) est gérée par le serveur
 * et n'existe pas côté application : on la retire.
 */
export function depuisLigne<T>(ligne: object): T {
  const { proprietaire: _proprietaire, ...donnees } = ligne as Record<string, unknown>;
  return renommer(donnees, CHAMPS) as T;
}

/** Modifications à envoyer pour une collection. */
export interface ChangementsCollection {
  /** Éléments nouveaux ou modifiés (convertis en lignes de la base). */
  enregistrer: Record<string, unknown>[];
  /** Identifiants des éléments supprimés. */
  supprimer: string[];
}

export type Changements = Record<Collection, ChangementsCollection>;

/**
 * Compare deux états et liste ce qui a changé, collection par collection.
 * Fonction pure, testée dans tests/distant.test.ts.
 */
export function calculerChangements(avant: DonneesGlacier, apres: DonneesGlacier): Changements {
  const resultat = {} as Changements;
  for (const collection of COLLECTIONS) {
    const anciens = new Map<string, unknown>(avant[collection].map((e) => [e.id, e]));
    const nouveauxIds = new Set(apres[collection].map((e) => e.id));
    resultat[collection] = {
      // Le reducer garde les mêmes objets pour ce qui n'a pas changé : la
      // comparaison de références suffit le plus souvent, le JSON sert de repli.
      enregistrer: apres[collection]
        .filter((e) => {
          const ancien = anciens.get(e.id);
          return ancien !== e && JSON.stringify(ancien) !== JSON.stringify(e);
        })
        .map(versLigne),
      supprimer: avant[collection].filter((e) => !nouveauxIds.has(e.id)).map((e) => e.id),
    };
  }
  return resultat;
}

/** Vrai s'il n'y a rien à envoyer. */
export function estVide(changements: Changements): boolean {
  return COLLECTIONS.every((c) => changements[c].enregistrer.length === 0 && changements[c].supprimer.length === 0);
}

/** Lève une erreur lisible si Supabase a renvoyé une erreur. */
function verifier(erreur: { message: string } | null): void {
  if (erreur) throw new Error(erreur.message);
}

/** Découpe une liste en paquets (les suppressions passent dans l'URL, qui a une longueur limitée). */
export function enPaquets<T>(liste: T[], taille: number): T[][] {
  const paquets: T[][] = [];
  for (let i = 0; i < liste.length; i += taille) paquets.push(liste.slice(i, i + taille));
  return paquets;
}

/** Nombre de lignes lues par requête (le serveur plafonne à 1000 par défaut). */
const TAILLE_PAGE = 1000;

/** Lit toutes les lignes d'une table, page par page. */
async function chargerTable(client: SupabaseClient, table: Collection): Promise<object[]> {
  const lignes: object[] = [];
  for (let debut = 0; ; debut += TAILLE_PAGE) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .order('id')
      .range(debut, debut + TAILLE_PAGE - 1);
    verifier(error);
    lignes.push(...(data ?? []));
    if (!data || data.length < TAILLE_PAGE) return lignes;
  }
}

/** Charge toutes les données depuis la base. */
export async function chargerDonneesDistantes(client: SupabaseClient): Promise<DonneesGlacier> {
  const tables = await Promise.all(COLLECTIONS.map((c) => chargerTable(client, c)));
  const donnees = { version: VERSION_DONNEES } as DonneesGlacier;
  COLLECTIONS.forEach((collection, i) => {
    (donnees[collection] as unknown[]) = tables[i].map((ligne) => depuisLigne(ligne));
  });
  // L'historique des mouvements s'affiche du plus récent au plus ancien.
  donnees.mouvements.sort((a, b) => b.date.localeCompare(a.date));
  return donnees;
}

/**
 * Envoie les changements au serveur.
 * Ordre : enregistrements des « parents » (employés, produits) avant leurs
 * « enfants » (créneaux, mouvements), puis suppressions des enfants avant les
 * parents, pour respecter les liens entre tables.
 */
export async function envoyerChangements(client: SupabaseClient, changements: Changements): Promise<void> {
  for (const collection of COLLECTIONS) {
    for (const paquet of enPaquets(changements[collection].enregistrer, 500)) {
      // `proprietaire` est rempli par le serveur (compte connecté) : la clé est (proprietaire, id).
      verifier((await client.from(collection).upsert(paquet, { onConflict: 'proprietaire,id' })).error);
    }
  }
  for (const collection of [...COLLECTIONS].reverse()) {
    for (const paquet of enPaquets(changements[collection].supprimer, 100)) {
      verifier((await client.from(collection).delete().in('id', paquet)).error);
    }
  }
}
