/**
 * Jeu de données d'exemple, chargé au premier lancement pour que
 * l'application ne soit pas vide lors de la découverte. On peut tout
 * effacer depuis la page Paramètres.
 */
import type { Creneau, DonneesGlacier, Employe, Poste, Produit, Tache } from '../types';
import { ajouterJours, aujourdhui, lundiDeLaSemaine } from '../lib/dates';
import { nouvelId } from '../lib/ids';
import { VERSION_DONNEES } from './stockage';

/** Construit un employé d'exemple. */
function employe(
  prenom: string,
  nom: string,
  postes: Poste[],
  statuts: Employe['statuts'],
  majeur = true,
  notes = '',
): Employe {
  return { id: nouvelId(), prenom, nom, telephone: '', postes, statuts, majeur, notes, actif: true };
}

/** Construit un parfum d'exemple, compté en bacs. */
function parfum(nom: string, categorie: string, quantite: number, seuilAlerte: number): Produit {
  return { id: nouvelId(), famille: 'bac', nom, categorie, unite: 'bac', quantite, seuilAlerte };
}

/** Construit une matière première d'exemple. */
function matiere(nom: string, categorie: string, unite: Produit['unite'], quantite: number, seuilAlerte: number): Produit {
  return { id: nouvelId(), famille: 'matiere', nom, categorie, unite, quantite, seuilAlerte };
}

/** Génère les données d'exemple, avec un planning sur la semaine en cours. */
export function donneesExemple(): DonneesGlacier {
  const employes = [
    employe('Camille', 'Martin', ['vente', 'production'], ['manager']),
    employe('Lucas', 'Bernard', ['production'], ['patissier', 'manager']),
    employe('Inès', 'Petit', ['vente'], ['standard']),
    employe('Hugo', 'Moreau', ['vente'], ['standard'], false, 'Étudiant, disponible le week-end et pendant les vacances scolaires.'),
  ];
  const [camille, lucas, ines, hugo] = employes;

  // Planning type sur toute la semaine : production le matin, vente l'après-midi.
  const lundi = lundiDeLaSemaine(aujourdhui());
  const creneaux: Creneau[] = [];
  for (let i = 0; i < 7; i++) {
    const date = ajouterJours(lundi, i);
    const ajouter = (e: Employe, poste: Poste, debut: string, fin: string) =>
      creneaux.push({ id: nouvelId(), employeId: e.id, poste, date, debut, fin, note: '' });
    ajouter(lucas, 'production', '08:00', '12:30');
    ajouter(i % 2 === 0 ? ines : hugo, 'vente', '13:00', '19:00');
    if (i >= 5) ajouter(camille, 'vente', '14:00', '22:00');
  }

  const produits = [
    // Bacs de glace prêts à la vente, par parfum.
    parfum('Vanille', 'Glaces', 6, 2),
    parfum('Chocolat', 'Glaces', 2, 2),
    parfum('Pistache', 'Glaces', 4, 2),
    parfum('Nutella', 'Glaces', 3, 2),
    parfum('Framboise', 'Sorbets', 1, 2),
    parfum('Citron', 'Sorbets', 3, 1),
    // Matières premières pour la production.
    matiere('Lait entier', 'Produits laitiers', 'L', 40, 20),
    matiere('Crème liquide 35 %', 'Produits laitiers', 'L', 8, 10),
    matiere('Nutella', 'Pâtes et arômes', 'kg', 6, 3),
    matiere('Pâte de pistache', 'Pâtes et arômes', 'kg', 1.5, 2),
    matiere('Gousses de vanille', 'Pâtes et arômes', 'pièce', 30, 10),
    matiere('Framboises surgelées', 'Fruits', 'kg', 5, 3),
    matiere('Sucre', 'Sucres', 'kg', 25, 10),
    matiere('Cornets', 'Emballages', 'carton', 3, 2),
  ];

  // Quelques tâches et rendez-vous pour illustrer la liste « To do ».
  const taches: Tache[] = [
    { id: nouvelId(), titre: 'Livraison crème et lait', date: aujourdhui(), heure: '09:00', note: 'Fournisseur laitier, vérifier les dates.', faite: false },
    { id: nouvelId(), titre: 'Rendez-vous comptable', date: ajouterJours(aujourdhui(), 3), heure: '14:30', note: '', faite: false },
    { id: nouvelId(), titre: 'Commander des cornets', date: '', heure: '', note: '', faite: false },
  ];

  return { version: VERSION_DONNEES, employes, creneaux, produits, mouvements: [], taches };
}
