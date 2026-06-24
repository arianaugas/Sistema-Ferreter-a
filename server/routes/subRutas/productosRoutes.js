const express = require('express');
const router = express.Router();
//importamos los controladores y middlewares de productos
const prodCtrl = require('../../controllers/productosController')
const { revisarToken } = require('../../middlewares/auth')
const { uploadImage } = require('../../middlewares/uploadMiddleware');

//rutas de Productos
router.get('/', revisarToken, prodCtrl.getAll);
router.get('/:id', revisarToken, prodCtrl.getById);
router.post('/', revisarToken, uploadImage, prodCtrl.crearProducto);
router.put('/:id', revisarToken, uploadImage, prodCtrl.editarProducto);
router.delete('/:id', revisarToken, prodCtrl.desactivarProducto);
router.post('/:id/imagenes', revisarToken, uploadImage, prodCtrl.uploadImage);
router.delete('/:id/imagenes/:idImagen', revisarToken, prodCtrl.deleteImage);

//exportamos
module.exports = router;


