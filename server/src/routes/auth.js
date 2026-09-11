const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { usuario, senha } = req.body || {};
  if (!usuario || !senha) return res.status(400).json({ erro: 'Informe usuário e senha' });

  const registro = db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get(usuario);
  if (!registro || !bcrypt.compareSync(senha, registro.senha_hash)) {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
  }

  const token = jwt.sign(
    { id: registro.id, nome: registro.nome, usuario: registro.usuario },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({ token, usuario: { id: registro.id, nome: registro.nome, usuario: registro.usuario } });
});

router.post('/alterar-senha', (req, res) => {
  const { usuario, senhaAtual, novaSenha } = req.body || {};
  if (!usuario || !senhaAtual || !novaSenha) {
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  }
  const registro = db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get(usuario);
  if (!registro || !bcrypt.compareSync(senhaAtual, registro.senha_hash)) {
    return res.status(401).json({ erro: 'Senha atual incorreta' });
  }
  const novoHash = bcrypt.hashSync(novaSenha, 10);
  db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(novoHash, registro.id);
  res.json({ ok: true });
});

module.exports = router;
