const express = require('express');
const router = express.Router();
const cajaController = require('../../controllers/cajaController');
const { revisarToken } = require('../../middlewares/auth');

router.get('/activa', revisarToken, cajaController.getCajaActiva);
router.get('/abiertas', revisarToken, cajaController.getCajasAbiertas);
router.post('/abrir', revisarToken, cajaController.abrirCaja);
router.patch('/:id/cerrar', revisarToken, cajaController.cerrarCaja);
router.get('/:id/movimientos', revisarToken, cajaController.getMovimientos);
router.post('/:id/movimientos', revisarToken, cajaController.addMovimiento);
router.get('/:id/resumen', revisarToken, cajaController.getResumen);

module.exports = router;