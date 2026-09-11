const express = require('express');
const db = require('../db');

const router = express.Router();

function calcularTotal(itens) {
  return itens.reduce((soma, item) => soma + Number(item.quantidade) * Number(item.valor_unitario), 0);
}

router.get('/', (req, res) => {
  const status = req.query.status;
  let orcamentos;
  if (status) {
    orcamentos = db.prepare(`
      SELECT o.*, c.nome AS cliente_nome
      FROM orcamentos o JOIN clientes c ON c.id = o.cliente_id
      WHERE o.status = ? ORDER BY o.criado_em DESC
    `).all(status);
  } else {
    orcamentos = db.prepare(`
      SELECT o.*, c.nome AS cliente_nome
      FROM orcamentos o JOIN clientes c ON c.id = o.cliente_id
      ORDER BY o.criado_em DESC
    `).all();
  }
  res.json(orcamentos);
});

router.get('/:id', (req, res) => {
  const orcamento = db.prepare(`
    SELECT o.*, c.nome AS cliente_nome
    FROM orcamentos o JOIN clientes c ON c.id = o.cliente_id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!orcamento) return res.status(404).json({ erro: 'Orçamento não encontrado' });
  const itens = db.prepare('SELECT * FROM orcamento_itens WHERE orcamento_id = ?').all(req.params.id);
  res.json({ ...orcamento, itens });
});

router.post('/', (req, res) => {
  const { cliente_id, itens, observacoes } = req.body || {};
  if (!cliente_id || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'Informe cliente e pelo menos um item' });
  }
  const cliente = db.prepare('SELECT id FROM clientes WHERE id = ?').get(cliente_id);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const valorTotal = calcularTotal(itens);
  const transacao = db.transaction(() => {
    const info = db.prepare(
      'INSERT INTO orcamentos (cliente_id, valor_total, observacoes) VALUES (?, ?, ?)'
    ).run(cliente_id, valorTotal, observacoes || null);
    const stmtItem = db.prepare(
      'INSERT INTO orcamento_itens (orcamento_id, descricao, quantidade, valor_unitario) VALUES (?, ?, ?, ?)'
    );
    for (const item of itens) {
      stmtItem.run(info.lastInsertRowid, item.descricao, Number(item.quantidade), Number(item.valor_unitario));
    }
    return info.lastInsertRowid;
  });
  const id = transacao();
  res.status(201).json({ ...db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(id), itens: db.prepare('SELECT * FROM orcamento_itens WHERE orcamento_id = ?').all(id) });
});

router.put('/:id/status', (req, res) => {
  const existente = db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Orçamento não encontrado' });
  const { status } = req.body || {};
  if (!['orcamento', 'aprovado', 'rejeitado'].includes(status)) {
    return res.status(400).json({ erro: 'Status inválido' });
  }
  db.prepare('UPDATE orcamentos SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json(db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Orçamento não encontrado' });
  const emUso = db.prepare('SELECT id FROM ordens_producao WHERE orcamento_id = ? LIMIT 1').get(req.params.id);
  if (emUso) return res.status(409).json({ erro: 'Orçamento possui ordem de produção vinculada' });
  db.prepare('DELETE FROM orcamentos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
