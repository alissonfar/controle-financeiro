import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Input from '../components/Input';
import Modal from '../components/Modal';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('usuario');
  const [idEdicao, setIdEdicao] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfirm, setModalConfirm] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [modalMessage, setModalMessage] = useState({ open: false, message: '' });

  // Buscar usuários
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await api.get('/usuarios');
        setUsuarios(response.data);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        setModalMessage({ open: true, message: 'Erro ao buscar usuários.' });
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
        setModalMessage({ open: true, message: 'Usuário atualizado com sucesso!' });
      } else {
        // Adicionar novo usuário
        await api.post('/usuarios', { nome, email, senha, perfil });
        setModalMessage({ open: true, message: 'Usuário criado com sucesso!' });
      }

      // Limpar campos e recarregar lista
      setNome('');
      setEmail('');
      setSenha('');
      setPerfil('usuario');
      setIdEdicao(null);
      setModalOpen(false);

      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      setModalMessage({ open: true, message: 'Erro ao salvar usuário.' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/usuarios/${selectedUsuario}`);
      setModalMessage({ open: true, message: 'Usuário excluído com sucesso!' });
      setModalConfirm(false);

      // Atualiza a lista de usuários
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      setModalMessage({ open: true, message: 'Erro ao excluir usuário.' });
    }
  };

  const handleEdit = (usuario) => {
    setIdEdicao(usuario.id);
    setNome(usuario.nome);
    setEmail(usuario.email);
    setPerfil(usuario.perfil);
    setModalOpen(true);
  };

  const openModal = () => {
    setModalOpen(true);
    setNome('');
    setEmail('');
    setSenha('');
    setPerfil('usuario');
    setIdEdicao(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Usuários</h1>
        <button
          onClick={openModal}
          className="relative bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-green-600 group font-bold"
        >
          +
          <span className="absolute top-full mt-2 hidden group-hover:block bg-black text-white text-xs py-1 px-2 rounded">
            Cadastrar Usuário
          </span>
        </button>
      </div>

      {/* Tabela de Usuários */}
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
                onClick={() => {
                  setSelectedUsuario(usuario.id);
                  setModalConfirm(true);
                }}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={modalOpen}
        title={idEdicao ? 'Editar Usuário' : 'Cadastrar Usuário'}
        onClose={() => setModalOpen(false)}
        confirmText={idEdicao ? 'Atualizar' : 'Cadastrar'}
        onConfirm={handleSubmit}
      >
        <Input
          label="Nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Digite o nome"
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Digite o email"
          required
        />
        {!idEdicao && (
          <Input
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite a senha"
            required
          />
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
      </Modal>

      {/* Modal de Confirmação */}
      <Modal
        isOpen={modalConfirm}
        title="Confirmação"
        onClose={() => setModalConfirm(false)}
        confirmText="Excluir"
        onConfirm={handleDelete}
      >
        <p className="text-gray-700">
          Tem certeza que deseja excluir este usuário?
        </p>
      </Modal>

      {/* Modal de Mensagem */}
      <Modal
        isOpen={modalMessage.open}
        onConfirm={() => setModalMessage({ open: false, message: '' })}
      >
        <p className="text-gray-700">{modalMessage.message}</p>
      </Modal>
    </div>
  );
};

export default Usuarios;
