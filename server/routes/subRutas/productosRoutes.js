const express = require('express');
const router = express.Router();
//importamos los controladores y middlewares de productos
const prodCtrl = require('../../controllers/productosController');
const { revisarToken, verificarAccesoModulo } = require('../../middlewares/auth');
const { uploadImage } = require('../../middlewares/uploadMiddleware');

//usuarios permitidos
const usersPermitidos = verificarAccesoModulo('/productos');

//rutas de Productos para cualquiera
router.get('/', revisarToken, prodCtrl.getAll);
router.get('/:id', revisarToken, prodCtrl.getById);
router.post('/', revisarToken, usersPermitidos, uploadImage, prodCtrl.crearProducto);
router.put('/:id', revisarToken, usersPermitidos, uploadImage, prodCtrl.editarProducto);
router.delete('/:id', revisarToken, usersPermitidos, prodCtrl.desactivarProducto);
router.post('/:id/imagenes', revisarToken, usersPermitidos, uploadImage, prodCtrl.uploadImage);
router.delete('/:id/imagenes/:idImagen', revisarToken, usersPermitidos, prodCtrl.deleteImage);

//exportamos
module.exports = router;


