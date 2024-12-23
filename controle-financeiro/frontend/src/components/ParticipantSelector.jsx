// ParticipantSelector.js (Atualizado)
import React from 'react';

const ParticipantSelector = ({ 
  participantes, 
  selecionados, 
  onChange,
  modoDistribuicao,
  valoresIndividuais,
  onChangeValores,
  valor 
}) => {

  const handleSelecionar = (participante) => {
    if (selecionados.some((part) => part.id === participante.id)) {
      // Removendo participante
      onChange(selecionados.filter((part) => part.id !== participante.id));
      
      if (modoDistribuicao === 'individual') {
        const novosValores = { ...valoresIndividuais };
        delete novosValores[participante.id];
        
        if (selecionados.length > 1) {
          const valorTotal = parseFloat(valor.replace(',', '.'));
          const novoNumeroParticipantes = selecionados.length - 1;
          const valorPorParticipante = (valorTotal / novoNumeroParticipantes).toFixed(2);
          
          selecionados
            .filter(part => part.id !== participante.id)
            .forEach(part => {
              novosValores[part.id] = valorPorParticipante.toString().replace('.', ',');
            });
        }
        
        onChangeValores(novosValores);
      }
    } else {
      // Adicionando participante
      const novoParticipante = {
        id: participante.id,
        usa_conta: participante.usa_conta || false,
      };
      
      onChange([...selecionados, novoParticipante]);
      
      if (modoDistribuicao === 'individual') {
        const valorTotal = parseFloat(valor.replace(',', '.'));
        const novoNumeroParticipantes = selecionados.length + 1;
        const valorPorParticipante = (valorTotal / novoNumeroParticipantes).toFixed(2);
        
        const novosValores = { ...valoresIndividuais };
        selecionados.forEach(part => {
          novosValores[part.id] = valorPorParticipante.toString().replace('.', ',');
        });
        novosValores[participante.id] = valorPorParticipante.toString().replace('.', ',');
        
        onChangeValores(novosValores);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      {participantes.map((p) => {
        const isSelecionado = selecionados.some((part) => part.id === p.id);
        
        return (
          <div 
            key={p.id} 
            className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors
              ${isSelecionado 
                ? 'bg-blue-100 border border-blue-500 text-blue-800' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
            onClick={() => handleSelecionar(p)}
          >
            <span className="flex-grow font-medium">{p.nome}</span>
            {modoDistribuicao === 'individual' && isSelecionado && (
              <input
                type="text"
                value={valoresIndividuais[p.id] || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d,]/g, '');
                  if (value === '' || /^\d*[\,]?\d{0,2}$/.test(value)) {
                    onChangeValores({
                      ...valoresIndividuais,
                      [p.id]: value
                    });
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-24 px-2 py-1 text-right bg-white border rounded shadow-sm"
                placeholder="0,00"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ParticipantSelector;
