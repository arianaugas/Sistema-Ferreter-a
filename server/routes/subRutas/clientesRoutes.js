const express = require('express');
const router = express.Router();
const clientesController = require('../../controllers/clientesController');
const { revisarToken } = require('../../middlewares/auth');

//rutas de clientes
router.get('/', revisarToken, clientesController.getAll);
router.get('/:id', revisarToken, clientesController.getById);
router.post('/', revisarToken, clientesController.create);
router.put('/:id', revisarToken, clientesController.update);
router.patch('/:id/desactivar', revisarToken, clientesController.deactivate);

module.exports = router;