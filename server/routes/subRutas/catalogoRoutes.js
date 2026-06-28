const express = require('express');
const router = express.Router();
//importamos los controladores y middlewares de marcas y unidades
const marcasCtrl = require('../../controllers/marcasController');
const unidadesCtrl = require('../../controllers/unidadesController');
const { revisarToken, verificarAccesoModulo } = require('../../middlewares/auth');

//acceso a productos
const accesoProductos = verificarAccesoModulo('/productos');

//rutas de marcas
router.get('/marcas', revisarToken, marcasCtrl.getAll);
router.get('/marcas/:id', revisarToken, marcasCtrl.getById);
router.post('/marcas', revisarToken, accesoProductos, marcasCtrl.crearMarca);
router.put('/marcas/:id', revisarToken,accesoProductos , marcasCtrl.editarMarca);
router.delete('/marcas/:id', revisarToken, accesoProductos ,marcasCtrl.desactivarMarca);

//rutas de unidades 
router.get('/unidades', revisarToken, unidadesCtrl.getAll);
router.get('/unidades/:id', revisarToken, unidadesCtrl.getById);
router.post('/unidades', revisarToken, accesoProductos , unidadesCtrl.crearUnidad);
router.put('/unidades/:id', revisarToken, accesoProductos , unidadesCtrl.editarUnidad);
router.delete('/unidades/:id', revisarToken, accesoProductos , unidadesCtrl.desactivarUnidad);


//exportamos
module.exports = router;
