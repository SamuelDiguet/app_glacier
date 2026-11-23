/**
 * Jeu de données d'exemple, chargé au premier lancement pour que
 * l'application ne soit pas vide lors de la découverte. On peut tout
 * effacer depuis la page Paramètres.
 */
import type { Creneau, DonneesGlacier, Employe, Poste, Produit } from '../types';
import { ajouterJours, aujourdhui, lundiDeLaSemaine } from '../lib/dates';
import { nouvelId } from '../lib/ids';
import { VERSION_DONNEES } from './stockage';

/** Construit un employé d'exemple. */
function employe(prenom: string, nom: string, postes: Poste[], statut: Employe['statut']): Employe {
  return { id: nouvelId(), prenom, nom, telephone: '', postes, statut, actif: true };
}

/** Construit un produit d'exemple. */
function produit(nom: string, categorie: string, unite: Produit['unite'], quantite: number, seuilAlerte: number): Produit {
  return { id: nouvelId(), nom, categorie, unite, quantite, seuilAlerte };
}

/** Génère les données d'exemple, avec un planning sur la semaine en cours. */
export function donneesExemple(): DonneesGlacier {
  const employes = [
    employe('Camille', 'Martin', ['vente', 'production'], 'manager'),
    employe('Lucas', 'Bernard', ['production'], 'patissier'),
    employe('Inès', 'Petit', ['vente'], 'standard'),
    employe('Hugo', 'Moreau', ['vente'], 'standard'),
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
    produit('Vanille de Madagascar', 'Glaces', 'bac', 6, 2),
    produit('Chocolat noir', 'Glaces', 'bac', 2, 2),
    produit('Pistache', 'Glaces', 'bac', 4, 2),
    produit('Sorbet framboise', 'Sorbets', 'bac', 1, 2),
    produit('Lait entier', 'Ingrédients', 'L', 40, 20),
    produit('Sucre', 'Ingrédients', 'kg', 25, 10),
    produit('Cornets', 'Emballages', 'carton', 3, 2),
    produit('Pots 2 boules', 'Emballages', 'carton', 1, 2),
  ];

  return { version: VERSION_DONNEES, employes, creneaux, produits, mouvements: [] };
}
