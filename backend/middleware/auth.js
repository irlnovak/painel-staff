// =================================================
// F4TE STAFF PANEL - Middleware de autenticação
// =================================================
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, rank: user.rank_habbo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
}

async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token ausente' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const rows = await query(
      'SELECT id, username, display_name, role, rank_habbo, ativo FROM panel_users WHERE id = ? LIMIT 1',
      [payload.id]
    );
    if (!rows.length || !rows[0].ativo) return res.status(401).json({ error: 'Sessão inválida' });

    req.user = rows[0];
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida' });
  }
}

// exige role mínimo (MOD ou ADMIN)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão insuficiente (apenas ' + roles.join(', ') + ')' });
    }
    next();
  };
}

module.exports = { signToken, authRequired, requireRole };
