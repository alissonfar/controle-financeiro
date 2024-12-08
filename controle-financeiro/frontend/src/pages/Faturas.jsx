import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Faturas = () => {
  const [faturas, setFaturas] = useState([]);
  const [idCartao, setIdCartao] = useState('');
  const [dataFechamento, setDataFechamento] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [status, setStatus] = useState('aberta');
  const [justificativa, setJustificativa] = useState('');
  const [idEdicao, setIdEdicao] = useState(null);

  useEffect(() => {
    const fetchFaturas = async () => {
      try {
        const response = await api.get('/faturas');
        setFaturas(response.data);
      } catch (error) {
        console.error('Erro ao buscar faturas:', error);
      }
    };

    fetchFaturas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (idEdicao) {
        await api.put(`/faturas/${idEdicao}`, {
          id_cartao: idCartao,
          data_fechamento: dataFechamento,
          data_vencimento: dataVencimento,
          valor_total: valorTotal,
          status,
          justificativa,
        });
        alert('Fatura atualizada com sucesso!');
      } else {
        await api.post('/faturas', {
          id_cartao: idCartao,
          data_fechamento: dataFechamento,
          data_vencimento: dataVencimento,
          valor_total: valorTotal,
          status,
          justificativa,
        });
        alert('Fatura criada com sucesso!');
      }
      setIdCartao('');
      setDataFechamento('');
      setDataVencimento('');
      setValorTotal('');
      setStatus('aberta');
      setJustificativa('');
      setIdEdicao(null);
      const response = await api.get('/faturas');
      setFaturas(response.data);
    } catch (error) {
      console.error('Erro ao salvar fatura:', error);
      alert('Erro ao salvar fatura.');
    }
  };

  const handleEdit = (fatura) => {
    setIdEdicao(fatura.id);
    setIdCartao(fatura.id_cartao);
    setDataFechamento(fatura.data_fechamento);
    setDataVencimento(fatura.data_vencimento);
    setValorTotal(fatura.valor_total);
    setStatus(fatura.status);
    setJustificativa(fatura.justificativa || '');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta fatura?')) {
      try {
        await api.delete(`/faturas/${id}`);
        alert('Fatura excluída com sucesso!');
        const response = await api.get('/faturas');
        setFaturas(response.data);
      } catch (error) {
        console.error('Erro ao excluir fatura:', error);
        alert('Erro ao excluir fatura.');
      }
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Lista de Faturas</h1>
      <ul className="bg-white shadow-md rounded-lg p-4">
        {faturas.map((fatura) => (
          <li
            key={fatura.id}
            className="flex justify-between items-center p-2 border-b last:border-none"
          >
            <div>
              <p className="font-medium">ID Cartão: {fatura.id_cartao}</p>
              <p className="text-sm text-gray-500">Fechamento: {fatura.data_fechamento}</p>
              <p className="text-sm text-gray-500">Vencimento: {fatura.data_vencimento}</p>
              <p className="text-sm text-gray-500">Valor Total: R$ {fatura.valor_total}</p>
              <p className="text-sm text-gray-500">Status: {fatura.status}</p>
            </div>
            <div>
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-blue-600"
                onClick={() => handleEdit(fatura)}
              >
                Editar
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                onClick={() => handleDelete(fatura.id)}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6">
        {idEdicao ? 'Editar Fatura' : 'Adicionar Nova Fatura'}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-4 mt-4"
      >
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">ID Cartão:</label>
          <input
            type="text"
            value={idCartao}
            onChange={(e) => setIdCartao(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Data de Fechamento:</label>
          <input
            type="date"
            value={dataFechamento}
            onChange={(e) => setDataFechamento(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Data de Vencimento:</label>
          <input
            type="date"
            value={dataVencimento}
            onChange={(e) => setDataVencimento(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Valor Total:</label>
          <input
            type="number"
            step="0.01"
            value={valorTotal}
            onChange={(e) => setValorTotal(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
          >
            <option value="aberta">Aberta</option>
            <option value="fechada">Fechada</option>
            <option value="paga">Paga</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Justificativa:</label>
          <textarea
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
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

export default Faturas;
