// =================================================
// F4TE STAFF PANEL - Usuários internos
// =================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// GET /api/users (apenas ADMIN)
router.get('/', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, username, display_name, role, rank_habbo, ativo, criado_em, ultimo_login
       FROM panel_users ORDER BY id ASC`
    );
    res.json({ users: rows });
  } catch (e) { next(e); }
});

// POST /api/users
router.post('/', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const username     = String(req.body?.username || '').toLowerCase().trim().slice(0, 50);
    const password     = String(req.body?.password || '');
    const display_name = String(req.body?.display_name || username).slice(0, 100);
    const role         = String(req.body?.role || 'HELPER').toUpperCase();
    const rank_habbo   = Math.max(1, Math.min(15, Number(req.body?.rank_habbo) || 1));
    if (!/^[a-z0-9_.\-]{3,50}$/.test(username)) return res.status(400).json({ error: 'username inválido' });
    if (password.length < 8) return res.status(400).json({ error: 'senha precisa ter ao menos 8 caracteres' });
    if (!['MOD','ADMIN','HELPER'].includes(role)) return res.status(400).json({ error: 'role inválida' });

    const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 10);
    const r = await query(
      'INSERT INTO panel_users (username, password_hash, display_name, role, rank_habbo) VALUES (?,?,?,?,?)',
      [username, hash, display_name, role, rank_habbo]
    );
    res.json({ ok: true, id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Já existe um usuário com esse username' });
    next(e);
  }
});

module.exports = router;
