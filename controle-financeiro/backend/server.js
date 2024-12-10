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
  const { nome, saldo_inicial, saldo_atual } = req.body;

  console.log('Dados recebidos no backend para criar conta:', req.body);

  if (!nome || saldo_inicial === undefined || saldo_atual === undefined) {
    return res.status(400).json({ error: 'Nome, saldo inicial e saldo atual são obrigatórios.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO contas (nome, saldo_inicial, saldo_atual) VALUES (?, ?, ?)',
      [nome, saldo_inicial, saldo_atual]
    );
    res.status(201).json({ message: 'Conta criada com sucesso!', id: result.insertId });
  } catch (err) {
    console.error('Erro ao criar conta:', err);
    res.status(500).json({ error: 'Erro ao criar conta.', details: err.message });
  }
});




// Endpoint para listar todas as contas
app.get('/contas', async (req, res) => {
  try {
    const [contas] = await db.query(`
      SELECT contas.*, GROUP_CONCAT(metodos_pagamento.nome) AS metodos_pagamento
      FROM contas
      LEFT JOIN contas_metodos_pagamento 
        ON contas.id = contas_metodos_pagamento.id_conta AND contas_metodos_pagamento.ativo = 1
      LEFT JOIN metodos_pagamento 
        ON contas_metodos_pagamento.id_metodo_pagamento = metodos_pagamento.id
      WHERE contas.ativo = 1
      GROUP BY contas.id
    `);

    res.json(contas);
  } catch (error) {
    console.error('Erro ao listar contas:', error);
    res.status(500).json({ error: 'Erro ao listar contas.' });
  }
});

  
  

