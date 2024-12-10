import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Participantes = () => {
  const [participantes, setParticipantes] = useState([]);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [usaConta, setUsaConta] = useState(false);
  const [idEdicao, setIdEdicao] = useState(null);

  const [contasDisponiveis, setContasDisponiveis] = useState([]);
  const [contasParaVincular, setContasParaVincular] = useState([]);
  const [contasOriginais, setContasOriginais] = useState([]);

  // Buscar participantes e contas disponíveis
  useEffect(() => {
    const fetchDados = async () => {
      try {
        const participantesResponse = await api.get('/participantes');
        setParticipantes(participantesResponse.data);

        const contasResponse = await api.get('/contas');
        setContasDisponiveis(contasResponse.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        alert('Erro ao carregar participantes ou contas.');
      }
    };

    fetchDados();
  }, []);

  const fetchContasVinculadas = async (idParticipante) => {
    try {
      console.log('Buscando contas vinculadas para o participante ID:', idParticipante);
      const response = await api.get(`/participantes/${idParticipante}/contas`);
      const contasIds = response.data.map((conta) => conta.id.toString());
      setContasParaVincular(contasIds);
      setContasOriginais(contasIds);
      console.log('Contas ativas vinculadas carregadas:', contasIds);
    } catch (error) {
      console.error('Erro ao buscar contas vinculadas:', error);
      alert('Erro ao carregar contas vinculadas.');
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
        console.log('Participante atualizado:', payload);
        alert('Participante atualizado com sucesso!');
      } else {
        const response = await api.post('/participantes', payload);
        participanteId = response.data.id;
        console.log('Participante criado:', payload);
        alert('Participante criado com sucesso!');
      }

      // Atualizar vinculação de contas somente se a flag "Usa Conta" estiver ativada
      if (usaConta) {
        if (contasParaVincular.sort().toString() !== contasOriginais.sort().toString()) {
          console.log('Atualizando vinculação de contas. Contas novas:', contasParaVincular);
          await api.post(`/participantes/${participanteId}/contas`, {
            contas: contasParaVincular,
          });
          alert('Contas vinculadas com sucesso!');
        } else {
          console.log('Nenhuma alteração detectada nas contas vinculadas.');
        }
      }

      setNome('');
      setDescricao('');
      setUsaConta(false);
      setIdEdicao(null);
      setContasParaVincular([]);
      setContasOriginais([]);

      const response = await api.get('/participantes');
      setParticipantes(response.data);
    } catch (error) {
      console.error('Erro ao salvar participante:', error);
      alert('Erro ao salvar participante.');
    }
  };

  const handleEdit = (participante) => {
    setIdEdicao(participante.id);
    setNome(participante.nome);
    setDescricao(participante.descricao);
    setUsaConta(participante.usa_conta);

    // Buscar contas vinculadas para edição
    if (participante.usa_conta) {
      fetchContasVinculadas(participante.id);
    } else {
      setContasParaVincular([]);
      setContasOriginais([]);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este participante?')) {
      try {
        await api.delete(`/participantes/${id}`);
        alert('Participante excluído com sucesso!');
        const response = await api.get('/participantes');
        setParticipantes(response.data);
      } catch (error) {
        console.error('Erro ao excluir participante:', error);
        alert('Erro ao excluir participante.');
      }
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Lista de Participantes</h1>
      <ul className="bg-white shadow-md rounded-lg p-4">
        {participantes.map((participante) => (
          <li
            key={participante.id}
            className="flex justify-between items-center p-2 border-b last:border-none"
          >
            <div>
              <p className="font-medium">{participante.nome}</p>
              <p className="text-sm text-gray-500">{participante.descricao}</p>
              <p className="text-sm text-gray-500">
                Usa Conta: {participante.usa_conta ? 'Sim' : 'Não'}
              </p>
              {participante.contas_vinculadas && (
                <p className="text-sm text-gray-500">
                  Contas Vinculadas: {participante.contas_vinculadas}
                </p>
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
                onClick={() => handleDelete(participante.id)}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6">
        {idEdicao ? 'Editar Participante' : 'Adicionar Novo Participante'}
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
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Descrição:</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>
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

export default Participantes;
