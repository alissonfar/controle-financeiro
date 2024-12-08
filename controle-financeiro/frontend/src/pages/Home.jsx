import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Bem-vindo ao Sistema de Controle Financeiro</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Link
          to="/usuarios"
          className="block bg-blue-500 text-white text-center py-4 rounded-lg shadow-md hover:bg-blue-600"
        >
          Gerenciar Usuários
        </Link>
        <Link
          to="/contas"
          className="block bg-green-500 text-white text-center py-4 rounded-lg shadow-md hover:bg-green-600"
        >
          Gerenciar Contas
        </Link>
        <Link
          to="/participantes"
          className="block bg-yellow-500 text-white text-center py-4 rounded-lg shadow-md hover:bg-yellow-600"
        >
          Gerenciar Participantes
        </Link>
        <Link
          to="/transacoes"
          className="block bg-red-500 text-white text-center py-4 rounded-lg shadow-md hover:bg-red-600"
        >
          Gerenciar Transações
        </Link>
        <Link
          to="/faturas"
          className="block bg-purple-500 text-white text-center py-4 rounded-lg shadow-md hover:bg-purple-600"
        >
          Gerenciar Faturas
        </Link>
        <Link
          to="/cartoes"
          className="block bg-indigo-500 text-white text-center py-4 rounded-lg shadow-md hover:bg-indigo-600"
        >
          Gerenciar Cartões
        </Link>
        <Link
          to="/metodos_pagamento"
          className="block bg-teal-500 text-white text-center py-4 rounded-lg shadow-md hover:bg-teal-600"
        >
          Métodos de Pagamento
        </Link>
      </div>
    </div>
  );
};

export default Home;
