// Importa a conexão com o banco de dados
const db = require('../db');

// Função utilitária para validação de dados de entrada
function validarDadosTransacao(dados) {
  const { descricao, valor, data, metodo_pagamento, participantes } = dados;

  if (!descricao || typeof descricao !== 'string' || descricao.trim() === '') {
    throw new Error('Descrição inválida.');
  }

  if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) {
    throw new Error('Valor inválido.');
  }

  if (!data || isNaN(Date.parse(data))) {
    throw new Error('Data inválida.');
  }

  if (!metodo_pagamento || isNaN(Number(metodo_pagamento))) {
    throw new Error('Método de pagamento inválido.');
  }

  if (!participantes || !Array.isArray(participantes) || participantes.length === 0) {
    throw new Error('Participantes inválidos. Deve ser uma lista de participantes.');
  }
}

// Função utilitária para validação de participantes e seleção de contas
async function validarParticipantes(connection, participantes, metodo_pagamento) {
  for (const participante of participantes) {
    const { id: participanteId } = participante;

    // Verificar se o participante usa conta
    const [dadosParticipante] = await connection.query(
      `SELECT usa_conta FROM participantes WHERE id = ? AND ativo = 1`,
      [participanteId]
    );

    if (dadosParticipante.length === 0) {
      throw new Error(`Participante ID ${participanteId} não encontrado ou inativo.`);
    }

    const { usa_conta } = dadosParticipante[0];

    if (usa_conta === 0) {
      console.log(`Participante ID ${participanteId} não usa conta. Pulando validações de contas.`);
      continue;
    }

    // Buscar contas vinculadas ao participante e método de pagamento
    const [contasRelacionadas] = await connection.query(
      `SELECT c.id AS id_conta, c.saldo_atual
       FROM participantes_contas pc
       JOIN contas c ON pc.id_conta = c.id AND c.ativo = 1
       JOIN contas_metodos_pagamento cmp 
         ON c.id = cmp.id_conta AND cmp.ativo = 1 AND cmp.id_metodo_pagamento = ?
       WHERE pc.id_participante = ? 
         AND pc.ativo = 1`,
      [metodo_pagamento, participanteId]
    );

    if (contasRelacionadas.length === 0) {
      throw new Error(`O método de pagamento ${metodo_pagamento} não está vinculado à conta ativa do participante ID ${participanteId}.`);
    }
  }
}

