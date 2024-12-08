import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MetodosPagamento = () => {
  const [metodos, setMetodos] = useState([]);
  const [nome, setNome] = useState('');
  const [idEdicao, setIdEdicao] = useState(null);

  // Buscar métodos de pagamento ao carregar a página
  useEffect(() => {
    const fetchMetodos = async () => {
      try {
        const response = await api.get('/metodos_pagamento');
        setMetodos(response.data);
      } catch (error) {
        console.error('Erro ao buscar métodos de pagamento:', error);
        alert('Erro ao carregar métodos de pagamento.');
      }
    };

    fetchMetodos();
  }, []);

  // Adicionar ou editar método de pagamento
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome) {
      alert('Por favor, informe o nome do método de pagamento.');
      return;
    }

    try {
      if (idEdicao) {
        await api.put(`/metodos_pagamento/${idEdicao}`, { nome });
        alert('Método de pagamento atualizado com sucesso!');
      } else {
        await api.post('/metodos_pagamento', { nome });
        alert('Método de pagamento criado com sucesso!');
      }

      setNome('');
      setIdEdicao(null);

      // Atualizar lista de métodos
      const response = await api.get('/metodos_pagamento');
      setMetodos(response.data);
    } catch (error) {
      console.error('Erro ao salvar método de pagamento:', error);
      alert('Erro ao salvar método de pagamento.');
    }
  };

  // Excluir método de pagamento logicamente
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este método de pagamento?')) {
      try {
        await api.delete(`/metodos_pagamento/${id}`);
        alert('Método de pagamento excluído com sucesso!');
        const response = await api.get('/metodos_pagamento');
        setMetodos(response.data);
      } catch (error) {
        console.error('Erro ao excluir método de pagamento:', error);
        alert('Erro ao excluir método de pagamento.');
      }
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Métodos de Pagamento</h1>
      <ul className="bg-white shadow-md rounded-lg p-4 mb-6">
        {metodos.map((metodo) => (
          <li
            key={metodo.id}
            className="flex justify-between items-center p-2 border-b last:border-none"
          >
            <span>{metodo.nome}</span>
            <div>
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-blue-600"
                onClick={() => {
                  setNome(metodo.nome);
                  setIdEdicao(metodo.id);
                }}
              >
                Editar
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                onClick={() => handleDelete(metodo.id)}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mb-4">
        {idEdicao ? 'Editar Método de Pagamento' : 'Adicionar Método de Pagamento'}
      </h2>
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

export default MetodosPagamento;
