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

  if (!descricao || !valor_total || !metodo_pagamento || !participante_destino_id) {
      return res.status(400).json({ error: 'Descrição, valor total, método de pagamento e participante de destino são obrigatórios.' });
  }

  const connection = await db.getConnection();

  try {
      await connection.beginTransaction();

      let saldoPreOrigem = null;
      let saldoPosOrigem = null;
      let saldoPreDestino = null;
      let saldoPosDestino = null;

      // Verificar saldo e contas de origem
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

      // Verificar saldo e contas de destino
      const [[participanteDestino]] = await connection.query(
          `SELECT usa_conta FROM participantes WHERE id = ? AND ativo = 1`,
          [participante_destino_id]
      );

      if (!participanteDestino) {
          throw new Error('Participante de destino não encontrado ou inativo.');
      }

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

      // Processar transações vinculadas ao pagamento
      if (transacoes && transacoes.length > 0) {
          for (const transacao of transacoes) {
              const { id, valor } = transacao;

              if (!id || !valor || valor <= 0) {
                  throw new Error('Dados inválidos na lista de transações.');
              }

              const [[transacaoExistente]] = await connection.query(
                  `SELECT valor, status FROM transacoes WHERE id = ? AND ativo = 1`,
                  [id]
              );

              if (!transacaoExistente || !['pendente', 'pago parcial', 'pago total'].includes(transacaoExistente.status)) {
                  throw new Error(`Transação ID ${id} não está disponível para vinculação.`);
              }

              const [[{ totalPago }]] = await connection.query(
                  `SELECT COALESCE(SUM(valor_vinculado), 0) AS totalPago
                  FROM pagamentos_transacoes
                  WHERE transacao_id = ?`,
                  [id]
              );

              const valorTransacao = parseFloat(transacaoExistente.valor);
              const valorPagoAcumulado = parseFloat(totalPago) + parseFloat(valor);

              if (valorPagoAcumulado > valorTransacao) {
                  throw new Error(`O valor vinculado (${valor}) excede o saldo restante da transação (ID ${id}).`);
              }

              const saldoRestantePre = valorTransacao - parseFloat(totalPago);
              const saldoRestantePos = valorTransacao - valorPagoAcumulado;

              let novoStatus = 'pago parcial';
              if (valorPagoAcumulado >= valorTransacao) {
                  novoStatus = 'pago total';
              } else if (valorPagoAcumulado === 0) {
                  novoStatus = 'pendente';
              }

              // Inserir na tabela pagamentos_transacoes
              await connection.query(
                  `INSERT INTO pagamentos_transacoes (
                      pagamento_id, transacao_id, valor_vinculado, status_transacao_pre,
                      status_transacao_pos, created_at
                  ) VALUES (?, ?, ?, ?, ?, NOW())`,
                  [pagamentoId, id, valor, transacaoExistente.status, novoStatus]
              );

              // Inserir na tabela pagamento_participantes_transacoes
              const [[participante]] = await connection.query(
                  `SELECT status, saldo_pos_transacao FROM transacoes_participantes 
                   WHERE id_transacao = ? AND id_participante = ?`,
                  [id, participante_destino_id]
              );

              const statusPre = participante.status;
              const saldoPos = participante.saldo_pos_transacao - valor;

              let statusPos = "pendente";
              if (saldoPos > 0 && saldoPos < valorTransacao) {
                  statusPos = "pago parcial";
              } else if (saldoPos === 0) {
                  statusPos = "pago total";
              }

              await connection.query(
                  `INSERT INTO pagamento_participantes_transacoes (
                      pagamento_id, id_transacao, id_participante, valor_pago, status_participante_pre, status_participante_pos
                  ) VALUES (?, ?, ?, ?, ?, ?)`,
                  [pagamentoId, id, participante_destino_id, valor, statusPre, statusPos]
              );

              // Atualizar transacoes_participantes
              await connection.query(
                  `UPDATE transacoes_participantes 
                   SET saldo_pos_transacao = ?, status = ?
                   WHERE id_transacao = ? AND id_participante = ?`,
                  [saldoPos, statusPos, id, participante_destino_id]
              );

              // Atualizar o status da transação geral
              await connection.query(
                  `UPDATE transacoes SET status = ? WHERE id = ?`,
                  [novoStatus, id]
              );
          }
      }

      // Atualizar saldos das contas de origem e destino
      if (saldoPosOrigem !== null) {
          await connection.query('UPDATE contas SET saldo_atual = ? WHERE id = ?', [saldoPosOrigem, conta_id]);
      }

      if (saldoPosDestino !== null) {
          await connection.query('UPDATE contas SET saldo_atual = ? WHERE id = ?', [saldoPosDestino, conta_destino_id]);
      }

      await connection.commit();

      res.status(201).json({
          message: 'Pagamento criado com sucesso!',
          pagamento: {
              id: pagamentoId,
              descricao,
              valor_total,
              saldo_pre_origem: saldoPreOrigem ? saldoPreOrigem.toFixed(2) : null,
              saldo_pos_origem: saldoPosOrigem ? saldoPosOrigem.toFixed(2) : null,
              saldo_pre_destino: saldoPreDestino ? saldoPreDestino.toFixed(2) : null,
              saldo_pos_destino: saldoPosDestino ? saldoPosDestino.toFixed(2) : null,
              transacoes: transacoes.map(t => ({ id: t.id, valor: t.valor }))
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




// Função para estornar pagamento
exports.estornarPagamento = async (req, res) => {
  const { id_transacao, id_participante, valor_estorno, motivo_estorno, comprovante } = req.body;

  try {
      if (!id_transacao || !id_participante || !valor_estorno || !motivo_estorno) {
          return res.status(400).json({ message: 'ID da transação, ID do participante, valor do estorno e motivo são obrigatórios.' });
      }

      // Verificar se o participante está vinculado à transação
      const [[transacaoParticipante]] = await db.query(
          `SELECT * FROM transacoes_participantes 
           WHERE id_transacao = ? AND id_participante = ? AND ativo = 1`,
          [id_transacao, id_participante]
      );

      if (!transacaoParticipante) {
          return res.status(404).json({ message: 'Participante não está vinculado à transação informada.' });
      }

      if (valor_estorno > transacaoParticipante.valor) {
          return res.status(400).json({ message: 'O valor do estorno não pode exceder o valor registrado para o participante.' });
      }

      const saldoPreEstorno = parseFloat(transacaoParticipante.saldo_pos_transacao || 0);
      const saldoPosEstorno = saldoPreEstorno + parseFloat(valor_estorno);

      const [estornoResult] = await db.query(
          `INSERT INTO estorno_participantes_transacoes 
          (id_transacao, id_participante, valor, saldo_pre_estorno, saldo_pos_estorno, data_estorno) 
          VALUES (?, ?, ?, ?, ?, NOW())`,
          [id_transacao, id_participante, valor_estorno, saldoPreEstorno, saldoPosEstorno]
      );

      let novoStatus = "pendente";
      if (saldoPosEstorno > 0 && saldoPosEstorno < transacaoParticipante.valor) {
          novoStatus = "pago parcial";
      }

      await db.query(
          `UPDATE transacoes_participantes 
           SET id_estorno = ?, status = ?, saldo_pos_transacao = ? 
           WHERE id_transacao = ? AND id_participante = ?`,
          [estornoResult.insertId, novoStatus, saldoPosEstorno, id_transacao, id_participante]
      );

      console.log(`Status atualizado para "${novoStatus}" para participante ID ${id_participante} na transação ${id_transacao}`);

      // Buscar o pagamento vinculado à transação
      const [[pagamentoVinculado]] = await db.query(
          `SELECT pt.pagamento_id, p.status FROM pagamentos_transacoes pt
           INNER JOIN pagamentos p ON pt.pagamento_id = p.id
           WHERE pt.transacao_id = ? LIMIT 1`,
          [id_transacao]
      );

      if (pagamentoVinculado) {
          await db.query(
              `UPDATE pagamentos 
               SET status = "ESTORNADO", data_estorno = NOW(), motivo_estorno = ?, comprovante = ? 
               WHERE id = ?`,
              [motivo_estorno, comprovante || null, pagamentoVinculado.pagamento_id]
          );

          console.log(`Pagamento ID ${pagamentoVinculado.pagamento_id} atualizado para "ESTORNADO".`);
      } else {
          console.log(`Nenhum pagamento encontrado para a transação ID ${id_transacao}.`);
      }

      res.json({
          message: 'Estorno registrado com sucesso!',
          estorno: {
              id_transacao,
              id_participante,
              valor_estorno,
              saldo_pre_estorno: saldoPreEstorno.toFixed(2),
              saldo_pos_estorno: saldoPosEstorno.toFixed(2),
              status: novoStatus,
              motivo_estorno,
              comprovante: comprovante || null,
              pagamento_id: pagamentoVinculado ? pagamentoVinculado.pagamento_id : null
          }
      });
  } catch (error) {
      console.error('Erro ao processar o estorno:', error);
      res.status(500).json({ message: 'Erro ao processar o estorno do pagamento.' });
  }
};




exports.listarPagamentos = async (req, res) => {
  const { page = 1, limit = 10, status, metodo_pagamento, participante_destino_id, start_date, end_date } = req.query;

  try {
    // Configuração de paginação padrão
    const offset = (page - 1) * limit;

    // Construção da query inicial
    let query = 'SELECT * FROM pagamentos WHERE 1=1'; // Sempre retorna algo
    const params = [];

    // Aplicar filtros opcionais
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (metodo_pagamento) {
      query += ' AND metodo_pagamento = ?';
      params.push(metodo_pagamento);
    }

    if (participante_destino_id) {
      query += ' AND participante_destino_id = ?';
      params.push(participante_destino_id);
    }

    if (start_date && end_date) {
      query += ' AND created_at BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    // Adicionar ordenação e paginação
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));


    // Executar a consulta no banco de dados
    const [result] = await db.query(query, params);

    // Contar total de registros (para paginação)
    const [countResult] = await db.query('SELECT COUNT(*) AS total FROM pagamentos WHERE 1=1', params.slice(0, -2));
    const total = countResult[0]?.total || 0;

    // Responder com os dados
    res.json({
      current_page: parseInt(page),
      per_page: parseInt(limit),
      total,
      data: result,
    });
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error); // Log do erro
    res.status(500).json({ message: 'Erro ao listar pagamentos.' });
  }
};
