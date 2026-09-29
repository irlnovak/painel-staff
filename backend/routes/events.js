// =================================================
// F4TE STAFF PANEL - Eventos
// =================================================
const express = require('express');
const { query } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// GET /api/events
router.get('/', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT e.id, e.titulo, e.tipo, e.descricao, e.ativo, e.criado_em, u.display_name as criado_por_nome
       FROM panel_events e
       LEFT JOIN panel_users u ON u.id = e.criado_por
       ORDER BY e.criado_em DESC LIMIT 100`
    );
    res.json({ eventos: rows });
  } catch (e) { next(e); }
});

// POST /api/events
router.post('/', requireRole('MOD','ADMIN'), async (req, res, next) => {
  try {
    const titulo = String(req.body?.titulo || '').trim().slice(0, 120);
    const tipo   = String(req.body?.tipo   || 'EVENTO').toUpperCase();
    const desc   = String(req.body?.descricao || '').slice(0, 1000);
    if (!titulo) return res.status(400).json({ error: 'Título obrigatório' });
    if (!['EVENTO','PAGAMENTO','HALL','CUSTOM'].includes(tipo)) return res.status(400).json({ error: 'tipo inválido' });

    const r = await query(
      'INSERT INTO panel_events (titulo, tipo, descricao, criado_por) VALUES (?,?,?,?)',
      [titulo, tipo, desc, req.user.id]
    );
    res.json({ ok: true, id: r.insertId });
  } catch (e) { next(e); }
});

// DELETE /api/events/:id
router.delete('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    await query('DELETE FROM panel_events WHERE id = ?', [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
