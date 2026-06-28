const express = require('express');
const router = express.Router();
//importamos los controladores y middlewares de productos
const prodCtrl = require('../../controllers/productosController');
const { revisarToken, permitirRoles } = require('../../middlewares/auth');
const { uploadImage } = require('../../middlewares/uploadMiddleware');

//usuarios permitidos, mjorar dsps
const usersPermitidos = permitirRoles('Administrador');

//rutas de Productos para cualquiera
router.get('/', revisarToken, prodCtrl.getAll);
router.get('/:id', revisarToken, prodCtrl.getById);
router.post('/', revisarToken, usersPermitidos, uploadImage, prodCtrl.crearProducto);
router.put('/:id', revisarToken, usersPermitidos, uploadImage, prodCtrl.editarProducto);
router.delete('/:id', revisarToken, usersPermitidos, prodCtrl.desactivarProducto);
router.post('/:id/imagenes', revisarToken, usersPermitidos, uploadImage, prodCtrl.uploadImage);
router.delete('/:id/imagenes/:idImagen',usersPermitidos, revisarToken, prodCtrl.deleteImage);

//exportamos
module.exports = router;


