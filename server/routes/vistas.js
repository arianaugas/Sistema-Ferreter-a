const express = require('express');
const router = express.Router();
const path = require('path');
//importamos el middleware del tocken
const { revisarToken } = require('../middlewares/auth')

// Carpeta pública
const views = path.join(__dirname, '../../public/pages');

//ruta publica - solo loginn
router.get('/', (req, res) => res.redirect('/login'));
router.get('/login', (req, res) => res.sendFile('login.html', { root: views }));

//rutas para solo admin (usuario logeado) 
router.get('/inicio',revisarToken, (req, res) => res.sendFile('index.html', { root: views }));
router.get('/productos',revisarToken, (req, res) => res.sendFile('productos.html', { root: views }));
router.get('/clientes',revisarToken, (req, res) => res.sendFile('clientes.html', { root: views }));
router.get('/usuarios',revisarToken, (req, res) => res.sendFile('usuarios.html', { root: views }));
router.get('/caja',revisarToken, (req, res) => res.sendFile('caja.html', { root: views }));
router.get('/compras',revisarToken, (req, res) => res.sendFile('compras.html', { root: views }));
router.get('/configuracion-auditoria',revisarToken, (req, res) => res.sendFile('config_Auditoria.html', { root: views }));
router.get('/devoluciones',revisarToken, (req, res) => res.sendFile('devoluciones.html', { root: views }));
router.get('/empleados',revisarToken, (req, res) => res.sendFile('empleados.html', { root: views }));
router.get('/inventario',revisarToken, (req, res) => res.sendFile('inventario.html', { root: views }));
router.get('/proveedores',revisarToken, (req, res) => res.sendFile('proveedores.html', { root: views }));
router.get('/reportes',revisarToken, (req, res) => res.sendFile('reportes.html', { root: views }));
router.get('/ventas',revisarToken, (req, res) => res.sendFile('ventas.html', { root: views }));

module.exports = router;
