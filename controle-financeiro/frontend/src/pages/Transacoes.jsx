import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Notification from '../components/Notification';
import { processarErroAPI } from '../utils/errorHandler';

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
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const descricaoInputRef = useRef(null);

  // Buscar transações, participantes e métodos de pagamento
  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
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
        const errorInfo = processarErroAPI(error);
        setNotification(errorInfo);
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, []);

  const resetForm = () => {
    const dataAtual = new Date().toISOString().split('T')[0];
    
    setDescricao('');
    setValor('');
    setData(dataAtual);
    setMetodoPagamento('');
    setCategoria('');
    setStatus('pendente');
    setParticipantesSelecionados([]);
    setIdEdicao(null);

    // Foca no campo de descrição
    setTimeout(() => {
      descricaoInputRef.current?.focus();
    }, 100);
  };

  // Resetar campos ao abrir o modal para nova transação
  const handleNewTransaction = () => {
    const dataAtual = new Date().toISOString().split('T')[0];
    
    setDescricao('');
    setValor('');
    setData(dataAtual);
    setMetodoPagamento('');
    setCategoria('');
    setStatus('pendente');
    setParticipantesSelecionados([]);
    setIdEdicao(null);
    setModalOpen(true);

    setTimeout(() => {
      descricaoInputRef.current?.focus();
    }, 100);
  };

  // Adicionar ou Editar Transação
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!descricao || !valor || !data || participantesSelecionados.length === 0 || !metodoPagamento || !categoria) {
      setNotification({
        tipo: 'validacao',
        titulo: 'Campos Obrigatórios',
        mensagem: 'Por favor, preencha todos os campos obrigatórios.'
      });
      return;
    }

    const transacao = {
      descricao,
      valor: parseFloat(valor.replace(',', '.')),
      data,
      metodo_pagamento: metodoPagamento,
      categoria,
      status,
      participantes: participantesSelecionados.map((p) => ({
        id: p.id,
        usa_conta: p.usa_conta || false,
      })),
    };

    try {
      if (idEdicao) {
        await api.put(`/transacoes/${idEdicao}`, transacao);
        setNotification({
          tipo: 'sucesso',
          titulo: 'Sucesso',
          mensagem: 'Transação atualizada com sucesso!'
        });
        setModalOpen(false);
      } else {
        await api.post('/transacoes', transacao);
        setNotification({
          tipo: 'sucesso',
          titulo: 'Sucesso',
          mensagem: 'Transação criada com sucesso!'
        });
        resetForm();
      }

      const response = await api.get('/transacoes');
      setTransacoes(response.data);
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      const errorInfo = processarErroAPI(error);
      setNotification(errorInfo);
    }
  };

  // Editar Transação
  const handleEdit = (transacao) => {
    setIdEdicao(transacao.id);
    setDescricao(transacao.descricao || '');
    setValor(transacao.valor?.toString() || '');
    setData(transacao.data ? transacao.data.split('T')[0] : '');
    setMetodoPagamento(transacao.metodo_pagamento || '');
    setCategoria(transacao.categoria || '');
    setStatus(transacao.status || 'pendente');

    const participantesCorrigidos = Array.isArray(transacao.participantes) 
      ? transacao.participantes.map(p => ({
          id: p.id,
          usa_conta: p.usa_conta || false
        })) 
      : [];
    setParticipantesSelecionados(participantesCorrigidos);
    setModalOpen(true);

    setTimeout(() => {
      descricaoInputRef.current?.focus();
    }, 100);
  };

  // Excluir Transação
  const handleDelete = async () => {
    try {
      await api.delete(`/transacoes/${selectedTransacao}`);
      setNotification({
        tipo: 'sucesso',
        titulo: 'Sucesso',
        mensagem: 'Transação excluída com sucesso!'
      });
      setModalConfirm(false);

      const response = await api.get('/transacoes');
      setTransacoes(response.data);
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      const errorInfo = processarErroAPI(error);
      setNotification(errorInfo);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Transações</h1>
        <button
          onClick={handleNewTransaction}
          className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-green-600 transition-colors"
          title="Adicionar nova transação"
        >
          +
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      ) : (
        <ul className="bg-white shadow-md rounded-lg p-4 space-y-4">
          {transacoes.length === 0 ? (
            <li className="text-center text-gray-500 py-4">
              Nenhuma transação encontrada
            </li>
          ) : (
            transacoes.map((transacao) => (
              <li 
                key={transacao.id} 
                className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium">{transacao.descricao}</p>
                  <p className="text-sm text-gray-500">
                    Valor: R$ {Number(transacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-500">
                    Data: {transacao.data ? transacao.data.split('T')[0] : 'Data não disponível'}
                  </p>
                  <p className="text-sm text-gray-500">Categoria: {transacao.categoria}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(transacao)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTransacao(transacao.id);
                      setModalConfirm(true);
                    }}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      <Modal
        isOpen={modalOpen}
        title={idEdicao ? 'Editar Transação' : 'Cadastrar Transação'}
        onClose={() => setModalOpen(false)}
        confirmText={idEdicao ? 'Atualizar' : 'Cadastrar'}
        onConfirm={handleSubmit}
      >
        <Input 
          ref={descricaoInputRef}
          label="Descrição" 
          value={descricao} 
          onChange={(e) => setDescricao(e.target.value)} 
          required 
        />
        <Input 
          label="Valor" 
          type="text"
          value={valor} 
          onChange={(e) => {
            const value = e.target.value.replace(/[^\d,]/g, '');
            if (value === '' || /^\d*[,]?\d{0,2}$/.test(value)) {
              setValor(value);
            }
          }}
          placeholder="0,00"
          required 
        />
        <Input 
          label="Data" 
          type="date" 
          value={data} 
          onChange={(e) => setData(e.target.value)} 
          required 
        />
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Participantes:</label>
          {participantes.map((p) => (
            <div key={p.id} className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={participantesSelecionados.some((part) => part.id === p.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setParticipantesSelecionados([
                      ...participantesSelecionados,
                      { id: p.id, usa_conta: p.usa_conta || false },
                    ]);
                  } else {
                    setParticipantesSelecionados(
                      participantesSelecionados.filter((part) => part.id !== p.id)
                    );
                  }
                }}
                className="rounded border-gray-300"
              />
              <label className="ml-2">{p.nome}</label>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Método de Pagamento:
          </label>
          <select
            value={metodoPagamento}
            onChange={(e) => setMetodoPagamento(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-700"
            required
          >
            <option value="">Selecione um método</option>
            {metodosPagamento.map((metodo) => (
              <option key={metodo.id} value={metodo.id}>
                {metodo.nome}
              </option>
            ))}
          </select>
        </div>
        <Input 
          label="Categoria" 
          value={categoria} 
          onChange={(e) => setCategoria(e.target.value)} 
          required 
        />
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Status:
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-700"
          >
            <option value="pendente">Pendente</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </Modal>

      <Modal
        isOpen={modalConfirm}
        title="Confirmação de Exclusão"
        onClose={() => setModalConfirm(false)}
        confirmText="Excluir"
        onConfirm={handleDelete}
      >
        <p className="text-gray-700">
          Tem certeza que deseja excluir esta transação? Esta ação não poderá ser desfeita.
        </p>
      </Modal>

      {notification && (
        <Notification
          tipo={notification.tipo}
          titulo={notification.titulo}
          mensagem={notification.mensagem}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Transacoes;