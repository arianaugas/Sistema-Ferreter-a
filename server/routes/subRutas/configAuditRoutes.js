const express = require('express');
const router  = express.Router();

const configCtrl = require('../../controllers/configYAuditController');
const { revisarToken, permitirRoles } = require('../../middlewares/auth');

// Solo admin puede leer/escribir configuración (IGNORAR)
/*const soloAdmin = (req, res, next) => {
    const rolesPermitidos = [1, 2]; // ajusta según tus ids de rol
    if (!rolesPermitidos.includes(req.user?.id_rol)) {
        return res.status(403).json({ error: 'No tiene permisos para este recurso.' });
    }
    next();
};*/

//usuarios permitidos, mjorar dsps
const usersPermitidos = permitirRoles('Administrador')

//rutas de auditoria
router.get('/auditoria', revisarToken, usersPermitidos, configCtrl.getLogs);
router.get('/auditoria/:id', revisarToken, usersPermitidos, configCtrl.getLogById);

//rutas de turnos
router.get('/turnos', revisarToken, configCtrl.getTurnos);
router.get('/turnos/:id', revisarToken, configCtrl.getTurnoById);
router.post('/turnos', revisarToken, usersPermitidos, configCtrl.crearTurno);
router.put('/turnos/:id', revisarToken, usersPermitidos, configCtrl.editarTurno);

//rutas de asignacion de turno a empleados
router.get('/turnos-empleados', revisarToken, configCtrl.getEmpleadosConTurno);
router.put('/turnos-empleados/:id', revisarToken, usersPermitidos, configCtrl.asignarTurnoEmpleado);

//rutas de configuracion
router.get('/', revisarToken, configCtrl.getAll);
router.get('/:clave', revisarToken, usersPermitidos, configCtrl.getByKey);
router.put('/:clave', revisarToken, usersPermitidos, configCtrl.update);


module.exports = router;