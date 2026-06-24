const express = require('express');
const router = express.Router();
//importamos los controladores y middlewares de categorias y subcategorias
const catCtrl = require('../../controllers/categoriasController');
const subCatCtrl = require('../../controllers/subcategoriasController');
const { revisarToken } = require('../../middlewares/auth');

//rutas de Sub‑categorías
router.get('/sub', revisarToken, subCatCtrl.getAll);
router.get('/sub/:id', revisarToken, subCatCtrl.getById);
router.post('/sub/', revisarToken, subCatCtrl.crear);
router.put('/sub/:id', revisarToken, subCatCtrl.actualizar);
//router.delete('/sub/:id', revisarToken, subCatCtrl.desactivar);

//rutas de categorías
router.get('/cat', revisarToken, catCtrl.getAll);
router.get('/cat/:id', revisarToken, catCtrl.getById);
router.post('/cat/', revisarToken, catCtrl.crearCategoria);
router.put('/cat/:id', revisarToken, catCtrl.actualizarCategoria);
//router.delete('/cat/:id', revisarToken, catCtrl.desactivarCategoria); IGNORAR

//exportamos
module.exports = router;
