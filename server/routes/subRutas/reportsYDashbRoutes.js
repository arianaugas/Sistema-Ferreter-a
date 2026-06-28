const express = require('express');
const router  = express.Router();

const reportesCtrl = require('../../controllers/reportesController');//CONTROLADOR DE REPORTES
const dashCtrl = require('../../controllers/dashboardController');//CONTROLADOR DE DASHBOARD
const { revisarToken, verificarAccesoModulo } = require('../../middlewares/auth');

const accesoReportes = verificarAccesoModulo('/reportes');

//rutas de REPORTES (requieren acceso al módulo Reportes)
router.get('/ventas', revisarToken, reportesCtrl.ventasPorPeriodo);
router.get('/productos-vendidos', revisarToken, reportesCtrl.productosMasVendidos);
router.get('/stock-bajo', revisarToken, reportesCtrl.stockBajo);
router.get('/lotes', revisarToken, reportesCtrl.reporteLotes);
router.get('/ganancias', revisarToken, accesoReportes, reportesCtrl.reporteGanancias);
router.get('/compras', revisarToken, accesoReportes, reportesCtrl.comprasPorPeriodo);
router.get('/gastos', revisarToken, accesoReportes, reportesCtrl.reporteGastos);
router.get('/cierres-caja', revisarToken, accesoReportes, reportesCtrl.cierresCaja);
router.get('/kardex', revisarToken, accesoReportes, reportesCtrl.kardexGeneral);
router.get('/kardex/:id', revisarToken, accesoReportes, reportesCtrl.kardexProducto);
router.get('/clientes-frecuentes', revisarToken, reportesCtrl.clientesFrecuentes);
router.get('/devoluciones', revisarToken, accesoReportes, reportesCtrl.reporteDevoluciones);

//rutas de DASHBOARD (info general, todos los roles las ven sin restricción de módulo)
router.get('/dashboard/resumen', revisarToken, dashCtrl.getResumen );
router.get('/dashboard/grafico-ventas', revisarToken, dashCtrl.getGraficoVentas );
router.get('/dashboard/alertas', revisarToken, dashCtrl.getAlertas );


module.exports = router;