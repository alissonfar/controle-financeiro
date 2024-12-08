require('dotenv').config(); // Certifique-se de ter esta linha no início do arquivo!

const db = require('./db');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint para criar um novo usuário
app.post('/usuarios', async (req, res) => {
  const { nome, email, senha, perfil } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
      [nome, email, senha, perfil]
    );
    res.status(201).json({ message: 'Usuário criado com sucesso!', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar usuário.', details: err.message });
  }
});


// Endpoint para listar todos os usuários
app.get('/usuarios', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE ativo = TRUE');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários.', details: err.message });
  }
});


// Endpoint para atualizar um usuário
app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email, perfil } = req.body;
  try {
    await db.query(
      'UPDATE usuarios SET nome = ?, email = ?, perfil = ? WHERE id = ? AND ativo = TRUE',
      [nome, email, perfil, id]
    );
    res.json({ message: 'Usuário atualizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar usuário.', details: err.message });
  }
});


// Endpoint para exclusão lógica de um usuário
app.delete('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE usuarios SET ativo = FALSE WHERE id = ?', [id]);
    res.json({ message: 'Usuário excluído logicamente!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir usuário.', details: err.message });
  }
});



// Endpoint para criar uma nova conta
app.post('/contas', async (req, res) => {
  const { nome, saldo_inicial, saldo_atual, metodos_pagamento } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO contas (nome, saldo_inicial, saldo_atual, metodos_pagamento) VALUES (?, ?, ?, ?)',
      [nome, saldo_inicial, saldo_atual, metodos_pagamento]
    );
    res.status(201).json({ message: 'Conta criada com sucesso!', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar conta.', details: err.message });
  }
});


// Endpoint para listar todas as contas
app.get('/contas', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM contas WHERE ativo = TRUE');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar contas.', details: err.message });
  }
});
  
  

// Endpoint para atualizar uma conta
app.put('/contas/:id', async (req, res) => {
const { id } = req.params;
const { nome, saldo_atual, metodos_pagamento } = req.body;
try {
  await db.query(
    'UPDATE contas SET nome = ?, saldo_atual = ?, metodos_pagamento = ? WHERE id = ? AND ativo = TRUE',
    [nome, saldo_atual, metodos_pagamento, id]
  );
  res.json({ message: 'Conta atualizada com sucesso!' });
} catch (err) {
  res.status(500).json({ error: 'Erro ao atualizar conta.', details: err.message });
}
});
    

// Endpoint para exclusão lógica de uma conta
app.delete('/contas/:id', async (req, res) => {
const { id } = req.params;
try {
await db.query('UPDATE contas SET ativo = FALSE WHERE id = ?', [id]);
res.json({ message: 'Conta excluída logicamente!' });
} catch (err) {
res.status(500).json({ error: 'Erro ao excluir conta.', details: err.message });
}
});
      



// Listar participantes
app.get('/participantes', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM participantes WHERE ativo = TRUE');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar participantes.', details: err.message });
  }
});
  
// Criar participante
app.post('/participantes', async (req, res) => {
  const { nome, descricao, usa_conta } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO participantes (nome, descricao, usa_conta) VALUES (?, ?, ?)',
      [nome, descricao, usa_conta]
    );
    res.status(201).json({ message: 'Participante criado com sucesso!', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar participante.', details: err.message });
  }
});

// Atualizar participante
app.put('/participantes/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, usa_conta } = req.body;
  try {
    await db.query(
      'UPDATE participantes SET nome = ?, descricao = ?, usa_conta = ? WHERE id = ? AND ativo = TRUE',
      [nome, descricao, usa_conta, id]
    );
    res.json({ message: 'Participante atualizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar participante.', details: err.message });
  }
});


// Excluir logicamente participante
app.delete('/participantes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE participantes SET ativo = FALSE WHERE id = ?', [id]);
    res.json({ message: 'Participante excluído logicamente!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir participante.', details: err.message });
  }
});





// Listar transações
app.get('/transacoes', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM transacoes WHERE ativo = TRUE');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar transações.', details: err.message });
  }
});

// Criar transação
app.post('/transacoes', async (req, res) => {
  const { descricao, valor, data, id_participante, id_conta, metodo_pagamento, categoria, status } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO transacoes (descricao, valor, data, id_participante, id_conta, metodo_pagamento, categoria, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [descricao, valor, data, id_participante, id_conta, metodo_pagamento, categoria, status]
    );
    res.status(201).json({ message: 'Transação criada com sucesso!', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar transação.', details: err.message });
  }
});


// Atualizar transação
app.put('/transacoes/:id', async (req, res) => {
  const { id } = req.params;
  const { descricao, valor, data, id_participante, id_conta, metodo_pagamento, categoria, status } = req.body;
  try {
    await db.query(
      'UPDATE transacoes SET descricao = ?, valor = ?, data = ?, id_participante = ?, id_conta = ?, metodo_pagamento = ?, categoria = ?, status = ? WHERE id = ? AND ativo = TRUE',
      [descricao, valor, data, id_participante, id_conta, metodo_pagamento, categoria, status, id]
    );
    res.json({ message: 'Transação atualizada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar transação.', details: err.message });
  }
});


// Excluir logicamente transação
app.delete('/transacoes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE transacoes SET ativo = FALSE WHERE id = ?', [id]);
    res.json({ message: 'Transação excluída logicamente!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir transação.', details: err.message });
  }
});





