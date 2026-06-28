const express = require('express');
const router = express.Router();
const permisosCtrl = require('../../controllers/permisosController');
const { revisarToken, verificarAccesoModulo } = require('../../middlewares/auth');

const soloAdmin = verificarAccesoModulo('/configuracion-auditoria');

router.get('/modulos', revisarToken, permisosCtrl.getModulos);
router.get('/rol/:id_rol', revisarToken, soloAdmin, permisosCtrl.getPermisosPorRol);
router.put('/rol/:id_rol', revisarToken, soloAdmin, permisosCtrl.guardarPermisos);

module.exports = router;