const express = require('express');
const router = express.Router();
const clientesController = require('../../controllers/clientesController');
const { revisarToken, verificarAccesoModulo  } = require('../../middlewares/auth');

//acceso a clientes
const accesoClientes = verificarAccesoModulo('/clientes');


//rutas de clientes
router.get('/', revisarToken, clientesController.getAll);
router.get('/:id', revisarToken, clientesController.getById);
router.post('/', revisarToken, accesoClientes, clientesController.create);
router.put('/:id', revisarToken, accesoClientes, clientesController.update);
router.patch('/:id/desactivar', revisarToken, clientesController.deactivate);

module.exports = router;