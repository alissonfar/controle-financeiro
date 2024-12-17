const express = require('express');
const router = express.Router();
const participantesController = require('../controllers/participantesController');

// Endpoints relacionados a participantes
router.post('/', participantesController.criarParticipante);
router.get('/', participantesController.listarParticipantes);
router.put('/:id', participantesController.atualizarParticipante);
router.delete('/:id', participantesController.excluirParticipante);

module.exports = router;
