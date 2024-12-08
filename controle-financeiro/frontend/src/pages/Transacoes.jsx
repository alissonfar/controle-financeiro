import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Transacoes = () => {
  const [transacoes, setTransacoes] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [idParticipante, setIdParticipante] = useState('');
  const [idConta, setIdConta] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [categoria, setCategoria] = useState('');
  const [status, setStatus] = useState('pendente');
  const [idEdicao, setIdEdicao] = useState(null);

  const [participantes, setParticipantes] = useState([]);
  const [contas, setContas] = useState([]);
  const [metodosPagamento, setMetodosPagamento] = useState([]);

  // Buscar transações, participantes, contas e métodos de pagamento
  useEffect(() => {
    const fetchDados = async () => {
      try {
        const transacoesResponse = await api.get('/transacoes');
        setTransacoes(transacoesResponse.data);

        const participantesResponse = await api.get('/participantes');
        setParticipantes(participantesResponse.data);

        const contasResponse = await api.get('/contas');
        setContas(contasResponse.data);

        const metodosResponse = await api.get('/metodos_pagamento');
        setMetodosPagamento(metodosResponse.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        alert('Erro ao carregar transações, participantes, contas ou métodos de pagamento.');
      }
    };

    fetchDados();
  }, []);

  // Adicionar ou Editar Transação
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!descricao || !valor || !data || !idParticipante || !idConta || !metodoPagamento || !categoria) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const transacao = {
      descricao,
      valor,
      data,
      id_participante: idParticipante,
      id_conta: idConta,
      metodo_pagamento: metodoPagamento,
      categoria,
      status,
    };

    try {
      if (idEdicao) {
        await api.put(`/transacoes/${idEdicao}`, transacao);
        alert('Transação atualizada com sucesso!');
      } else {
        await api.post('/transacoes', transacao);
        alert('Transação criada com sucesso!');
      }

      // Limpar os campos do formulário
      setDescricao('');
      setValor('');
      setData('');
      setIdParticipante('');
      setIdConta('');
      setMetodoPagamento('');
      setCategoria('');
      setStatus('pendente');
      setIdEdicao(null);

      // Atualizar lista de transações
      const response = await api.get('/transacoes');
      setTransacoes(response.data);
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      alert('Erro ao salvar transação.');
    }
  };

  // Preencher o formulário para edição
  const handleEdit = (transacao) => {
    setIdEdicao(transacao.id);
    setDescricao(transacao.descricao);
    setValor(transacao.valor);
    setData(transacao.data);
    setIdParticipante(transacao.id_participante);
    setIdConta(transacao.id_conta);
    setMetodoPagamento(transacao.metodo_pagamento);
    setCategoria(transacao.categoria);
    setStatus(transacao.status);
  };

  // Excluir transação logicamente
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await api.delete(`/transacoes/${id}`);
        alert('Transação excluída com sucesso!');
        const response = await api.get('/transacoes');
        setTransacoes(response.data);
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
        alert('Erro ao excluir transação.');
      }
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Lista de Transações</h1>
      <ul className="bg-white shadow-md rounded-lg p-4 mb-6">
        {transacoes.map((transacao) => (
          <li
            key={transacao.id}
            className="flex justify-between items-center p-2 border-b last:border-none"
          >
            <div>
              <p className="font-medium">{transacao.descricao}</p>
              <p className="text-sm text-gray-500">Valor: R$ {transacao.valor}</p>
              <p className="text-sm text-gray-500">Data: {transacao.data}</p>
              <p className="text-sm text-gray-500">Categoria: {transacao.categoria}</p>
            </div>
            <div>
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-blue-600"
                onClick={() => handleEdit(transacao)}
              >
                Editar
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                onClick={() => handleDelete(transacao.id)}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold">Adicionar ou Editar Transação</h2>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-4 mt-4">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Descrição:</label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Valor:</label>
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Data:</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Participante:</label>
          <select
            value={idParticipante}
            onChange={(e) => setIdParticipante(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            required
          >
            <option value="">Selecione um participante</option>
            {participantes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
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
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Método de Pagamento:</label>
          <select
            value={metodoPagamento}
            onChange={(e) => setMetodoPagamento(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            required
          >
            <option value="">Selecione um método de pagamento</option>
            {metodosPagamento.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Categoria:</label>
          <input
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            required
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

export default Transacoes;
