const db = require('../db');

exports.criarUsuario = async (req, res) => {
  const { nome, email, senha, perfil } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
      [nome, email, senha, perfil]
    );
    res.status(201).json({ message: 'Usuário criado com sucesso!', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar usuário.', details: err.message });
  }
};

exports.listarUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE ativo = TRUE');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários.', details: err.message });
  }
};

exports.atualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nome, email, perfil } = req.body;
  try {
    await db.query(
      'UPDATE usuarios SET nome = ?, email = ?, perfil = ? WHERE id = ? AND ativo = TRUE',
      [nome, email, perfil, id]
    );
    res.json({ message: 'Usuário atualizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar usuário.', details: err.message });
  }
};

exports.excluirUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE usuarios SET ativo = FALSE WHERE id = ?', [id]);
    res.json({ message: 'Usuário excluído logicamente!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir usuário.', details: err.message });
  }
};
