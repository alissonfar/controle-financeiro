import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Input from '../components/Input';
import Modal from '../components/Modal';

const Cartoes = () => {
  const [cartoes, setCartoes] = useState([]);
  const [nome, setNome] = useState('');
  const [idConta, setIdConta] = useState('');
  const [idMetodoPagamento, setIdMetodoPagamento] = useState([]);
  const [limite, setLimite] = useState('');
  const [contas, setContas] = useState([]);
  const [metodos, setMetodos] = useState([]);
  const [idEdicao, setIdEdicao] = useState(null);
  const [metodosOriginais, setMetodosOriginais] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfirm, setModalConfirm] = useState(false);
  const [selectedCartao, setSelectedCartao] = useState(null);
  const [modalMessage, setModalMessage] = useState({ open: false, message: '' });

  // Buscar cartões, contas e métodos de pagamento ao carregar a página
  useEffect(() => {
    const fetchDados = async () => {
      try {
        const [cartoesResponse, contasResponse, metodosResponse] = await Promise.all([
          api.get('/cartoes'),
          api.get('/contas'),
          api.get('/metodos_pagamento'),
        ]);
        setCartoes(cartoesResponse.data);
        setContas(contasResponse.data);
        setMetodos(metodosResponse.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setModalMessage({ open: true, message: 'Erro ao carregar cartões, contas ou métodos de pagamento.' });
      }
    };

    fetchDados();
  }, []);

  // Adicionar ou editar cartão
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome || !idConta || idMetodoPagamento.length === 0) {
      setModalMessage({ open: true, message: 'Por favor, preencha todos os campos obrigatórios.' });
      return;
    }

    const metodosParaEnviar =
      idMetodoPagamento.sort().toString() === metodosOriginais.sort().toString()
        ? metodosOriginais
        : idMetodoPagamento;

    const cartao = {
      nome,
      id_conta: idConta,
      metodos_pagamento: metodosParaEnviar,
      limite: limite === '' ? null : limite,
    };

    try {
      if (idEdicao) {
        await api.put(`/cartoes/${idEdicao}`, cartao);
        setModalMessage({ open: true, message: 'Cartão atualizado com sucesso!' });
      } else {
        await api.post('/cartoes', cartao);
        setModalMessage({ open: true, message: 'Cartão criado com sucesso!' });
      }

      resetForm();
      const response = await api.get('/cartoes');
      setCartoes(response.data);
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      setModalMessage({ open: true, message: 'Erro ao salvar cartão.' });
    }
  };

  // Resetar formulário
  const resetForm = () => {
    setNome('');
    setIdConta('');
    setIdMetodoPagamento([]);
    setLimite('');
    setIdEdicao(null);
    setMetodosOriginais([]);
    setModalOpen(false);
  };

  // Carregar informações ao editar um cartão
  const handleEdit = (cartao) => {
    setIdEdicao(cartao.id);
    setNome(cartao.nome);
    setIdConta(cartao.id_conta);
    setLimite(cartao.limite || '');

    const metodos = cartao.metodos_pagamento
      ? cartao.metodos_pagamento.split(',').map((m) => m.trim())
      : [];
    setIdMetodoPagamento(metodos);
    setMetodosOriginais(metodos);

    setModalOpen(true);
  };

  // Excluir cartão logicamente
  const handleDelete = async (id) => {
    setSelectedCartao(id);
    setModalConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/cartoes/${selectedCartao}`);
      setModalMessage({ open: true, message: 'Cartão excluído com sucesso!' });
      setModalConfirm(false);
      const response = await api.get('/cartoes');
      setCartoes(response.data);
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      setModalMessage({ open: true, message: 'Erro ao excluir cartão.' });
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cartões</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-green-600"
        >
          +
        </button>
      </div>

      <ul className="bg-white shadow-md rounded-lg p-4 mb-6">
        {cartoes.map((cartao) => (
          <li key={cartao.id} className="flex justify-between items-center p-2 border-b last:border-none">
            <div>
              <p className="font-medium">{cartao.nome}</p>
              <p className="text-sm text-gray-500">
                Conta: {cartao.nome_conta} | Método(s): {cartao.metodos_pagamento || 'Nenhum'}
              </p>
              {cartao.limite && <p className="text-sm text-gray-500">Limite: R$ {cartao.limite}</p>}
            </div>
            <div>
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-blue-600"
                onClick={() => handleEdit(cartao)}
              >
                Editar
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                onClick={() => handleDelete(cartao.id)}
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
        title={idEdicao ? 'Editar Cartão' : 'Cadastrar Cartão'}
        onClose={resetForm}
        confirmText={idEdicao ? 'Atualizar' : 'Cadastrar'}
        onConfirm={handleSubmit}
      >
        <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Conta:</label>
          <select
            value={idConta}
            onChange={(e) => setIdConta(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value="">Selecione uma conta</option>
            {contas.map((conta) => (
              <option key={conta.id} value={conta.id}>
                {conta.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Método de Pagamento:</label>
          <select
            multiple
            value={idMetodoPagamento}
            onChange={(e) =>
              setIdMetodoPagamento(Array.from(e.target.selectedOptions, (option) => option.value))
            }
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            {metodos.map((metodo) => (
              <option key={metodo.id} value={metodo.id}>
                {metodo.nome}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Limite (opcional)"
          type="number"
          step="0.01"
          value={limite}
          onChange={(e) => setLimite(e.target.value)}
        />
      </Modal>

      {/* Modal de Confirmação */}
      <Modal
        isOpen={modalConfirm}
        title="Confirmação"
        onClose={() => setModalConfirm(false)}
        confirmText="Excluir"
        onConfirm={confirmDelete}
      >
        <p>Tem certeza que deseja excluir este cartão?</p>
      </Modal>

      {/* Modal de Mensagens */}
      <Modal
        isOpen={modalMessage.open}
        onConfirm={() => setModalMessage({ open: false, message: '' })}
      >
        <p>{modalMessage.message}</p>
      </Modal>
    </div>
  );
};

export default Cartoes;
