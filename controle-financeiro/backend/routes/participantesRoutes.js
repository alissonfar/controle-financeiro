const express = require('express');
const router = express.Router();
const participantesController = require('../controllers/participantesController');

// Endpoints relacionados a participantes
router.post('/', participantesController.criarParticipante);
router.post('/:id/contas', participantesController.vincularContas);
router.get('/:id/contas', participantesController.listarContasVinculadas);
router.get('/', participantesController.listarParticipantes);
router.put('/:id', participantesController.atualizarParticipante);
router.delete('/:id', participantesController.excluirParticipante);

module.exports = router;
