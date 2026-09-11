const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const status = req.query.status;
  let ordens;
  if (status) {
    ordens = db.prepare('SELECT * FROM ordens_producao WHERE status = ? ORDER BY criado_em DESC').all(status);
  } else {
    ordens = db.prepare('SELECT * FROM ordens_producao ORDER BY criado_em DESC').all();
  }
  res.json(ordens);
});

router.get('/:id', (req, res) => {
  const ordem = db.prepare('SELECT * FROM ordens_producao WHERE id = ?').get(req.params.id);
  if (!ordem) return res.status(404).json({ erro: 'Ordem não encontrada' });
  const materiais = db.prepare(`
    SELECT om.*, m.nome AS material_nome, m.unidade
    FROM ordem_materiais om JOIN materiais m ON m.id = om.material_id
    WHERE om.ordem_id = ?
  `).all(req.params.id);
  res.json({ ...ordem, materiais });
});

router.post('/', (req, res) => {
  const { orcamento_id, descricao, observacoes, materiais } = req.body || {};
  if (!descricao) return res.status(400).json({ erro: 'Descrição é obrigatória' });

  const transacao = db.transaction(() => {
    const info = db.prepare(
      'INSERT INTO ordens_producao (orcamento_id, descricao, observacoes) VALUES (?, ?, ?)'
    ).run(orcamento_id || null, descricao, observacoes || null);

    if (Array.isArray(materiais)) {
      const stmt = db.prepare(
        'INSERT INTO ordem_materiais (ordem_id, material_id, quantidade_usada) VALUES (?, ?, ?)'
      );
      for (const item of materiais) {
        stmt.run(info.lastInsertRowid, item.material_id, Number(item.quantidade_usada));
      }
    }
    return info.lastInsertRowid;
  });
  const id = transacao();
  res.status(201).json(db.prepare('SELECT * FROM ordens_producao WHERE id = ?').get(id));
});

router.put('/:id/status', (req, res) => {
  const ordem = db.prepare('SELECT * FROM ordens_producao WHERE id = ?').get(req.params.id);
  if (!ordem) return res.status(404).json({ erro: 'Ordem não encontrada' });
  const { status } = req.body || {};
  if (!['pendente', 'em_producao', 'concluida', 'cancelada'].includes(status)) {
    return res.status(400).json({ erro: 'Status inválido' });
  }

  const transacao = db.transaction(() => {
    if (status === 'em_producao' && ordem.status === 'pendente') {
      db.prepare('UPDATE ordens_producao SET status = ?, data_inicio = datetime(\'now\') WHERE id = ?').run(status, req.params.id);
    } else if (status === 'concluida') {
      db.prepare('UPDATE ordens_producao SET status = ?, data_fim = datetime(\'now\') WHERE id = ?').run(status, req.params.id);
      baixarMateriais(req.params.id, req.usuario?.id);
    } else {
      db.prepare('UPDATE ordens_producao SET status = ? WHERE id = ?').run(status, req.params.id);
    }
  });
  transacao();

  res.json(db.prepare('SELECT * FROM ordens_producao WHERE id = ?').get(req.params.id));
});

function baixarMateriais(ordemId, usuarioId) {
  const itens = db.prepare('SELECT * FROM ordem_materiais WHERE ordem_id = ? AND baixado = 0').all(ordemId);
  const stmtMov = db.prepare(
    'INSERT INTO movimentacoes_estoque (material_id, tipo, quantidade, motivo, usuario_id) VALUES (?, \'saida\', ?, ?, ?)'
  );
  const stmtEstoque = db.prepare('UPDATE materiais SET quantidade = quantidade - ? WHERE id = ?');
  const stmtBaixa = db.prepare('UPDATE ordem_materiais SET baixado = 1 WHERE id = ?');

  for (const item of itens) {
    stmtMov.run(item.material_id, item.quantidade_usada, `Consumo ordem de produção #${ordemId}`, usuarioId || null);
    stmtEstoque.run(item.quantidade_usada, item.material_id);
    stmtBaixa.run(item.id);
  }
}

router.delete('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM ordens_producao WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Ordem não encontrada' });
  db.prepare('DELETE FROM ordens_producao WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
