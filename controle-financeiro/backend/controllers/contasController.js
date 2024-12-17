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
