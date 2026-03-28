const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { pool }= require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger  = require('../logger');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Liste tous les utilisateurs (admin)
 *     tags: [Users]
 */
router.get('/', authenticate, requireAdmin, async (req, res) => {
  logger.info(`[LIST USERS] par ${req.user.email}`);
  try {
    const { rows } = await pool.query(
      'SELECT id,email,first_name,last_name,role,is_active,created_at FROM app_users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (e) {
    logger.error(`[DB] ${e.message}`);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Profil utilisateur
 *     tags: [Users]
 */
router.get('/:id', authenticate, async (req, res) => {
  if (req.user.user_id !== req.params.id && req.user.role !== 'admin') {
    logger.warn(`[ACCÈS REFUSÉ] ${req.user.email} tente d'accéder à ${req.params.id}`);
    return res.status(403).json({ error: 'Accès interdit' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id,email,first_name,last_name,role,is_active,created_at FROM app_users WHERE id=$1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(rows[0]);
  } catch (e) {
    logger.error(`[DB] ${e.message}`);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Modifier un utilisateur
 *     tags: [Users]
 */
router.patch('/:id', authenticate, async (req, res) => {
  if (req.user.user_id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès interdit' });
  }
  const { first_name, last_name, password } = req.body;
  const sets = [], vals = [];
  let i = 1;
  if (first_name !== undefined) { sets.push(`first_name=$${i++}`); vals.push(first_name); }
  if (last_name !== undefined)  { sets.push(`last_name=$${i++}`);  vals.push(last_name); }
  if (password) {
    sets.push(`password_hash=$${i++}`);
    vals.push(await bcrypt.hash(password, 12));
  }
  if (!sets.length) return res.status(400).json({ error: 'Aucun champ à modifier' });
  sets.push('updated_at=NOW()');
  vals.push(req.params.id);
  try {
    const { rows } = await pool.query(
      `UPDATE app_users SET ${sets.join(',')} WHERE id=$${i} RETURNING id,email,first_name,last_name,role`,
      vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    logger.info(`[USER MAJ] id=${req.params.id} par=${req.user.email}`);
    res.json(rows[0]);
  } catch (e) {
    logger.error(`[DB] ${e.message}`);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur (admin)
 *     tags: [Users]
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM app_users WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Utilisateur introuvable' });
    logger.warn(`[USER SUPPRIMÉ] id=${req.params.id} par=${req.user.email}`);
    res.status(204).send();
  } catch (e) {
    logger.error(`[DB] ${e.message}`);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

module.exports = router;
