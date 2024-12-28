import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import Notification from '../components/Notification';
import Input from '../components/Input';
import ParticipantSelector from '../components/ParticipantSelector';
import { Plus, Trash2, Info, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';

const Pagamentos = () => {
  const [pagamentos, setPagamentos] = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [metodosPagamento, setMetodosPagamento] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [modalEstorno, setModalEstorno] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [modalNovoPagamento, setModalNovoPagamento] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState(null);
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 10, total: 0 });

  const [descricao, setDescricao] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [participantesSelecionados, setParticipantesSelecionados] = useState([]);

  // Estados para filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroParticipante, setFiltroParticipante] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroMetodoPagamento, setFiltroMetodoPagamento] = useState('');

  const fetchDados = async (page = 1) => {
    setLoading(true);
    try {
      const [pagamentosResponse, participantesResponse, metodosResponse] = await Promise.all([
        api.get(`/pagamentos?page=${page}`),
        api.get('/participantes'),
        api.get('/metodos_pagamento'),
      ]);

      setPagamentos(pagamentosResponse.data.data || []);
      setPagination({
        current_page: pagamentosResponse.data.current_page,
        per_page: pagamentosResponse.data.per_page,
        total: pagamentosResponse.data.total,
      });
      setParticipantes(participantesResponse.data);
      setMetodosPagamento(metodosResponse.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setNotification({
        tipo: 'erro',
        titulo: 'Erro ao Carregar Dados',
        mensagem: 'Não foi possível carregar os dados necessários.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchPagamentosComFiltros = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroDataInicio) params.append('start_date', filtroDataInicio);
      if (filtroDataFim) params.append('end_date', filtroDataFim);
      if (filtroParticipante) params.append('participante_destino_id', filtroParticipante);
      if (filtroStatus) params.append('status', filtroStatus);
      if (filtroMetodoPagamento) params.append('metodo_pagamento', filtroMetodoPagamento);

      const response = await api.get(`/pagamentos?${params.toString()}`);
      setPagamentos(response.data.data || []);
      setPagination({
        current_page: response.data.current_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      setNotification({
        tipo: 'erro',
        titulo: 'Erro ao Carregar Pagamentos',
        mensagem: 'Não foi possível carregar os pagamentos.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNovoPagamento = async () => {
    try {
      if (!descricao || !valorTotal || !metodoPagamento || participantesSelecionados.length === 0) {
        setNotification({
          tipo: 'validacao',
          titulo: 'Campos Obrigatórios',
          mensagem: 'Preencha todos os campos obrigatórios.',
        });
        return;
      }

      const novoPagamento = {
        descricao,
        valor_total: parseFloat(valorTotal.replace(',', '.')),
        metodo_pagamento: metodoPagamento,
        participantes: participantesSelecionados.map((p) => p.id),
      };

      await api.post('/pagamentos', novoPagamento);

      setNotification({
        tipo: 'sucesso',
        titulo: 'Pagamento Criado',
        mensagem: 'O pagamento foi criado com sucesso!',
      });

      setModalNovoPagamento(false);
      fetchDados(pagination.current_page);
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      setNotification({
        tipo: 'erro',
        titulo: 'Erro ao Criar Pagamento',
        mensagem: 'Não foi possível criar o pagamento.',
      });
    }
  };

  const handleEstorno = async () => {
    try {
      await api.post(`/pagamentos/${selectedPagamento}/estornar`, {
        motivo_estorno: 'Ajuste solicitado pelo usuário.',
      });
      setNotification({
        tipo: 'sucesso',
        titulo: 'Estorno Realizado',
        mensagem: 'O pagamento foi estornado com sucesso.',
      });
      setModalEstorno(false);
      fetchDados(pagination.current_page);
    } catch (error) {
      console.error('Erro ao estornar pagamento:', error);
      setNotification({
        tipo: 'erro',
        titulo: 'Erro ao Estornar',
        mensagem: 'Não foi possível estornar o pagamento.',
      });
    }
  };

  const handlePageChange = (newPage) => {
    fetchDados(newPage);
  };

  const openDetalhesModal = (pagamento) => {
    setSelectedPagamento(pagamento);
    setModalDetalhes(true);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'ATIVO':
        return { color: 'bg-green-100 text-green-800', text: 'Ativo' };
      case 'ESTORNADO':
        return { color: 'bg-red-100 text-red-800', text: 'Estornado' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: status };
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Pagamentos</h1>
        <button
          onClick={() => setModalNovoPagamento(true)}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Novo Pagamento</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <Input
          label="Data Início"
          type="date"
          value={filtroDataInicio}
          onChange={(e) => setFiltroDataInicio(e.target.value)}
        />
        <Input
          label="Data Fim"
          type="date"
          value={filtroDataFim}
          onChange={(e) => setFiltroDataFim(e.target.value)}
        />
        <div>
          <label className="block text-gray-700 font-medium mb-1">Participante:</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={filtroParticipante}
            onChange={(e) => setFiltroParticipante(e.target.value)}
          >
            <option value="">Todos</option>
            {participantes.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Status:</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="ATIVO">Ativo</option>
            <option value="ESTORNADO">Estornado</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Método de Pagamento:</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={filtroMetodoPagamento}
            onChange={(e) => setFiltroMetodoPagamento(e.target.value)}
          >
            <option value="">Todos</option>
            {metodosPagamento.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchPagamentosComFiltros}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Aplicar Filtros
        </button>
      </div>

      <div className="flex justify-between mb-4">
        <button
          onClick={() => handlePageChange(pagination.current_page - 1)}
          disabled={pagination.current_page === 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          <ChevronLeft /> Anterior
        </button>
        <button
          onClick={() => handlePageChange(pagination.current_page + 1)}
          disabled={pagination.current_page === Math.ceil(pagination.total / pagination.per_page)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Próximo <ChevronRight />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      ) : (
        <ul className="bg-white shadow-md rounded-lg p-4 space-y-4">
          {pagamentos.map((pagamento) => {
            const statusConfig = getStatusConfig(pagamento.status);
            return (
              <li key={pagamento.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{pagamento.descricao}</h3>
                    <p className="text-sm text-gray-600">R$ {parseFloat(pagamento.valor_total).toFixed(2)}</p>
                    <span className={`text-sm px-2 py-1 rounded ${statusConfig.color}`}>{statusConfig.text}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openDetalhesModal(pagamento)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Detalhes
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPagamento(pagamento.id);
                        setModalEstorno(true);
                      }}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Estornar
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        isOpen={modalNovoPagamento}
        title="Novo Pagamento"
        onClose={() => setModalNovoPagamento(false)}
        confirmText="Criar"
        onConfirm={handleNovoPagamento}
      >
        <Input
          label="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />
        <Input
          label="Valor Total"
          type="text"
          value={valorTotal}
          onChange={(e) => {
            const value = e.target.value.replace(/[^\d,]/g, '');
            if (value === '' || /^\d*[,]?\d{0,2}$/.test(value)) {
              setValorTotal(value);
            }
          }}
          required
        />

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Participantes:</label>
          <ParticipantSelector
            participantes={participantes}
            selecionados={participantesSelecionados}
            onChange={setParticipantesSelecionados}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Método de Pagamento:</label>
          <select
            value={metodoPagamento}
            onChange={(e) => setMetodoPagamento(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-700"
            required
          >
            <option value="">Selecione um método</option>
            {metodosPagamento.map((metodo) => (
              <option key={metodo.id} value={metodo.id}>{metodo.nome}</option>
            ))}
          </select>
        </div>
      </Modal>

      <Modal
        isOpen={modalDetalhes}
        title="Detalhes do Pagamento"
        onClose={() => setModalDetalhes(false)}
      >
        {selectedPagamento && (
          <div className="space-y-2">
            <p><strong>Descrição:</strong> {selectedPagamento.descricao}</p>
            <p><strong>Valor Total:</strong> R$ {parseFloat(selectedPagamento.valor_total).toFixed(2)}</p>
            <p><strong>Status:</strong> {selectedPagamento.status}</p>
            <p><strong>Método de Pagamento:</strong> {selectedPagamento.metodo_pagamento || 'Não informado'}</p>
            <p><strong>Participante de Destino:</strong> {selectedPagamento.participante_destino_id || 'Não informado'}</p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modalEstorno}
        title="Confirmação de Estorno"
        onClose={() => setModalEstorno(false)}
        confirmText="Estornar"
        onConfirm={handleEstorno}
      >
        <p className="text-gray-700">Tem certeza que deseja estornar este pagamento?</p>
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

export default Pagamentos;
