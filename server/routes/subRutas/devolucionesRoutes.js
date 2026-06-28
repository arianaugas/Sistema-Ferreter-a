const express = require('express');
const router = express.Router();
const devCtrl = require('../../controllers/devolucionesController');//controllers de devoluciones
const { revisarToken, verificarAccesoModulo} = require('../../middlewares/auth');

//usuarios permitidos
const usersPermitidos = verificarAccesoModulo('/devoluciones');

//Rutas de devoluciones
router.get('/', revisarToken, devCtrl.getAll);
router.get('/:id', revisarToken , devCtrl.getById);
router.post('/', revisarToken, usersPermitidos ,devCtrl.create);
router.patch('/:id/procesar', revisarToken, usersPermitidos , devCtrl.procesar);
router.patch('/:id/anular', revisarToken, usersPermitidos , devCtrl.anular);


module.exports = router;