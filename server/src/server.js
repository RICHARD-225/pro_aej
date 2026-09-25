import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { Prisma } from '@prisma/client';
import { REFERENTIELS } from './seedData.js';
import { authenticateUser, requireAuth, requireRole, signAccessToken, toPublicUser } from './auth.js';
import { prisma } from './prisma.js';
import { checklistKeys, toCreateData, toPublicDossier } from './dossierMapper.js';
import { generateOtp, sendOtpEmail, verifyOtp } from './emailService.js';
import { buildEndStageAttestationPdf, buildEnterpriseAttestationPdf, groupAttestationDossiers, sanitizeFilename } from './attestationPdf.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);
const dossierInclude = {
  agence: true,
  candidat: { include: { tuteurs: { include: { tuteur: true } } } },
  entreprise: true,
  conseiller: true,
  verificationItems: { include: { typeVerification: true } },
  corrections: { orderBy: { createdAt: 'desc' }, take: 5 },
  historiquesAudit: { include: { auteur: true }, orderBy: { createdAt: 'asc' } }
};

const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      // Autorise le frontend sur les deux ports Vite possibles en dev
      connectSrc: ["'self'", ...(isDevelopment ? ['ws:', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'] : [])],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));
// CORS : accepte le frontend Vite (port 5173 en dev) et le port configuré via CLIENT_ORIGIN
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (ex: Postman, curl) et les origines listées
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS bloqué : origine non autorisée → ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Limiteur de tentatives de connexion : fixé à 5 tentatives max par tranche de 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion infructueuses (5 maximum). Veuillez patienter 15 minutes avant de réessayer.'
  }
});
const mutationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Trop de tentatives de validation OTP. Réessayez plus tard.' } });
const resendOtpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 3, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Trop de demandes de renvoi OTP. Réessayez plus tard.' } });
const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // Lax en dev (cross-port 3000→5000), Strict en prod
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/',
  maxAge: 8 * 60 * 60 * 1000
};

function setAuthCookie(res, token) {
  const sameSite = authCookieOptions.sameSite[0].toUpperCase() + authCookieOptions.sameSite.slice(1);
  // Token stocké brut (sans encodeURIComponent) pour simplifier la lecture côté requireAuth
  res.setHeader('Set-Cookie', `aej_access_token=${token}; Max-Age=${authCookieOptions.maxAge / 1000}; Path=${authCookieOptions.path}; HttpOnly; SameSite=${sameSite}${authCookieOptions.secure ? '; Secure' : ''}`);
}

function clearAuthCookie(res) {
  const sameSite = process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax';
  res.setHeader('Set-Cookie', `aej_access_token=; Max-Age=0; Path=/; HttpOnly; SameSite=${sameSite}`);
}
const verificationTypesSeed = [
  ['Identité conforme', "Vérification de l'identité du candidat.", 1],
  ['Téléphone conforme', 'Vérification du contact candidat.', 2],
  ["Pièce d'identité conforme", "Vérification de la pièce d'identité.", 3],
  ['Convention conforme', 'Vérification de la convention de stage.', 4],
  ['Entreprise conforme', "Vérification de la structure d'accueil.", 5],
  ["Service d'affectation conforme", "Vérification du poste d'affectation.", 6],
  ['Dates conformes', 'Vérification de la période de stage.', 7],
  ['Signatures conformes', 'Vérification des signatures et cachets.', 8],
  ['Dossier physique présent', 'Vérification de la fiche physique.', 9]
];

export async function ensureVerificationTypes(tx = prisma) {
  for (const [libelle, description, ordreAffichage] of verificationTypesSeed) {
    await tx.typeVerification.upsert({
      where: { ordreAffichage },
      update: { libelle, description, obligatoire: true, actif: true },
      create: { libelle, description, ordreAffichage, obligatoire: true, actif: true }
    });
  }

  return tx.typeVerification.findMany({
    where: { actif: true },
    orderBy: { ordreAffichage: 'asc' }
  });
}

