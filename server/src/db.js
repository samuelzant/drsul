const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'data', 'metalurgica.db');
require('fs').mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  usuario TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  documento TEXT,
  endereco TEXT,
  observacoes TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS materiais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'un',
  quantidade REAL NOT NULL DEFAULT 0,
  estoque_minimo REAL NOT NULL DEFAULT 0,
  preco_unitario REAL NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id INTEGER NOT NULL REFERENCES materiais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida')),
  quantidade REAL NOT NULL,
  motivo TEXT,
  usuario_id INTEGER REFERENCES usuarios(id),
  data TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orcamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'orcamento' CHECK (status IN ('orcamento','aprovado','rejeitado')),
  valor_total REAL NOT NULL DEFAULT 0,
  observacoes TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orcamento_itens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  quantidade REAL NOT NULL DEFAULT 1,
  valor_unitario REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ordens_producao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orcamento_id INTEGER REFERENCES orcamentos(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_producao','concluida','cancelada')),
  data_inicio TEXT,
  data_fim TEXT,
  observacoes TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ordem_materiais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ordem_id INTEGER NOT NULL REFERENCES ordens_producao(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materiais(id),
  quantidade_usada REAL NOT NULL,
  baixado INTEGER NOT NULL DEFAULT 0
);
`);

const adminExists = db.prepare('SELECT id FROM usuarios WHERE usuario = ?').get('admin');
if (!adminExists) {
  const senha_hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO usuarios (nome, usuario, senha_hash) VALUES (?, ?, ?)')
    .run('Administrador', 'admin', senha_hash);
  console.log('Usuário padrão criado -> usuario: admin | senha: admin123 (altere depois de logar)');
}

module.exports = db;
