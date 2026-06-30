const { sql, query } = require('../db/conexion_sql');


const getResumen = async (req, res) => {
    try {
        // Ventas del día
        const ventasHoy = await query(
            `SELECT
                COUNT(id_venta)  AS cantidad_ventas,
                ISNULL(SUM(total), 0) AS total_recaudado
             FROM ventas
             WHERE estado <> 'anulada'
               AND CONVERT(DATE, fecha) = CONVERT(DATE, GETDATE())`
        );

        // Productos con stock bajo
        const stockBajo = await query(
            `SELECT COUNT(*) AS cantidad
             FROM productos
             WHERE activo = 1 AND stock_actual < stock_minimo`
        );

        // Productos sin stock
        const sinStock = await query(
            `SELECT COUNT(*) AS cantidad
             FROM productos
             WHERE activo = 1 AND stock_actual <= 0`
        );

        // Caja activa
        const cajaActiva = await query(
            `SELECT TOP 1
                c.id_caja,
                c.numero_turno,
                c.monto_inicial,
                c.fecha_apertura,
                e.nombre + ' ' + e.apellido AS cajero
             FROM cajas c
             INNER JOIN empleados e ON e.id_empleado = c.id_empleado
             WHERE c.estado = 'abierta'
             ORDER BY c.fecha_apertura DESC`
        );

        // Últimas 5 ventas
        const ultimasVentas = await query(
            `SELECT TOP 5
                v.id_venta,
                v.numero_comprobante,
                v.fecha,
                v.total,
                v.estado,
                ISNULL(c.nombre, 'Sin cliente') AS cliente,
                e.nombre + ' ' + e.apellido     AS empleado
             FROM ventas v
             LEFT JOIN clientes  c ON c.id_cliente   = v.id_cliente
             INNER JOIN empleados e ON e.id_empleado = v.id_empleado
             ORDER BY v.fecha DESC`
        );

        return res.json({
            ok: true,
            resumen: {
                ventas_hoy: ventasHoy.recordset[0],
                stock_bajo: stockBajo.recordset[0].cantidad,
                sin_stock: sinStock.recordset[0].cantidad,
                caja_activa: cajaActiva.recordset[0] || null,
                ultimas_ventas: ultimasVentas.recordset
            }
        });
    } catch (err) {
        console.error('Error en getResumen:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const getGraficoVentas = async (req, res) => {
    const dias = parseInt(req.query.dias) || 7;

    if (![7, 30].includes(dias)) {
        return res.status(400).json({ ok: false, mensaje: 'El parámetro días debe ser 7 o 30.' });
    }

    try {
        const result = await query(
            `SELECT
                CONVERT(VARCHAR(10), CONVERT(DATE, fecha), 120) AS fecha,
                COUNT(id_venta)                                  AS cantidad_ventas,
                ISNULL(SUM(total), 0)                           AS total
             FROM ventas
             WHERE estado <> 'anulada'
               AND fecha >= DATEADD(DAY, -@dias, CONVERT(DATE, GETDATE()))
             GROUP BY CONVERT(DATE, fecha)
             ORDER BY CONVERT(DATE, fecha)`,
            { dias: { type: sql.Int, value: dias } }
        );
        return res.json({ ok: true, dias, datos: result.recordset });
    } catch (err) {
        console.error('Error en getGraficoVentas:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


const getAlertas = async (req, res) => {
    try {
        // Productos con stock bajo (pero no en 0)
        const stockBajo = await query(
            `SELECT
                id_producto,
                codigo,
                nombre,
                stock_actual,
                stock_minimo,
                stock_minimo - stock_actual AS faltante
             FROM productos
             WHERE activo = 1
               AND stock_actual > 0
               AND stock_actual < stock_minimo
             ORDER BY faltante DESC`
        );

        // Productos sin stock
        const sinStock = await query(
            `SELECT
                id_producto,
                codigo,
                nombre,
                stock_actual,
                stock_minimo
             FROM productos
             WHERE activo = 1 AND stock_actual <= 0
             ORDER BY nombre`
        );

        // Órdenes de compra pendientes (enviadas, sin recibir)
        const ordenesPendientes = await query(
            `SELECT
                oc.id_orden,
                oc.numero_orden,
                oc.fecha,
                oc.fecha_esperada,
                oc.total,
                prov.nombre AS proveedor
             FROM ordenes_compra oc
             INNER JOIN proveedores prov ON prov.id_proveedor = oc.id_proveedor
             WHERE oc.estado = 'enviada'
             ORDER BY oc.fecha_esperada ASC`
        );

        return res.json({
            ok: true,
            alertas: {
                stock_bajo: stockBajo.recordset,
                sin_stock: sinStock.recordset,
                ordenes_pendientes: ordenesPendientes.recordset,
                total_alertas:
                    stockBajo.recordset.length +
                    sinStock.recordset.length +
                    ordenesPendientes.recordset.length
            }
        });
    } catch (err) {
        console.error('Error en getAlertas:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


module.exports = { 
    getResumen, 
    getGraficoVentas, 
    getAlertas 
};