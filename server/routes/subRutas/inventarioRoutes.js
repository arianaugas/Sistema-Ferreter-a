const express = require('express');
const router = express.Router();
const invCtrl = require('../../controllers/inventarioController');
const { revisarToken } = require('../../middlewares/auth');

//rutas de Almacenes
router.get('/almacenes', revisarToken, invCtrl.getAlmacenes);
router.get('/almacenes/:id', revisarToken, invCtrl.getAlmacenById);
router.post('/almacenes', revisarToken, invCtrl.crearAlmacen);
router.put('/almacenes/:id', revisarToken, invCtrl.editarAlmacen);
router.delete('/almacenes/:id', revisarToken, invCtrl.desactivarAlmacen);

//rutas de Stock
router.get('/stock', revisarToken, invCtrl.getStock);

//rutas de Kardex
router.get('/kardex/:idProducto', revisarToken, invCtrl.getKardex);

//rutas de Ajuste
router.post('/ajuste', revisarToken, invCtrl.ajustarStock);

//rutas de Lotes
router.get('/lotes', revisarToken, invCtrl.getAllLotes);
router.get('/lotes/:idProducto', revisarToken, invCtrl.getLotes);

//rutas de Transferencias
router.get('/transferencias', revisarToken, invCtrl.getTransferencias);
router.get('/transferencias/:id', revisarToken, invCtrl.getTransferenciaById);
router.post('/transferencias', revisarToken, invCtrl.crearTransferencia);
router.patch('/transferencias/:id/completar', revisarToken, invCtrl.completarTransferencia);

module.exports = router;