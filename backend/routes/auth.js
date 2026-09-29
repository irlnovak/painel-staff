// =================================================
// F4TE STAFF PANEL - Rotas de autenticação
// =================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { signToken, authRequired } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Informe usuário e senha' });

    const rows = await query(
      'SELECT * FROM panel_users WHERE username = ? AND ativo = 1 LIMIT 1',
      [String(username).toLowerCase().slice(0, 50)]
    );
    if (!rows.length) return res.status(401).json({ error: 'Usuário ou senha inválidos' });

    const user = rows[0];
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Usuário ou senha inválidos' });

    await query('UPDATE panel_users SET ultimo_login = NOW() WHERE id = ?', [user.id]);
    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role, rank: user.rank_habbo }
    });
  } catch (e) { next(e); }
});

// GET /api/auth/me
router.get('/me', authRequired, (req, res) => res.json({ user: req.user }));

module.exports = router;
