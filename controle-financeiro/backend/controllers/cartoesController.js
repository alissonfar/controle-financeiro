const db = require('../db');

exports.listarCartoes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        cartoes.*, 
        contas.nome AS nome_conta, 
        GROUP_CONCAT(metodos_pagamento.nome) AS metodos_pagamento
      FROM cartoes
      JOIN contas ON cartoes.id_conta = contas.id
      LEFT JOIN cartoes_metodos_pagamento cmp ON cartoes.id = cmp.id_cartao AND cmp.ativo = 1
      LEFT JOIN metodos_pagamento ON cmp.id_metodo_pagamento = metodos_pagamento.id
      WHERE cartoes.ativo = 1
      GROUP BY cartoes.id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cartões.', details: error.message });
  }
};

exports.criarCartao = async (req, res) => {
  const { nome, id_conta, metodos_pagamento, limite } = req.body;

  if (!metodos_pagamento || !Array.isArray(metodos_pagamento) || metodos_pagamento.length === 0) {
    return res.status(400).json({ error: 'É necessário fornecer os métodos de pagamento.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO cartoes (nome, id_conta, limite) VALUES (?, ?, ?)',
      [nome, id_conta, limite]
    );

    const cartaoId = result.insertId;

    const queries = metodos_pagamento.map((idMetodoPagamento) =>
      db.query(
        'INSERT INTO cartoes_metodos_pagamento (id_cartao, id_metodo_pagamento) VALUES (?, ?)',
        [cartaoId, idMetodoPagamento]
      )
    );
    await Promise.all(queries);

    res.status(201).json({ message: 'Cartão criado com sucesso!', id: cartaoId });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar cartão.', details: error.message });
  }
};

exports.atualizarCartao = async (req, res) => {
  const { id } = req.params;
  const { nome, id_conta, metodos_pagamento, limite } = req.body;

  try {
    await db.query(
      'UPDATE cartoes SET nome = ?, id_conta = ?, limite = ? WHERE id = ?',
      [nome, id_conta, limite, id]
    );

    await db.query('UPDATE cartoes_metodos_pagamento SET ativo = 0 WHERE id_cartao = ?', [id]);

    const queries = metodos_pagamento.map((idMetodoPagamento) =>
      db.query(
        'INSERT INTO cartoes_metodos_pagamento (id_cartao, id_metodo_pagamento) VALUES (?, ?)',
        [id, idMetodoPagamento]
      )
    );
    await Promise.all(queries);

    res.json({ message: 'Cartão atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar cartão.', details: error.message });
  }
};

exports.excluirCartao = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE cartoes SET ativo = 0 WHERE id = ?', [id]);
    res.json({ message: 'Cartão excluído logicamente!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir cartão.', details: error.message });
  }
};
