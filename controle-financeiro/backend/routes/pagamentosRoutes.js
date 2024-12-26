const express = require('express');
const router = express.Router();
const pagamentosController = require('../controllers/pagamentosController');

// Rotas relacionadas aos pagamentos
router.post('/', pagamentosController.createPagamento);
// Outras rotas podem ser adicionadas aqui futuramente

module.exports = router;
