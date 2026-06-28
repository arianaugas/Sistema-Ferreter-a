const express = require('express');
const router = express.Router();

//importamos los controllers y middlewares de EMPLEADOS Y CARGOS
const empleCtrl = require('../../controllers/empleadosController');
const { revisarToken, verificarAccesoModulo } = require('../../middlewares/auth');

//usuarios q tienen acceso permitido
const usersPermitidos = verificarAccesoModulo('/empleados');

//rutas de cargos
router.get('/cargos', revisarToken, empleCtrl.getCargos);
router.post('/cargos', revisarToken, usersPermitidos , empleCtrl.crearCargo);
router.put('/cargos/:id', revisarToken, usersPermitidos , empleCtrl.editarCargo);
router.delete('/cargos/:id',revisarToken, usersPermitidos , empleCtrl.eliminarCargo);

//rutas de empleados
router.get('/', revisarToken, empleCtrl.getAll);
router.get('/:id', revisarToken, empleCtrl.getById);
router.post('/', revisarToken, usersPermitidos, empleCtrl.crearEmpleado);
router.put('/:id', revisarToken, usersPermitidos, empleCtrl.editarEmpleado);
router.delete('/:id', revisarToken,usersPermitidos, empleCtrl.desactivarEmpleado);


module.exports=router;