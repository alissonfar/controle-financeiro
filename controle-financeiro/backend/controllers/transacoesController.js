const db = require('../db');

exports.listarTransacoes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, 
             GROUP_CONCAT(CONCAT(p.nome, ' (R$ ', tp.valor, ')') SEPARATOR ', ') AS participantes
      FROM transacoes t
      LEFT JOIN transacoes_participantes tp ON t.id = tp.id_transacao AND tp.ativo = 1
      LEFT JOIN participantes p ON tp.id_participante = p.id
      WHERE t.ativo = 1
      GROUP BY t.id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar transações.', details: error.message });
  }
};

exports.criarTransacao = async (req, res) => {
  const { descricao, valor, data, metodo_pagamento, categoria, status, participantes } = req.body;
  if (!descricao || !valor || !data || !metodo_pagamento || !categoria || !participantes || participantes.length === 0) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO transacoes (descricao, valor, data, metodo_pagamento, categoria, status) VALUES (?, ?, ?, ?, ?, ?)',
      [descricao, valor, data, metodo_pagamento, categoria, status]
    );

    const transacaoId = result.insertId;

    for (const participante of participantes) {
      const valorIndividual = valor / participantes.length;
      await connection.query(
        'INSERT INTO transacoes_participantes (id_transacao, id_participante, valor) VALUES (?, ?, ?)',
        [transacaoId, participante.id, valorIndividual]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Transação criada com sucesso!' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Erro ao criar transação.', details: error.message });
  } finally {
    connection.release();
  }
};

exports.atualizarTransacao = async (req, res) => {
  const { id } = req.params;
  const { descricao, valor, data, metodo_pagamento, categoria, status, participantes } = req.body;

  if (!descricao || !valor || !data || !metodo_pagamento || !categoria || !participantes || participantes.length === 0) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE transacoes SET descricao = ?, valor = ?, data = ?, metodo_pagamento = ?, categoria = ?, status = ? WHERE id = ? AND ativo = 1',
      [descricao, valor, data, metodo_pagamento, categoria, status, id]
    );

    await connection.query('UPDATE transacoes_participantes SET ativo = 0 WHERE id_transacao = ?', [id]);

    for (const participante of participantes) {
      const valorIndividual = valor / participantes.length;
      await connection.query(
        'INSERT INTO transacoes_participantes (id_transacao, id_participante, valor, ativo) VALUES (?, ?, ?, 1)',
        [id, participante.id, valorIndividual]
      );
    }

    await connection.commit();
    res.json({ message: 'Transação atualizada com sucesso!' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Erro ao atualizar transação.', details: error.message });
  } finally {
    connection.release();
  }
};

exports.excluirTransacao = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query('UPDATE transacoes SET ativo = 0 WHERE id = ?', [id]);
    await connection.query('UPDATE transacoes_participantes SET ativo = 0 WHERE id_transacao = ?', [id]);
    await connection.commit();
    res.json({ message: 'Transação excluída logicamente!' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Erro ao excluir transação.', details: error.message });
  } finally {
    connection.release();
  }
};
