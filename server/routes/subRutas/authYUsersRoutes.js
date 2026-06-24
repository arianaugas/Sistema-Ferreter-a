const express = require('express');
const router = express.Router();

//importamos los controllers y middlewares de AUTH , USUARIOSS Y ROLES
const authCtrl = require('../../controllers/authController')
const usuariosCtrl = require('../../controllers/usuariosController')
const { revisarToken } = require('../../middlewares/auth')
const { validarLogin } = require('../../middlewares/validationMiddleware')
const rolesCtrl = require('../../controllers/rolesController');

//rutas de AUTH
router.post('/login', validarLogin, authCtrl.login);
router.post('/logout', revisarToken, authCtrl.logout);
router.get('/me', revisarToken, authCtrl.getUsuario)

//rutas de USUARIOS
router.get('/users', revisarToken, usuariosCtrl.getAll);
router.get('/users/:id', revisarToken, usuariosCtrl.getById);
router.post('/users', revisarToken, usuariosCtrl.crearUsuario);
router.put('/users/:id', revisarToken, usuariosCtrl.editarUsuario);
router.delete('/users/:id', revisarToken, usuariosCtrl.desactivarUsuario);
router.put('/users/:id/cambiar-contrasena', revisarToken, usuariosCtrl.cambiarContrasena);

//rutas de ROLES
router.get('/roles',       revisarToken, rolesCtrl.getAll);
router.get('/roles/:id',   revisarToken, rolesCtrl.getById);
router.post('/roles',      revisarToken, rolesCtrl.crearRol);
router.put('/roles/:id',   revisarToken, rolesCtrl.editarRol);
//router.delete('/roles/:id',revisarToken, rolesCtrl.eliminarRol); ignorar

//exportamos
module.exports = router;
