import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const Notification = ({ tipo, titulo, mensagem, onClose, duration = 2000 }) => {
  useEffect(() => {
    // Configura o timer para fechar a notificação
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    // Limpa o timer se o componente for desmontado
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getStyles = () => {
    switch (tipo) {
      case 'participante':
      case 'conta':
      case 'cartao':
      case 'fatura':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'erro':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'validacao':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'sucesso':
        return 'bg-green-50 text-green-800 border-green-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`
      fixed left-1/2 top-20 transform -translate-x-1/2 
      w-96 z-50
      rounded-lg border p-4 shadow-lg
      transition-all duration-300 ease-in-out
      pointer-events-auto
      ${getStyles()}
    `}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          {titulo && (
            <h3 className="font-medium mb-1">
              {titulo}
            </h3>
          )}
          <p className="text-sm">
            {mensagem}
          </p>
        </div>
        <button
          onClick={onClose}
          className="inline-flex flex-shrink-0 rounded-md p-1
                   hover:bg-white hover:bg-opacity-20 
                   focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          <span className="sr-only">Fechar</span>
          <span className="text-lg leading-none">&times;</span>
        </button>
      </div>
    </div>
  );
};

Notification.propTypes = {
  tipo: PropTypes.oneOf(['participante', 'conta', 'cartao', 'fatura', 'erro', 'validacao', 'sucesso']).isRequired,
  titulo: PropTypes.string,
  mensagem: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number
};

Notification.defaultProps = {
  titulo: '',
  duration: 2000 // 2 segundos por padrão
};

export default Notification;