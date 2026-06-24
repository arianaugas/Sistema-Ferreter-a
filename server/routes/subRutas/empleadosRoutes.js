const express = require('express');
const router = express.Router();

//importamos los controllers y middlewares de EMPLEADOS Y CARGOS
const empleCtrl = require('../../controllers/empleadosController');
const { revisarToken } = require('../../middlewares/auth');


//rutas de cargos
router.get('/cargos', revisarToken, empleCtrl.getCargos);
router.post('/cargos', revisarToken, empleCtrl.crearCargo);
router.put('/cargos/:id', revisarToken, empleCtrl.editarCargo);
router.delete('/cargos/:id',revisarToken, empleCtrl.eliminarCargo);

//rutas de empleados
router.get('/', revisarToken, empleCtrl.getAll);
router.get('/:id', revisarToken, empleCtrl.getById);
router.post('/', revisarToken, empleCtrl.crearEmpleado);
router.put('/:id', revisarToken, empleCtrl.editarEmpleado);


module.exports=router;