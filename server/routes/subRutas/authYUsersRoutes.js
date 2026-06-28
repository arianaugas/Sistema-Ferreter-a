const express = require('express');
const router = express.Router();

//importamos los controllers y middlewares de AUTH , USUARIOSS Y ROLES
const authCtrl = require('../../controllers/authController')
const usuariosCtrl = require('../../controllers/usuariosController')
const { revisarToken, verificarAccesoModulo} = require('../../middlewares/auth');
const { validarLogin } = require('../../middlewares/validationMiddleware')
const rolesCtrl = require('../../controllers/rolesController');
const { getMisPermisos } = require('../../controllers/permisosController');

//usuarios permitidos
const usersPermitidos = verificarAccesoModulo('/usuarios');

//rutas de permisos: restringen el acceso al sistema segun rol
router.get('/mis-permisos', revisarToken, getMisPermisos);

//rutas de AUTH
router.post('/login', validarLogin, authCtrl.login);
router.post('/logout', revisarToken, authCtrl.logout);
router.get('/me', revisarToken, authCtrl.getUsuario)

//rutas de USUARIOS (gestión de cuentas: solo Administrador)
router.get('/users', revisarToken, usuariosCtrl.getAll);
router.get('/users/:id', revisarToken, usuariosCtrl.getById);
router.post('/users', revisarToken, usersPermitidos, usuariosCtrl.crearUsuario);
router.put('/users/:id', revisarToken, usersPermitidos, usuariosCtrl.editarUsuario);
router.delete('/users/:id', revisarToken, usersPermitidos, usuariosCtrl.desactivarUsuario);

// cambiar-contrasena se deja solo con revisarToken: cada usuario cambia la suya y ya exige la contraseña anterior
router.put('/users/:id/cambiar-contrasena', revisarToken, usuariosCtrl.cambiarContrasena);

//rutas de ROLES (lectura libre, escritura solo Administrador)
router.get('/roles', revisarToken, rolesCtrl.getAll);
router.get('/roles/:id', revisarToken, rolesCtrl.getById);
router.post('/roles', revisarToken, usersPermitidos, rolesCtrl.crearRol);
router.put('/roles/:id', revisarToken, usersPermitidos, rolesCtrl.editarRol);
//router.delete('/roles/:id',revisarToken, rolesCtrl.eliminarRol); ignorar

//exportamos
module.exports = router;
