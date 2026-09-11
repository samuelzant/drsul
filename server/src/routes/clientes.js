const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const busca = req.query.busca;
  let clientes;
  if (busca) {
    clientes = db.prepare('SELECT * FROM clientes WHERE nome LIKE ? ORDER BY nome').all(`%${busca}%`);
  } else {
    clientes = db.prepare('SELECT * FROM clientes ORDER BY nome').all();
  }
  res.json(clientes);
});

router.get('/:id', (req, res) => {
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(cliente);
});

router.post('/', (req, res) => {
  const { nome, telefone, email, documento, endereco, observacoes } = req.body || {};
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
  const info = db.prepare(
    'INSERT INTO clientes (nome, telefone, email, documento, endereco, observacoes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(nome, telefone || null, email || null, documento || null, endereco || null, observacoes || null);
  res.status(201).json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  const { nome, telefone, email, documento, endereco, observacoes } = req.body || {};
  db.prepare(
    'UPDATE clientes SET nome = ?, telefone = ?, email = ?, documento = ?, endereco = ?, observacoes = ? WHERE id = ?'
  ).run(
    nome ?? existente.nome,
    telefone ?? existente.telefone,
    email ?? existente.email,
    documento ?? existente.documento,
    endereco ?? existente.endereco,
    observacoes ?? existente.observacoes,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  const emUso = db.prepare('SELECT id FROM orcamentos WHERE cliente_id = ? LIMIT 1').get(req.params.id);
  if (emUso) return res.status(409).json({ erro: 'Cliente possui orçamentos vinculados e não pode ser excluído' });
  db.prepare('DELETE FROM clientes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
