const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const materiais = db.prepare('SELECT * FROM materiais ORDER BY nome').all();
  res.json(materiais);
});

router.get('/alertas', (req, res) => {
  const alertas = db.prepare('SELECT * FROM materiais WHERE quantidade <= estoque_minimo ORDER BY nome').all();
  res.json(alertas);
});

router.get('/:id', (req, res) => {
  const material = db.prepare('SELECT * FROM materiais WHERE id = ?').get(req.params.id);
  if (!material) return res.status(404).json({ erro: 'Material não encontrado' });
  const movimentacoes = db.prepare(
    'SELECT * FROM movimentacoes_estoque WHERE material_id = ? ORDER BY data DESC LIMIT 50'
  ).all(req.params.id);
  res.json({ ...material, movimentacoes });
});

router.post('/', (req, res) => {
  const { nome, unidade, quantidade, estoque_minimo, preco_unitario } = req.body || {};
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
  const info = db.prepare(
    'INSERT INTO materiais (nome, unidade, quantidade, estoque_minimo, preco_unitario) VALUES (?, ?, ?, ?, ?)'
  ).run(nome, unidade || 'un', Number(quantidade) || 0, Number(estoque_minimo) || 0, Number(preco_unitario) || 0);
  res.status(201).json(db.prepare('SELECT * FROM materiais WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM materiais WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Material não encontrado' });
  const { nome, unidade, estoque_minimo, preco_unitario } = req.body || {};
  db.prepare(
    'UPDATE materiais SET nome = ?, unidade = ?, estoque_minimo = ?, preco_unitario = ? WHERE id = ?'
  ).run(
    nome ?? existente.nome,
    unidade ?? existente.unidade,
    estoque_minimo != null ? Number(estoque_minimo) : existente.estoque_minimo,
    preco_unitario != null ? Number(preco_unitario) : existente.preco_unitario,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM materiais WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM materiais WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Material não encontrado' });
  db.prepare('DELETE FROM materiais WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/:id/movimentacao', (req, res) => {
  const material = db.prepare('SELECT * FROM materiais WHERE id = ?').get(req.params.id);
  if (!material) return res.status(404).json({ erro: 'Material não encontrado' });

  const { tipo, quantidade, motivo } = req.body || {};
  const qtd = Number(quantidade);
  if (!['entrada', 'saida'].includes(tipo) || !qtd || qtd <= 0) {
    return res.status(400).json({ erro: 'Informe tipo (entrada/saida) e quantidade válida' });
  }
  if (tipo === 'saida' && qtd > material.quantidade) {
    return res.status(409).json({ erro: 'Quantidade em estoque insuficiente' });
  }

  const usuarioId = req.usuario?.id || null;
  const transacao = db.transaction(() => {
    db.prepare(
      'INSERT INTO movimentacoes_estoque (material_id, tipo, quantidade, motivo, usuario_id) VALUES (?, ?, ?, ?, ?)'
    ).run(material.id, tipo, qtd, motivo || null, usuarioId);

    const novaQuantidade = tipo === 'entrada' ? material.quantidade + qtd : material.quantidade - qtd;
    db.prepare('UPDATE materiais SET quantidade = ? WHERE id = ?').run(novaQuantidade, material.id);
  });
  transacao();

  res.json(db.prepare('SELECT * FROM materiais WHERE id = ?').get(material.id));
});

module.exports = router;
