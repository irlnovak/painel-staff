// =================================================
// F4TE STAFF PANEL - Pagamentos
// =================================================
const express = require('express');
const { query } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// GET /api/payments
router.get('/', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT p.id, p.usuario_habbo, p.valor, p.descricao, p.criado_em, u.display_name as registrado_por
       FROM panel_payments p
       LEFT JOIN panel_users u ON u.id = p.registrado_por
       ORDER BY p.criado_em DESC LIMIT 200`
    );
    const cotaRow = await query('SELECT total_atual FROM panel_cota WHERE id = 1');
    res.json({ pagamentos: rows, cota: cotaRow[0]?.total_atual || 0 });
  } catch (e) { next(e); }
});

// POST /api/payments
router.post('/', requireRole('MOD','ADMIN','HELPER'), async (req, res, next) => {
  try {
    const usuario = String(req.body?.usuario_habbo || '').trim().slice(0, 80);
    const valor   = Number(req.body?.valor);
    const desc    = String(req.body?.descricao || '').slice(0, 255);
    if (!usuario || !/^[A-Za-z0-9 \-_.]{1,80}$/.test(usuario)) return res.status(400).json({ error: 'usuario_habbo inválido' });
    if (!Number.isFinite(valor) || valor < 0 || valor > 99999) return res.status(400).json({ error: 'valor inválido' });

    await query(
      'INSERT INTO panel_payments (usuario_habbo, valor, descricao, registrado_por) VALUES (?,?,?,?)',
      [usuario, valor, desc, req.user.id]
    );
    await query(
      `INSERT INTO panel_cota (id, total_atual) VALUES (1, ?)
       ON DUPLICATE KEY UPDATE total_atual = total_atual + VALUES(total_atual)`,
      [valor]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
