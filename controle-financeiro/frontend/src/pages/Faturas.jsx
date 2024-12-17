import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Input from '../components/Input';
import Modal from '../components/Modal';

const Faturas = () => {
  const [faturas, setFaturas] = useState([]);
  const [cartoes, setCartoes] = useState([]); // Estado para armazenar os cartões
  const [idCartao, setIdCartao] = useState('');
  const [dataFechamento, setDataFechamento] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [status, setStatus] = useState('aberta');
  const [justificativa, setJustificativa] = useState('');
  const [idEdicao, setIdEdicao] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfirm, setModalConfirm] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState(null);
  const [modalMessage, setModalMessage] = useState({ open: false, message: '' });

  // Buscar faturas e cartões ao carregar a página
  useEffect(() => {
    const fetchFaturasECartoes = async () => {
      try {
        const [faturasResponse, cartoesResponse] = await Promise.all([
          api.get('/faturas'),
          api.get('/cartoes'),
        ]);
        setFaturas(faturasResponse.data);
        setCartoes(cartoesResponse.data);
      } catch (error) {
        console.error('Erro ao buscar faturas ou cartões:', error);
        setModalMessage({ open: true, message: 'Erro ao carregar faturas ou cartões.' });
      }
    };

    fetchFaturasECartoes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id_cartao: idCartao,
        data_fechamento: dataFechamento,
        data_vencimento: dataVencimento,
        valor_total: valorTotal,
        status,
        justificativa,
      };

      if (idEdicao) {
        await api.put(`/faturas/${idEdicao}`, payload);
        setModalMessage({ open: true, message: 'Fatura atualizada com sucesso!' });
      } else {
        await api.post('/faturas', payload);
        setModalMessage({ open: true, message: 'Fatura criada com sucesso!' });
      }

      resetForm();
      const response = await api.get('/faturas');
      setFaturas(response.data);
    } catch (error) {
      console.error('Erro ao salvar fatura:', error);
      setModalMessage({ open: true, message: 'Erro ao salvar fatura.' });
    }
  };

  const resetForm = () => {
    setIdCartao('');
    setDataFechamento('');
    setDataVencimento('');
    setValorTotal('');
    setStatus('aberta');
    setJustificativa('');
    setIdEdicao(null);
    setModalOpen(false);
  };

  const handleEdit = (fatura) => {
    setIdEdicao(fatura.id);
    setIdCartao(fatura.id_cartao);
    setDataFechamento(fatura.data_fechamento);
    setDataVencimento(fatura.data_vencimento);
    setValorTotal(fatura.valor_total);
    setStatus(fatura.status);
    setJustificativa(fatura.justificativa || '');
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/faturas/${selectedFatura}`);
      setModalMessage({ open: true, message: 'Fatura excluída com sucesso!' });
      setModalConfirm(false);

      const response = await api.get('/faturas');
      setFaturas(response.data);
    } catch (error) {
      console.error('Erro ao excluir fatura:', error);
      setModalMessage({ open: true, message: 'Erro ao excluir fatura.' });
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Faturas</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-green-600"
        >
          +
        </button>
      </div>

      {/* Lista de Faturas */}
      <ul className="bg-white shadow-md rounded-lg p-4">
        {faturas.map((fatura) => (
          <li key={fatura.id} className="flex justify-between items-center p-2 border-b last:border-none">
            <div>
              <p className="font-medium">Cartão: {fatura.id_cartao}</p>
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
                onClick={() => {
                  setSelectedFatura(fatura.id);
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
        title={idEdicao ? 'Editar Fatura' : 'Cadastrar Fatura'}
        onClose={resetForm}
        confirmText={idEdicao ? 'Atualizar' : 'Cadastrar'}
        onConfirm={handleSubmit}
      >
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Cartão:</label>
          <select
            value={idCartao}
            onChange={(e) => setIdCartao(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value="">Selecione um cartão</option>
            {cartoes.map((cartao) => (
              <option key={cartao.id} value={cartao.id}>
                {cartao.nome} - Limite: R$ {cartao.limite || 'N/A'}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Data de Fechamento"
          type="date"
          value={dataFechamento}
          onChange={(e) => setDataFechamento(e.target.value)}
          required
        />
        <Input
          label="Data de Vencimento"
          type="date"
          value={dataVencimento}
          onChange={(e) => setDataVencimento(e.target.value)}
          required
        />
        <Input
          label="Valor Total"
          type="number"
          step="0.01"
          value={valorTotal}
          onChange={(e) => setValorTotal(e.target.value)}
          required
        />
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="aberta">Aberta</option>
            <option value="fechada">Fechada</option>
            <option value="paga">Paga</option>
          </select>
        </div>
        <Input
          label="Justificativa"
          type="text"
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
        />
      </Modal>

      {/* Modal de Confirmação */}
      <Modal
        isOpen={modalConfirm}
        title="Confirmação"
        onClose={() => setModalConfirm(false)}
        confirmText="Excluir"
        onConfirm={handleDelete}
      >
        <p>Tem certeza que deseja excluir esta fatura?</p>
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

export default Faturas;
