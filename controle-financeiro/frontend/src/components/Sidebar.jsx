import React from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCreditCard, FiFileText, FiDollarSign, FiLayers, FiSettings, FiHome } from 'react-icons/fi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <div
      className={`fixed top-0 left-0 bg-azul-900 text-white h-full transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-64'
      } w-64 z-50 shadow-lg`}
    >
      {/* Cabeçalho */}
      <div className="flex justify-between items-center p-4">
        <span className="text-xl font-bold">Controle Financeiro</span>
        <button
          onClick={toggleSidebar}
          className="text-white p-2 rounded-md hover:bg-azul-600 focus:outline-none"
        >
          ✕
        </button>
      </div>

      {/* Navegação */}
      <nav className="mt-4">
        <ul className="space-y-2">
          <li>
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-2 rounded hover:bg-azul-600 hover:shadow-lg transition-all"
            >
              <FiHome className="text-lg" />
              <span>Home</span>
            </Link>
          </li>
          <li>
            <Link
              to="usuarios"
              className="flex items-center gap-3 px-4 py-2 rounded hover:bg-azul-600 hover:shadow-lg transition-all"
            >
              <FiUsers className="text-lg" />
              <span>Gerenciar Usuários</span>
            </Link>
          </li>
          <li>
            <Link
              to="contas"
              className="flex items-center gap-3 px-4 py-2 rounded hover:bg-azul-600 hover:shadow-lg transition-all"
            >
              <FiLayers className="text-lg" />
              <span>Gerenciar Contas</span>
            </Link>
          </li>
          <li>
            <Link
              to="participantes"
              className="flex items-center gap-3 px-4 py-2 rounded hover:bg-azul-600 hover:shadow-lg transition-all"
            >
              <FiUsers className="text-lg" />
              <span>Gerenciar Participantes</span>
            </Link>
          </li>
          <li>
            <Link
              to="transacoes"
              className="flex items-center gap-3 px-4 py-2 rounded hover:bg-azul-600 hover:shadow-lg transition-all"
            >
              <FiDollarSign className="text-lg" />
              <span>Gerenciar Transações</span>
            </Link>
          </li>
          <li>
            <Link
              to="faturas"
              className="flex items-center gap-3 px-4 py-2 rounded hover:bg-azul-600 hover:shadow-lg transition-all"
            >
              <FiFileText className="text-lg" />
              <span>Gerenciar Faturas</span>
            </Link>
          </li>
          <li>
            <Link
              to="cartoes"
              className="flex items-center gap-3 px-4 py-2 rounded hover:bg-azul-600 hover:shadow-lg transition-all"
            >
              <FiCreditCard className="text-lg" />
              <span>Gerenciar Cartões</span>
            </Link>
          </li>
          <li>
            <Link
              to="metodos_pagamento"
              className="flex items-center gap-3 px-4 py-2 rounded hover:bg-azul-600 hover:shadow-lg transition-all"
            >
              <FiSettings className="text-lg" />
              <span>Métodos de Pagamento</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
