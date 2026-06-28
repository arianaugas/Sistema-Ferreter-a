const express = require('express');
const router = express.Router();
const provCtrl = require('../../controllers/proveedoresController');
const { revisarToken, verificarAccesoModulo } = require('../../middlewares/auth');

//usuarios permitidos
const usersPermitidos = verificarAccesoModulo('/proveedores');

// Proveedores
router.get('/comparativa', revisarToken, provCtrl.getComparativa);
router.get('/', revisarToken, provCtrl.getAll);
router.get('/:id', revisarToken, provCtrl.getById);
router.post('/', revisarToken,usersPermitidos, provCtrl.crearProveedor);
router.put('/:id', revisarToken, usersPermitidos, provCtrl.editarProveedor);
router.delete('/:id', revisarToken, usersPermitidos, provCtrl.desactivarProveedor);

// Contactos
router.post('/:id/contactos', revisarToken, usersPermitidos, provCtrl.addContacto);
router.delete('/:id/contactos/:idContacto', revisarToken, usersPermitidos, provCtrl.removeContacto);

// Productos del proveedor
router.get('/:id/productos', revisarToken, provCtrl.getProductosByProveedor);
router.post('/:id/productos', revisarToken, usersPermitidos, provCtrl.addProducto);
router.delete('/:id/productos/:idProducto', revisarToken, usersPermitidos, provCtrl.removeProducto);

module.exports = router;