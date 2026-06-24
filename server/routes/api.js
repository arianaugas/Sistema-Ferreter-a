const express = require('express');
const router = express.Router();

const authYUserRoutes = require('./subRutas/authYUsersRoutes');//importamos las rutas de AUTH y USUARIOS
const prodRoutes = require('./subRutas/productosRoutes');//importamos las rutas de PRODUCTOS
const catRoutes = require('./subRutas/categoriasRoutes'); //importamos las categorias y subcategorias
const catalogoRoutes = require('./subRutas/catalogoRoutes');//importamos las rutas de CATALOGO
const inventarioRoutes = require('./subRutas/inventarioRoutes');//importamos las rutas de INVENTARIO
const proveedoresRoutes = require('./subRutas/proveedoresRoutes');//importamos las rutas de PROVEEDORES
const empleadosRoutes = require('./subRutas/empleadosRoutes');//importamos las rutas de EMPLEADOS
const reportsDashRoutes = require('./subRutas/reportsYDashbRoutes');//importamos las rutas de REPORTES Y DASHBOARD
const configuracionRoutes = require('./subRutas/configAuditRoutes');//importamos las rutas de CONFIGURACION Y AUDITORIA
const comprasRoutes = require('./subRutas/comprasRoutes');//importamos las rutas de COMPRAS
const devolucionesRoutes = require('./subRutas/devolucionesRoutes');//importamos las rutas de DEVOLUCIONES
const ventasRoutes = require('./subRutas/ventasRoutes');//importamos las rutas de VENTAS
const cajaRoutes = require('./subRutas/cajaRoutes');//importamos las rutas de CAJA
const clientesRoutes = require('./subRutas/clientesRoutes');//importamos las rutas de CLIENTES

//rutas
router.use('/auth', authYUserRoutes);//usamos las rutas de AUTH y USUARIOS
router.use('/productos', prodRoutes);//usamos las rutas de PRODUCTOS
router.use('/categorias', catRoutes);//usamos las rutas de CATEGORIAS Y SUBCATEGORIAS
router.use('/catalogo', catalogoRoutes);//usamos las rutas de CATALOGO
router.use('/inventario', inventarioRoutes);//usamos las rutas de INVENTARIO
router.use('/proveedores', proveedoresRoutes);//usamos las rutas de PROVEEDORES
router.use('/empleados', empleadosRoutes);//usamos las rutas de EMPLEADOS
router.use('/reportes', reportsDashRoutes);//usamos las rutas de REPORTES y DASHBOARD
router.use('/configuracion', configuracionRoutes);//usamos las rutas de CONFIGURACION Y AUDITORIA
router.use('/compras', comprasRoutes);//usamos las rutas de COMPRAS
router.use('/devoluciones', devolucionesRoutes);//usamos las rutas de devoluciones
router.use('/ventas', ventasRoutes);//usamos las rutas de ventas
router.use('/caja', cajaRoutes);//usamos las ruta de ventas
router.use('/clientes', clientesRoutes);//usamos las rutas de clientes

//exportamos
module.exports = router;
