const db = require('../db');

exports.listarFaturas = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM faturas WHERE ativo = TRUE');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar faturas.', details: err.message });
  }
};

exports.criarFatura = async (req, res) => {
  const { id_cartao, data_fechamento, data_vencimento, valor_total, status, justificativa } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO faturas (id_cartao, data_fechamento, data_vencimento, valor_total, status, justificativa) VALUES (?, ?, ?, ?, ?, ?)',
      [id_cartao, data_fechamento, data_vencimento, valor_total, status, justificativa]
    );
    res.status(201).json({ message: 'Fatura criada com sucesso!', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar fatura.', details: err.message });
  }
};

exports.atualizarFatura = async (req, res) => {
  const { id } = req.params;
  const { id_cartao, data_fechamento, data_vencimento, valor_total, status, justificativa } = req.body;
  try {
    await db.query(
      'UPDATE faturas SET id_cartao = ?, data_fechamento = ?, data_vencimento = ?, valor_total = ?, status = ?, justificativa = ? WHERE id = ? AND ativo = TRUE',
      [id_cartao, data_fechamento, data_vencimento, valor_total, status, justificativa, id]
    );
    res.json({ message: 'Fatura atualizada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar fatura.', details: err.message });
  }
};

exports.excluirFatura = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE faturas SET ativo = FALSE WHERE id = ?', [id]);
    res.json({ message: 'Fatura excluída logicamente!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir fatura.', details: err.message });
  }
};
 