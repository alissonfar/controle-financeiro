const db = require('../db');

exports.listarParticipantes = async (req, res) => {
  try {
    const [participantes] = await db.query(`
      SELECT p.id, p.nome, p.descricao, p.usa_conta, 
             GROUP_CONCAT(c.nome SEPARATOR ', ') AS contas_vinculadas
      FROM participantes p
      LEFT JOIN participantes_contas pc ON p.id = pc.id_participante AND pc.ativo = 1
      LEFT JOIN contas c ON pc.id_conta = c.id
      WHERE p.ativo = 1
      GROUP BY p.id
    `);
    res.json(participantes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar participantes.', details: error.message });
  }
};

exports.criarParticipante = async (req, res) => {
  const { nome, descricao, usa_conta } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO participantes (nome, descricao, usa_conta) VALUES (?, ?, ?)',
      [nome, descricao, usa_conta]
    );
    res.status(201).json({ message: 'Participante criado com sucesso!', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar participante.', details: err.message });
  }
};

exports.atualizarParticipante = async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, usa_conta } = req.body;
  try {
    await db.query(
      'UPDATE participantes SET nome = ?, descricao = ?, usa_conta = ? WHERE id = ? AND ativo = TRUE',
      [nome, descricao, usa_conta, id]
    );
    res.json({ message: 'Participante atualizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar participante.', details: err.message });
  }
};

exports.excluirParticipante = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE participantes SET ativo = FALSE WHERE id = ?', [id]);
    res.json({ message: 'Participante excluído logicamente!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir participante.', details: err.message });
  }
};
