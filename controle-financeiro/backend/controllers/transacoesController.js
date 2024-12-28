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

    // Se o participante não usa conta, pular validações relacionadas a contas
    if (usa_conta === 0) {
      console.log(`Participante ID ${participanteId} não usa conta. Pulando validações de contas.`);
      continue;
    }

    // Buscar contas ativas vinculadas ao participante e método de pagamento
    const [contasRelacionadas] = await connection.query(
      `SELECT c.id AS id_conta, ca.id AS id_cartao, cmp.id_metodo_pagamento
       FROM participantes_contas pc
       JOIN contas c ON pc.id_conta = c.id AND c.ativo = 1
       LEFT JOIN cartoes ca ON ca.id_conta = c.id AND ca.ativo = 1
       JOIN contas_metodos_pagamento cmp 
         ON c.id = cmp.id_conta AND cmp.ativo = 1 AND cmp.id_metodo_pagamento = ?
       WHERE pc.id_participante = ? 
         AND pc.ativo = 1`,
      [metodo_pagamento, participanteId]
    );

    console.log(`Contas encontradas para participante ID ${participanteId}:`, contasRelacionadas);

    if (contasRelacionadas.length === 0) {
      throw new Error(`O método de pagamento ${metodo_pagamento} não está vinculado à conta ativa do participante ID ${participanteId}.`);
    }

    // Validação adicional para cartão de crédito (método 1)
    if (metodo_pagamento === 1) {
      // Cartão de Crédito
      const contaComCartao = contasRelacionadas.find(conta => conta.id_cartao);
      if (!contaComCartao) {
        throw new Error(`Nenhum cartão de crédito encontrado para o participante ID ${participanteId}.`);
      }

      // Verificar se há uma fatura aberta para o período atual
      const [faturasAbertas] = await connection.query(
        `SELECT id FROM faturas 
         WHERE id_cartao = ? 
           AND status = 'aberta'
           AND ? BETWEEN data_fechamento AND data_vencimento`,
        [contaComCartao.id_cartao, new Date()]
      );

      if (faturasAbertas.length === 0) {
        throw new Error(`Nenhuma fatura aberta encontrada para o período atual do cartão de crédito do participante ID ${participanteId}.`);
      }

      console.log(`Fatura válida encontrada para o cartão do participante ID ${participanteId}.`);
    }

    console.log(`Participante ID ${participanteId} validado com sucesso para o método de pagamento ${metodo_pagamento}.`);
  }
}

exports.listarTransacoes = async (req, res) => {
  try {
    console.log('Listando transações...');
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
       VALUES (?, ?, ?, ?, ?, ?)`,
      [descricao, valor, data, metodo_pagamento, categoria, status]
    );

    const transacaoId = transacaoResult.insertId;

    await validarParticipantes(connection, participantes, metodo_pagamento);

    for (const participante of participantes) {
      const valorDividido = valor / participantes.length;

      // Inserir registro de participantes na transação
      await connection.query(
        `INSERT INTO transacoes_participantes (id_transacao, id_participante, valor) 
         VALUES (?, ?, ?)`,
        [transacaoId, participante.id, valorDividido]
      );

      // Buscar conta vinculada ao participante
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
        throw new Error(`Nenhuma conta ativa encontrada para o participante ID ${participante.id} com o método de pagamento ${metodo_pagamento}.`);
      }

      const conta = contasRelacionadas[0];
      const saldoAtual = parseFloat(conta.saldo_atual); // Converter para número

      if (isNaN(saldoAtual)) {
        throw new Error(`Saldo atual inválido para a conta ID ${conta.id_conta}.`);
      }

      console.log(`Participante ID ${participante.id} | Conta ID ${conta.id_conta} | Saldo pré-operação: R$ ${saldoAtual.toFixed(2)}`);

      const novoSaldo = saldoAtual - valorDividido;

      if (novoSaldo < 0) {
        throw new Error(`Saldo insuficiente na conta ID ${conta.id_conta} do participante ID ${participante.id}.`);
      }

      // Atualizar saldo da conta
      await connection.query(
        `UPDATE contas SET saldo_atual = ? WHERE id = ?`,
        [novoSaldo, conta.id_conta]
      );

      console.log(`Participante ID ${participante.id} | Conta ID ${conta.id_conta} | Saldo pós-operação: R$ ${novoSaldo.toFixed(2)}`);
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
  const connection = await db.getConnection();

  try {
    console.log(`Iniciando atualização de transação ID ${id}...`);
    validarDadosTransacao(req.body);
    const { descricao, valor, data, metodo_pagamento, categoria, status, participantes } = req.body;

    await connection.beginTransaction();

    await connection.query(
      'UPDATE transacoes SET descricao = ?, valor = ?, data = ?, metodo_pagamento = ?, categoria = ?, status = ? WHERE id = ? AND ativo = 1',
      [descricao, valor, data, metodo_pagamento, categoria, status, id]
    );

    await connection.query('UPDATE transacoes_participantes SET ativo = 0 WHERE id_transacao = ?', [id]);

    await validarParticipantes(connection, participantes, metodo_pagamento);

    for (const participante of participantes) {
      await connection.query(
        'INSERT INTO transacoes_participantes (id_transacao, id_participante, valor, ativo) VALUES (?, ?, ?, 1)',
        [id, participante.id, valor / participantes.length]
      );
    }

    await connection.commit();
    res.json({ message: 'Transação atualizada com sucesso!' });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar transação:', error);
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
};

exports.excluirTransacao = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    console.log(`Iniciando exclusão lógica da transação ID ${id}...`);

    await connection.beginTransaction();

    const [transacao] = await connection.query('SELECT id FROM transacoes WHERE id = ? AND ativo = 1', [id]);
    if (transacao.length === 0) {
      throw new Error('Transação não encontrada ou já excluída.');
    }

    await connection.query('UPDATE transacoes SET ativo = 0 WHERE id = ?', [id]);
    await connection.query('UPDATE transacoes_participantes SET ativo = 0 WHERE id_transacao = ?', [id]);

    await connection.commit();
    res.json({ message: 'Transação excluída logicamente!' });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao excluir transação:', error);
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
};