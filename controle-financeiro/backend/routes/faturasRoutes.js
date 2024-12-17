const express = require('express');
const router = express.Router();
const faturasController = require('../controllers/faturasController');

// Endpoints relacionados a faturas
router.get('/', faturasController.listarFaturas);
router.post('/', faturasController.criarFatura);
router.put('/:id', faturasController.atualizarFatura);
router.delete('/:id', faturasController.excluirFatura);

module.exports = router;
