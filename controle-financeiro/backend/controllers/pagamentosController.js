const db = require('../db');

exports.createPagamento = async (req, res) => {
  const {
    descricao,
    valor_total,
    tipo,
    metodo_pagamento,
    conta_id,
    usuario_origem_id,
    participante_destino_id,
    conta_destino_id,
    transacoes
  } = req.body;

  // Validação básica
  if (!descricao || !valor_total || !metodo_pagamento || !participante_destino_id) {
    return res.status(400).json({ error: 'Descrição, valor total, método de pagamento e participante de destino são obrigatórios.' });
  }

  const connection = await db.getConnection();

  try {
    // Iniciar transação no banco de dados
    await connection.beginTransaction();

    let saldoPreOrigem = null;
    let saldoPosOrigem = null;
    let saldoPreDestino = null;
    let saldoPosDestino = null;

    // Validar e processar a conta de origem, se fornecida
    if (conta_id || usuario_origem_id) {
      const [[origemUsaConta]] = await connection.query(
        `SELECT usa_conta FROM participantes WHERE id = ? AND ativo = 1`,
        [usuario_origem_id || null]
      );

      if (origemUsaConta && origemUsaConta.usa_conta === 1) {
        const [[contaOrigem]] = await connection.query(
          'SELECT saldo_atual FROM contas WHERE id = ? AND ativo = 1',
          [conta_id]
        );

        if (!contaOrigem) {
          throw new Error('Conta de origem não encontrada ou inativa.');
        }

        saldoPreOrigem = parseFloat(contaOrigem.saldo_atual);
        saldoPosOrigem = parseFloat((saldoPreOrigem - valor_total).toFixed(2));

        if (saldoPosOrigem < 0) {
          throw new Error('Saldo insuficiente na conta de origem.');
        }
      }
    }

    // Validar participante de destino
    const [[participanteDestino]] = await connection.query(
      `SELECT usa_conta FROM participantes WHERE id = ? AND ativo = 1`,
      [participante_destino_id]
    );

    if (!participanteDestino) {
      throw new Error('Participante de destino não encontrado ou inativo.');
    }

    // Validar e processar a conta de destino, se aplicável
    if (participanteDestino.usa_conta === 1) {
      if (!conta_destino_id) {
        throw new Error('Conta de destino é obrigatória para participantes que utilizam conta.');
      }

      const [[contaDestino]] = await connection.query(
        `SELECT saldo_atual FROM contas WHERE id = ? AND ativo = 1 AND id IN (
          SELECT id_conta FROM participantes_contas WHERE id_participante = ? AND ativo = 1
        )`,
        [conta_destino_id, participante_destino_id]
      );

      if (!contaDestino) {
        throw new Error('Conta de destino inválida ou não pertence ao participante de destino.');
      }

      saldoPreDestino = parseFloat(contaDestino.saldo_atual);
      saldoPosDestino = parseFloat((saldoPreDestino + valor_total).toFixed(2));
    }

    // Inserir pagamento
    const [pagamentoResult] = await connection.query(
      `INSERT INTO pagamentos (
        descricao, valor_total, tipo, metodo_pagamento, conta_id, usuario_origem_id, participante_destino_id,
        conta_destino_id, saldo_conta_pre, saldo_conta_pos, saldo_destino_pre, saldo_destino_pos, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ATIVO', NOW())`,
      [
        descricao,
        valor_total,
        tipo,
        metodo_pagamento,
        conta_id || null,
        usuario_origem_id || null,
        participante_destino_id,
        conta_destino_id || null,
        saldoPreOrigem,
        saldoPosOrigem,
        saldoPreDestino,
        saldoPosDestino
      ]
    );

    const pagamentoId = pagamentoResult.insertId;

    // Vincular transações, se fornecidas
    if (transacoes && transacoes.length > 0) {
        for (const transacao of transacoes) {
            const { id, valor } = transacao;
          
            if (!id || !valor || valor <= 0) {
              throw new Error('Dados inválidos na lista de transações.');
            }
          
            // Consultar a transação existente
            const [[transacaoExistente]] = await connection.query(
              `SELECT valor, status FROM transacoes WHERE id = ? AND ativo = 1`,
              [id]
            );
          
            if (!transacaoExistente || !['pendente', 'pago parcial', 'pago total'].includes(transacaoExistente.status)) {
              throw new Error(`Transação ID ${id} não está disponível para vinculação.`);
            }
          
            // Soma acumulada de valores já pagos para esta transação
            const [[{ totalPago }]] = await connection.query(
              `SELECT COALESCE(SUM(valor_vinculado), 0) AS totalPago
               FROM pagamentos_transacoes
               WHERE transacao_id = ?`,
              [id]
            );
          
            const valorTransacao = parseFloat(transacaoExistente.valor);
            const valorPagoAcumulado = parseFloat(totalPago) + parseFloat(valor);
          
            console.log(`Transação ID: ${id}, Total Pago: ${totalPago}, Valor Atual: ${valor}, Pago Acumulado: ${valorPagoAcumulado}, Valor Transação: ${valorTransacao}`);
          
            // Determinar o novo status com base no valor acumulado
            let novoStatus = 'pago parcial';
            if (valorPagoAcumulado >= valorTransacao) {
              novoStatus = 'pago total';
            } else if (valorPagoAcumulado === 0) {
              novoStatus = 'pendente';
            }
          
            // Inserir o pagamento vinculado
            await connection.query(
              `INSERT INTO pagamentos_transacoes (pagamento_id, transacao_id, valor_vinculado, status_transacao_pre, status_transacao_pos, created_at)
               VALUES (?, ?, ?, ?, ?, NOW())`,
              [pagamentoId, id, valor, transacaoExistente.status, novoStatus]
            );
          
            // Atualizar o status da transação
            await connection.query(
              `UPDATE transacoes SET status = ? WHERE id = ?`,
              [novoStatus, id]
            );
          }
          
          
          
    }

    // Atualizar saldos de origem e destino, se aplicável
    if (saldoPosOrigem !== null) {
      await connection.query('UPDATE contas SET saldo_atual = ? WHERE id = ?', [saldoPosOrigem, conta_id]);
    }

    if (saldoPosDestino !== null) {
      await connection.query('UPDATE contas SET saldo_atual = ? WHERE id = ?', [saldoPosDestino, conta_destino_id]);
    }

    // Confirmar transação
    await connection.commit();

    res.status(201).json({
      message: 'Pagamento criado com sucesso!',
      pagamento: {
        id: pagamentoId,
        descricao,
        valor_total,
        saldo_pre_origem: saldoPreOrigem ? saldoPreOrigem.toFixed(2) : null,
        saldo_pos_origem: saldoPosOrigem ? saldoPosOrigem.toFixed(2) : null,
        saldo_pre_destino: saldoPreDestino.toFixed(2),
        saldo_pos_destino: saldoPosDestino.toFixed(2),
        transacoes: transacoes.map(t => ({ id: t.id, valor: t.valor, status: t.novoStatus }))
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar pagamento:', error);
    res.status(500).json({ error: 'Erro ao criar pagamento.', details: error.message });
  } finally {
    connection.release();
  }
};