function nextDossierId() {
  return `IMM-${new Date().getFullYear()}-${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
}

function apiError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

const allowedTransitions = {
  SOUMIS: ['EN_VERIFICATION', 'CORRECTION_DEMANDEE', 'VALIDE'],
  EN_VERIFICATION: ['CORRECTION_DEMANDEE', 'VALIDE'],
  CORRECTION_DEMANDEE: ['RESOUMIS'],
  RESOUMIS: ['EN_VERIFICATION', 'CORRECTION_DEMANDEE', 'VALIDE'],
  VALIDE: ['ATTESTATION_GENEREE'],
  ATTESTATION_GENEREE: []
};

function assertWorkflowTransition(currentStatus, nextStatus) {
  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    throw apiError(`Transition de statut interdite : ${currentStatus} -> ${nextStatus}.`, 409);
  }
}

async function findAuthorizedDossier(id, auth, tx = prisma) {
  const dossier = await tx.dossierImmersion.findFirst({
    where: { id, agenceId: auth.agenceId }, include: dossierInclude
  });
  if (!dossier) throw apiError('Dossier introuvable.', 404);
  if (auth.role === 'CONSEILLER' && dossier.conseillerId !== auth.sub) throw apiError('Accès non autorisé à ce dossier.', 403);
  return dossier;
}

function checklistState(dossier) {
  const byOrder = new Map(dossier.verificationItems.map((item) => [item.typeVerification.ordreAffichage, item]));
  return checklistKeys.map((key, index) => ({ key, item: byOrder.get(index + 1) }));
}

function normalizeHeader(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function normalizeCellValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function parseDateCell(value) {
  const raw = normalizeCellValue(value);
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split('/');
    return `${year}-${month}-${day}`;
  }
  return raw;
}

function parseBooleanCell(value) {
  const raw = normalizeCellValue(value).toLowerCase();
  if (!raw) return false;
  return ['oui', 'o', 'true', '1', 'yes', 'y'].includes(raw);
}

function getRowCell(row, aliases) {
  const keyMap = new Map();
  for (const [key, val] of Object.entries(row || {})) {
    keyMap.set(normalizeHeader(key), normalizeCellValue(val));
  }
  for (const alias of aliases) {
    const hit = keyMap.get(normalizeHeader(alias));
    if (hit !== undefined && hit !== '') return hit;
  }
  return '';
}

function toExcelPayload(row) {
  const sexe = normalizeCellValue(getRowCell(row, ['sexe', 'genre'])).toUpperCase();
  const typePaiement = normalizeCellValue(getRowCell(row, ['typepaiement', 'type_de_paiement', 'typepaiements']));
  const typeEntreprise = normalizeCellValue(getRowCell(row, ['typeentreprise', 'type_entreprise', 'natureentreprise']));

  return {
    candidat: {
      nom: normalizeCellValue(getRowCell(row, ['nom', 'nomdefamille', 'nomcandidat'])),
      prenoms: normalizeCellValue(getRowCell(row, ['prenoms', 'prénoms', 'prenom', 'prenomsducandidat'])),
      sexe: sexe === 'HOMME' ? 'HOMME' : 'FEMME',
      date_naissance: parseDateCell(getRowCell(row, ['datedenaissance', 'date_de_naissance', 'date_naissance'])),
      lieu_naissance: normalizeCellValue(getRowCell(row, ['lieunaissance', 'lieu_naissance'] )) || 'BOUAKÉ',
      sous_prefecture_naissance: normalizeCellValue(getRowCell(row, ['sousprefecturenaissance', 'sous_prefecture_naissance'])) || 'BOUAKÉ',
      handicap: parseBooleanCell(getRowCell(row, ['handicap', 'esthandicap'])),
      autre_type_handicap: normalizeCellValue(getRowCell(row, ['typehandicap', 'autre_type_handicap'])),
      nature_piece_identite: normalizeCellValue(getRowCell(row, ['naturepieceidentite', 'nature_piece_identite', 'naturepiece'])) || 'Carte CNI blanc',
      numero_piece_identite: normalizeCellValue(getRowCell(row, ['numeropieceidentite', 'numero_piece_identite', 'numero_piece'])),
      contact_1: normalizeCellValue(getRowCell(row, ['contact1', 'contact_1', 'telephone1', 'portable1'])),
      contact_2: normalizeCellValue(getRowCell(row, ['contact2', 'contact_2', 'telephone2', 'portable2'])),
      niveau_etude: normalizeCellValue(getRowCell(row, ['niveauetude', 'niveau_etude'])) || 'Non renseigné',
      etablissement_frequente: normalizeCellValue(getRowCell(row, ['etablissement', 'etablissementfrequente', 'etablissement_frequente'])) || 'Non renseigné',
      type_enseignement: normalizeCellValue(getRowCell(row, ['typeenseignement', 'type_enseignement'])) || 'Non renseigné',
      sous_prefecture_residence: normalizeCellValue(getRowCell(row, ['sousprefectureresidence', 'sous_prefecture_residence'])) || 'BOUAKÉ',
      localite_residence_habituelle: normalizeCellValue(getRowCell(row, ['localiteresidence', 'localite_residence_habituelle', 'localite_residence'])) || 'BOUAKÉ',
      type_paiement: typePaiement || 'Trésor Money',
      numero_paiement: normalizeCellValue(getRowCell(row, ['numeropaiement', 'numero_paiement', 'numerodepaiement'])) || normalizeCellValue(getRowCell(row, ['contact1', 'contact_1'])),
      tuteur: {
        nom_prenoms: normalizeCellValue(getRowCell(row, ['nomprenomsdetuteur', 'nom_prenoms_tuteur', 'tuteurnomprenoms', 'tuteur'])),
        lien_parente: normalizeCellValue(getRowCell(row, ['lienparente', 'lien_parente_tuteur', 'lienparentetuteur'])) || 'Autre',
        contact: normalizeCellValue(getRowCell(row, ['contacttuteur', 'contact_tuteur', 'telephonetuteur']))
      }
    },
    entreprise: {
      raison_sociale: normalizeCellValue(getRowCell(row, ['entreprisenom', 'raison_sociale', 'nomentreprise', 'entreprise'])),
      type_entreprise: typeEntreprise || 'Privé',
      branche_activite: normalizeCellValue(getRowCell(row, ['brancheactivite', 'branche_activite'])) || 'Autre',
      contact_1: normalizeCellValue(getRowCell(row, ['contactentreprise1', 'contact_entreprise_1', 'entreprisecontact1'])),
      contact_2: normalizeCellValue(getRowCell(row, ['contactentreprise2', 'contact_entreprise_2', 'entreprisecontact2'])),
      sous_prefecture: normalizeCellValue(getRowCell(row, ['sousprefectureentreprise', 'sous_prefecture_entreprise'])) || 'BOUAKÉ',
      localite: normalizeCellValue(getRowCell(row, ['localiteentreprise', 'localite_entreprise'])) || 'BOUAKÉ'
    },
    service_affectation: normalizeCellValue(getRowCell(row, ['serviceaffectation', 'service_affectation', 'service'])) || 'Non renseigné',
    date_debut_stage: parseDateCell(getRowCell(row, ['datedebutstage', 'date_debut_stage', 'date_debut'])),
    date_fin_previsionnelle: parseDateCell(getRowCell(row, ['datefinstage', 'date_fin_stage', 'date_fin_previsionnelle']))
  };
}

function buildWorkbookFromDossiers(dossiers) {
  const rows = dossiers.map((dossier) => ({
    'Conseiller Référent': dossier.conseiller_nom,
    Nom: dossier.candidat.nom,
    Prenoms: dossier.candidat.prenoms,
    Sexe: dossier.candidat.sexe,
    'Date de Naissance': dossier.candidat.date_naissance,
    'Lieu Naissance': dossier.candidat.lieu_naissance,
    'Sous Préfecture Naissance': dossier.candidat.sous_prefecture_naissance,
    Handicap: dossier.candidat.handicap ? 'OUI' : 'NON',
    'Type Handicap': dossier.candidat.autre_type_handicap || '',
    'Nature Pièce Identité': dossier.candidat.nature_piece_identite,
    'Numéro Pièce Identité': dossier.candidat.numero_piece_identite,
    'Contact 1': dossier.candidat.contact_1,
    'Contact 2': dossier.candidat.contact_2 || '',
    'Niveau Étude': dossier.candidat.niveau_etude,
    Établissement: dossier.candidat.etablissement_frequente,
    'Type Enseignement': dossier.candidat.type_enseignement,
    'Sous Préfecture Résidence': dossier.candidat.sous_prefecture_residence,
    'Localité Résidence': dossier.candidat.localite_residence_habituelle,
    'Type Paiement': dossier.candidat.type_paiement,
    'Numéro Paiement': dossier.candidat.numero_paiement,
    'Tuteur Nom Prenoms': dossier.candidat.tuteur?.nom_prenoms || '',
    'Lien Parente Tuteur': dossier.candidat.tuteur?.lien_parente || '',
    'Contact Tuteur': dossier.candidat.tuteur?.contact || '',
    'Entreprise Nom': dossier.entreprise.raison_sociale,
    'Type Entreprise': dossier.entreprise.type_entreprise,
    'Branche Activité': dossier.entreprise.branche_activite,
    'Contact Entreprise 1': dossier.entreprise.contact_1,
    'Contact Entreprise 2': dossier.entreprise.contact_2 || '',
    'Sous Préfecture Entreprise': dossier.entreprise.sous_prefecture,
    'Localité Entreprise': dossier.entreprise.localite,
    'Service Affectation': dossier.service_affectation,
    'Date Début Stage': dossier.date_debut_stage,
    'Date Fin Stage': dossier.date_fin_previsionnelle
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Dossiers');
  return workbook;
}

app.get('/api/health', (_req, res) => res.json({ success: true }));

app.post('/api/auth/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(401).json({ success: false, message: 'Identifiant ou mot de passe incorrect.' });
    }
    const user = await authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Identifiant ou mot de passe incorrect.' });
    }
    // Étape 2 : Génération du code à 6 chiffres et envoi par email
    try {
      const { code } = generateOtp(user.email);
      await sendOtpEmail(user.email, code, `${user.prenoms} ${user.nom}`);
      return res.json({
        success: true,
        requireOtp: true,
        email: user.email,
        userName: `${user.prenoms} ${user.nom}`,
        message: 'Un code de validation à 6 chiffres a été envoyé à votre adresse e-mail.'
      });
    } catch (otpError) {
      return res.status(429).json({ success: false, message: otpError.message });
    }
  } catch (error) { next(error); }
});

app.post('/api/auth/verify-otp', otpLimiter, async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Adresse e-mail et code de validation requis.' });
    }

    const verification = verifyOtp(email, otp);
    if (!verification.valid) {
      return res.status(400).json({ success: false, message: verification.error });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim().toLowerCase() }, actif: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Compte utilisateur introuvable ou inactif.' });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), loginCount: { increment: 1 } } });
      if (updated.agenceId) await tx.userSessionLog.create({ data: { id: randomUUID(), userId: updated.id, agenceId: updated.agenceId, createdAt: new Date() } });
      return updated;
    });
    setAuthCookie(res, signAccessToken(updatedUser));
    return res.json({ success: true, user: toPublicUser(updatedUser), message: 'Connexion réussie et vérifiée.' });
  } catch (error) { next(error); }
});

app.post('/api/auth/resend-otp', resendOtpLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Adresse e-mail requise pour le renvoi.' });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim().toLowerCase() }, actif: true }
    });

    if (!user) return res.json({ success: true, message: 'Si un compte actif correspond à cette adresse, un nouveau code a été envoyé.' });

    const { code } = generateOtp(user.email);
    await sendOtpEmail(user.email, code, `${user.prenoms} ${user.nom}`);

    return res.json({
      success: true,
      message: 'Un nouveau code de validation a été envoyé à votre adresse e-mail.'
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || 'Erreur lors du renvoi du code.' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth.sub } });
    if (!user || !user.actif) throw apiError('Utilisateur inactif ou introuvable.', 401);
    res.json({ success: true, user: toPublicUser(user) });
  } catch (error) { next(error); }
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

app.put('/api/auth/password', requireAuth, mutationLimiter, async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (newPassword.length < 8) throw apiError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
    if (!(await bcrypt.compare(currentPassword, req.user.motDePasseHash))) throw apiError('Mot de passe actuel incorrect.', 401);
    const updated = await prisma.user.update({ where: { id: req.user.id }, data: { motDePasseHash: await bcrypt.hash(newPassword, 10), passwordChangeRequired: false, sessionVersion: { increment: 1 } } });
    clearAuthCookie(res);
    setAuthCookie(res, signAccessToken(updated));
    res.json({ success: true, user: toPublicUser(updated) });
  } catch (error) { next(error); }
});

app.get('/api/referentiels', requireAuth, (_req, res) => res.json({ success: true, data: REFERENTIELS }));

app.get('/api/users', requireAuth, requireRole('SERVICE_INFO', 'DIRECTION'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ where: { agenceId: req.auth.agenceId }, orderBy: [{ role: 'asc' }, { nom: 'asc' }] });
    res.json({ success: true, data: users.map(toPublicUser) });
  } catch (error) { next(error); }
});

app.get('/api/users/logins', requireAuth, requireRole('SERVICE_INFO', 'DIRECTION'), async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const logs = await prisma.userSessionLog.findMany({
      where: {
        agenceId: req.auth.agenceId,
        createdAt: { gte: startOfToday }
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        email: log.user.email,
        prenoms: log.user.prenoms,
        nom: log.user.nom,
        role: log.user.role,
        createdAt: log.createdAt
      }))
    });
  } catch (error) { next(error); }
});

app.patch('/api/auth/profile', requireAuth, mutationLimiter, async (req, res, next) => {
  try {
    const nom = String(req.body?.nom || '').trim();
    const prenoms = String(req.body?.prenoms || '').trim();
    const titre = String(req.body?.titre || '').trim();
    const avatar = String(req.body?.avatar || '').trim();
    if (!nom || !prenoms) throw apiError('Le nom et le prénom sont obligatoires.');
    if (avatar && !(/^(https?:\/\/|data:image\/)/i.test(avatar))) throw apiError('L’avatar doit être une URL http(s) ou une image valide.');
    if (avatar.length > 2 * 1024 * 1024) throw apiError('L’avatar ne doit pas dépasser 2 Mo.');
    const updated = await prisma.user.update({ where: { id: req.auth.sub }, data: { nom, prenoms, titre: titre || null, avatar: avatar || null } });
    res.json({ success: true, user: toPublicUser(updated) });
  } catch (error) { next(error); }
});

app.get('/api/agences', requireAuth, requireRole('SUPER_ADMIN'), async (_req, res, next) => {
  try {
    const agences = await prisma.agence.findMany({ select: { id: true, nom: true, ville: true, directeurNom: true, directeurPrenoms: true, directeurTitre: true, users: { where: { role: 'DIRECTION' }, select: { id: true, nom: true, prenoms: true, email: true, actif: true } } }, orderBy: { nom: 'asc' } });
    res.json({ success: true, data: agences });
  } catch (error) { next(error); }
});

app.post('/api/agences', requireAuth, requireRole('SUPER_ADMIN'), mutationLimiter, async (req, res, next) => {
  try {
    const nom = String(req.body?.nom || '').trim();
    const ville = String(req.body?.ville || '').trim();
    const chefNom = String(req.body?.chef_nom || '').trim();
    const chefPrenoms = String(req.body?.chef_prenoms || '').trim();
    const chefEmail = String(req.body?.chef_email || '').trim().toLowerCase();
    const chefTitre = String(req.body?.chef_titre || 'Chef d’agence').trim();
    if (!nom || !ville || !chefNom || !chefPrenoms || !chefEmail) throw apiError('Agence, ville et informations du chef d’agence sont obligatoires.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chefEmail)) throw apiError('L’email du chef d’agence est invalide.');
    const initialPassword = String(req.body?.chef_password || `AEJ-${randomUUID().replaceAll('-', '').slice(0, 10)}!`);
    if (initialPassword.length < 8) throw apiError('Le mot de passe initial doit contenir au moins 8 caractères.');
    const result = await prisma.$transaction(async (tx) => {
      const agency = await tx.agence.create({ data: { id: randomUUID(), nom, ville, directeurNom: chefNom, directeurPrenoms: chefPrenoms, directeurTitre: chefTitre } });
      const chef = await tx.user.create({ data: { id: randomUUID(), agenceId: agency.id, email: chefEmail, nom: chefNom, prenoms: chefPrenoms, role: 'DIRECTION', titre: chefTitre, motDePasseHash: await bcrypt.hash(initialPassword, 10), actif: true, passwordChangeRequired: true } });
      return { agency, chef };
    });
    res.status(201).json({ success: true, agency: result.agency, credentials: { email: result.chef.email, password: initialPassword }, chef: toPublicUser(result.chef) });
  } catch (error) {
    if (error?.code === 'P2002') return next(apiError('Le nom de l’agence ou l’email du chef existe déjà.', 409));
    next(error);
  }
});

app.post('/api/users', requireAuth, requireRole('SERVICE_INFO', 'DIRECTION'), mutationLimiter, async (req, res, next) => {
  try {
    const nom = String(req.body?.nom || '').trim();
    const prenoms = String(req.body?.prenoms || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const titre = String(req.body?.titre || '').trim();
    const requestedRole = String(req.body?.role || 'CONSEILLER').trim().toUpperCase();

    if (!nom || !prenoms || !email) throw apiError('Nom, prénom(s) et email sont obligatoires.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw apiError('L’email du conseiller est invalide.');
    const allowedRoles = req.auth.role === 'DIRECTION' ? ['CONSEILLER', 'SERVICE_INFO'] : ['CONSEILLER'];
    if (!allowedRoles.includes(requestedRole)) throw apiError(req.auth.role === 'DIRECTION' ? 'Le chef d’agence peut créer un conseiller ou un Service Informatique.' : 'Le Service Informatique peut uniquement créer un conseiller.');
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw apiError(existingUser.actif ? 'Cette adresse e-mail est déjà utilisée par un compte actif.' : 'Cette adresse e-mail appartient à un compte désactivé. Réactivez ce compte ou utilisez une autre adresse.', 409);

    const manualPassword = String(req.body?.password || req.body?.motDePasse || '').trim();
    if (!manualPassword) throw apiError('Le mot de passe initial est obligatoire.');
    const finalPassword = manualPassword;
    if (finalPassword.length < 8) {
      throw apiError('Le mot de passe doit contenir au moins 8 caractères.');
    }

    const newUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        agenceId: req.auth.agenceId,
        email,
        nom,
        prenoms,
        role: requestedRole,
        titre: titre || 'Conseiller Emploi',
        motDePasseHash: await bcrypt.hash(finalPassword, 8),
        actif: true,
        lastLoginAt: null,
        loginCount: 0,
        passwordChangeRequired: true
      }
    });

    res.status(201).json({ success: true, user: toPublicUser(newUser) });
  } catch (error) {
    if (error?.code === 'P2002' && error?.meta?.target?.includes?.('email')) {
      return next(apiError('Cette adresse e-mail est déjà utilisée par un autre compte.', 409));
    }
    next(error);
  }
});

app.patch('/api/users/:id/status', requireAuth, requireRole('SERVICE_INFO', 'DIRECTION'), mutationLimiter, async (req, res, next) => {
  try {
    const actif = req.body?.actif;
    if (typeof actif !== 'boolean') throw apiError('Le statut actif doit être booléen.');
    const user = await prisma.user.updateMany({ where: { id: req.params.id, agenceId: req.auth.agenceId }, data: { actif, ...(actif ? {} : { sessionVersion: { increment: 1 } }) } });
    if (!user.count) throw apiError('Utilisateur introuvable.', 404);
    res.json({ success: true });
  } catch (error) { next(error); }
});

app.patch('/api/users/:id/password', requireAuth, requireRole('SERVICE_INFO', 'DIRECTION'), mutationLimiter, async (req, res, next) => {
  try {
    const newPassword = String(req.body?.newPassword || '').trim();
    if (newPassword.length < 8) throw apiError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
    const target = await prisma.user.findFirst({ where: { id: req.params.id, agenceId: req.auth.agenceId, role: 'CONSEILLER' } });
    if (!target) throw apiError('Conseiller introuvable dans cette agence.', 404);
    const user = await prisma.user.update({
      where: { id: target.id },
      data: {
        motDePasseHash: await bcrypt.hash(newPassword, 10),
        passwordChangeRequired: true,
        sessionVersion: { increment: 1 }
      }
    });
    res.json({ success: true, user: toPublicUser(user) });
  } catch (error) { next(error); }
});

app.get('/api/dossiers', requireAuth, async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim().slice(0, 100);
    const statut = String(req.query.statut || '').trim() || undefined;
    const page = Math.max(Number.parseInt(req.query.page || '1', 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(req.query.pageSize || '25', 10) || 25, 1), 100);
    const allowedStatuses = ['BROUILLON', 'SOUMIS', 'EN_VERIFICATION', 'CORRECTION_DEMANDEE', 'RESOUMIS', 'VALIDE', 'ATTESTATION_GENEREE', 'REJETE', 'ARCHIVE'];
    if (statut && !allowedStatuses.includes(statut)) throw apiError('Statut de recherche invalide.');
    const where = {
      agenceId: req.auth.agenceId,
      ...(statut ? { statutWorkflow: statut } : {}),
      ...(req.auth.role === 'CONSEILLER' ? { conseillerId: req.auth.sub } : {}),
      ...(search ? { OR: [
        { id: { contains: search } }, { candidat: { nom: { contains: search } } }, { candidat: { prenoms: { contains: search } } },
        { candidat: { numeroPieceIdentite: { contains: search } } }, { candidat: { contact1: { contains: search } } },
        { entreprise: { raisonSociale: { contains: search } } }
      ] } : {})
    };
    const [dossiers, total] = await prisma.$transaction([
      prisma.dossierImmersion.findMany({ where, include: dossierInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.dossierImmersion.count({ where })
    ]);
    res.json({ success: true, count: dossiers.length, total, page, pageSize, totalPages: Math.ceil(total / pageSize), data: dossiers.map(toPublicDossier) });
  } catch (error) { next(error); }
});
// export excel
app.get('/api/dossiers/export-excel', requireAuth, async (req, res, next) => {
  try {
    const where = {
      agenceId: req.auth.agenceId,
      ...(req.auth.role === 'CONSEILLER' ? { conseillerId: req.auth.sub } : {})
    };
    const dossiers = await prisma.dossierImmersion.findMany({
      where,
      include: dossierInclude,
      orderBy: { createdAt: 'desc' }
    });
    const workbook = buildWorkbookFromDossiers(dossiers.map(toPublicDossier));
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="dossiers_aej.xlsx"');
    res.send(buffer);
  } catch (error) { next(error); }
});
// import
app.post('/api/dossiers/import-excel', requireAuth, requireRole('CONSEILLER', 'SERVICE_INFO', 'DIRECTION'), multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
  if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) cb(null, true); else cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) sont acceptés.'));
} }).single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw apiError('Aucun fichier Excel n\'a été sélectionné.');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) throw apiError('Le fichier Excel est vide.');

    const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '', raw: false });
    if (!rows.length) throw apiError('Le fichier Excel ne contient aucune ligne de données.');
    if (rows.length > 1000) throw apiError('Le fichier Excel ne peut pas dépasser 1000 lignes.');

    const results = { total: rows.length, imported: [], failed: [] };
    const selectedConseillerId = req.auth.role === 'CONSEILLER' ? req.auth.sub : String(req.body.conseiller_id || '');

    for (let index = 0; index < rows.length; index += 1) {
      const rowNumber = index + 2;
      try {
        const payload = toExcelPayload(rows[index]);
        const conseillerId = req.auth.role === 'CONSEILLER' ? req.auth.sub : selectedConseillerId || (await prisma.user.findFirst({ where: { agenceId: req.auth.agenceId, role: 'CONSEILLER', actif: true } }))?.id;
        if (!conseillerId) throw apiError('Un conseiller valide est requis pour l\'import.');

        const data = toCreateData(payload, conseillerId, req.auth.agenceId);
        const created = await prisma.$transaction(async (tx) => {
          const conseiller = await tx.user.findFirst({ where: { id: conseillerId, agenceId: req.auth.agenceId, role: 'CONSEILLER', actif: true } });
          if (!conseiller) throw apiError('Conseiller introuvable dans cette agence.', 404);
          const duplicate = await tx.candidat.findFirst({ where: { OR: [{ numeroPieceIdentite: data.candidat.numeroPieceIdentite }, { contact1: data.candidat.contact1 }] } });
          if (duplicate) {
            if (duplicate.numeroPieceIdentite === data.candidat.numeroPieceIdentite) throw apiError("Doublon détecté : ce numéro de pièce d'identité existe déjà dans la base.", 409);
            throw apiError('Doublon détecté : ce contact candidat existe déjà dans la base.', 409);
          }
          const duplicatePayment = await tx.candidat.findFirst({ where: { numeroPaiement: data.candidat.numeroPaiement } });
          if (duplicatePayment) throw apiError('Doublon détecté : ce numéro de paiement existe déjà dans la base.', 409);
          const existingEntreprise = await tx.entreprise.findFirst({ where: { raisonSociale: data.entreprise.raisonSociale, dossiers: { some: { agenceId: req.auth.agenceId } } } });
          const types = await ensureVerificationTypes(tx);
          if (types.length !== 9) throw apiError('Les 9 types de vérification ne sont pas initialisés.', 500);
          const max = await tx.dossierImmersion.aggregate({ where: { agenceId: req.auth.agenceId }, _max: { numeroOrdreExcel: true } });
          return tx.dossierImmersion.create({ data: {
            id: nextDossierId(), numeroOrdreExcel: (max._max.numeroOrdreExcel || 0) + 1, dateSaisie: new Date(), statutWorkflow: 'SOUMIS',
            agence: { connect: { id: req.auth.agenceId } },
            conseiller: { connect: { id: conseiller.id } },
            serviceAffectation: data.dossier.serviceAffectation,
            dateDebutStage: data.dossier.dateDebutStage,
            dateFinPrevisionnelle: data.dossier.dateFinPrevisionnelle,
            departementAdministratifStage: data.dossier.departementAdministratifStage,
            sousPrefectureLieuStage: data.dossier.sousPrefectureLieuStage,
            localiteLieuStage: data.dossier.localiteLieuStage,
            candidat: { create: data.candidat },
            entreprise: existingEntreprise ? { connect: { id: existingEntreprise.id } } : { create: data.entreprise },
            verificationItems: { create: types.map((type) => ({ id: randomUUID(), typeVerificationId: type.id, conforme: false })) },
            historiquesAudit: { create: { auteurId: req.auth.sub, action: 'Import Excel du dossier', nouveauStatut: 'SOUMIS' } }
          }, include: dossierInclude });
        }, { isolationLevel: 'Serializable' });

        results.imported.push({ rowNumber, dossierId: created.id });
      } catch (error) {
        results.failed.push({ rowNumber, error: error.message || 'Erreur inconnue' });
      }
    }

    return res.json({ success: true, message: `Import terminé : ${results.imported.length} dossiers importés, ${results.failed.length} lignes refusées.`, data: results });
  } catch (error) { next(error); }
});

app.get('/api/dossiers/:id', requireAuth, async (req, res, next) => {
  try { res.json({ success: true, data: toPublicDossier(await findAuthorizedDossier(req.params.id, req.auth)) }); }
  catch (error) { next(error); }
});

app.post('/api/dossiers', requireAuth, requireRole('CONSEILLER', 'SERVICE_INFO', 'DIRECTION'), mutationLimiter, async (req, res, next) => {
  try {
    const conseillerId = req.auth.role === 'CONSEILLER' ? req.auth.sub : String(req.body.conseiller_id || '');
    if (!conseillerId) throw apiError('Un conseiller destinataire est requis.');
    const created = await prisma.$transaction(async (tx) => {
      const conseiller = await tx.user.findFirst({ where: { id: conseillerId, agenceId: req.auth.agenceId, role: 'CONSEILLER', actif: true } });
      if (!conseiller) throw apiError('Conseiller introuvable dans cette agence.');
      const data = toCreateData(req.body, conseillerId, req.auth.agenceId);
      const duplicate = await tx.candidat.findFirst({ where: { OR: [{ numeroPieceIdentite: data.candidat.numeroPieceIdentite }, { contact1: data.candidat.contact1 }] } });
      if (duplicate) {
        if (duplicate.numeroPieceIdentite === data.candidat.numeroPieceIdentite) throw apiError("Doublon détecté : ce numéro de pièce d'identité existe déjà dans la base.", 409);
        throw apiError('Doublon détecté : ce contact candidat existe déjà dans la base.', 409);
      }
      const duplicatePayment = await tx.candidat.findFirst({ where: { numeroPaiement: data.candidat.numeroPaiement } });
      if (duplicatePayment) throw apiError('Doublon détecté : ce numéro de paiement existe déjà dans la base.', 409);
      const existingEntreprise = await tx.entreprise.findFirst({ where: { raisonSociale: data.entreprise.raisonSociale, dossiers: { some: { agenceId: req.auth.agenceId } } } });
      const types = await ensureVerificationTypes(tx);
      if (types.length !== 9) throw apiError('Les 9 types de vérification ne sont pas initialisés.', 500);
      const max = await tx.dossierImmersion.aggregate({ where: { agenceId: req.auth.agenceId }, _max: { numeroOrdreExcel: true } });
      return tx.dossierImmersion.create({ data: {
        id: nextDossierId(), numeroOrdreExcel: (max._max.numeroOrdreExcel || 0) + 1, dateSaisie: new Date(), statutWorkflow: 'SOUMIS',
        // Les relations obligatoires sont connectées explicitement lorsque les autres relations sont créées imbriquées.
        agence: { connect: { id: req.auth.agenceId } },
        conseiller: { connect: { id: conseiller.id } },
        serviceAffectation: data.dossier.serviceAffectation,
        dateDebutStage: data.dossier.dateDebutStage,
        dateFinPrevisionnelle: data.dossier.dateFinPrevisionnelle,
        departementAdministratifStage: data.dossier.departementAdministratifStage,
        sousPrefectureLieuStage: data.dossier.sousPrefectureLieuStage,
        localiteLieuStage: data.dossier.localiteLieuStage,
        candidat: { create: data.candidat }, entreprise: existingEntreprise ? { connect: { id: existingEntreprise.id } } : { create: data.entreprise },
        verificationItems: { create: types.map((type) => ({ id: randomUUID(), typeVerificationId: type.id, conforme: false })) },
        historiquesAudit: { create: { auteurId: req.auth.sub, action: 'Soumission du dossier', nouveauStatut: 'SOUMIS' } }
      }, include: dossierInclude });
    }, { isolationLevel: 'Serializable' });
    res.status(201).json({ success: true, data: toPublicDossier(created) });
  } catch (error) { next(error); }
});

app.put('/api/dossiers/:id/checklist', requireAuth, requireRole('SERVICE_INFO', 'DIRECTION'), mutationLimiter, async (req, res, next) => {
  try {
    const checklist = req.body?.checklist;
    if (!checklist || checklistKeys.some((key) => typeof checklist[key] !== 'boolean')) throw apiError('La checklist complète à 9 points est requise.');
    const updated = await prisma.$transaction(async (tx) => {
      const dossier = await findAuthorizedDossier(req.params.id, req.auth, tx);
      const rows = checklistState(dossier);
      if (rows.some(({ item }) => !item)) throw apiError('Checklist de vérification incomplète.', 500);
      await Promise.all(rows.map(({ key, item }) => tx.verificationItem.update({ where: { id: item.id }, data: { conforme: checklist[key], observation: checklist.observations_controle?.trim() || null, verifieParId: req.auth.sub, dateVerification: new Date() } })));
      const conforme = checklistKeys.every((key) => checklist[key]);
      const statutWorkflow = conforme ? 'VALIDE' : 'EN_VERIFICATION';
      assertWorkflowTransition(dossier.statutWorkflow, statutWorkflow);
      await tx.dossierImmersion.update({ where: { id: dossier.id }, data: { statutWorkflow, ...(conforme ? { dateValidation: new Date(), valideParId: req.auth.sub } : {}) } });
      await tx.historiqueAudit.create({ data: { dossierId: dossier.id, auteurId: req.auth.sub, action: conforme ? 'Validation après contrôle complet' : 'Mise à jour de la checklist', ancienStatut: dossier.statutWorkflow, nouveauStatut: statutWorkflow } });
      return findAuthorizedDossier(dossier.id, req.auth, tx);
    });
    res.json({ success: true, data: toPublicDossier(updated) });
  } catch (error) { next(error); }
});

app.post('/api/dossiers/:id/correct', requireAuth, requireRole('SERVICE_INFO', 'DIRECTION'), mutationLimiter, async (req, res, next) => {
  try {
    const motif = String(req.body?.motif || '').trim();
    const checklist = req.body?.checklist;
    if (!motif) throw apiError('Le motif de correction est requis.');

    const updated = await prisma.$transaction(async (tx) => {
      const dossier = await findAuthorizedDossier(req.params.id, req.auth, tx);
      assertWorkflowTransition(dossier.statutWorkflow, 'CORRECTION_DEMANDEE');

      // Si la checklist des 9 points est transmise, on enregistre l'état exact des points pour le conseiller
      if (checklist) {
        const rows = checklistState(dossier);
        await Promise.all(rows.map(({ key, item }) => {
          if (!item) return null;
          return tx.verificationItem.update({
            where: { id: item.id },
            data: {
              conforme: Boolean(checklist[key]),
              observation: checklist.observations_controle?.trim() || motif,
              verifieParId: req.auth.sub,
              dateVerification: new Date()
            }
          });
        }));
      }

      await tx.correction.create({ data: { id: randomUUID(), dossierId: dossier.id, demandeParId: req.auth.sub, motif } });
      await tx.dossierImmersion.update({ where: { id: dossier.id }, data: { statutWorkflow: 'CORRECTION_DEMANDEE' } });
      await tx.historiqueAudit.create({ data: { dossierId: dossier.id, auteurId: req.auth.sub, action: 'Demande de correction', description: motif, ancienStatut: dossier.statutWorkflow, nouveauStatut: 'CORRECTION_DEMANDEE' } });
      return findAuthorizedDossier(dossier.id, req.auth, tx);
    });
    res.json({ success: true, data: toPublicDossier(updated) });
  } catch (error) { next(error); }
});

// Le conseiller corrige uniquement son dossier, puis le remet dans la file du Service Info.
// Les objets candidat/entreprise/tuteur sont mis à jour proprement sans conflits d'identifiants.
app.put('/api/dossiers/:id/resubmit', requireAuth, requireRole('CONSEILLER'), mutationLimiter, async (req, res, next) => {
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const dossier = await findAuthorizedDossier(req.params.id, req.auth, tx);
      if (dossier.statutWorkflow !== 'CORRECTION_DEMANDEE') throw apiError('Seul un dossier en correction peut être resoumis.', 409);
      assertWorkflowTransition(dossier.statutWorkflow, 'RESOUMIS');
      const correctionPoints = req.body?.correction_points || {};
      const pendingCorrectionPoints = checklistState(dossier)
        .filter(({ item }) => item && !item.conforme)
        .map(({ key }) => key)
        .filter((key) => correctionPoints[key] !== true);
      if (pendingCorrectionPoints.length) throw apiError('Toutes les corrections demandées doivent être confirmées avant la resoumission.', 409);
      const data = toCreateData(req.body, dossier.conseillerId, dossier.agenceId);
      const { id: _candidatId, tuteurs, ...candidat } = data.candidat;
      const { id: _entrepriseId, ...entreprise } = data.entreprise;
      await tx.candidat.update({ where: { id: dossier.candidatId }, data: candidat });
      await tx.entreprise.update({ where: { id: dossier.entrepriseId }, data: entreprise });
      if (tuteurs?.create) {
        const { id: _tuteurId, ...tuteurData } = tuteurs.create.tuteur.create;
        const relationExistante = dossier.candidat.tuteurs?.[0];
        if (relationExistante) {
          await tx.tuteur.update({ where: { id: relationExistante.tuteurId }, data: tuteurData });
          await tx.candidatTuteur.update({ where: { candidatId_tuteurId: { candidatId: dossier.candidatId, tuteurId: relationExistante.tuteurId } }, data: { lienParente: tuteurs.create.lienParente } });
        } else {
          await tx.candidatTuteur.create({ data: { candidatId: dossier.candidatId, lienParente: tuteurs.create.lienParente, tuteur: { create: tuteurData } } });
        }
      }
      await tx.correction.updateMany({ where: { dossierId: dossier.id, statut: 'EN_ATTENTE' }, data: { statut: 'CORRIGEE', corrigeeAt: new Date() } });
      await tx.dossierImmersion.update({ where: { id: dossier.id }, data: { ...data.dossier, statutWorkflow: 'RESOUMIS', dateValidation: null, valideParId: null } });
      await tx.historiqueAudit.create({ data: { dossierId: dossier.id, auteurId: req.auth.sub, action: 'Correction et resoumission', ancienStatut: 'CORRECTION_DEMANDEE', nouveauStatut: 'RESOUMIS' } });
      return findAuthorizedDossier(dossier.id, req.auth, tx);
    });
    res.json({ success: true, data: toPublicDossier(updated) });
  } catch (error) { next(error); }
});

app.post('/api/attestations/entreprise', requireAuth, requireRole('CONSEILLER', 'SERVICE_INFO', 'DIRECTION'), mutationLimiter, async (req, res, next) => {
  try {
    const entrepriseId = String(req.body?.entreprise_id || '').trim();
    if (!entrepriseId) throw apiError('L’entreprise à attester est requise.');
    const where = {
      agenceId: req.auth.agenceId,
      entrepriseId,
      statutWorkflow: { not: 'ARCHIVE' }
    };
    const dossiers = await prisma.dossierImmersion.findMany({ where, include: dossierInclude, orderBy: { dateDebutStage: 'asc' } });
    if (!dossiers.length) throw apiError('Aucun dossier trouvé pour cette entreprise.', 404);
    const nonValides = dossiers.filter((dossier) => !['VALIDE', 'ATTESTATION_GENEREE'].includes(dossier.statutWorkflow));
    if (nonValides.length) throw apiError(`Impression impossible : ${nonValides.length} dossier(s) de cette entreprise ne sont pas encore validé(s).`, 409);
    const agency = dossiers[0].agence;
    const enterprise = dossiers[0].entreprise;
    const reference = `ATT-ENT-${new Date().getFullYear()}-${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
    const numeroAttestation = await prisma.$transaction(async (tx) => {
      const existing = await tx.attestation.findFirst({ where: { entrepriseId, agenceId: req.auth.agenceId, statut: 'GENEREE', typeAttestation: 'ENTREPRISE' }, orderBy: { dateGeneration: 'desc' } });
      const numero = existing?.numeroAttestation || reference;
      if (!existing) {
        await tx.attestation.create({ data: { id: randomUUID(), typeAttestation: 'ENTREPRISE', numeroAttestation: numero, entrepriseId, agenceId: req.auth.agenceId, periodeDebut: dossiers[0].dateDebutStage, periodeFin: dossiers.reduce((latest, dossier) => dossier.dateFinPrevisionnelle > latest ? dossier.dateFinPrevisionnelle : latest, dossiers[0].dateFinPrevisionnelle), genereeParId: req.auth.sub, cheminFichier: `attestations/${numero}.pdf` } });
      }
      const validDossiers = dossiers.filter((dossier) => dossier.statutWorkflow === 'VALIDE');
      if (validDossiers.length) {
        await tx.dossierImmersion.updateMany({ where: { id: { in: validDossiers.map((dossier) => dossier.id) } }, data: { statutWorkflow: 'ATTESTATION_GENEREE' } });
        await Promise.all(validDossiers.map((dossier) => tx.historiqueAudit.create({ data: { dossierId: dossier.id, auteurId: req.auth.sub, action: 'Génération attestation entreprise', ancienStatut: 'VALIDE', nouveauStatut: 'ATTESTATION_GENEREE', description: numero } })));
      }
      return numero;
    });
    const pdf = await buildEnterpriseAttestationPdf(agency, enterprise, dossiers, numeroAttestation);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(enterprise.raisonSociale)}.pdf"`);
    res.send(pdf);
  } catch (error) { next(error); }
});