// Endpoint para atualizar uma conta
app.put('/contas/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, saldo_atual } = req.body;

  console.log('Dados recebidos para atualizar conta (Payload):', req.body);

  if (!nome || saldo_atual === undefined) {
    return res.status(400).json({ error: 'Nome e saldo atual são obrigatórios.' });
  }

  try {
    await db.query(
      'UPDATE contas SET nome = ?, saldo_atual = ? WHERE id = ? AND ativo = TRUE',
      [nome, saldo_atual, id]
    );
    res.json({ message: 'Conta atualizada com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar conta:', err);
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


// Endpoint para vincular métodos de pagamento a uma conta
app.post('/contas/vincular-metodos', async (req, res) => {
  const { id_conta, id_metodos_pagamento } = req.body;

  if (!id_conta || !Array.isArray(id_metodos_pagamento)) {
    return res.status(400).json({ error: 'id_conta e um array de id_metodos_pagamento são obrigatórios.' });
  }

  try {
    // Obter métodos atuais
    const [metodosAtuais] = await db.query(
      'SELECT id_metodo_pagamento FROM contas_metodos_pagamento WHERE id_conta = ? AND ativo = 1',
      [id_conta]
    );

    const idsAtuais = metodosAtuais.map((m) => m.id_metodo_pagamento);

    // Se o array recebido está vazio, reutilizar métodos atuais
    const idsRecebidos = id_metodos_pagamento.length > 0 ? id_metodos_pagamento : idsAtuais;

    // Comparar se há modificações
    const precisaAtualizar =
      idsAtuais.length !== idsRecebidos.length || !idsAtuais.every((id) => idsRecebidos.includes(id));

    if (!precisaAtualizar) {
      return res.status(200).json({ message: 'Nenhuma modificação nos métodos de pagamento.' });
    }

    // Inativar métodos antigos
    await db.query(
      'UPDATE contas_metodos_pagamento SET ativo = 0 WHERE id_conta = ?',
      [id_conta]
    );

    // Inserir novos métodos
    const queries = idsRecebidos.map((id_metodo_pagamento) => {
      return db.query(
        'INSERT INTO contas_metodos_pagamento (id_conta, id_metodo_pagamento, ativo) VALUES (?, ?, 1)',
        [id_conta, id_metodo_pagamento]
      );
    });

    await Promise.all(queries);
    res.status(201).json({ message: 'Métodos de pagamento vinculados com sucesso.' });
  } catch (error) {
    console.error('Erro ao vincular métodos de pagamento:', error);
    res.status(500).json({ error: 'Erro ao vincular métodos de pagamento.' });
  }
});







      



// Listar participantes
app.get('/participantes', async (req, res) => {
  try {
      const [participantes] = await db.query(`
          SELECT 
              p.id, 
              p.nome, 
              p.descricao, 
              p.usa_conta,
              GROUP_CONCAT(c.nome SEPARATOR ', ') AS contas_vinculadas
          FROM participantes p
          LEFT JOIN participantes_contas pc ON p.id = pc.id_participante
          LEFT JOIN contas c ON pc.id_conta = c.id
          WHERE p.ativo = 1
          GROUP BY p.id
      `);
      res.json(participantes);
  } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar participantes.' });
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
  const { descricao, valor, data, metodo_pagamento, categoria, status, participantes } = req.body;

  if (!descricao || !valor || !data || !metodo_pagamento || !categoria || !participantes || participantes.length === 0) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const connection = db.promise();
  const transaction = await connection.getConnection(); // Cria uma transação para segurança

  try {
    await transaction.beginTransaction();

    // Criar a transação principal
    const [result] = await transaction.query(
      'INSERT INTO transacoes (descricao, valor, data, metodo_pagamento, categoria, status) VALUES (?, ?, ?, ?, ?, ?)',
      [descricao, valor, data, metodo_pagamento, categoria, status]
    );

    const transacaoId = result.insertId;

    // Processar participantes
    for (const participante of participantes) {
      const { id, usa_conta } = participante;
      const valorIndividual = valor / participantes.length;

      // Registrar no histórico de participantes da transação
      await transaction.query(
        'INSERT INTO transacoes_participantes (id_transacao, id_participante, valor) VALUES (?, ?, ?)',
        [transacaoId, id, valorIndividual]
      );

      // Se o participante usa conta, debitar o valor
      if (usa_conta) {
        const [contas] = await transaction.query(
          'SELECT * FROM contas WHERE id_participante = ? AND ativo = TRUE',
          [id]
        );

        if (contas.length === 0) {
          throw new Error(`Nenhuma conta vinculada encontrada para o participante ID: ${id}`);
        }

        // Debitar da conta principal do participante
        const conta = contas[0];
        if (conta.saldo_atual < valorIndividual) {
          throw new Error(`Saldo insuficiente na conta: ${conta.nome}`);
        }

        await transaction.query(
          'UPDATE contas SET saldo_atual = saldo_atual - ? WHERE id = ?',
          [valorIndividual, conta.id]
        );
      }
    }

    await transaction.commit();
    res.status(201).json({ message: 'Transação criada com sucesso!' });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao criar transação:', error);
    res.status(500).json({ error: 'Erro ao criar transação.' });
  } finally {
    transaction.release();
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





app.get('/transacoes/:id/participantes', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT tp.id, p.nome, tp.valor 
       FROM transacoes_participantes tp
       JOIN participantes p ON tp.id_participante = p.id
       WHERE tp.id_transacao = ?`,
      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar participantes da transação:', error);
    res.status(500).json({ error: 'Erro ao buscar participantes da transação.' });
  }
});

// Vincular contas a um participante
// Vincular contas a um participante
app.post('/participantes/:id/contas', async (req, res) => {
  let { id } = req.params;
  const { contas } = req.body;

  // Convertendo o id para inteiro
  id = parseInt(id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'O ID do participante deve ser um número válido.' });
  }

  if (!contas || !Array.isArray(contas) || contas.length === 0) {
    return res.status(400).json({ error: 'É necessário fornecer uma lista de IDs de contas.' });
  }

  try {
    for (const contaId of contas) {
      const [existingLink] = await db.query(
        'SELECT * FROM participantes_contas WHERE id_participante = ? AND id_conta = ? AND ativo = TRUE',
        [id, contaId]
      );

      if (!existingLink.length) {
        await db.query(
          'INSERT INTO participantes_contas (id_participante, id_conta) VALUES (?, ?)',
          [id, contaId]
        );
      }
    }

    res.status(201).json({ message: 'Contas vinculadas ao participante com sucesso!' });
  } catch (error) {
    console.error('Erro ao vincular contas ao participante:', error);
    res.status(500).json({ error: 'Erro ao vincular contas ao participante.' });
  }
});




app.get('/participantes/:id/contas', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT c.id, c.nome, c.saldo_atual 
       FROM participantes_contas pc
       JOIN contas c ON pc.id_conta = c.id
       WHERE pc.id_participante = ? AND pc.ativo = TRUE`,
      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar contas vinculadas ao participante:', error);
    res.status(500).json({ error: 'Erro ao buscar contas vinculadas ao participante.' });
  }
});






const validarTransacao = (req, res, next) => {
  const { descricao, valor, participantes } = req.body;

  if (!descricao || !valor || !Array.isArray(participantes) || participantes.length === 0) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }

  next();
};

app.post('/transacoes', validarTransacao, async (req, res) => {
  // Código principal do endpoint
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
