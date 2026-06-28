const express = require('express');
const router  = express.Router();

const configCtrl = require('../../controllers/configYAuditController');
const { revisarToken, verificarAccesoModulo } = require('../../middlewares/auth');

//usuarios permitidos
const usersPermitidos = verificarAccesoModulo('/configuracion-auditoria');

//rutas de auditoria
router.get('/auditoria', revisarToken, configCtrl.getLogs);
router.get('/auditoria/:id', revisarToken, configCtrl.getLogById);

//rutas de turnos
router.get('/turnos', revisarToken, configCtrl.getTurnos);
router.get('/turnos/:id', revisarToken, configCtrl.getTurnoById);
router.post('/turnos', revisarToken, usersPermitidos, configCtrl.crearTurno);
router.put('/turnos/:id', revisarToken, usersPermitidos, configCtrl.editarTurno);
router.delete('/turnos/:id', revisarToken, usersPermitidos, configCtrl.eliminarTurno);

//rutas de asignacion de turno a empleados
router.get('/turnos-empleados', revisarToken, configCtrl.getEmpleadosConTurno);
router.put('/turnos-empleados/:id', revisarToken, usersPermitidos, configCtrl.asignarTurnoEmpleado);

//rutas de configuracion
router.get('/', revisarToken, configCtrl.getAll);
router.get('/:clave', revisarToken, usersPermitidos, configCtrl.getByKey);
router.put('/:clave', revisarToken, usersPermitidos, configCtrl.update);


module.exports = router;