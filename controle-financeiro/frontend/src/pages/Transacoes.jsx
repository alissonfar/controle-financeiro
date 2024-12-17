import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Input from '../components/Input';
import Modal from '../components/Modal';

const Transacoes = () => {
  const [transacoes, setTransacoes] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [categoria, setCategoria] = useState('');
  const [status, setStatus] = useState('pendente');
  const [idEdicao, setIdEdicao] = useState(null);

  const [participantes, setParticipantes] = useState([]);
  const [participantesSelecionados, setParticipantesSelecionados] = useState([]);
  const [metodosPagamento, setMetodosPagamento] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfirm, setModalConfirm] = useState(false);
  const [selectedTransacao, setSelectedTransacao] = useState(null);
  const [modalMessage, setModalMessage] = useState({ open: false, message: '' });

  // Buscar transações, participantes e métodos de pagamento
  useEffect(() => {
    const fetchDados = async () => {
      try {
        const [transacoesResponse, participantesResponse, metodosResponse] = await Promise.all([
          api.get('/transacoes'),
          api.get('/participantes'),
          api.get('/metodos_pagamento'),
        ]);
        setTransacoes(transacoesResponse.data);
        setParticipantes(participantesResponse.data);
        setMetodosPagamento(metodosResponse.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setModalMessage({ open: true, message: 'Erro ao carregar os dados.' });
      }
    };

    fetchDados();
  }, []);

  // Resetar campos ao abrir o modal para nova transação
  const handleNewTransaction = () => {
    setDescricao('');
    setValor('');
    setData('');
    setMetodoPagamento('');
    setCategoria('');
    setStatus('pendente');
    setParticipantesSelecionados([]);
    setIdEdicao(null);
    setModalOpen(true);
  };

  // Adicionar ou Editar Transação
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!descricao || !valor || !data || participantesSelecionados.length === 0 || !metodoPagamento || !categoria) {
      setModalMessage({ open: true, message: 'Por favor, preencha todos os campos obrigatórios.' });
      return;
    }
  
    const transacao = {
      descricao,
      valor,
      data,
      metodo_pagamento: metodoPagamento,
      categoria,
      status,
      participantes: participantesSelecionados.map((p) => ({
        id: p.id,
        usa_conta: p.usa_conta || false,
      })),
    };
  
    console.log('Dados enviados para o backend:', transacao);
  
    try {
      if (idEdicao) {
        await api.put(`/transacoes/${idEdicao}`, transacao);
        setModalMessage({ open: true, message: 'Transação atualizada com sucesso!' });
      } else {
        await api.post('/transacoes', transacao);
        setModalMessage({ open: true, message: 'Transação criada com sucesso!' });
      }
  
      const response = await api.get('/transacoes');
      setTransacoes(response.data);
  
      setModalOpen(false);
      handleNewTransaction();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
  
      // Capturar erro específico retornado pelo backend
      let errorMessage = 'Erro ao salvar transação.';
  
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = 'Nenhuma conta ou cartão foi encontrado para os dados fornecidos.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erro interno do servidor. Por favor, tente novamente mais tarde.';
      }
  
      setModalMessage({
        open: true,
        message: errorMessage,
      });
    }
  };

  // Editar Transação
  const handleEdit = (transacao) => {
    console.log('Transação recebida:', transacao);

    setIdEdicao(transacao.id);
    setDescricao(transacao.descricao || '');
    setValor(transacao.valor || '');

    // Formatar data para yyyy-MM-dd
    const dataFormatada = transacao.data ? transacao.data.split('T')[0] : '';
    setData(dataFormatada);

    setMetodoPagamento(transacao.metodo_pagamento || '');
    setCategoria(transacao.categoria || '');
    setStatus(transacao.status || 'pendente');

    const participantesCorrigidos = Array.isArray(transacao.participantes) ? transacao.participantes : [];
    setParticipantesSelecionados(participantesCorrigidos);

    setModalOpen(true);
  };

  // Excluir Transação
  const handleDelete = async () => {
    try {
      await api.delete(`/transacoes/${selectedTransacao}`);
      setModalMessage({ open: true, message: 'Transação excluída com sucesso!' });
      setModalConfirm(false);

      const response = await api.get('/transacoes');
      setTransacoes(response.data);
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      setModalMessage({ open: true, message: 'Erro ao excluir transação.' });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Transações</h1>
        <button
          onClick={handleNewTransaction}
          className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-green-600"
        >
          +
        </button>
      </div>

      {/* Listar Transações */}
      <ul className="bg-white shadow-md rounded-lg p-4">
        {transacoes.map((transacao) => (
          <li key={transacao.id} className="flex justify-between items-center p-2 border-b last:border-none">
            <div>
              <p className="font-medium">{transacao.descricao}</p>
              <p className="text-sm text-gray-500">Valor: R$ {transacao.valor}</p>
              <p className="text-sm text-gray-500">
                Data: {transacao.data ? transacao.data.split('T')[0] : 'Data não disponível'}
              </p>
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
                onClick={() => {
                  setSelectedTransacao(transacao.id);
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
        title={idEdicao ? 'Editar Transação' : 'Cadastrar Transação'}
        onClose={() => setModalOpen(false)}
        confirmText={idEdicao ? 'Atualizar' : 'Cadastrar'}
        onConfirm={handleSubmit}
      >
        <Input label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
        <Input label="Valor" type="number" value={valor} onChange={(e) => setValor(e.target.value)} required />
        <Input label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Participantes:</label>
          {participantes.map((p) => (
            <div key={p.id} className="flex items-center">
              <input
                type="checkbox"
                value={p.id}
                checked={Array.isArray(participantesSelecionados) && participantesSelecionados.some((part) => part.id === p.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setParticipantesSelecionados([
                      ...participantesSelecionados,
                      { id: p.id, usa_conta: p.usa_conta },
                    ]);
                  } else {
                    setParticipantesSelecionados(
                      participantesSelecionados.filter((part) => part.id !== p.id)
                    );
                  }
                }}
              />
              <label className="ml-2">{p.nome}</label>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Método de Pagamento:</label>
          <select
            value={metodoPagamento}
            onChange={(e) => setMetodoPagamento(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Selecione um método</option>
            {metodosPagamento.map((metodo) => (
              <option key={metodo.id} value={metodo.id}>
                {metodo.nome}
              </option>
            ))}
          </select>
        </div>
        <Input label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} required />
      </Modal>

      {/* Modal de Confirmação */}
      <Modal
        isOpen={modalConfirm}
        title="Confirmação"
        onClose={() => setModalConfirm(false)}
        confirmText="Excluir"
        onConfirm={handleDelete}
      >
        <p>Tem certeza que deseja excluir esta transação?</p>
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

export default Transacoes;
