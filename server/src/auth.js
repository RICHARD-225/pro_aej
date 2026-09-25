import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma.js';

const publicUserSelect = {
  id: true,
  agenceId: true,
  email: true,
  nom: true,
  prenoms: true,
  role: true,
  titre: true,
  avatar: true,
  actif: true,
  lastLoginAt: true,
  loginCount: true,
  passwordChangeRequired: true
};

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET est obligatoire');
  }
  return process.env.JWT_SECRET;
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, agenceId: user.agenceId, sessionVersion: user.sessionVersion || 0 },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

export async function authenticateUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !user.actif) return null;

  const passwordMatches = await bcrypt.compare(password, user.motDePasseHash);
  if (!passwordMatches) return null;

  return user;
}

export function toPublicUser(user) {
  return Object.fromEntries(
    Object.keys(publicUserSelect).map((key) => [key, user[key]])
  );
}

function getCookieValue(header, name) {
  const raw = header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || null;
  if (!raw) return null;
  try { return decodeURIComponent(raw); } catch { return raw; }
}

export async function requireAuth(req, res, next) {
  const header = req.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : getCookieValue(req.get('cookie'), 'aej_access_token');
  if (!token) return res.status(401).json({ success: false, message: 'Authentification requise.' });

  try {
    req.auth = jwt.verify(token, getJwtSecret());
    const user = await prisma.user.findUnique({ where: { id: req.auth.sub } });
    if (!user || !user.actif || user.sessionVersion !== (req.auth.sessionVersion || 0)) {
      return res.status(401).json({ success: false, message: 'Session invalide ou utilisateur inactif.' });
    }
    req.user = user;
    req.auth.role = user.role;
    req.auth.agenceId = user.agenceId;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Jeton invalide ou expire.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ success: false, message: 'Permission insuffisante.' });
    }
    return next();
  };
}
