/**
 * Tests des règles du planning (chevauchements, vérifications, heures).
 */
import { describe, expect, it } from 'vitest';
import type { Creneau, Employe } from '../src/types';
import { heuresParEmploye, seChevauchent, verifierCreneau } from '../src/lib/planning';

/** Fabrique un créneau de test avec des valeurs par défaut. */
const creneau = (champs: Partial<Creneau>): Creneau => ({
  id: 'c1', employeId: 'e1', poste: 'vente', date: '2026-11-24', debut: '10:00', fin: '14:00', note: '', ...champs,
});

const ines: Employe = {
  id: 'e1', prenom: 'Inès', nom: 'Petit', telephone: '', postes: ['vente'], statuts: ['standard'], actif: true,
};

describe('planning', () => {
  it('détecte les chevauchements le même jour seulement', () => {
    expect(seChevauchent(creneau({}), creneau({ id: 'c2', debut: '13:00', fin: '18:00' }))).toBe(true);
    expect(seChevauchent(creneau({}), creneau({ id: 'c2', debut: '14:00', fin: '18:00' }))).toBe(false);
    expect(seChevauchent(creneau({}), creneau({ id: 'c2', date: '2026-11-25' }))).toBe(false);
  });

  it('accepte un créneau valide', () => {
    expect(verifierCreneau(creneau({}), ines, [])).toEqual([]);
  });

  it('signale les horaires incohérents, le poste et la double affectation', () => {
    const existant = creneau({ id: 'c2', debut: '12:00', fin: '16:00' });
    const problemes = verifierCreneau(creneau({ poste: 'production', debut: '15:00', fin: '14:00' }), ines, [existant]);
    expect(problemes).toHaveLength(3);
  });

  it('ignore le créneau lui-même lors d’une modification', () => {
    const c = creneau({});
    expect(verifierCreneau(c, ines, [c])).toEqual([]);
  });

  it('additionne les heures par employé', () => {
    const totaux = heuresParEmploye([creneau({}), creneau({ id: 'c2', date: '2026-11-25', debut: '08:00', fin: '09:30' })]);
    expect(totaux.get('e1')).toBe(5.5);
  });
});