// Listar faturas
app.get('/faturas', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM faturas WHERE ativo = TRUE');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar faturas.', details: err.message });
  }
});


// Criar fatura
app.post('/faturas', async (req, res) => {
  const { id_cartao, data_fechamento, data_vencimento, valor_total, status, justificativa } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO faturas (id_cartao, data_fechamento, data_vencimento, valor_total, status, justificativa) VALUES (?, ?, ?, ?, ?, ?)',
      [id_cartao, data_fechamento, data_vencimento, valor_total, status, justificativa]
    );
    res.status(201).json({ message: 'Fatura criada com sucesso!', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar fatura.', details: err.message });
  }
});


// Atualizar fatura
app.put('/faturas/:id', async (req, res) => {
  const { id } = req.params;
  const { id_cartao, data_fechamento, data_vencimento, valor_total, status, justificativa } = req.body;
  try {
    await db.query(
      'UPDATE faturas SET id_cartao = ?, data_fechamento = ?, data_vencimento = ?, valor_total = ?, status = ?, justificativa = ? WHERE id = ? AND ativo = TRUE',
      [id_cartao, data_fechamento, data_vencimento, valor_total, status, justificativa, id]
    );
    res.json({ message: 'Fatura atualizada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar fatura.', details: err.message });
  }
});


// Excluir logicamente fatura
app.delete('/faturas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE faturas SET ativo = FALSE WHERE id = ?', [id]);
    res.json({ message: 'Fatura excluída logicamente!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir fatura.', details: err.message });
  }
});






app.get('/metodos_pagamento', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM metodos_pagamento WHERE ativo = 1');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar métodos de pagamento.' });
  }
});

app.post('/metodos_pagamento', async (req, res) => {
  const { nome } = req.body;
  try {
    await db.query('INSERT INTO metodos_pagamento (nome) VALUES (?)', [nome]);
    res.status(201).json({ message: 'Método de pagamento criado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar método de pagamento.' });
  }
});

app.put('/metodos_pagamento/:id', async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  try {
    await db.query('UPDATE metodos_pagamento SET nome = ? WHERE id = ?', [nome, id]);
    res.json({ message: 'Método de pagamento atualizado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar método de pagamento.' });
  }
});

app.delete('/metodos_pagamento/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE metodos_pagamento SET ativo = 0 WHERE id = ?', [id]);
    res.json({ message: 'Método de pagamento excluído logicamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir método de pagamento.' });
  }
});


app.get('/cartoes', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT cartoes.*, contas.nome AS nome_conta, metodos_pagamento.nome AS nome_metodo_pagamento
      FROM cartoes
      JOIN contas ON cartoes.id_conta = contas.id
      JOIN metodos_pagamento ON cartoes.id_metodo_pagamento = metodos_pagamento.id
      WHERE cartoes.ativo = 1
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cartões.' });
  }
});

app.post('/cartoes', async (req, res) => {
  const { nome, id_conta, id_metodo_pagamento, limite } = req.body;
  try {
    await db.query(
      'INSERT INTO cartoes (nome, id_conta, id_metodo_pagamento, limite) VALUES (?, ?, ?, ?)',
      [nome, id_conta, id_metodo_pagamento, limite]
    );
    res.status(201).json({ message: 'Cartão criado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar cartão.' });
  }
});

app.put('/cartoes/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, id_conta, id_metodo_pagamento, limite } = req.body;
  try {
    await db.query(
      'UPDATE cartoes SET nome = ?, id_conta = ?, id_metodo_pagamento = ?, limite = ? WHERE id = ?',
      [nome, id_conta, id_metodo_pagamento, limite, id]
    );
    res.json({ message: 'Cartão atualizado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar cartão.' });
  }
});

app.delete('/cartoes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE cartoes SET ativo = 0 WHERE id = ?', [id]);
    res.json({ message: 'Cartão excluído logicamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir cartão.' });
  }
});



db.getConnection()
  .then(() => console.log('Conexão com o banco de dados bem-sucedida!'))
  .catch(err => console.error('Erro ao conectar ao banco de dados:', err));



app.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});
