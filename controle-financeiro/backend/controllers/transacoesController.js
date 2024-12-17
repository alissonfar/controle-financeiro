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

  if (!descricao || !valor || !data || !metodo_pagamento || !participantes || participantes.length === 0) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Criar a transação principal
    const [transacaoResult] = await connection.query(
      `INSERT INTO transacoes (descricao, valor, data, metodo_pagamento, categoria, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [descricao, valor, data, metodo_pagamento, categoria, status]
    );
    const transacaoId = transacaoResult.insertId;

    // Processar os participantes
    for (const participante of participantes) {
      const { id: participanteId } = participante;

      // Buscar contas ativas vinculadas ao participante
      const [contasRelacionadas] = await connection.query(
        `SELECT c.id AS id_conta, ca.id AS id_cartao
         FROM participantes_contas pc
         JOIN contas c ON pc.id_conta = c.id AND c.ativo = 1
         LEFT JOIN cartoes ca ON ca.id_conta = c.id AND ca.ativo = 1
         LEFT JOIN cartoes_metodos_pagamento cmp ON ca.id = cmp.id_cartao AND cmp.ativo = 1
         WHERE pc.id_participante = ?`,
        [participanteId]
      );

      if (contasRelacionadas.length === 0) {
        throw new Error(
          `Nenhuma conta ativa encontrada para o participante ID ${participanteId}.`
        );
      }

      // Validação: Método de pagamento "Cartão de Crédito" (ID = 1)
      if (metodo_pagamento === 1) {
        const contaComCartao = contasRelacionadas.find((conta) => conta.id_cartao);

        if (!contaComCartao) {
          throw new Error(
            `Nenhum cartão encontrado para a conta vinculada ao participante ID ${participanteId}.`
          );
        }

        const cartaoId = contaComCartao.id_cartao;

        // Buscar fatura aberta vinculada ao cartão
        const [faturasAbertas] = await connection.query(
          `SELECT id, valor_total
           FROM faturas 
           WHERE id_cartao = ? 
           AND data_fechamento <= ? AND data_vencimento > ? 
           AND status = 'aberta'`,
          [cartaoId, data, data]
        );

        if (faturasAbertas.length === 0) {
          throw new Error(
            `Nenhuma fatura aberta encontrada para o cartão ID ${cartaoId}.`
          );
        }

        const fatura = faturasAbertas[0];

        // Atualizar o valor da fatura com o valor da transação
        await connection.query(
          `UPDATE faturas SET valor_total = valor_total + ? WHERE id = ?`,
          [valor, fatura.id]
        );

        console.log(`Fatura atualizada: ${fatura.id}`);
      }

      // Validação: Métodos diferentes de Cartão de Crédito
      if (metodo_pagamento !== 1) {
        console.log(`Método de pagamento ${metodo_pagamento} não utiliza fatura.`);
      }

      // Inserir o participante na transação
      await connection.query(
        `INSERT INTO transacoes_participantes (id_transacao, id_participante, valor) 
         VALUES (?, ?, ?)`,
        [transacaoId, participanteId, valor / participantes.length]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Transação criada com sucesso!' });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar transação:', error);
    res.status(400).json({ error: error.message });
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
