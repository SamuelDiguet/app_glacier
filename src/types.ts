/**
 * Types métier de l'application.
 *
 * Le glacier est traité comme un seul point de vente : aucune donnée
 * n'est rattachée à un point de vente particulier.
 */

/** Postes qu'un employé peut occuper. */
export type Poste = 'vente' | 'production';

/** Statut d'un employé dans l'équipe. */
export type Statut = 'standard' | 'patissier' | 'manager';

/** Un membre de l'équipe. */
export interface Employe {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  /** Postes que l'employé peut tenir (au moins un). */
  postes: Poste[];
  /** Statuts de l'employé (au moins un, cumulables : ex. pâtissier et manager). */
  statuts: Statut[];
  /** Majeur (18 ans ou plus) ou mineur : utile pour les règles d'horaires. */
  majeur: boolean;
  /** Notes libres sur l'employé (disponibilités, remarques…). */
  notes: string;
  /** Un employé inactif n'est plus proposé dans les plannings. */
  actif: boolean;
}

/** Un créneau de travail dans le planning. */
export interface Creneau {
  id: string;
  employeId: string;
  poste: Poste;
  /** Jour au format AAAA-MM-JJ. */
  date: string;
  /** Heure de début au format HH:MM. */
  debut: string;
  /** Heure de fin au format HH:MM. */
  fin: string;
  note: string;
}

/** Unités possibles pour un produit en stock. */
export type Unite = 'bac' | 'kg' | 'L' | 'pièce' | 'carton';

/**
 * Famille de stock :
 * - `bac` : bacs de glace prêts à la vente, comptés par parfum ;
 * - `matiere` : matières premières et fournitures servant à la production
 *   (Nutella, pâte de pistache, crème, sucre, cornets…).
 */
export type FamilleStock = 'bac' | 'matiere';

/** Un produit suivi en stock (un parfum en bacs, ou une matière première). */
export interface Produit {
  id: string;
  famille: FamilleStock;
  /** Nom du parfum (bacs) ou de la matière première. */
  nom: string;
  categorie: string;
  unite: Unite;
  /** Quantité actuellement en stock. */
  quantite: number;
  /** En dessous (ou égal à) ce seuil, le produit est signalé en alerte. */
  seuilAlerte: number;
}

/** Sens d'un mouvement de stock. */
export type TypeMouvement = 'entree' | 'sortie';

/** Une entrée ou une sortie de stock. */
export interface Mouvement {
  id: string;
  produitId: string;
  type: TypeMouvement;
  /** Quantité déplacée, toujours positive. */
  quantite: number;
  /** Date et heure au format ISO. */
  date: string;
  motif: string;
}

/** Une tâche ou un rendez-vous de la liste « To do ». */
export interface Tache {
  id: string;
  titre: string;
  /** Jour au format AAAA-MM-JJ, ou chaîne vide si la tâche n'a pas de date. */
  date: string;
  /** Heure au format HH:MM, ou chaîne vide (sans date, l'heure est ignorée). */
  heure: string;
  /** Notes libres (adresse, personne à contacter…). */
  note: string;
  faite: boolean;
}

/** L'ensemble des données de l'application, tel qu'il est sauvegardé. */
export interface DonneesGlacier {
  version: number;
  employes: Employe[];
  creneaux: Creneau[];
  produits: Produit[];
  mouvements: Mouvement[];
  taches: Tache[];
}
