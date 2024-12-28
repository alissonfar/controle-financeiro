import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FiUsers, FiCreditCard, FiFileText, FiDollarSign, FiLayers, FiSettings, FiHome } from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const cardsData = [
    {
      icon: <FiUsers className="w-7 h-7 text-azul-600" />,
      title: 'Gerenciar Usuários',
      subtitle: 'Módulo para gerenciar usuários.',
      link: '/usuarios',
    },
    {
      icon: <FiLayers className="w-7 h-7 text-azul-600" />,
      title: 'Gerenciar Contas',
      subtitle: 'Módulo para gerenciar contas.',
      link: '/contas',
    },
    {
      icon: <FiUsers className="w-7 h-7 text-azul-600" />,
      title: 'Gerenciar Participantes',
      subtitle: 'Módulo para gerenciar participantes.',
      link: '/participantes',
    },
    {
      icon: <FiDollarSign className="w-7 h-7 text-azul-600" />,
      title: 'Gerenciar Transações',
      subtitle: 'Módulo para gerenciar transações.',
      link: '/transacoes',
    },
    {
      icon: <FiFileText className="w-7 h-7 text-azul-600" />,
      title: 'Gerenciar Faturas',
      subtitle: 'Módulo para gerenciar faturas.',
      link: '/faturas',
    },
    {
      icon: <FiCreditCard className="w-7 h-7 text-azul-600" />,
      title: 'Gerenciar Cartões',
      subtitle: 'Módulo para gerenciar cartões.',
      link: '/cartoes',
    },
    {
      icon: <FiSettings className="w-7 h-7 text-azul-600" />,
      title: 'Métodos de Pagamento',
      subtitle: 'Módulo para gerenciar métodos de pagamento.',
      link: '/metodos_pagamento',
    },
    {
      icon: <FiDollarSign className="w-7 h-7 text-azul-600" />,
      title: 'Gerenciar Pagamentos',
      subtitle: 'Módulo para gerenciar pagamentos.',
      link: '/pagamentos',
    },
  ];

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        } w-full flex flex-col`}
      >
        <div className="bg-gradient-to-r from-azul-900 to-azul-800 shadow-md p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="text-white text-2xl rounded-md hover:bg-azul-500 p-2 transition-all focus:outline-none"
          >
            ☰
          </button>
          <h1 className="text-white text-2xl font-semibold">
            Sistema de Controle Financeiro
          </h1>
          <button className="text-white bg-azul-500 px-4 py-2 rounded-md shadow hover:bg-azul-600 transition-all">
            Sair
          </button>
        </div>

        <div className="p-8">
          {location.pathname === '/' && (
            <>
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-azul-700">
                  Bem-vindo(a) ao Sistema de Controle Financeiro
                </h2>
                <p className="text-gray-600 mt-2">
                  Aqui você pode gerenciar seus usuários, transações, contas e muito mais.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
                {cardsData.map((card, index) => (
                  <Card
                    key={index}
                    icon={card.icon}
                    title={card.title}
                    subtitle={card.subtitle}
                    link={card.link}
                  />
                ))}
              </div>
            </>
          )}

          {location.pathname !== '/' && (
            <div className="bg-white rounded-lg shadow p-6">
              <Outlet />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
