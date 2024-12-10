import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Contas = () => {
  const [contas, setContas] = useState([]);
  const [nome, setNome] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [saldoAtual, setSaldoAtual] = useState('');
  const [metodosDisponiveis, setMetodosDisponiveis] = useState([]);
  const [metodosSelecionados, setMetodosSelecionados] = useState([]);
  const [idEdicao, setIdEdicao] = useState(null);
  const [metodosOriginais, setMetodosOriginais] = useState([]);

  // Buscar dados iniciais
  useEffect(() => {
    const fetchDados = async () => {
      try {
        const contasResponse = await api.get('/contas');
        setContas(contasResponse.data);

        const metodosResponse = await api.get('/metodos_pagamento');
        setMetodosDisponiveis(metodosResponse.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        alert('Erro ao carregar contas ou métodos de pagamento.');
      }
    };

    fetchDados();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const conta = {
        nome,
        saldo_inicial: saldoInicial,
        saldo_atual: saldoAtual,
      };

      console.log('Dados enviados para criar/atualizar conta:', conta);
      console.log('Métodos selecionados antes do envio:', metodosSelecionados);

      let response;
      if (idEdicao) {
        response = await api.put(`/contas/${idEdicao}`, conta);
      } else {
        response = await api.post('/contas', conta);
      }

      const metodos = metodosSelecionados.length > 0 ? metodosSelecionados : metodosOriginais;
      console.log('Métodos de pagamento IDs enviados:', metodos);

      // Garantir que os métodos de pagamento sejam enviados corretamente
      if (metodos.length > 0) {
        await api.post('/contas/vincular-metodos', {
          id_conta: response.data.id || idEdicao,
          id_metodos_pagamento: metodos,
        });
      }

      alert('Conta salva com sucesso!');
      setNome('');
      setSaldoInicial('');
      setSaldoAtual('');
      setMetodosSelecionados([]);
      setMetodosOriginais([]);
      setIdEdicao(null);

      const contasResponse = await api.get('/contas');
      setContas(contasResponse.data);
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
  
    // Certifique-se de carregar os IDs dos métodos originais vinculados
    const metodosAtuais = conta.metodos_pagamento
      ? conta.metodos_pagamento.split(',').map((m) => {
          const metodoEncontrado = metodosDisponiveis.find(
            (metodo) => metodo.nome === m.trim()
          );
          return metodoEncontrado ? metodoEncontrado.id : null;
        }).filter((id) => id !== null) // Filtrar nulos para evitar problemas
      : [];
  
    setMetodosSelecionados(metodosAtuais);
    console.log('IDs dos métodos vinculados ao editar:', metodosAtuais);
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await api.delete(`/contas/${id}`);
        alert('Conta excluída com sucesso!');
        const contasResponse = await api.get('/contas');
        setContas(contasResponse.data);
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
              <p className="text-sm text-gray-500">Métodos: {conta.metodos_pagamento || 'Nenhum'}</p>
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
          <select
            multiple
            value={metodosSelecionados}
            onChange={(e) =>
              setMetodosSelecionados(Array.from(e.target.selectedOptions, (option) => option.value))
            }
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
          >
            {metodosDisponiveis.map((metodo) => (
              <option key={metodo.id} value={metodo.id}>
                {metodo.nome}
              </option>
            ))}
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

export default Contas;
