// utils/errorHandler.js

/**
 * Tipos de erro do backend
 */
export const ERRO_TIPOS = {
    PARTICIPANTE: 'participante',
    CONTA: 'conta',
    CARTAO: 'cartao',
    FATURA: 'fatura',
    VALIDACAO: 'validacao',
    SERVIDOR: 'servidor'
  };
  
  /**
   * Processa o erro retornado pela API e retorna uma mensagem amigável
   */
  export const processarErroAPI = (error) => {
    // Se não houver resposta da API
    if (!error.response) {
      return {
        tipo: 'erro',
        titulo: 'Erro de Conexão',
        mensagem: 'Não foi possível conectar ao servidor. Verifique sua conexão.'
      };
    }
  
    const { status, data } = error.response;
    const mensagemBackend = data?.error || '';
  
    // Erro do servidor (500)
    if (status === 500) {
      return {
        tipo: 'erro',
        titulo: 'Erro no Servidor',
        mensagem: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.'
      };
    }
  
    // Erros de validação e negócio (400)
    if (status === 400) {
      // Verifica o tipo específico de erro baseado na mensagem
      if (mensagemBackend.includes('participante')) {
        return {
          tipo: ERRO_TIPOS.PARTICIPANTE,
          titulo: 'Erro com Participante',
          mensagem: mensagemBackend
        };
      }
  
      if (mensagemBackend.includes('conta')) {
        return {
          tipo: ERRO_TIPOS.CONTA,
          titulo: 'Erro com Conta',
          mensagem: mensagemBackend
        };
      }
  
      if (mensagemBackend.includes('cartão')) {
        return {
          tipo: ERRO_TIPOS.CARTAO,
          titulo: 'Erro com Cartão',
          mensagem: mensagemBackend
        };
      }
  
      if (mensagemBackend.includes('fatura')) {
        return {
          tipo: ERRO_TIPOS.FATURA,
          titulo: 'Erro com Fatura',
          mensagem: mensagemBackend
        };
      }
  
      // Erro de validação genérico
      return {
        tipo: ERRO_TIPOS.VALIDACAO,
        titulo: 'Erro de Validação',
        mensagem: mensagemBackend
      };
    }
  
    // Outros erros
    return {
      tipo: 'erro',
      titulo: 'Erro',
      mensagem: mensagemBackend || 'Ocorreu um erro inesperado.'
    };
  };