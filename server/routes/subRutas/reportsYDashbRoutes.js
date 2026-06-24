
const express = require('express');
const router  = express.Router();

const reportesCtrl = require('../../controllers/reportesController');//CONTROLADOR DE REPORTES
const dashCtrl = require('../../controllers/dashboardController');//CONTROLADOR DE DASHBOARD
const { revisarToken } = require('../../middlewares/auth');

// IGNORARRRRRRRRRR Y NO DESCOMENTAR
/*const soloAdmin = (req, res, next) => {
    const rolesPermitidos = [1, 2]; // ajusta según tus ids de rol
    if (!rolesPermitidos.includes(req.user?.id_rol)) {
        return res.status(403).json({ error: 'No tiene permisos para este recurso.' });
    }
    next();
};*/

//rutas de REPORTES
router.get('/ventas', revisarToken, reportesCtrl.ventasPorPeriodo);
router.get('/productos-vendidos',revisarToken, reportesCtrl.productosMasVendidos);
router.get('/stock-bajo', revisarToken, reportesCtrl.stockBajo);
router.get('/lotes', revisarToken, reportesCtrl.reporteLotes);
router.get('/ganancias', revisarToken, reportesCtrl.reporteGanancias);
router.get('/compras', revisarToken, reportesCtrl.comprasPorPeriodo);
router.get('/gastos', revisarToken, reportesCtrl.reporteGastos);
router.get('/cierres-caja', revisarToken, reportesCtrl.cierresCaja);
router.get('/kardex/:id', revisarToken, reportesCtrl.kardexProducto);
router.get('/clientes-frecuentes',revisarToken,reportesCtrl.clientesFrecuentes);
router.get('/devoluciones', revisarToken, reportesCtrl.reporteDevoluciones);

//rutas de DASHBOARD
router.get('/dashboard/resumen', revisarToken, dashCtrl.getResumen );
router.get('/dashboard/grafico-ventas', revisarToken, dashCtrl.getGraficoVentas );
router.get('/dashboard/alertas', revisarToken, dashCtrl.getAlertas );


module.exports = router;