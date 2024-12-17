require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Importar as rotas
const usuariosRoutes = require('./routes/usuariosRoutes');
const contasRoutes = require('./routes/contasRoutes');
const participantesRoutes = require('./routes/participantesRoutes');
const transacoesRoutes = require('./routes/transacoesRoutes');
const faturasRoutes = require('./routes/faturasRoutes');
const metodosPagamentoRoutes = require('./routes/metodosPagamentoRoutes');
const cartoesRoutes = require('./routes/cartoesRoutes');


// Configurar as rotas
app.use('/usuarios', usuariosRoutes);
app.use('/contas', contasRoutes);
app.use('/participantes', participantesRoutes);
app.use('/transacoes', transacoesRoutes);
app.use('/faturas', faturasRoutes);
app.use('/metodos_pagamento', metodosPagamentoRoutes);
app.use('/cartoes', cartoesRoutes);

// Teste de conexão com o banco de dados
db.getConnection()
  .then(() => console.log('Conexão com o banco de dados bem-sucedida!'))
  .catch((err) => console.error('Erro ao conectar ao banco de dados:', err));

// Iniciar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
