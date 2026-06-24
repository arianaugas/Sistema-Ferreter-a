const express = require('express');
const router = express.Router();
const ventasController = require('../../controllers/ventasController');
const seriesController = require('../../controllers/seriesController');
const tiposPagoController = require('../../controllers/tiposPagoController');
const { revisarToken } = require('../../middlewares/auth');


// Rutas de Series de Comprobantes
router.get('/series', revisarToken, seriesController.getAll);
router.get('/series/:id', revisarToken, seriesController.getById);
router.post('/series', revisarToken, seriesController.crear);
router.put('/series/:id', revisarToken, seriesController.actualizar);
router.delete('/series/:id', revisarToken, seriesController.eliminar);

// Rutas de Tipos de Pago
router.get('/tipos-pago', revisarToken, tiposPagoController.getAll);
router.get('/tipos-pago/:id', revisarToken, tiposPagoController.getById);
router.post('/tipos-pago', revisarToken, tiposPagoController.crear);
router.put('/tipos-pago/:id', revisarToken, tiposPagoController.actualizar);
router.delete('/tipos-pago/:id', revisarToken, tiposPagoController.eliminar);

// Rutas de Ventas
router.get('/', revisarToken, ventasController.getAll);
router.get('/:id', revisarToken, ventasController.getById);
router.post('/', revisarToken, ventasController.create);
router.patch('/:id/anular', revisarToken, ventasController.anular);


module.exports = router;