app.post('/api/attestations/dossier/:id', requireAuth, requireRole('SERVICE_INFO', 'CONSEILLER', 'DIRECTION'), mutationLimiter, async (req, res, next) => {
  try {
    const dossier = await prisma.$transaction(async (tx) => {
      const selected = await findAuthorizedDossier(req.params.id, req.auth, tx);
      if (!['VALIDE', 'ATTESTATION_GENEREE'].includes(selected.statutWorkflow)) {
        throw apiError('Le dossier n’est pas encore validé pour la génération d’attestation.', 409);
      }

      const existing = await tx.attestation.findFirst({ where: { dossierId: selected.id, typeAttestation: 'FIN_STAGE', statut: 'GENEREE' }, orderBy: { dateGeneration: 'desc' } });
      const numeroAttestation = existing?.numeroAttestation || `ATT-FIN-${new Date().getFullYear()}-${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
      if (selected.statutWorkflow === 'VALIDE') {
        await tx.dossierImmersion.update({
          where: { id: selected.id },
          data: { statutWorkflow: 'ATTESTATION_GENEREE' }
        });
        await tx.historiqueAudit.create({
          data: {
            dossierId: selected.id,
            auteurId: req.auth.sub,
            action: 'Génération attestation individuelle',
            ancienStatut: 'VALIDE',
            nouveauStatut: 'ATTESTATION_GENEREE',
            description: numeroAttestation
          }
        });
      }

      if (!existing) {
        await tx.attestation.create({
          data: {
            id: randomUUID(),
            typeAttestation: 'FIN_STAGE',
            numeroAttestation,
            dossierId: selected.id,
            entrepriseId: selected.entrepriseId,
            agenceId: req.auth.agenceId,
            periodeDebut: selected.dateDebutStage,
            periodeFin: selected.dateFinPrevisionnelle,
            genereeParId: req.auth.sub,
            cheminFichier: `attestations/${numeroAttestation}.pdf`,
            statut: 'GENEREE'
          }
        });
      }

      return { dossier: selected, numeroAttestation };
    });

    const pdf = await buildEndStageAttestationPdf(dossier.dossier.agence, dossier.dossier, dossier.numeroAttestation);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(`${dossier.dossier.candidat.nom}-${dossier.dossier.candidat.prenoms}-fin-stage`)}.pdf"`);
    res.send(pdf);
  } catch (error) { next(error); }
});

app.post('/api/attestations/lot', requireAuth, requireRole('SERVICE_INFO', 'DIRECTION'), mutationLimiter, async (req, res, next) => {
  try {
    const dossierIds = Array.isArray(req.body?.dossier_ids) ? req.body.dossier_ids.map((id) => String(id)) : [];
    if (!dossierIds.length) throw apiError('Au moins un dossier est requis pour générer un lot d’attestations.', 400);

    const dossiers = await prisma.dossierImmersion.findMany({
      where: { id: { in: dossierIds }, agenceId: req.auth.agenceId, statutWorkflow: { in: ['VALIDE', 'ATTESTATION_GENEREE'] } },
      include: dossierInclude,
      orderBy: { dateDebutStage: 'asc' }
    });

    if (!dossiers.length) throw apiError('Aucun dossier validé sélectionné pour ce lot d’attestations.', 404);

    const group = groupAttestationDossiers(dossiers);
    const agency = dossiers[0].agence;
    const numeroAttestation = `ATT-LOT-${new Date().getFullYear()}-${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;

    await prisma.$transaction(async (tx) => {
      const validDossiers = dossiers.filter((dossier) => dossier.statutWorkflow === 'VALIDE');
      if (validDossiers.length) {
        await tx.dossierImmersion.updateMany({ where: { id: { in: validDossiers.map((dossier) => dossier.id) } }, data: { statutWorkflow: 'ATTESTATION_GENEREE' } });
        await Promise.all(validDossiers.map((dossier) => tx.historiqueAudit.create({ data: { dossierId: dossier.id, auteurId: req.auth.sub, action: 'Génération attestation lot', ancienStatut: 'VALIDE', nouveauStatut: 'ATTESTATION_GENEREE', description: numeroAttestation } })));
      }

      const existing = await tx.attestation.findMany({
        where: { dossierId: { in: dossiers.map((dossier) => dossier.id) }, typeAttestation: 'FIN_STAGE', statut: 'GENEREE' },
        select: { dossierId: true }
      });
      const existingIds = new Set(existing.map((attestation) => attestation.dossierId));
      const missing = dossiers.filter((dossier) => !existingIds.has(dossier.id));
      if (missing.length) await tx.attestation.createMany({
        data: missing.map((dossier) => ({
          id: randomUUID(),
          typeAttestation: 'FIN_STAGE',
          numeroAttestation: `${numeroAttestation}-${dossier.id.slice(-6)}`,
          dossierId: dossier.id,
          entrepriseId: dossier.entrepriseId,
          agenceId: req.auth.agenceId,
          periodeDebut: dossier.dateDebutStage,
          periodeFin: dossier.dateFinPrevisionnelle,
          genereeParId: req.auth.sub,
          cheminFichier: `attestations/${numeroAttestation}-${dossier.id}.pdf`,
          statut: 'GENEREE'
        }))
      });
    });

    const pdf = await buildEndStageAttestationPdf(agency, group.items, numeroAttestation);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(group.entrepriseName)}.pdf"`);
    res.send(pdf);
  } catch (error) { next(error); }
});

