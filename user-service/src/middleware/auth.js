const jwt    = require('jsonwebtoken');
const logger = require('../logger');
const SECRET = process.env.JWT_SECRET || 'dev-secret';

function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    logger.warn(`[AUTH] token manquant sur ${req.method} ${req.url}`);
    return res.status(401).json({ error: 'Token manquant' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), SECRET);
    next();
  } catch (e) {
    logger.warn(`[AUTH] token invalide: ${e.message}`);
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    logger.warn(`[AUTH] accès admin refusé à ${req.user?.email}`);
    return res.status(403).json({ error: 'Accès réservé aux admins' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
