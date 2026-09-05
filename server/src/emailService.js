import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Stockage sécurisé en mémoire des codes OTP actifs
const otpStore = new Map();

// Délai de validité du code : 5 minutes
const OTP_EXPIRATION_MS = 5 * 60 * 1000;
// Délai minimum entre 2 renvois : 30 secondes
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
// Nombre maximal d'essais erronés
const MAX_OTP_ATTEMPTS = 5;

const otpCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of otpStore) if (entry.expiresAt <= now) otpStore.delete(email);
}, 60 * 1000);
otpCleanupTimer.unref?.();

// Transporteur Nodemailer — initialisé en mode lazy (après le chargement de dotenv)
let _mailerInstance = null;

function getMailer() {
  if (_mailerInstance) return _mailerInstance;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    _mailerInstance = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
    console.log(`[AEJ SMTP] Transporteur e-mail initialisé → ${host}:${port} (${user})`);
  }
  return _mailerInstance;
}

/**
 * Génère un code OTP aléatoire à 6 chiffres pour un utilisateur
 */
export function generateOtp(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = otpStore.get(normalizedEmail);

  // Vérification cooldown de renvoi
  if (existing && Date.now() - (existing.createdAt || 0) < OTP_RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - existing.createdAt)) / 1000);
    throw new Error(`Veuillez patienter ${waitSeconds} seconde(s) avant de demander un nouveau code.`);
  }

  // Génération d'un code 6 chiffres sécurisé
  const code = String(crypto.randomInt(100000, 999999));
  const expiresAt = Date.now() + OTP_EXPIRATION_MS;

  otpStore.set(normalizedEmail, {
    code,
    expiresAt,
    createdAt: Date.now(),
    attempts: 0
  });

  return { code, expiresAt, expiresInMinutes: 5 };
}

/**
 * Envoie le code OTP par email avec template officiel AEJ
 */
export async function sendOtpEmail(email, code, userName = '') {
  const normalizedEmail = email.trim().toLowerCase();
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"AEJ Authentification" <no-reply@emploi.gouv.ci>';
  
  // Affichage console formaté pour le développement / démo
  console.log('\n======================================================');
  console.log('📧 [AEJ 2FA] CODE DE VALIDATION DE CONNEXION');
  console.log(`Destinataire : ${normalizedEmail} (${userName || 'Utilisateur'})`);
  console.log(`🔑 Code OTP à 6 chiffres : >>> ${code} <<<`);
  console.log(`⏳ Validité : 5 minutes (Expire à ${new Date(Date.now() + OTP_EXPIRATION_MS).toLocaleTimeString('fr-FR')})`);
  console.log('======================================================\n');

  if (getMailer()) {
    try {
      await getMailer().sendMail({
        from,
        to: normalizedEmail,
        subject: `🔒 ${code} est votre code de vérification AEJ Bouaké`,
        text: `Bonjour ${userName},\n\nVoici votre code d'accès à 6 chiffres pour vous connecter à la plateforme des Immersions Professionnelles AEJ Bouaké :\n\n${code}\n\nCe code est valable pendant 5 minutes.\nSi vous n'avez pas tenté de vous connecter, veuillez ignorer ce message.\n\nAgence Emploi Jeunes - Bouaké`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #0F172A; margin: 0; font-size: 22px;">Agence Emploi Jeunes (AEJ)</h2>
              <p style="color: #64748B; font-size: 13px; margin: 4px 0 0 0;">Direction Régionale du Gbêkê - Bouaké</p>
            </div>
            
            <div style="background-color: #FFF7ED; border-left: 4px solid #E05A10; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="color: #9A3412; margin: 0 0 8px 0; font-size: 16px;">Vérification d'Identité en Deux Étapes</h3>
              <p style="color: #431407; margin: 0; font-size: 13px;">
                Une tentative de connexion a été initiée pour le compte <strong>${normalizedEmail}</strong>.
              </p>
            </div>

            <p style="color: #334155; font-size: 14px;">Bonjour <strong>${userName}</strong>,</p>
            <p style="color: #334155; font-size: 14px;">
              Voici votre code de sécurité à 6 chiffres pour finaliser votre connexion :
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <div style="display: inline-block; background-color: #0F172A; color: #FFFFFF; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 36px; border-radius: 12px; font-family: monospace; border: 2px solid #E05A10;">
                ${code}
              </div>
              <p style="color: #E05A10; font-size: 12px; font-weight: bold; margin-top: 10px;">
                ⏱️ Ce code expire dans 5 minutes
              </p>
            </div>

            <div style="background-color: #F8FAFC; padding: 14px; border-radius: 8px; font-size: 12px; color: #64748B; margin-top: 24px;">
              <strong>⚠️ Conseil de sécurité :</strong> Ne transmettez jamais ce code à un tiers. Aucun conseiller ou agent de l'AEJ ne vous demandera votre code de sécurité par téléphone ou message.
            </div>

            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />

            <p style="text-align: center; color: #94A3B8; font-size: 11px; margin: 0;">
              Système de Gestion Physico-Numérique des Immersions Professionnelles &copy; 2026 AEJ Bouaké
            </p>
          </div>
        `
      });
    } catch (mailError) {
      console.error('Erreur lors de l’envoi de l’email SMTP:', mailError);
    }
  }
}

/**
 * Valide le code OTP soumis par l'utilisateur
 */
export function verifyOtp(email, inputCode) {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = otpStore.get(normalizedEmail);

  if (!entry) {
    return {
      valid: false,
      error: 'Aucun code actif trouvé pour cette adresse e-mail. Veuillez recommencer la connexion.'
    };
  }

  // Vérification de l'expiration (5 minutes)
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedEmail);
    return {
      valid: false,
      error: 'Le code de sécurité a expiré (validité 5 minutes). Veuillez demander un nouveau code.'
    };
  }

  // Incrémentation des tentatives
  entry.attempts += 1;

  if (entry.attempts > MAX_OTP_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return {
      valid: false,
      error: 'Trop de tentatives erronées (5 maximum). Veuillez recommencer la connexion.'
    };
  }

  // Vérification stricte du code 6 chiffres
  const cleanInput = String(inputCode || '').trim();
  const expected = Buffer.from(entry.code, 'utf8');
  const received = Buffer.from(cleanInput, 'utf8');
  const matches = received.length === expected.length && crypto.timingSafeEqual(received, expected);
  if (!matches) {
    const remaining = MAX_OTP_ATTEMPTS - entry.attempts;
    return {
      valid: false,
      error: `Code de validation incorrect. ${remaining > 0 ? `Il vous reste ${remaining} essai(s).` : 'Veuillez demander un nouveau code.'}`
    };
  }

  // Code valide : consommation immédiate (usage unique)
  otpStore.delete(normalizedEmail);
  return { valid: true };
}
