const express = require('express');
const router = express.Router();
const comprasCtrl = require('../../controllers/comprasController');//controllers de compras
const { revisarToken, verificarAccesoModulo} = require('../../middlewares/auth');

//usuarios permitidos
const usersPermitidos = verificarAccesoModulo('/compras');

//Rutas de Compras
router.get('/', revisarToken, comprasCtrl.getOrdenes);
router.get('/:id', revisarToken, comprasCtrl.getOrdenById);
router.post('/', revisarToken, usersPermitidos, comprasCtrl.crearOrden);
router.patch('/:id/enviar', revisarToken, usersPermitidos,comprasCtrl.enviarOrden);
router.patch('/:id/anular', revisarToken, usersPermitidos, comprasCtrl.anularOrden);
router.post('/:id/recepciones', revisarToken, usersPermitidos, comprasCtrl.crearRecepcion);
router.get('/:id/recepciones', revisarToken,comprasCtrl.getRecepcionesByOrdenId);

module.exports = router
