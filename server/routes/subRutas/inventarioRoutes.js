const express = require('express');
const router = express.Router();
const invCtrl = require('../../controllers/inventarioController');
const { revisarToken, permitirRoles } = require('../../middlewares/auth');

//usuarios permitidos, mjorar dsps, INVENTAR UN ROL MÁS DSPS
const usersPermitidos = permitirRoles('Administrador', 'Vendedor', 'Almacenero')

//rutas de Almacenes
router.get('/almacenes', revisarToken, invCtrl.getAlmacenes);
router.get('/almacenes/:id', revisarToken, invCtrl.getAlmacenById);
router.post('/almacenes', revisarToken, usersPermitidos, invCtrl.crearAlmacen);
router.put('/almacenes/:id', revisarToken, usersPermitidos, invCtrl.editarAlmacen);
router.delete('/almacenes/:id', revisarToken, usersPermitidos, invCtrl.desactivarAlmacen);

//rutas de Stock
router.get('/stock', revisarToken, invCtrl.getStock);

//rutas de Kardex
router.get('/kardex/:idProducto', revisarToken, invCtrl.getKardex);

//rutas de Ajuste
router.post('/ajuste', revisarToken, usersPermitidos, invCtrl.ajustarStock);

//rutas de Lotes
router.get('/lotes', revisarToken, invCtrl.getAllLotes);
router.get('/lotes/:idProducto', revisarToken, invCtrl.getLotes);

//rutas de Transferencias
router.get('/transferencias', revisarToken, invCtrl.getTransferencias);
router.get('/transferencias/:id', revisarToken, invCtrl.getTransferenciaById);
router.post('/transferencias', revisarToken, usersPermitidos, invCtrl.crearTransferencia);
router.patch('/transferencias/:id/completar', usersPermitidos, revisarToken, invCtrl.completarTransferencia);

module.exports = router;