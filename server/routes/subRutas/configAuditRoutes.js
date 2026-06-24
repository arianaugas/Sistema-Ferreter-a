const express = require('express');
const router  = express.Router();

const configCtrl = require('../../controllers/configYAuditController');
const { revisarToken } = require('../../middlewares/auth');

// Solo admin puede leer/escribir configuración (IGNORAR)
/*const soloAdmin = (req, res, next) => {
    const rolesPermitidos = [1, 2]; // ajusta según tus ids de rol
    if (!rolesPermitidos.includes(req.user?.id_rol)) {
        return res.status(403).json({ error: 'No tiene permisos para este recurso.' });
    }
    next();
};*/


//rutas de auditoria
router.get('/auditoria', revisarToken, configCtrl.getLogs);
router.get('/auditoria/:id', revisarToken, configCtrl.getLogById);


//rutas de configuracion
router.get('/', revisarToken, configCtrl.getAll);
router.get('/:clave', revisarToken, configCtrl.getByKey);
router.put('/:clave', revisarToken, configCtrl.update);


module.exports = router;