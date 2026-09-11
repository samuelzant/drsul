const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'metalurgica-local-dev-secret';

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Não autenticado' });
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: 'Sessão inválida ou expirada' });
  }
}

module.exports = { auth, JWT_SECRET };
