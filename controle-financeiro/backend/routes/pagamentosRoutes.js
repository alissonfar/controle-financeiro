const express = require('express');
const router = express.Router();
const pagamentosController = require('../controllers/pagamentosController');

// Rotas relacionadas aos pagamentos
router.post('/', pagamentosController.createPagamento);

// Rota de estorno utilizando o payload para identificação do pagamento
router.post('/estornar', pagamentosController.estornarPagamento);

// Rota para listar pagamentos
router.get('/', pagamentosController.listarPagamentos);

module.exports = router;