exports.listarTransacoes = async (req, res) => {
  try {
    console.log('Listando transações...');
    const [rows] = await db.query(
      `SELECT t.*, 
             GROUP_CONCAT(CONCAT(p.nome, ' (R$ ', tp.valor, ')') SEPARATOR ', ') AS participantes
      FROM transacoes t
      LEFT JOIN transacoes_participantes tp ON t.id = tp.id_transacao AND tp.ativo = 1
      LEFT JOIN participantes p ON tp.id_participante = p.id
      WHERE t.ativo = 1
      GROUP BY t.id`
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({ error: 'Erro ao listar transações.', details: error.message });
  }
};

exports.criarTransacao = async (req, res) => {
  const connection = await db.getConnection();

  try {
    console.log('Iniciando criação de transação...');
    validarDadosTransacao(req.body);
    const { descricao, valor, data, metodo_pagamento, categoria, status, participantes } = req.body;

    await connection.beginTransaction();

    const [transacaoResult] = await connection.query(
      `INSERT INTO transacoes (descricao, valor, data, metodo_pagamento, categoria, status) 
       VALUES (?, ?, ?, ?, ?, ?)`
      , [descricao, valor, data, metodo_pagamento, categoria, status]
    );

    const transacaoId = transacaoResult.insertId;

    await validarParticipantes(connection, participantes, metodo_pagamento);

    for (const participante of participantes) {
      const valorDividido = valor / participantes.length;

      const [contasRelacionadas] = await connection.query(
        `SELECT c.id AS id_conta, c.saldo_atual 
         FROM participantes_contas pc
         JOIN contas c ON pc.id_conta = c.id AND c.ativo = 1
         JOIN contas_metodos_pagamento cmp 
           ON c.id = cmp.id_conta AND cmp.ativo = 1 AND cmp.id_metodo_pagamento = ?
         WHERE pc.id_participante = ? 
           AND pc.ativo = 1`,
        [metodo_pagamento, participante.id]
      );

      if (contasRelacionadas.length === 0) {
        throw new Error(`Nenhuma conta ativa encontrada para o participante ID ${participante.id}.`);
      }

      const conta = contasRelacionadas[0];
      const saldoPreTransacao = parseFloat(conta.saldo_atual);
      const saldoPosTransacao = saldoPreTransacao - valorDividido;

      if (saldoPosTransacao < 0) {
        throw new Error(`Saldo insuficiente na conta ID ${conta.id_conta}.`);
      }

      await connection.query(
        `UPDATE contas SET saldo_atual = ? WHERE id = ?`,
        [saldoPosTransacao, conta.id_conta]
      );

      await connection.query(
        `INSERT INTO transacoes_participantes (id_transacao, id_participante, valor, saldo_pre_transacao, saldo_pos_transacao) 
         VALUES (?, ?, ?, ?, ?)`
        , [transacaoId, participante.id, valorDividido, saldoPreTransacao, saldoPosTransacao]
      );

      console.log(`Participante ID ${participante.id} | Saldo pré-transação: R$ ${saldoPreTransacao.toFixed(2)}, Saldo pós-transação: R$ ${saldoPosTransacao.toFixed(2)}`);
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


exports.estornarTransacao = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    console.log(`Iniciando estorno da transação ID ${id}...`);

    await connection.beginTransaction();

    const [transacao] = await connection.query(
      'SELECT * FROM transacoes WHERE id = ? AND ativo = 1 AND estornada = 0',
      [id]
    );

    if (transacao.length === 0) {
      throw new Error('Transação não encontrada ou já estornada.');
    }

    const [participantesTransacao] = await connection.query(
      `SELECT tp.id, tp.id_participante, tp.valor, tp.saldo_pre_transacao, tp.saldo_pos_transacao, c.id AS id_conta, c.saldo_atual
       FROM transacoes_participantes tp
       JOIN participantes_contas pc ON tp.id_participante = pc.id_participante
       JOIN contas c ON pc.id_conta = c.id AND c.ativo = 1
       WHERE tp.id_transacao = ? AND tp.ativo = 1`,
      [id]
    );

    for (const participante of participantesTransacao) {
      const saldoPreEstorno = parseFloat(participante.saldo_atual);
      const valorTransacao = parseFloat(participante.valor);
      const saldoPosEstorno = saldoPreEstorno + valorTransacao;

      if (isNaN(saldoPreEstorno) || isNaN(valorTransacao)) {
        throw new Error(`Valores inválidos detectados para o participante ID ${participante.id_participante}.`);
      }

      await connection.query(
        `UPDATE contas SET saldo_atual = ? WHERE id = ?`,
        [saldoPosEstorno, participante.id_conta]
      );

      // Registrar o estorno na tabela estorno_participantes_transacoes
      const [result] = await connection.query(
        `INSERT INTO estorno_participantes_transacoes 
         (id_transacao, id_participante, valor, saldo_pre_estorno, saldo_pos_estorno, data_estorno) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [id, participante.id_participante, valorTransacao, saldoPreEstorno, saldoPosEstorno]
      );

      const idEstorno = result.insertId;

      // Atualizar o id_estorno na tabela transacoes_participantes
      await connection.query(
        `UPDATE transacoes_participantes 
         SET saldo_pre_transacao = ?, saldo_pos_transacao = ?, id_estorno = ? 
         WHERE id = ?`,
        [saldoPreEstorno, saldoPosEstorno, idEstorno, participante.id]
      );

      console.log(`Estorno registrado para Participante ID ${participante.id_participante} com ID de estorno ${idEstorno}.`);
    }

    await connection.query(
      'UPDATE transacoes SET estornada = 1 WHERE id = ?',
      [id]
    );

    await connection.commit();
    res.json({ message: 'Transação estornada com sucesso!' });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao estornar transação:', error);
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
};
