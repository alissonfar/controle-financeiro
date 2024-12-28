import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import Notification from '../components/Notification';
import Input from '../components/Input';
import { Plus, Trash2, Info } from 'lucide-react';

const Pagamentos = () => {
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [modalEstorno, setModalEstorno] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [modalNovoPagamento, setModalNovoPagamento] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState(null);

  const [descricao, setDescricao] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [participanteDestino, setParticipanteDestino] = useState('');

  // Função para carregar pagamentos
  const fetchPagamentos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/pagamentos');
      setPagamentos(response.data.data || []);
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

  useEffect(() => {
    fetchPagamentos();
  }, []);

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
      fetchPagamentos(); // Atualiza a lista após o estorno
    } catch (error) {
      console.error('Erro ao estornar pagamento:', error);
      setNotification({
        tipo: 'erro',
        titulo: 'Erro ao Estornar',
        mensagem: 'Não foi possível estornar o pagamento.',
      });
    }
  };

  const handleNovoPagamento = async () => {
    try {
      if (!descricao || !valorTotal || !metodoPagamento || !participanteDestino) {
        setNotification({
          tipo: 'validacao',
          titulo: 'Campos Obrigatórios',
          mensagem: 'Preencha todos os campos obrigatórios.',
        });
        return;
      }

      await api.post('/pagamentos', {
        descricao,
        valor_total: parseFloat(valorTotal.replace(',', '.')),
        metodo_pagamento: metodoPagamento,
        participante_destino_id: parseInt(participanteDestino),
      });

      setNotification({
        tipo: 'sucesso',
        titulo: 'Pagamento Criado',
        mensagem: 'O pagamento foi criado com sucesso!',
      });

      setModalNovoPagamento(false);
      fetchPagamentos(); // Atualiza a lista após a criação do pagamento
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      setNotification({
        tipo: 'erro',
        titulo: 'Erro ao Criar Pagamento',
        mensagem: 'Não foi possível criar o pagamento.',
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Pagamentos</h1>
        <button
          onClick={() => setModalNovoPagamento(true)}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg
                     hover:from-green-600 hover:to-green-700 transition-all duration-300 
                     shadow-lg hover:shadow-xl transform hover:-translate-y-1
                     flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Novo Pagamento</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      ) : (
        <ul className="bg-white shadow-md rounded-lg p-4 space-y-4">
          {pagamentos.length === 0 ? (
            <li className="text-center text-gray-500 py-4">Nenhum pagamento encontrado</li>
          ) : (
            pagamentos.map((pagamento) => (
              <li key={pagamento.id} className="border rounded-lg hover:bg-gray-50 transition-colors overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{pagamento.descricao}</h3>
                      <div className="text-gray-600">
                        <span className="font-medium text-lg">
                          R$ {Number(pagamento.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedPagamento(pagamento.id);
                          setModalDetalhes(true);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                      >
                        <Info className="w-4 h-4" />
                        Detalhes
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPagamento(pagamento.id);
                          setModalEstorno(true);
                        }}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Estornar
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {/* Modal para Novo Pagamento */}
      <Modal
        isOpen={modalNovoPagamento}
        title="Novo Pagamento"
        onClose={() => setModalNovoPagamento(false)}
        confirmText="Criar"
        onConfirm={handleNovoPagamento}
      >
        <Input label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
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
        <Input label="Método de Pagamento" value={metodoPagamento} onChange={(e) => setMetodoPagamento(e.target.value)} required />
        <Input
          label="Participante de Destino (ID)"
          value={participanteDestino}
          onChange={(e) => setParticipanteDestino(e.target.value)}
          required
        />
      </Modal>

      {/* Modal para Detalhes */}
      <Modal
        isOpen={modalDetalhes}
        title="Detalhes do Pagamento"
        onClose={() => setModalDetalhes(false)}
      >
        {/* Exibir informações detalhadas aqui */}
        <p className="text-gray-700">Exibir detalhes do pagamento com ID {selectedPagamento}.</p>
      </Modal>

      {/* Modal para Estorno */}
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
