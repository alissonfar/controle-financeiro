import React from 'react';

const Modal = ({ title, children, isOpen, onClose, onConfirm, confirmText = 'Confirmar', cancelText = 'Cancelar', hideFooter = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6">
        {/* Título do Modal */}
        {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}

        {/* Conteúdo do Modal */}
        <div className="mb-6">{children}</div>

        {/* Rodapé do Modal */}
        {!hideFooter && (
          <div className="flex justify-end">
            {onClose && (
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-gray-600"
              >
                {cancelText}
              </button>
            )}
            {onConfirm && (
              <button
                onClick={onConfirm}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
