const db = require('../db');

exports.listarMetodosPagamento = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM metodos_pagamento WHERE ativo = 1');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar métodos de pagamento.', details: error.message });
  }
};

exports.criarMetodoPagamento = async (req, res) => {
  const { nome } = req.body;
  try {
    await db.query('INSERT INTO metodos_pagamento (nome) VALUES (?)', [nome]);
    res.status(201).json({ message: 'Método de pagamento criado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar método de pagamento.', details: error.message });
  }
};

exports.atualizarMetodoPagamento = async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  try {
    await db.query('UPDATE metodos_pagamento SET nome = ? WHERE id = ?', [nome, id]);
    res.json({ message: 'Método de pagamento atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar método de pagamento.', details: error.message });
  }
};

exports.excluirMetodoPagamento = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE metodos_pagamento SET ativo = 0 WHERE id = ?', [id]);
    res.json({ message: 'Método de pagamento excluído logicamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir método de pagamento.', details: error.message });
  }
};
