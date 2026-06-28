const express = require('express');
const router = express.Router();
const cajaController = require('../../controllers/cajaController');
const { revisarToken, permitirRoles } = require('../../middlewares/auth');

//usuarios permitidos, mjorar dsps
const usersPermitidos = permitirRoles('Administrador', 'Cajero')

router.get('/activa', revisarToken, usersPermitidos, cajaController.getCajaActiva);
router.get('/abiertas', revisarToken, cajaController.getCajasAbiertas);
router.post('/abrir', revisarToken, usersPermitidos, cajaController.abrirCaja);
router.patch('/:id/cerrar', revisarToken, usersPermitidos,  cajaController.cerrarCaja);
router.get('/:id/movimientos', revisarToken, usersPermitidos,  cajaController.getMovimientos);
router.post('/:id/movimientos', revisarToken, usersPermitidos,  cajaController.addMovimiento);
router.get('/:id/resumen', revisarToken, usersPermitidos, cajaController.getResumen);

module.exports = router;