app.get('/api/attestations', requireAuth, async (req, res, next) => {
  try {
    const status = String(req.query.statut || '').trim();
    const attestations = await prisma.attestation.findMany({
      where: { agenceId: req.auth.agenceId, ...(status ? { statut: status } : {}), ...(req.auth.role === 'CONSEILLER' ? { OR: [{ dossier: { conseillerId: req.auth.sub } }, { typeAttestation: 'ENTREPRISE', genereeParId: req.auth.sub }] } : {}) },
      include: { entreprise: true, dossier: { include: { candidat: true } } },
      orderBy: { dateGeneration: 'desc' }
    });
    res.json({ success: true, data: attestations });
  } catch (error) { next(error); }
});

app.post('/api/attestations/entreprise/:entrepriseId/archive', requireAuth, requireRole('CONSEILLER', 'SERVICE_INFO', 'DIRECTION'), mutationLimiter, async (req, res, next) => {
  try {
    const entrepriseId = String(req.params.entrepriseId || '').trim();
    const archived = await prisma.attestation.updateMany({
      where: {
        agenceId: req.auth.agenceId,
        entrepriseId,
        typeAttestation: 'ENTREPRISE',
        statut: 'GENEREE',
        ...(req.auth.role === 'CONSEILLER' ? { genereeParId: req.auth.sub } : {})
      },
      data: { statut: 'ARCHIVEE' }
    });
    if (!archived.count) throw apiError('Aucune attestation entreprise active à archiver.', 404);
    res.json({ success: true, archived: archived.count });
  } catch (error) { next(error); }
});

