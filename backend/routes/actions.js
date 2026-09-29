// =================================================
// F4TE STAFF PANEL - Ações rápidas do painel
// (Tele, Att, Add Evento, Chooser)
// =================================================
const express = require('express');
const { query } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

async function log(user, acao, alvo, detalhes, ip) {
  await query(
    'INSERT INTO panel_logs (user_id, acao, alvo, detalhes, ip) VALUES (?,?,?,?,?)',
    [user.id, acao, alvo || null, detalhes ? JSON.stringify(detalhes) : null, ip || null]
  );
}

// POST /api/actions/tele  { username, quarto }
router.post('/tele', requireRole('MOD','ADMIN'), async (req, res, next) => {
  try {
    const { username, quarto } = req.body || {};
    if (!username || !quarto) return res.status(400).json({ error: 'username e quarto são obrigatórios' });
    if (!/^[A-Za-z0-9 \-_.]{1,80}$/.test(username)) return res.status(400).json({ error: 'username inválido' });
    if (!/^[A-Za-z0-9 \-_.]{1,80}$/.test(quarto))  return res.status(400).json({ error: 'quarto inválido' });

    // TODO: integrar com a API do emulador (Arcturus/Nitro) aqui
    await log(req.user, ':TELE', username, { quarto }, req.ip);
    res.json({ ok: true, message: `:TELE ${username} -> ${quarto}` });
  } catch (e) { next(e); }
});

// POST /api/actions/alert  { mensagem }
router.post('/alert', requireRole('MOD','ADMIN','HELPER'), async (req, res, next) => {
  try {
    const msg = String(req.body?.mensagem || '').trim().slice(0, 240);
    if (!msg) return res.status(400).json({ error: 'mensagem vazia' });
    await log(req.user, 'ATT.', null, { mensagem: msg }, req.ip);
    res.json({ ok: true, message: 'Alerta enviado para o hotel.' });
  } catch (e) { next(e); }
});

// POST /api/actions/chooser  { opcoes: [string] }
router.post('/chooser', requireRole('MOD','ADMIN'), async (req, res, next) => {
  try {
    const opcoes = Array.isArray(req.body?.opcoes) ? req.body.opcoes.slice(0, 10) : [];
    if (!opcoes.length) return res.status(400).json({ error: 'Informe ao menos uma opção' });
    opcoes.forEach(o => {
      if (typeof o !== 'string' || o.length > 40) throw new Error('opção inválida');
    });
    await log(req.user, ':CHOOSER', null, { opcoes }, req.ip);
    res.json({ ok: true, message: 'Chooser aberto para o hotel.' });
  } catch (e) { next(e); }
});

// POST /api/actions/hall  { quarto }
router.post('/hall', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const quarto = String(req.body?.quarto || '').trim().slice(0, 80);
    if (!quarto) return res.status(400).json({ error: 'Informe o quarto do hall' });
    await log(req.user, 'HALL', quarto, null, req.ip);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/actions/zerar-cota
router.post('/zerar-cota', requireRole('ADMIN'), async (req, res, next) => {
  try {
    await query('UPDATE panel_cota SET total_atual = 0 WHERE id = 1');
    await log(req.user, 'ZERAR COTA', null, null, req.ip);
    res.json({ ok: true, message: 'Cota zerada.' });
  } catch (e) { next(e); }
});

module.exports = router;
