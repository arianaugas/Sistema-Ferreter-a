const { sql, query } = require('../db/conexion_sql');



// ventasPorPeriodo
// Totales de ventas agrupados por día/semana/mes, filtrable por rango y empleado
const ventasPorPeriodo = async (req, res) => {
    const { desde, hasta, agrupacion = 'dia', id_empleado, tipo_comprobante } = req.query;

    //validamos los tipos de comprobante validos
    const tiposValidos = ['boleta', 'factura', 'nota_venta'];
    if (tipo_comprobante && !tiposValidos.includes(tipo_comprobante)) {
        return res.status(400).json({ ok: false, mensaje: 'tipo_comprobante inválido.' });
    }

    // Validar agrupacion
    const agrupacionesValidas = ['dia', 'semana', 'mes'];
    if (!agrupacionesValidas.includes(agrupacion)) {
        return res.status(400).json({ ok: false, mensaje: 'Agrupación inválida. Use: dia, semana, mes.' });
    }

    if (desde && isNaN(Date.parse(desde))) {
        return res.status(400).json({ ok: false, mensaje: 'desde no es una fecha válida.' });
    }
    if (hasta && isNaN(Date.parse(hasta))) {
        return res.status(400).json({ ok: false, mensaje: 'hasta no es una fecha válida.' });
    }
    if (desde && hasta && new Date(desde) > new Date(hasta)) {
        return res.status(400).json({ ok: false, mensaje: 'desde no puede ser mayor a hasta.' });
    }

    // Construir expresión de agrupación
    const grupos = {
        dia: "CONVERT(DATE, fecha)",
        semana: "DATEPART(YEAR, fecha), DATEPART(WEEK, fecha)",
        mes: "YEAR(fecha), MONTH(fecha)"
    };
    const labelMap = {
        dia: "CONVERT(VARCHAR(10), CONVERT(DATE, fecha), 120)",
        semana: "CONCAT(DATEPART(YEAR, fecha), '-W', RIGHT('0'+CAST(DATEPART(WEEK, fecha) AS VARCHAR),2))",
        mes: "CONCAT(YEAR(fecha), '-', RIGHT('0'+CAST(MONTH(fecha) AS VARCHAR),2))"
    };

    const groupExpr = grupos[agrupacion];
    const labelExpr = labelMap[agrupacion];

    let whereClausules = [`v.estado <> 'anulada'`];
    const params = {};

    if (desde) {
        whereClausules.push(`v.fecha >= @desde`);
        params.desde = { type: sql.DateTime2, value: new Date(desde) };
    }
    if (hasta) {
        whereClausules.push(`v.fecha <= @hasta`);
        params.hasta = { type: sql.DateTime2, value: new Date(hasta) };
    }
    if (id_empleado) {
        whereClausules.push(`v.id_empleado = @id_empleado`);
        params.id_empleado = { type: sql.Int, value: parseInt(id_empleado) };
    }
    if (tipo_comprobante) {
        whereClausules.push(`sc.tipo_comprobante = @tipo_comprobante`);
        params.tipo_comprobante = { type: sql.VarChar, value: tipo_comprobante };
    }

    const where = whereClausules.length ? `WHERE ${whereClausules.join(' AND ')}` : '';

    try {
        const result = await query(
            `SELECT
                ${labelExpr}    AS periodo,
                COUNT(v.id_venta) AS cantidad_ventas,
                SUM(v.subtotal) AS subtotal,
                SUM(v.igv) AS igv,
                SUM(v.total) AS total
            FROM ventas v
            INNER JOIN serie_comprobantes sc ON sc.id_serie = v.id_serie
            ${where}
            GROUP BY ${groupExpr}
            ORDER BY ${groupExpr}`,
            params
        );
        return res.json({ ok: true, agrupacion, datos: result.recordset });
    } catch (err) {
        console.error('Error en ventasPorPeriodo:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


// productosMasVendidos
// Ranking de productos por cantidad o monto en un período
const productosMasVendidos = async (req, res) => {
    const { desde, hasta, orden = 'cantidad', limite = 10 } = req.query;

    const ordenesValidos = ['cantidad', 'monto'];
    if (!ordenesValidos.includes(orden)) {
        return res.status(400).json({ ok: false, mensaje: 'Orden inválido. Use: cantidad, monto.' });
    }


    const columnaOrden = orden === 'monto' ? 'total_monto' : 'total_cantidad';

    let where = `WHERE v.estado <> 'anulada'`;
    const params = {
        limite: { type: sql.Int, value: parseInt(limite) || 10 }
    };

    if (desde) {
        where += ` AND v.fecha >= @desde`;
        params.desde = { type: sql.DateTime2, value: new Date(desde) };
    }
    if (hasta) {
        where += ` AND v.fecha <= @hasta`;
        params.hasta = { type: sql.DateTime2, value: new Date(hasta) };
    }

    try {
        const result = await query(
            `SELECT TOP (@limite)
                p.id_producto,
                p.codigo,
                p.nombre                        AS producto,
                SUM(dv.cantidad)                AS total_cantidad,
                SUM(dv.subtotal)                AS total_monto
             FROM detalle_venta dv
             INNER JOIN ventas   v ON v.id_venta   = dv.id_venta
             INNER JOIN productos p ON p.id_producto = dv.id_producto
             ${where}
             GROUP BY p.id_producto, p.codigo, p.nombre
             ORDER BY ${columnaOrden} DESC`,
            params
        );
        return res.json({ ok: true, orden, datos: result.recordset });
    } catch (err) {
        console.error('Error en productosMasVendidos:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};



// stockBajo
// Productos cuyo stock_actual < stock_minimo
const stockBajo = async (req, res) => {
    const { id_categoria } = req.query;

    let whereClausules = [
        'p.activo = 1',
        'p.stock_actual < p.stock_minimo'
    ];
    const params = {};

    if (id_categoria) {
        whereClausules.push('cat.id_categoria = @id_categoria');
        params.id_categoria = { type: sql.Int, value: parseInt(id_categoria) };
    }

    const where = `WHERE ${whereClausules.join(' AND ')}`;

    try {
        const result = await query(
            `SELECT
                p.id_producto,
                p.codigo,
                p.nombre,
                p.ubicacion,
                p.stock_actual,
                p.stock_minimo,
                p.stock_minimo - p.stock_actual AS diferencia,
                cat.nombre                       AS categoria,
                sc.nombre                        AS subcategoria,
                ISNULL(prov.nombre, '—')         AS proveedor_preferido
            FROM productos p
            INNER JOIN subcategorias sc   ON sc.id_subcategoria = p.id_subcategoria
            INNER JOIN categorias     cat ON cat.id_categoria   = sc.id_categoria
            LEFT JOIN  productos_proveedor pp  ON pp.id_producto = p.id_producto
                AND pp.es_preferido = 1
            LEFT JOIN  proveedores     prov ON prov.id_proveedor = pp.id_proveedor
            ${where}
            ORDER BY diferencia DESC`,
            params
        );
        return res.json({ ok: true, total: result.recordset.length, datos: result.recordset });
    } catch (err) {
        console.error('Error en stockBajo:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

//Historial de compras por proveedor o por producto en un rango de fechas. ---(FALTA COMPLETAR Y MEJORAR)
// comprasPorPeriodo, Totales de compras agrupados por período y proveedor
const comprasPorPeriodo = async (req, res) => {
    const { desde, hasta, agrupacion = 'dia', id_proveedor } = req.query;

    const agrupacionesValidas = ['dia', 'semana', 'mes'];
    if (!agrupacionesValidas.includes(agrupacion)) {
        return res.status(400).json({ ok: false, mensaje: 'Agrupación inválida. Use: dia, semana, mes.' });
    }

    if (desde && isNaN(Date.parse(desde))) {
        return res.status(400).json({ ok: false, mensaje: 'desde no es una fecha válida.' });
    }
    if (hasta && isNaN(Date.parse(hasta))) {
        return res.status(400).json({ ok: false, mensaje: 'hasta no es una fecha válida.' });
    }
    if (desde && hasta && new Date(desde) > new Date(hasta)) {
        return res.status(400).json({ ok: false, mensaje: 'desde no puede ser mayor a hasta.' });
    }

    const labelMap = {
        dia: "CONVERT(VARCHAR(10), CONVERT(DATE, oc.fecha), 120)",
        semana: "CONCAT(DATEPART(YEAR, oc.fecha), '-W', RIGHT('0'+CAST(DATEPART(WEEK, oc.fecha) AS VARCHAR),2))",
        mes: "CONCAT(YEAR(oc.fecha), '-', RIGHT('0'+CAST(MONTH(oc.fecha) AS VARCHAR),2))"
    };
    const groupMap = {
        dia: "CONVERT(DATE, oc.fecha)",
        semana: "DATEPART(YEAR, oc.fecha), DATEPART(WEEK, oc.fecha)",
        mes: "YEAR(oc.fecha), MONTH(oc.fecha)"
    };

    let whereClausules = [`oc.estado <> 'anulada'`];
    const params = {};

    if (desde) {
        whereClausules.push(`oc.fecha >= @desde`);
        params.desde = { type: sql.DateTime2, value: new Date(desde) };
    }
    if (hasta) {
        whereClausules.push(`oc.fecha <= @hasta`);
        params.hasta = { type: sql.DateTime2, value: new Date(hasta) };
    }
    if (id_proveedor) {
        whereClausules.push(`oc.id_proveedor = @id_proveedor`);
        params.id_proveedor = { type: sql.Int, value: parseInt(id_proveedor) };
    }

    const where = `WHERE ${whereClausules.join(' AND ')}`;

    try {
        const result = await query(
            `SELECT
                ${labelMap[agrupacion]} AS periodo,
                prov.nombre AS proveedor,
                COUNT(oc.id_orden) AS cantidad_ordenes,
                SUM(oc.subtotal) AS subtotal,
                SUM(oc.igv) AS igv,
                SUM(oc.total) AS total
             FROM ordenes_compra oc
             INNER JOIN proveedores prov ON prov.id_proveedor = oc.id_proveedor
             ${where}
             GROUP BY ${groupMap[agrupacion]}, prov.id_proveedor, prov.nombre
             ORDER BY ${groupMap[agrupacion]}, prov.nombre`,
            params
        );
        return res.json({ ok: true, agrupacion, datos: result.recordset });
    } catch (err) {
        console.error('Error en comprasPorPeriodo:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};



// cierresCaja
// Resumen de cierres de caja por rango de fechas con diferencias acumuladas
const cierresCaja = async (req, res) => {
    const { desde, hasta, id_empleado } = req.query;

    if (desde && isNaN(Date.parse(desde))) {
        return res.status(400).json({ ok: false, mensaje: 'desde no es una fecha válida.' });
    }
    if (hasta && isNaN(Date.parse(hasta))) {
        return res.status(400).json({ ok: false, mensaje: 'hasta no es una fecha válida.' });
    }
    if (desde && hasta && new Date(desde) > new Date(hasta)) {
        return res.status(400).json({ ok: false, mensaje: 'desde no puede ser mayor a hasta.' });
    }

    let whereClausules = [`c.estado = 'cerrada'`];
    const params = {};

    if (desde) {
        whereClausules.push(`CAST(c.fecha_cierre AS DATE) >= @desde`);
        params.desde = { type: sql.Date, value: desde };
    }
    if (hasta) {
        whereClausules.push(`CAST(c.fecha_cierre AS DATE) <= @hasta`);
        params.hasta = { type: sql.Date, value: hasta };
    }
    if (id_empleado) {
        whereClausules.push(`c.id_empleado = @id_empleado`);
        params.id_empleado = { type: sql.Int, value: parseInt(id_empleado) };
    }

    const where = `WHERE ${whereClausules.join(' AND ')}`;

    try {
        const result = await query(
            `SELECT
                c.id_caja,
                c.numero_turno,
                c.fecha_apertura,
                c.fecha_cierre,
                c.monto_inicial,
                c.monto_esperado,
                c.monto_real,
                c.diferencia,
                c.observacion,
                e.nombre + ' ' + e.apellido AS cajero
             FROM cajas c
             INNER JOIN empleados e ON e.id_empleado = c.id_empleado
             ${where}
             ORDER BY c.fecha_cierre DESC`,
            params
        );

        // Totales acumulados
        const totales = result.recordset.reduce((acc, row) => {
            acc.total_esperado += parseFloat(row.monto_esperado || 0);
            acc.total_real += parseFloat(row.monto_real || 0);
            acc.total_diferencia += parseFloat(row.diferencia || 0);
            return acc;
        }, { total_esperado: 0, total_real: 0, total_diferencia: 0 });

        totales.total_esperado = parseFloat(totales.total_esperado.toFixed(2));
        totales.total_real = parseFloat(totales.total_real.toFixed(2));
        totales.total_diferencia = parseFloat(totales.total_diferencia.toFixed(2));

        return res.json({
            ok: true,
            total_cierres: result.recordset.length,
            totales,
            datos: result.recordset
        });
    } catch (err) {
        console.error('Error en cierresCaja:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


// movimientosCaja
// Resumen de ingresos y egresos por caja y por fecha
const movimientosCaja = async (req, res) => {
    const { desde, hasta, id_caja } = req.query;

    if (desde && isNaN(Date.parse(desde))) {
        return res.status(400).json({ ok: false, mensaje: 'desde no es una fecha válida.' });
    }
    if (hasta && isNaN(Date.parse(hasta))) {
        return res.status(400).json({ ok: false, mensaje: 'hasta no es una fecha válida.' });
    }
    if (desde && hasta && new Date(desde) > new Date(hasta)) {
        return res.status(400).json({ ok: false, mensaje: 'desde no puede ser mayor a hasta.' });
    }

    let whereClausules = [];
    const params = {};

    if (desde) {
        whereClausules.push(`mc.registrado_en >= @desde`);
        params.desde = { type: sql.DateTime2, value: new Date(desde) };
    }
    if (hasta) {
        whereClausules.push(`mc.registrado_en <= @hasta`);
        params.hasta = { type: sql.DateTime2, value: new Date(hasta) };
    }
    if (id_caja) {
        whereClausules.push(`mc.id_caja = @id_caja`);
        params.id_caja = { type: sql.Int, value: parseInt(id_caja) };
    }

    const where = whereClausules.length ? `WHERE ${whereClausules.join(' AND ')}` : '';

    try {
        const result = await query(
            `SELECT
                CONVERT(DATE, mc.registrado_en)  AS fecha,
                c.id_caja,
                e.nombre + ' ' + e.apellido AS cajero,
                mc.tipo,
                COUNT(mc.id_movimiento) AS cantidad,
                SUM(mc.monto) AS total
             FROM movimientos_caja mc
             INNER JOIN cajas c ON c.id_caja = mc.id_caja
             INNER JOIN empleados e ON e.id_empleado = c.id_empleado
             ${where}
             GROUP BY CONVERT(DATE, mc.registrado_en), c.id_caja, e.nombre, e.apellido, mc.tipo
             ORDER BY fecha DESC, c.id_caja`,
            params
        );
        return res.json({ ok: true, datos: result.recordset });
    } catch (err) {
        console.error('Error en movimientosCaja:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};



// Kardex general — todos los productos con filtros opcionales
const kardexGeneral = async (req, res) => {
    const { desde, hasta, id_categoria } = req.query;

    let whereClausules = [];
    const params = {};

    if (id_categoria) {
        whereClausules.push(`sc.id_categoria = @id_categoria`);
        params.id_categoria = { type: sql.Int, value: parseInt(id_categoria) };
    }
    if (desde) {
        whereClausules.push(`k.registrado_en >= @desde`);
        params.desde = { type: sql.DateTime2, value: new Date(desde) };
    }
    if (hasta) {
        whereClausules.push(`k.registrado_en <= @hasta`);
        params.hasta = { type: sql.DateTime2, value: new Date(hasta) };
    }

    const where = whereClausules.length ? `WHERE ${whereClausules.join(' AND ')}` : '';

    try {
        const result = await query(
            `SELECT TOP 500
                k.id_kardex,
                p.codigo,
                p.nombre AS producto,
                k.tipo_movimiento,
                k.motivo,
                k.referencia_tipo,
                k.referencia_id,
                a.nombre AS almacen,
                k.cantidad,
                k.stock_anterior,
                k.stock_posterior,
                u.username AS usuario,
                k.registrado_en
            FROM kardex k
            INNER JOIN productos p ON p.id_producto = k.id_producto
            INNER JOIN subcategorias sc ON sc.id_subcategoria = p.id_subcategoria
            INNER JOIN almacenes a ON a.id_almacen = k.id_almacen
            INNER JOIN usuarios u ON u.id_usuario = k.id_usuario
            ${where}
            ORDER BY k.registrado_en DESC`,
            params
        );
        return res.json({ ok: true, movimientos: result.recordset });
    } catch (err) {
        console.error('Error en kardexGeneral:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


const kardexProducto = async (req, res) => {
    const { id } = req.params;
    const { desde, hasta } = req.query;

    if (!id) return res.status(400).json({ ok: false, mensaje: 'Se requiere el id del producto.' });

    if (desde && isNaN(Date.parse(desde))) {
        return res.status(400).json({ ok: false, mensaje: 'desde no es una fecha válida.' });
    }
    if (hasta && isNaN(Date.parse(hasta))) {
        return res.status(400).json({ ok: false, mensaje: 'hasta no es una fecha válida.' });
    }
    if (desde && hasta && new Date(desde) > new Date(hasta)) {
        return res.status(400).json({ ok: false, mensaje: 'desde no puede ser mayor a hasta.' });
    }

    let whereClausules = [`k.id_producto = @id_producto`];
    const params = {
        id_producto: { type: sql.Int, value: parseInt(id) }
    };

    if (desde) {
        whereClausules.push(`k.registrado_en >= @desde`);
        params.desde = { type: sql.DateTime2, value: new Date(desde) };
    }
    if (hasta) {
        whereClausules.push(`k.registrado_en <= @hasta`);
        params.hasta = { type: sql.DateTime2, value: new Date(hasta) };
    }

    const where = `WHERE ${whereClausules.join(' AND ')}`;

    try {
        // Verificar que el producto exista
        const prod = await query(
            `SELECT id_producto, codigo, nombre FROM productos WHERE id_producto = @id`,
            { id: { type: sql.Int, value: parseInt(id) } }
        );
        if (!prod.recordset.length) {
            return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
        }

        const result = await query(
            `SELECT
                k.id_kardex,
                k.tipo_movimiento,
                k.motivo,
                k.referencia_tipo,
                k.referencia_id,
                a.nombre AS almacen,
                k.cantidad,
                k.stock_anterior,
                k.stock_posterior,
                u.username AS usuario,
                k.registrado_en
             FROM kardex k
             INNER JOIN almacenes a  ON a.id_almacen = k.id_almacen
             INNER JOIN usuarios u ON u.id_usuario = k.id_usuario
             ${where}
             ORDER BY k.registrado_en DESC`,
            params
        );
        return res.json({
            ok: true,
            producto: prod.recordset[0],
            movimientos: result.recordset
        });
    } catch (err) {
        console.error('Error en kardexProducto:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


// clientesFrecuentes
// Ranking de clientes por número de compras o monto total
const clientesFrecuentes = async (req, res) => {
    const { desde, hasta, orden = 'compras', limite = 10 } = req.query;

    const ordenesValidos = ['compras', 'monto'];
    if (!ordenesValidos.includes(orden)) {
        return res.status(400).json({ ok: false, mensaje: 'Orden inválido. Use: compras, monto.' });
    }

    const columnaOrden = orden === 'monto' ? 'total_gastado' : 'total_compras';

    let where = `WHERE v.estado <> 'anulada' AND v.id_cliente IS NOT NULL`;
    const params = {
        limite: { type: sql.Int, value: parseInt(limite) || 10 }
    };

    if (desde) {
        where += ` AND v.fecha >= @desde`;
        params.desde = { type: sql.DateTime2, value: new Date(desde) };
    }
    if (hasta) {
        where += ` AND v.fecha <= @hasta`;
        params.hasta = { type: sql.DateTime2, value: new Date(hasta) };
    }

    try {
        const result = await query(
            `SELECT TOP (@limite)
                c.id_cliente,
                c.nombre AS cliente,
                c.tipo_documento,
                c.numero_documento,
                COUNT(v.id_venta) AS total_compras,
                SUM(v.total) AS total_gastado,
                MAX(v.fecha) AS ultima_compra
             FROM ventas v
             INNER JOIN clientes c ON c.id_cliente = v.id_cliente
             ${where}
             GROUP BY c.id_cliente, c.nombre, c.tipo_documento, c.numero_documento
             ORDER BY ${columnaOrden} DESC`,
            params
        );
        return res.json({ ok: true, orden, datos: result.recordset });
    } catch (err) {
        console.error('Error en clientesFrecuentes:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// reporteDevoluciones
// Lista de devoluciones con montos reembolsados en un período
const reporteDevoluciones = async (req, res) => {
    const { desde, hasta, tipo, estado } = req.query;

    if (desde && isNaN(Date.parse(desde))) {
        return res.status(400).json({ ok: false, mensaje: 'desde no es una fecha válida.' });
    }
    if (hasta && isNaN(Date.parse(hasta))) {
        return res.status(400).json({ ok: false, mensaje: 'hasta no es una fecha válida.' });
    }
    if (desde && hasta && new Date(desde) > new Date(hasta)) {
        return res.status(400).json({ ok: false, mensaje: 'desde no puede ser mayor a hasta.' });
    }
    if (tipo && !['cambio', 'reembolso'].includes(tipo)) {
        return res.status(400).json({ ok: false, mensaje: 'tipo inválido. Use: cambio, reembolso.' });
    }
    if (estado && !['pendiente', 'procesada', 'anulada'].includes(estado)) {
        return res.status(400).json({ ok: false, mensaje: 'estado inválido. Use: pendiente, procesada, anulada.' });
    }

    let whereClausules = [];
    const params = {};

    if (desde) {
        whereClausules.push(`CAST(d.fecha AS DATE) >= @desde`);
        params.desde = { type: sql.Date, value: desde };
    }
    if (hasta) {
        whereClausules.push(`CAST(d.fecha AS DATE) <= @hasta`);
        params.hasta = { type: sql.Date, value: hasta };
    }
    if (tipo) {
        whereClausules.push(`d.tipo = @tipo`);
        params.tipo = { type: sql.VarChar, value: tipo };
    }
    if (estado) {
        whereClausules.push(`d.estado = @estado`);
        params.estado = { type: sql.VarChar, value: estado };
    }

    const where = whereClausules.length ? `WHERE ${whereClausules.join(' AND ')}` : '';

    try {
        const result = await query(
            `SELECT
                d.id_devolucion,
                d.fecha,
                d.tipo,
                d.estado,
                d.motivo,
                d.monto_reembolso,
                v.numero_comprobante,
                ISNULL(c.nombre, 'Sin cliente') AS cliente_nombre,
                e.nombre + ' ' + e.apellido     AS empleado_nombre
             FROM devoluciones d
             INNER JOIN ventas v ON v.id_venta    = d.id_venta
             LEFT JOIN  clientes c ON c.id_cliente  = v.id_cliente
             INNER JOIN empleados e ON e.id_empleado = d.id_empleado
             ${where}
             ORDER BY d.fecha DESC`,
            params
        );

        // Total reembolsado solo de devoluciones procesadas
        const total_reembolsado = result.recordset
            .filter(r => r.estado === 'procesada' && r.tipo === 'reembolso')
            .reduce((acc, r) => acc + parseFloat(r.monto_reembolso || 0), 0);

        return res.json({
            ok: true,
            total: result.recordset.length,
            total_reembolsado: parseFloat(total_reembolsado.toFixed(2)),
            datos: result.recordset
        });
    } catch (err) {
        console.error('Error en reporteDevoluciones:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// reporteGanancias
const reporteGanancias = async (req, res) => {
    const { desde, hasta, id_categoria, id_subcategoria } = req.query;

    if (desde && isNaN(Date.parse(desde)))
        return res.status(400).json({ ok: false, mensaje: 'desde no es una fecha válida.' });
    if (hasta && isNaN(Date.parse(hasta)))
        return res.status(400).json({ ok: false, mensaje: 'hasta no es una fecha válida.' });
    if (desde && hasta && new Date(desde) > new Date(hasta))
        return res.status(400).json({ ok: false, mensaje: 'desde no puede ser mayor a hasta.' });

    let whereClausules = [`v.estado <> 'anulada'`];
    const params = {};

    if (desde) {
        whereClausules.push(`v.fecha >= @desde`);
        params.desde = { type: sql.DateTime2, value: new Date(desde) };
    }
    if (hasta) {
        whereClausules.push(`v.fecha <= @hasta`);
        params.hasta = { type: sql.DateTime2, value: new Date(hasta) };
    }
    if (id_subcategoria) {
        whereClausules.push(`p.id_subcategoria = @id_subcategoria`);
        params.id_subcategoria = { type: sql.Int, value: parseInt(id_subcategoria) };
    } else if (id_categoria) {
        whereClausules.push(`cat.id_categoria = @id_categoria`);
        params.id_categoria = { type: sql.Int, value: parseInt(id_categoria) };
    }

    const where = `WHERE ${whereClausules.join(' AND ')}`;

    try {
        const result = await query(
            `SELECT
                p.id_producto,
                p.codigo,
                p.nombre AS producto,
                cat.nombre AS categoria,
                sc.nombre AS subcategoria,
                SUM(dv.cantidad) AS unidades_vendidas,
                AVG(dv.precio_unitario) AS precio_venta_prom,
                AVG(p.precio_compra) AS precio_costo_prom,
                SUM(dv.subtotal) AS ingresos,
                SUM(dv.cantidad * p.precio_compra) AS costo_total,
                SUM(dv.subtotal) - SUM(dv.cantidad * p.precio_compra) AS ganancia
            FROM detalle_venta dv
            INNER JOIN ventas v ON v.id_venta  = dv.id_venta
            INNER JOIN productos p ON p.id_producto = dv.id_producto
            INNER JOIN subcategorias sc ON sc.id_subcategoria = p.id_subcategoria
            INNER JOIN categorias cat ON cat.id_categoria  = sc.id_categoria
            ${where}
            GROUP BY p.id_producto, p.codigo, p.nombre, cat.nombre, sc.nombre
            ORDER BY ganancia DESC`,
            params
        );

        const totales = result.recordset.reduce((acc, r) => {
            acc.ingresos += parseFloat(r.ingresos || 0);
            acc.costo_total += parseFloat(r.costo_total || 0);
            acc.ganancia += parseFloat(r.ganancia || 0);
            return acc;
        }, { ingresos: 0, costo_total: 0, ganancia: 0 });

        totales.ingresos = parseFloat(totales.ingresos.toFixed(2));
        totales.costo_total = parseFloat(totales.costo_total.toFixed(2));
        totales.ganancia = parseFloat(totales.ganancia.toFixed(2));

        return res.json({ ok: true, totales, datos: result.recordset });
    } catch (err) {
        console.error('Error en reporteGanancias:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// reporteLotes
const reporteLotes = async (req, res) => {
    const { estado, vence_antes } = req.query;

    const estadosValidos = ['caducado', 'por_vencer', 'vigente'];
    if (estado && !estadosValidos.includes(estado)) {
        return res.status(400).json({ ok: false, mensaje: 'estado inválido. Use: caducado, por_vencer, vigente.' });
    }

    let whereClausules = [`l.cantidad > 0`];
    const params = {};

    if (estado === 'caducado') {
        whereClausules.push(`l.fecha_vencimiento < CONVERT(DATE, GETDATE())`);
    } else if (estado === 'por_vencer') {
        whereClausules.push(`l.fecha_vencimiento >= CONVERT(DATE, GETDATE())`);
        whereClausules.push(`l.fecha_vencimiento <= DATEADD(DAY, 30, CONVERT(DATE, GETDATE()))`);
    } else if (estado === 'vigente') {
        whereClausules.push(`l.fecha_vencimiento > DATEADD(DAY, 30, CONVERT(DATE, GETDATE()))`);
    }

    if (vence_antes) {
        if (isNaN(Date.parse(vence_antes)))
            return res.status(400).json({ ok: false, mensaje: 'vence_antes no es una fecha válida.' });
        whereClausules.push(`l.fecha_vencimiento <= @vence_antes`);
        params.vence_antes = { type: sql.Date, value: vence_antes };
    }

    const where = `WHERE ${whereClausules.join(' AND ')}`;

    try {
        const result = await query(
            `SELECT
                l.id_lote,
                l.numero_lote,
                l.fecha_vencimiento,
                l.cantidad,
                p.nombre AS producto,
                p.codigo AS codigo_producto,
                a.nombre AS almacen,
                CASE
                    WHEN l.fecha_vencimiento < CONVERT(DATE, GETDATE())
                        THEN 'caducado'
                    WHEN l.fecha_vencimiento <= DATEADD(DAY, 30, CONVERT(DATE, GETDATE()))
                        THEN 'por_vencer'
                    ELSE 'vigente'
                END AS estado_lote
             FROM lotes l
             INNER JOIN productos p ON p.id_producto = l.id_producto
             INNER JOIN almacenes a ON a.id_almacen = l.id_almacen
             ${where}
             ORDER BY l.fecha_vencimiento ASC`,
            params
        );
        return res.json({ ok: true, total: result.recordset.length, datos: result.recordset });
    } catch (err) {
        console.error('Error en reporteLotes:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// reporteGastos
const reporteGastos = async (req, res) => {
    const { desde, hasta } = req.query;

    if (desde && isNaN(Date.parse(desde)))
        return res.status(400).json({ ok: false, mensaje: 'desde no es una fecha válida.' });
    if (hasta && isNaN(Date.parse(hasta)))
        return res.status(400).json({ ok: false, mensaje: 'hasta no es una fecha válida.' });
    if (desde && hasta && new Date(desde) > new Date(hasta))
        return res.status(400).json({ ok: false, mensaje: 'desde no puede ser mayor a hasta.' });

    let whereClausules = [`mc.tipo = 'egreso'`];
    const params = {};

    if (desde) {
        whereClausules.push(`mc.registrado_en >= @desde`);
        params.desde = { type: sql.DateTime2, value: new Date(desde) };
    }
    if (hasta) {
        whereClausules.push(`mc.registrado_en <= @hasta`);
        params.hasta = { type: sql.DateTime2, value: new Date(hasta) };
    }

    const where = `WHERE ${whereClausules.join(' AND ')}`;

    try {
        const result = await query(
            `SELECT
                mc.id_movimiento,
                mc.registrado_en,
                mc.concepto,
                mc.monto,
                mc.id_caja,
                c.numero_turno,
                e.nombre + ' ' + e.apellido AS cajero
             FROM movimientos_caja mc
             INNER JOIN cajas c ON c.id_caja = mc.id_caja
             INNER JOIN empleados e ON e.id_empleado = c.id_empleado
             ${where}
             ORDER BY mc.registrado_en DESC`,
            params
        );

        const total_gastos = result.recordset
            .reduce((acc, r) => acc + parseFloat(r.monto || 0), 0);

        return res.json({
            ok: true,
            total_gastos: parseFloat(total_gastos.toFixed(2)),
            datos: result.recordset
        });
    } catch (err) {
        console.error('Error en reporteGastos:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


module.exports = {
    ventasPorPeriodo,
    productosMasVendidos,
    stockBajo,
    comprasPorPeriodo,
    movimientosCaja,
    kardexGeneral,
    kardexProducto,
    clientesFrecuentes,
    cierresCaja,
    reporteDevoluciones,
    reporteGanancias,
    reporteLotes,
    reporteGastos
};