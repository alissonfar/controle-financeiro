import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('usuario');
  const [idEdicao, setIdEdicao] = useState(null);

  // Buscar usuários
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await api.get('/usuarios');
        setUsuarios(response.data);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    };

    fetchUsuarios();
  }, []);

  // Adicionar ou Editar Usuário
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (idEdicao) {
        // Atualizar usuário existente
        await api.put(`/usuarios/${idEdicao}`, { nome, email, perfil });
        alert('Usuário atualizado com sucesso!');
      } else {
        // Adicionar novo usuário
        await api.post('/usuarios', { nome, email, senha, perfil });
        alert('Usuário criado com sucesso!');
      }

      // Limpar campos e recarregar lista
      setNome('');
      setEmail('');
      setSenha('');
      setPerfil('usuario');
      setIdEdicao(null);
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await api.delete(`/usuarios/${id}`);
        alert('Usuário excluído com sucesso!');
        // Atualiza a lista de usuários após a exclusão
        const response = await api.get('/usuarios');
        setUsuarios(response.data);
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário.');
      }
    }
  };
  
  // Preencher o formulário para edição
  const handleEdit = (usuario) => {
    setIdEdicao(usuario.id);
    setNome(usuario.nome);
    setEmail(usuario.email);
    setPerfil(usuario.perfil);
    setSenha(''); // Senha não será editada
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Lista de Usuários</h1>
      <ul className="bg-white shadow-md rounded-lg p-4">
        {usuarios.map((usuario) => (
          <li
            key={usuario.id}
            className="flex justify-between items-center p-2 border-b last:border-none"
          >
            <div>
              <p className="font-medium">{usuario.nome}</p>
              <p className="text-sm text-gray-500">{usuario.email}</p>
              <p className="text-sm text-gray-500">Perfil: {usuario.perfil}</p>
            </div>
            <div>
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-blue-600"
                onClick={() => handleEdit(usuario)}
              >
                Editar
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                onClick={() => handleDelete(usuario.id)}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
  
      <h2 className="text-xl font-semibold mt-6">
        {idEdicao ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-4 mt-4"
      >
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Nome:</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
        </div>
        {!idEdicao && (
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">Senha:</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
              required
            />
          </div>
        )}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Perfil:</label>
          <select
            value={perfil}
            onChange={(e) => setPerfil(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
          >
            <option value="usuario">Usuário</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          {idEdicao ? 'Atualizar' : 'Adicionar'}
        </button>
      </form>
    </div>
  );
  
};

export default Usuarios;
