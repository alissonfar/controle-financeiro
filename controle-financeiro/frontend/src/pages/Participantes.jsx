import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Input from '../components/Input';
import Modal from '../components/Modal';

const Participantes = () => {
  const [participantes, setParticipantes] = useState([]);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [usaConta, setUsaConta] = useState(false);
  const [idEdicao, setIdEdicao] = useState(null);

  const [contasDisponiveis, setContasDisponiveis] = useState([]);
  const [contasParaVincular, setContasParaVincular] = useState([]);
  const [contasOriginais, setContasOriginais] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfirm, setModalConfirm] = useState(false);
  const [selectedParticipante, setSelectedParticipante] = useState(null);
  const [modalMessage, setModalMessage] = useState({ open: false, message: '' });

  // Buscar participantes e contas disponíveis
  useEffect(() => {
    const fetchDados = async () => {
      try {
        const [participantesResponse, contasResponse] = await Promise.all([
          api.get('/participantes'),
          api.get('/contas'),
        ]);
        setParticipantes(participantesResponse.data);
        setContasDisponiveis(contasResponse.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setModalMessage({ open: true, message: 'Erro ao carregar participantes ou contas.' });
      }
    };

    fetchDados();
  }, []);

  const fetchContasVinculadas = async (idParticipante) => {
    try {
      const response = await api.get(`/participantes/${idParticipante}/contas`);
      const contasIds = response.data.map((conta) => conta.id.toString());
      setContasParaVincular(contasIds);
      setContasOriginais(contasIds);
    } catch (error) {
      console.error('Erro ao buscar contas vinculadas:', error);
      setModalMessage({ open: true, message: 'Erro ao carregar contas vinculadas.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { nome, descricao, usa_conta: usaConta };
      let participanteId;

      if (idEdicao) {
        await api.put(`/participantes/${idEdicao}`, payload);
        participanteId = idEdicao;
        setModalMessage({ open: true, message: 'Participante atualizado com sucesso!' });
      } else {
        const response = await api.post('/participantes', payload);
        participanteId = response.data.id;
        setModalMessage({ open: true, message: 'Participante criado com sucesso!' });
      }

      if (usaConta && contasParaVincular.sort().toString() !== contasOriginais.sort().toString()) {
        await api.post(`/participantes/${participanteId}/contas`, {
          contas: contasParaVincular,
        });
        setModalMessage({ open: true, message: 'Contas vinculadas com sucesso!' });
      }

      setNome('');
      setDescricao('');
      setUsaConta(false);
      setIdEdicao(null);
      setContasParaVincular([]);
      setContasOriginais([]);
      setModalOpen(false);

      const participantesResponse = await api.get('/participantes');
      setParticipantes(participantesResponse.data);
    } catch (error) {
      console.error('Erro ao salvar participante:', error);
      setModalMessage({ open: true, message: 'Erro ao salvar participante.' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/participantes/${selectedParticipante}`);
      setModalMessage({ open: true, message: 'Participante excluído com sucesso!' });
      setModalConfirm(false);

      const participantesResponse = await api.get('/participantes');
      setParticipantes(participantesResponse.data);
    } catch (error) {
      console.error('Erro ao excluir participante:', error);
      setModalMessage({ open: true, message: 'Erro ao excluir participante.' });
    }
  };

  const handleEdit = (participante) => {
    setIdEdicao(participante.id);
    setNome(participante.nome);
    setDescricao(participante.descricao);
    setUsaConta(participante.usa_conta);

    if (participante.usa_conta) {
      fetchContasVinculadas(participante.id);
    } else {
      setContasParaVincular([]);
      setContasOriginais([]);
    }
    setModalOpen(true);
  };

  const openModal = () => {
    setModalOpen(true);
    setNome('');
    setDescricao('');
    setUsaConta(false);
    setContasParaVincular([]);
    setIdEdicao(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Participantes</h1>
        <button
          onClick={openModal}
          className="relative bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-green-600 group font-bold"
        >
          +
          <span className="absolute top-full mt-2 hidden group-hover:block bg-black text-white text-xs py-1 px-2 rounded">
            Cadastrar Participante
          </span>
        </button>
      </div>

      <ul className="bg-white shadow-md rounded-lg p-4">
        {participantes.map((participante) => (
          <li key={participante.id} className="flex justify-between items-center p-2 border-b last:border-none">
            <div>
              <p className="font-medium">{participante.nome}</p>
              <p className="text-sm text-gray-500">{participante.descricao}</p>
              <p className="text-sm text-gray-500">Usa Conta: {participante.usa_conta ? 'Sim' : 'Não'}</p>
              {participante.contas_vinculadas && (
                <p className="text-sm text-gray-500">Contas Vinculadas: {participante.contas_vinculadas}</p>
              )}
            </div>
            <div>
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-blue-600"
                onClick={() => handleEdit(participante)}
              >
                Editar
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                onClick={() => {
                  setSelectedParticipante(participante.id);
                  setModalConfirm(true);
                }}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        isOpen={modalOpen}
        title={idEdicao ? 'Editar Participante' : 'Cadastrar Participante'}
        onClose={() => setModalOpen(false)}
        confirmText={idEdicao ? 'Atualizar' : 'Cadastrar'}
        onConfirm={handleSubmit}
      >
        <Input
          label="Nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Digite o nome do participante"
          required
        />
        <Input
          label="Descrição"
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Digite a descrição do participante"
        />
        <div className="mb-4 flex items-center">
          <label className="block text-gray-700 font-medium mr-2">Usa Conta:</label>
          <input
            type="checkbox"
            checked={usaConta}
            onChange={(e) => setUsaConta(e.target.checked)}
            className="h-5 w-5 text-blue-600 focus:ring focus:ring-blue-200"
          />
        </div>
        {usaConta && (
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">Vincular Contas:</label>
            <select
              multiple
              value={contasParaVincular}
              onChange={(e) =>
                setContasParaVincular([...e.target.selectedOptions].map((option) => option.value))
              }
              className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            >
              {contasDisponiveis.map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome}
                </option>
              ))}
            </select>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modalConfirm}
        title="Confirmação"
        onClose={() => setModalConfirm(false)}
        confirmText="Excluir"
        onConfirm={handleDelete}
      >
        <p className="text-gray-700">Tem certeza que deseja excluir este participante?</p>
      </Modal>

      <Modal
        isOpen={modalMessage.open}
        onConfirm={() => setModalMessage({ open: false, message: '' })}
      >
        <p className="text-gray-700">{modalMessage.message}</p>
      </Modal>
    </div>
  );
};

export default Participantes;
