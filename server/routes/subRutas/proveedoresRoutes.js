const express = require('express');
const router = express.Router();
const provCtrl = require('../../controllers/proveedoresController');
const { revisarToken } = require('../../middlewares/auth');

// Proveedores
router.get('/comparativa', revisarToken, provCtrl.getComparativa);
router.get('/', revisarToken, provCtrl.getAll);
router.get('/:id', revisarToken, provCtrl.getById);
router.post('/', revisarToken, provCtrl.crearProveedor);
router.put('/:id', revisarToken, provCtrl.editarProveedor);
router.delete('/:id', revisarToken, provCtrl.desactivarProveedor);

// Contactos
router.post('/:id/contactos', revisarToken, provCtrl.addContacto);
router.delete('/:id/contactos/:idContacto', revisarToken, provCtrl.removeContacto);

// Productos del proveedor
router.post('/:id/productos', revisarToken, provCtrl.addProducto);
router.delete('/:id/productos/:idProducto', revisarToken, provCtrl.removeProducto);

module.exports = router;