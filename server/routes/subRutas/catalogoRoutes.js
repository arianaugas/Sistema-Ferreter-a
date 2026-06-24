const express = require('express');
const router = express.Router();
//importamos los controladores y middlewares de marcas y unidades
const marcasCtrl = require('../../controllers/marcasController');
const unidadesCtrl = require('../../controllers/unidadesController');
const { revisarToken } = require('../../middlewares/auth')

//rutas de marcas
router.get('/marcas', revisarToken, marcasCtrl.getAll);
router.get('/marcas/:id', revisarToken, marcasCtrl.getById);
router.post('/marcas', revisarToken, marcasCtrl.crearMarca);
router.put('/marcas/:id', revisarToken, marcasCtrl.editarMarca);
router.delete('/marcas/:id', revisarToken, marcasCtrl.desactivarMarca);

//rutas de unidades 
router.get('/unidades', revisarToken, unidadesCtrl.getAll);
router.get('/unidades/:id', revisarToken, unidadesCtrl.getById);
router.post('/unidades', revisarToken, unidadesCtrl.crearUnidad);
router.put('/unidades/:id', revisarToken, unidadesCtrl.editarUnidad);
router.delete('/unidades/:id', revisarToken, unidadesCtrl.desactivarUnidad);


//exportamos
module.exports = router;
