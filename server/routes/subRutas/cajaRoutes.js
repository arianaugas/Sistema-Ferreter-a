const express = require('express');
const router = express.Router();
const cajaController = require('../../controllers/cajaController');
const { revisarToken, verificarAccesoModulo} = require('../../middlewares/auth');

//usuarios permitidos
const usersPermitidos = verificarAccesoModulo('/caja');

router.get('/activa', revisarToken, cajaController.getCajaActiva);
router.get('/abiertas', revisarToken, cajaController.getCajasAbiertas);
router.post('/abrir', revisarToken, usersPermitidos, cajaController.abrirCaja);
router.patch('/:id/cerrar', revisarToken, usersPermitidos,  cajaController.cerrarCaja);
router.get('/:id/movimientos', revisarToken, cajaController.getMovimientos);
router.post('/:id/movimientos', revisarToken, usersPermitidos,  cajaController.addMovimiento);
router.get('/:id/resumen', revisarToken, cajaController.getResumen);

module.exports = router;