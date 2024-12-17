const express = require('express');
const router = express.Router();
const contasController = require('../controllers/contasController');

// Endpoints relacionados a contas
router.post('/', contasController.criarConta);
router.get('/', contasController.listarContas);
router.put('/:id', contasController.atualizarConta);
router.delete('/:id', contasController.excluirConta);

module.exports = router;
