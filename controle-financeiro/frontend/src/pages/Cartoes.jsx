import React, { useState, useEffect } from 'react';
import api from '../services/api';

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
        alert('Erro ao carregar cartões, contas ou métodos de pagamento.');
      }
    };

    fetchDados();
  }, []);

  // Adicionar ou editar cartão
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome || !idConta || idMetodoPagamento.length === 0) {
      alert('Por favor, preencha todos os campos obrigatórios.');
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
      limite: limite === '' ? null : limite, // Transformar valor vazio em null
    };

    console.log('Dados enviados para criar/atualizar cartão:', cartao);

    try {
      if (idEdicao) {
        await api.put(`/cartoes/${idEdicao}`, cartao);
        alert('Cartão atualizado com sucesso!');
      } else {
        await api.post('/cartoes', cartao);
        alert('Cartão criado com sucesso!');
      }

      setNome('');
      setIdConta('');
      setIdMetodoPagamento([]);
      setLimite('');
      setIdEdicao(null);
      setMetodosOriginais([]);

      const response = await api.get('/cartoes');
      setCartoes(response.data);
      console.log('Cartões atualizados após criação/edição:', response.data);
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      alert('Erro ao salvar cartão.');
    }
  };

  // Carregar informações ao editar um cartão
  const handleEdit = (cartao) => {
    setIdEdicao(cartao.id);
    setNome(cartao.nome);
    setIdConta(cartao.id_conta);
    setLimite(cartao.limite || '');

    // Carregar métodos originais
    const metodos = cartao.metodos_pagamento
      ? cartao.metodos_pagamento.split(',').map((m) => m.trim())
      : [];
    setIdMetodoPagamento(metodos);
    setMetodosOriginais(metodos);
    console.log('Métodos vinculados ao editar:', metodos);
  };

  // Excluir cartão logicamente
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cartão?')) {
      try {
        await api.delete(`/cartoes/${id}`);
        alert('Cartão excluído com sucesso!');
        const response = await api.get('/cartoes');
        setCartoes(response.data);
      } catch (error) {
        console.error('Erro ao excluir cartão:', error);
        alert('Erro ao excluir cartão.');
      }
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Cartões</h1>
      <ul className="bg-white shadow-md rounded-lg p-4 mb-6">
        {cartoes.map((cartao) => (
          <li
            key={cartao.id}
            className="flex justify-between items-center p-2 border-b last:border-none"
          >
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

      <h2 className="text-xl font-semibold mb-4">{idEdicao ? 'Editar Cartão' : 'Adicionar Cartão'}</h2>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-4">
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
          <label className="block text-gray-700 font-medium">Conta:</label>
          <select
            value={idConta}
            onChange={(e) => setIdConta(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
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
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            required
          >
            {metodos.map((metodo) => (
              <option key={metodo.id} value={metodo.id}>
                {metodo.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Limite (opcional):</label>
          <input
            type="number"
            step="0.01"
            value={limite}
            onChange={(e) => setLimite(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
          />
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

export default Cartoes;
