import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Input from '../components/Input';
import Modal from '../components/Modal';

const Contas = () => {
  const [contas, setContas] = useState([]);
  const [nome, setNome] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [saldoAtual, setSaldoAtual] = useState('');
  const [metodosDisponiveis, setMetodosDisponiveis] = useState([]);
  const [metodosSelecionados, setMetodosSelecionados] = useState([]);
  const [idEdicao, setIdEdicao] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfirm, setModalConfirm] = useState(false);
  const [selectedConta, setSelectedConta] = useState(null);
  const [modalMessage, setModalMessage] = useState({ open: false, message: '' });

  // Buscar contas e métodos de pagamento
  useEffect(() => {
    const fetchDados = async () => {
      try {
        const [contasResponse, metodosResponse] = await Promise.all([
          api.get('/contas'),
          api.get('/metodos_pagamento'),
        ]);
        setContas(contasResponse.data);
        setMetodosDisponiveis(metodosResponse.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setModalMessage({ open: true, message: 'Erro ao carregar dados.' });
      }
    };

    fetchDados();
  }, []);

  // Adicionar ou Editar Conta
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const conta = { nome, saldo_inicial: saldoInicial, saldo_atual: saldoAtual };

      let response;
      if (idEdicao) {
        response = await api.put(`/contas/${idEdicao}`, conta);
        setModalMessage({ open: true, message: 'Conta atualizada com sucesso!' });
      } else {
        response = await api.post('/contas', conta);
        setModalMessage({ open: true, message: 'Conta criada com sucesso!' });
      }

      if (metodosSelecionados.length > 0) {
        await api.post('/contas/vincular-metodos', {
          id_conta: response.data.id || idEdicao,
          id_metodos_pagamento: metodosSelecionados,
        });
      }

      setNome('');
      setSaldoInicial('');
      setSaldoAtual('');
      setMetodosSelecionados([]);
      setIdEdicao(null);
      setModalOpen(false);

      const contasResponse = await api.get('/contas');
      setContas(contasResponse.data);
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      setModalMessage({ open: true, message: 'Erro ao salvar conta.' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/contas/${selectedConta}`);
      setModalMessage({ open: true, message: 'Conta excluída com sucesso!' });
      setModalConfirm(false);

      const contasResponse = await api.get('/contas');
      setContas(contasResponse.data);
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      setModalMessage({ open: true, message: 'Erro ao excluir conta.' });
    }
  };

  const handleEdit = (conta) => {
    setIdEdicao(conta.id);
    setNome(conta.nome);
    setSaldoInicial(conta.saldo_inicial);
    setSaldoAtual(conta.saldo_atual);
    setMetodosSelecionados(
      conta.metodos_pagamento
        ? conta.metodos_pagamento.split(',').map((m) => {
            const metodo = metodosDisponiveis.find((metodo) => metodo.nome.trim() === m.trim());
            return metodo?.id || null;
          })
        : []
    );
    setModalOpen(true);
  };

  const openModal = () => {
    setModalOpen(true);
    setNome('');
    setSaldoInicial('');
    setSaldoAtual('');
    setMetodosSelecionados([]);
    setIdEdicao(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Contas</h1>
        <button
          onClick={openModal}
          className="relative bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-green-600 group font-bold"
        >
          +
          <span className="absolute top-full mt-2 hidden group-hover:block bg-black text-white text-xs py-1 px-2 rounded">
            Cadastrar Conta
          </span>
        </button>
      </div>

      {/* Tabela de Contas */}
      <ul className="bg-white shadow-md rounded-lg p-4">
        {contas.map((conta) => (
          <li
            key={conta.id}
            className="flex justify-between items-center p-2 border-b last:border-none"
          >
            <div>
              <p className="font-medium">{conta.nome}</p>
              <p className="text-sm text-gray-500">Saldo Atual: R$ {conta.saldo_atual}</p>
              <p className="text-sm text-gray-500">Métodos: {conta.metodos_pagamento || 'Nenhum'}</p>
            </div>
            <div>
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-blue-600"
                onClick={() => handleEdit(conta)}
              >
                Editar
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                onClick={() => {
                  setSelectedConta(conta.id);
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
        title={idEdicao ? 'Editar Conta' : 'Cadastrar Conta'}
        onClose={() => setModalOpen(false)}
        confirmText={idEdicao ? 'Atualizar' : 'Cadastrar'}
        onConfirm={handleSubmit}
      >
        <Input
          label="Nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Digite o nome da conta"
          required
        />
        <Input
          label="Saldo Atual"
          type="number"
          step="0.01"
          value={saldoAtual}
          onChange={(e) => setSaldoAtual(e.target.value)}
          placeholder="Digite o saldo atual"
          required
        />
        {!idEdicao && (
          <Input
            label="Saldo Inicial"
            type="number"
            step="0.01"
            value={saldoInicial}
            onChange={(e) => setSaldoInicial(e.target.value)}
            placeholder="Digite o saldo inicial"
            required
          />
        )}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Métodos de Pagamento:</label>
          <select
            multiple
            value={metodosSelecionados}
            onChange={(e) =>
              setMetodosSelecionados(Array.from(e.target.selectedOptions, (option) => option.value))
            }
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
          >
            {metodosDisponiveis.map((metodo) => (
              <option key={metodo.id} value={metodo.id}>
                {metodo.nome}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Modal de Confirmação */}
      <Modal
        isOpen={modalConfirm}
        title="Confirmação"
        onClose={() => setModalConfirm(false)}
        confirmText="Excluir"
        onConfirm={handleDelete}
      >
        <p className="text-gray-700">Tem certeza que deseja excluir esta conta?</p>
      </Modal>

      {/* Modal de Mensagem */}
      <Modal
        isOpen={modalMessage.open}
        onConfirm={() => setModalMessage({ open: false, message: '' })}
      >
        <p className="text-gray-700">{modalMessage.message}</p>
      </Modal>
    </div>
  );
};

export default Contas;
