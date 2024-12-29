import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Notification from '../components/Notification';
import { processarErroAPI } from '../utils/errorHandler';
import ParticipantSelector from '../components/ParticipantSelector';
import { 
  Calendar, 
  Tag, 
  Users, 
  CreditCard, 
  AlertCircle, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Eye,
  EyeOff
} from 'lucide-react';

const Transacoes = () => {
  const [transacoes, setTransacoes] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [categoria, setCategoria] = useState('');
  const [participantes, setParticipantes] = useState([]);
  const [participantesSelecionados, setParticipantesSelecionados] = useState([]);
  const [valoresIndividuais, setValoresIndividuais] = useState({});
  const [modoDistribuicao, setModoDistribuicao] = useState('igual');
  const [metodosPagamento, setMetodosPagamento] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfirm, setModalConfirm] = useState(false);
  const [modalEstornoOpen, setModalEstornoOpen] = useState(false);
  const [selectedTransacao, setSelectedTransacao] = useState(null);
  const [motivoEstorno, setMotivoEstorno] = useState('');
  const [idUsuarioEstorno, setIdUsuarioEstorno] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showTransactionsList, setShowTransactionsList] = useState(true);
  const [expandedTransactions, setExpandedTransactions] = useState({});

  const descricaoInputRef = useRef(null);

  const toggleTransactionsList = () => {
    setShowTransactionsList(prev => !prev);
  };

  const toggleTransaction = (id, event) => {
    event.stopPropagation();
    setExpandedTransactions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSubmit = async () => {
    if (!descricao || !valor || !data || !metodoPagamento || !categoria || participantesSelecionados.length === 0) {
      setNotification({
        tipo: 'erro',
        titulo: 'Campos Obrigatórios',
        mensagem: 'Por favor, preencha todos os campos antes de cadastrar.'
      });
      return;
    }
  
    try {
      const participantesComValores = participantesSelecionados.map((p) => ({
        id: p.id,
        valor: modoDistribuicao === 'igual'
          ? (valor / participantesSelecionados.length).toFixed(2)
          : valoresIndividuais[p.id].replace(',', '.')
      }));
  
      await api.post('/transacoes', {
        descricao,
        valor: parseFloat(valor.replace(',', '.')),
        data,
        metodo_pagamento: metodoPagamento,
        categoria,
        status: 'pendente', // Define explicitamente o status como "pendente"
        participantes: participantesComValores
      });
  
      setNotification({
        tipo: 'sucesso',
        titulo: 'Sucesso',
        mensagem: 'Transação cadastrada com sucesso!'
      });
      setModalOpen(false);
      resetForm();
      const response = await api.get('/transacoes');
      setTransacoes(response.data);
    } catch (error) {
      console.error('Erro ao cadastrar transação:', error);
      const errorInfo = processarErroAPI(error);
      setNotification(errorInfo);
    }
  };
  

  const handleEstorno = async () => {
    if (selectedTransacao.status !== 'pendente') {
      setNotification({
        tipo: 'erro',
        titulo: 'Estorno não permitido',
        mensagem: 'A transação só pode ser estornada se estiver no status "pendente".'
      });
      return;
    }

    try {
      await api.put(`/transacoes/${selectedTransacao.id}/estornar`, {
        motivo: motivoEstorno,
        id_usuario: idUsuarioEstorno || null
      });
      setNotification({
        tipo: 'sucesso',
        titulo: 'Sucesso',
        mensagem: 'Transação estornada com sucesso!'
      });

      const response = await api.get('/transacoes');
      setTransacoes(response.data);
      setModalEstornoOpen(false);
      setMotivoEstorno('');
      setIdUsuarioEstorno('');
    } catch (error) {
      console.error('Erro ao estornar transação:', error);
      const errorInfo = processarErroAPI(error);
      setNotification(errorInfo);
    }
  };

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
        console.log('Transações carregadas:', transacoesResponse.data);
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
    setParticipantesSelecionados([]);
    setValoresIndividuais({});
    setModoDistribuicao('igual');

    setTimeout(() => {
      descricaoInputRef.current?.focus();
    }, 100);
  };

  const handleNewTransaction = () => {
    resetForm();
    setModalOpen(true);
  };

  const calcularValorTotal = () => {
    if (modoDistribuicao === 'individual') {
      return Object.values(valoresIndividuais)
        .reduce((sum, val) => sum + (parseFloat(val.replace(',', '.')) || 0), 0);
    }
    return parseFloat(valor.replace(',', '.')) || 0;
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pago parcialmente':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Pago Parcialmente' };
      case 'pago total':
        return { color: 'bg-green-100 text-green-800', text: 'Pago Total' };
      case 'pendente':
        return { color: 'bg-orange-100 text-orange-800', text: 'Pendente' };
      case 'estornado':
        return { color: 'bg-gray-100 text-gray-800', text: 'Estornado' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: status };
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Transações</h1>
        <button
          onClick={toggleTransactionsList}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          {showTransactionsList ? (
            <>
              <EyeOff className="w-5 h-5" />
              Ocultar Lista
            </>
          ) : (
            <>
              <Eye className="w-5 h-5" />
              Mostrar Lista
            </>
          )}
        </button>
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={handleNewTransaction}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg 
                   hover:from-green-600 hover:to-green-700 transition-all duration-300 
                   shadow-lg hover:shadow-xl transform hover:-translate-y-1
                   flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Nova Transação</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      ) : showTransactionsList && (
        <ul className="bg-white shadow-md rounded-lg p-4 space-y-4">
          {transacoes.length === 0 ? (
            <li className="text-center text-gray-500 py-4">
              Nenhuma transação encontrada
            </li>
          ) : (
            transacoes.map((transacao) => {
              const statusConfig = getStatusConfig(transacao.status);
              return (
                <li 
                  key={transacao.id} 
                  className="border rounded-lg hover:bg-gray-50 transition-colors overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{transacao.descricao}</h3>
                            <div className="flex items-center text-gray-600">
                              <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
                              <span className="font-medium text-lg">
                                R$ {Number(transacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                              {statusConfig.text}
                            </span>
                            <button
                              onClick={(e) => toggleTransaction(transacao.id, e)}
                              className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              {expandedTransactions[transacao.id] ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {expandedTransactions[transacao.id] && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-5 h-5 mr-2 text-purple-500" />
                              <div>
                                <span className="text-sm font-medium text-gray-700">Data:</span>
                                <p>{transacao.data ? new Date(transacao.data).toLocaleDateString('pt-BR') : 'Data não disponível'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <Tag className="w-5 h-5 mr-2 text-green-500" />
                              <div>
                                <span className="text-sm font-medium text-gray-700">Categoria:</span>
                                <p>{transacao.categoria}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <Users className="w-5 h-5 mr-2 text-orange-500" />
                              <div>
                                <span className="text-sm font-medium text-gray-700">Participantes:</span>
                                <p>{typeof transacao.participantes === 'string' ? transacao.participantes : '0 participantes'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                              <div>
                                <span className="text-sm font-medium text-gray-700">Status:</span>
                                <p className="capitalize">{statusConfig.text}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedTransacao(transacao);
                            setModalEstornoOpen(true);
                          }}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Estornar
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}

      <Modal
        isOpen={modalOpen}
        title="Cadastrar Transação"
        onClose={() => setModalOpen(false)}
        confirmText="Cadastrar"
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
          <div className="mb-2">
            <select 
              value={modoDistribuicao}
              onChange={(e) => {
                setModoDistribuicao(e.target.value);
                if (e.target.value === 'igual') {
                  setValoresIndividuais({});
                } else if (participantesSelecionados.length > 0) {
                  const valorPorParticipante = (parseFloat(valor.replace(',', '.')) / participantesSelecionados.length).toFixed(2);
                  const valores = {};
                  participantesSelecionados.forEach(p => {
                    valores[p.id] = valorPorParticipante.toString().replace('.', ',');
                  });
                  setValoresIndividuais(valores);
                }
              }}
              className="w-full border rounded-lg px-3 py-2 text-gray-700 mb-2"
            >
              <option value="igual">Dividir igualmente</option>
              <option value="individual">Definir valores individuais</option>
            </select>
          </div>

          <ParticipantSelector
            participantes={participantes}
            selecionados={participantesSelecionados}
            onChange={setParticipantesSelecionados}
            modoDistribuicao={modoDistribuicao}
            valoresIndividuais={valoresIndividuais}
            onChangeValores={            setValoresIndividuais}
            valor={valor}
          />

          {modoDistribuicao === 'individual' && participantesSelecionados.length > 0 && (
            <div className="mt-2 p-2 bg-gray-50 rounded">
              <p className="text-sm">
                Total dividido: R$ {calcularValorTotal().toFixed(2).replace('.', ',')}
              </p>
              <p className="text-sm">
                Valor total: R$ {parseFloat(valor.replace(',', '.')).toFixed(2).replace('.', ',')}
              </p>
            </div>
          )}
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
      </Modal>

      {/* Modal de Estorno */}
      <Modal
        isOpen={modalEstornoOpen}
        title="Registrar Estorno"
        onClose={() => {
          setModalEstornoOpen(false);
          setMotivoEstorno('');
          setIdUsuarioEstorno('');
        }}
        confirmText="Confirmar Estorno"
        onConfirm={handleEstorno}
      >
        <div className="mb-4">
          <Input
            label="Motivo do Estorno"
            value={motivoEstorno}
            onChange={(e) => setMotivoEstorno(e.target.value)}
            placeholder="Descreva o motivo do estorno"
            required
          />
        </div>
        <div className="mb-4">
          <Input
            label="ID do Usuário (opcional)"
            value={idUsuarioEstorno}
            onChange={(e) => setIdUsuarioEstorno(e.target.value)}
            placeholder="Informe o ID do usuário responsável"
          />
        </div>
        <p className="text-gray-700 text-sm">
          Certifique-se de que todos os detalhes do estorno estão corretos antes de confirmar. Esta ação é irreversível.
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

