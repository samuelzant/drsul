require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db');
const { auth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const materiaisRoutes = require('./routes/materiais');
const orcamentosRoutes = require('./routes/orcamentos');
const ordensRoutes = require('./routes/ordens');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clientes', auth, clientesRoutes);
app.use('/api/materiais', auth, materiaisRoutes);
app.use('/api/orcamentos', auth, orcamentosRoutes);
app.use('/api/ordens', auth, ordensRoutes);

app.get('/api/saude', (req, res) => res.json({ ok: true }));

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse pelo próprio PC em: http://localhost:${PORT}`);
  console.log('Acesse do outro computador usando o IP deste PC na rede local, ex: http://192.168.0.10:' + PORT);
});
