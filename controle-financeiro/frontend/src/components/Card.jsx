import React from 'react';
import { Link } from 'react-router-dom';

const Card = ({ icon, title, subtitle, link }) => {
  return (
    <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow p-6 hover:shadow-lg transition-all">
      {/* Ícone */}
      <div className="mb-4">{icon}</div>
      
      {/* Título */}
      <Link to={link}>
        <h5 className="mb-2 text-xl font-bold text-gray-900">{title}</h5>
      </Link>
      
      {/* Subtítulo */}
      <p className="mb-3 text-gray-500">{subtitle}</p>
      
      {/* Botão/Link */}
      <Link
        to={link}
        className="inline-flex items-center text-blue-600 hover:underline font-medium"
      >
        Acessar
      </Link>
    </div>
  );
};

export default Card;
