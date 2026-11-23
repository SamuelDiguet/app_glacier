/**
 * Tests de la lecture de l'adresse au retour d'un lien reçu par e-mail.
 */
import { describe, expect, it } from 'vitest';
import { lireRetourLien } from '../src/lib/retourLien';

describe('retour d’un lien reçu par e-mail', () => {
  it('ne signale rien sur une adresse normale', () => {
    expect(lireRetourLien('', '#/planning')).toEqual({ code: false, erreur: '' });
  });

  it('repère le code à échanger contre une session', () => {
    expect(lireRetourLien('?code=abc123', '')).toEqual({ code: true, erreur: '' });
  });

  it('traduit un lien expiré, même transmis dans le fragment', () => {
    const retour = lireRetourLien('', '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid');
    expect(retour.erreur).toMatch(/expiré/);
  });

  it('garde le message d’origine pour une erreur inconnue', () => {
    expect(lireRetourLien('?error=x&error_description=Autre+erreur', '').erreur).toBe('Autre erreur');
  });
});
