const db = require('../db');

exports.criarConta = async (req, res) => {
  const { nome, saldo_inicial, saldo_atual } = req.body;
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
    res.status(500).json({ error: 'Erro ao criar conta.', details: err.message });
  }
};

exports.listarContas = async (req, res) => {
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
    res.status(500).json({ error: 'Erro ao listar contas.', details: error.message });
  }
};

exports.atualizarConta = async (req, res) => {
  const { id } = req.params;
  const { nome, saldo_atual } = req.body;
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
    res.status(500).json({ error: 'Erro ao atualizar conta.', details: err.message });
  }
};

exports.excluirConta = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE contas SET ativo = FALSE WHERE id = ?', [id]);
    res.json({ message: 'Conta excluída logicamente!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir conta.', details: err.message });
  }
};

exports.vincularMetodosPagamento = async (req, res) => {
  const { id_conta, id_metodos_pagamento } = req.body;

  // Validação básica dos dados recebidos
  if (!id_conta || !Array.isArray(id_metodos_pagamento)) {
    return res.status(400).json({ error: 'id_conta e um array de id_metodos_pagamento são obrigatórios.' });
  }

  try {
    // Inativar os métodos de pagamento atuais vinculados à conta
    await db.query('UPDATE contas_metodos_pagamento SET ativo = 0 WHERE id_conta = ?', [id_conta]);

    // Inserir os novos métodos de pagamento
    const queries = id_metodos_pagamento.map((id_metodo_pagamento) =>
      db.query(
        'INSERT INTO contas_metodos_pagamento (id_conta, id_metodo_pagamento, ativo) VALUES (?, ?, 1)',
        [id_conta, id_metodo_pagamento]
      )
    );

    await Promise.all(queries); // Aguarda todas as inserções serem concluídas

    res.status(201).json({ message: 'Métodos de pagamento vinculados com sucesso!' });
  } catch (error) {
    console.error('Erro ao vincular métodos de pagamento:', error);
    res.status(500).json({ error: 'Erro ao vincular métodos de pagamento.', details: error.message });
  }
};
