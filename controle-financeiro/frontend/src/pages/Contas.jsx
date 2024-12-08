import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Contas = () => {
  const [contas, setContas] = useState([]);
  const [nome, setNome] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [saldoAtual, setSaldoAtual] = useState('');
  const [metodosPagamento, setMetodosPagamento] = useState('');
  const [idEdicao, setIdEdicao] = useState(null);

  useEffect(() => {
    const fetchContas = async () => {
      try {
        const response = await api.get('/contas');
        setContas(response.data);
      } catch (error) {
        console.error('Erro ao buscar contas:', error);
      }
    };

    fetchContas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (idEdicao) {
        await api.put(`/contas/${idEdicao}`, {
          nome,
          saldo_atual: saldoAtual,
          metodos_pagamento: metodosPagamento,
        });
        alert('Conta atualizada com sucesso!');
      } else {
        await api.post('/contas', {
          nome,
          saldo_inicial: saldoInicial,
          saldo_atual: saldoAtual,
          metodos_pagamento: metodosPagamento,
        });
        alert('Conta criada com sucesso!');
      }
      setNome('');
      setSaldoInicial('');
      setSaldoAtual('');
      setMetodosPagamento('');
      setIdEdicao(null);
      const response = await api.get('/contas');
      setContas(response.data);
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      alert('Erro ao salvar conta.');
    }
  };

  const handleEdit = (conta) => {
    setIdEdicao(conta.id);
    setNome(conta.nome);
    setSaldoInicial(conta.saldo_inicial);
    setSaldoAtual(conta.saldo_atual);
    setMetodosPagamento(conta.metodos_pagamento);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await api.delete(`/contas/${id}`);
        alert('Conta excluída com sucesso!');
        const response = await api.get('/contas');
        setContas(response.data);
      } catch (error) {
        console.error('Erro ao excluir conta:', error);
        alert('Erro ao excluir conta.');
      }
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Lista de Contas</h1>
      <ul className="bg-white shadow-md rounded-lg p-4">
        {contas.map((conta) => (
          <li
            key={conta.id}
            className="flex justify-between items-center p-2 border-b last:border-none"
          >
            <div>
              <p className="font-medium">{conta.nome}</p>
              <p className="text-sm text-gray-500">Saldo Atual: R$ {conta.saldo_atual}</p>
              <p className="text-sm text-gray-500">Métodos: {conta.metodos_pagamento}</p>
            </div>
            <div>
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-blue-600"
                onClick={() => handleEdit(conta)}
              >
                Editar
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                onClick={() => handleDelete(conta.id)}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6">
        {idEdicao ? 'Editar Conta' : 'Adicionar Nova Conta'}
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
        {!idEdicao && (
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">Saldo Inicial:</label>
            <input
              type="number"
              step="0.01"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
              required
            />
          </div>
        )}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Saldo Atual:</label>
          <input
            type="number"
            step="0.01"
            value={saldoAtual}
            onChange={(e) => setSaldoAtual(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Métodos de Pagamento:</label>
          <input
            type="text"
            value={metodosPagamento}
            onChange={(e) => setMetodosPagamento(e.target.value)}
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

export default Contas;
