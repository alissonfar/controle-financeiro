const express = require('express');
const router = express.Router();
const metodosPagamentoController = require('../controllers/metodosPagamentoController');

// Endpoints relacionados a métodos de pagamento
router.get('/', metodosPagamentoController.listarMetodosPagamento);
router.post('/', metodosPagamentoController.criarMetodoPagamento);
router.put('/:id', metodosPagamentoController.atualizarMetodoPagamento);
router.delete('/:id', metodosPagamentoController.excluirMetodoPagamento);

module.exports = router;
