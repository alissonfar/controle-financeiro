const express = require('express');
const router = express.Router();
const pagamentosController = require('../controllers/pagamentosController');

// Rotas relacionadas aos pagamentos
router.post('/', pagamentosController.createPagamento);

router.post('/:id/estornar', pagamentosController.estornarPagamento);

router.get('/', pagamentosController.listarPagamentos);

module.exports = router;
