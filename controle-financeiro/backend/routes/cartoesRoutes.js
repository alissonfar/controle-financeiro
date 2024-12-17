const express = require('express');
const router = express.Router();
const cartoesController = require('../controllers/cartoesController');

// Endpoints relacionados a cartões
router.get('/', cartoesController.listarCartoes);
router.post('/', cartoesController.criarCartao);
router.put('/:id', cartoesController.atualizarCartao);
router.delete('/:id', cartoesController.excluirCartao);

module.exports = router;
