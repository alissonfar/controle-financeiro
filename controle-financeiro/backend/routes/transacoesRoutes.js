const express = require('express');
const router = express.Router();
const transacoesController = require('../controllers/transacoesController');

// Endpoints relacionados a transações
router.get('/', transacoesController.listarTransacoes);
router.post('/', transacoesController.criarTransacao);
router.put('/:id/estornar', transacoesController.estornarTransacao);

module.exports = router;
