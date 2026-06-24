const express = require('express');
const router = express.Router();
const comprasCtrl = require('../../controllers/comprasController');//controllers de compras
const { revisarToken } = require('../../middlewares/auth');


//Rutas de Compras
router.get('/', revisarToken, comprasCtrl.getOrdenes);
router.get('/:id', revisarToken, comprasCtrl.getOrdenById);
router.post('/', revisarToken, comprasCtrl.crearOrden);
router.patch('/:id/enviar', revisarToken, comprasCtrl.enviarOrden);
router.patch('/:id/anular', revisarToken, comprasCtrl.anularOrden);
router.post('/:id/recepciones', revisarToken, comprasCtrl.crearRecepcion);
router.get('/:id/recepciones', revisarToken, comprasCtrl.getRecepcionesByOrdenId);

module.exports = router