app.get('/api/stats', requireAuth, requireRole('SERVICE_INFO', 'DIRECTION'), async (req, res, next) => {
  try {
    const grouped = await prisma.dossierImmersion.groupBy({ by: ['statutWorkflow'], where: { agenceId: req.auth.agenceId }, _count: { _all: true } });
    const counts = Object.fromEntries(grouped.map((item) => [item.statutWorkflow, item._count._all]));
    const total = grouped.reduce((sum, item) => sum + item._count._all, 0);
    const valides = (counts.VALIDE || 0) + (counts.ATTESTATION_GENEREE || 0);
    res.json({ success: true, kpis: { total, enregistres: total, en_verification: (counts.SOUMIS || 0) + (counts.EN_VERIFICATION || 0) + (counts.RESOUMIS || 0), corrections_demandees: counts.CORRECTION_DEMANDEE || 0, valides, attestations_disponibles: counts.ATTESTATION_GENEREE || 0 } });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  const prismaStatus = error instanceof Prisma.PrismaClientKnownRequestError
    ? (error.code === 'P2002' ? 409 : error.code === 'P2025' ? 404 : 400)
    : 500;
  const status = error.status || prismaStatus;
  if (status >= 500) {
    console.error(JSON.stringify({ event: 'server_error', status, message: error.message, timestamp: new Date().toISOString() }));
  }
  res.status(status).json({
    success: false,
    message: status >= 500
      ? 'Erreur interne du serveur.'
      : error.message
  });
});

const startServer = async () => {
  await ensureVerificationTypes();
  app.listen(PORT, () => console.log(`[AEJ Bouaké] API démarrée sur le port ${PORT}`));
};

export { app };

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  startServer().catch((error) => {
    console.error('Échec au démarrage du serveur :', error);
    process.exit(1);
  });
}

process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
