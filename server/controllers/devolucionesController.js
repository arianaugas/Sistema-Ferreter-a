const { sql, query, withTransaction } = require('../db/conexion_sql');

// DEVOLUCIONES CONTROLLER

// Listar devoluciones con filtros
const getAll = async (req, res) => {
    const { estado, tipo, fecha_desde, fecha_hasta } = req.query;
    try {
        let where = 'WHERE 1=1';
        const params = {};

        if (estado) {
            where += ' AND d.estado = @estado';
            params.estado = { type: sql.VarChar, value: estado };
        }
        if (tipo) {
            where += ' AND d.tipo = @tipo';
            params.tipo = { type: sql.VarChar, value: tipo };
        }
        if (fecha_desde) {
            if (isNaN(Date.parse(fecha_desde))) {
                return res.status(400).json({ ok: false, mensaje: 'fecha_desde no es una fecha válida.' });
            }
            where += ' AND CAST(d.fecha AS DATE) >= @fecha_desde';
            params.fecha_desde = { type: sql.Date, value: fecha_desde };
        }
        if (fecha_hasta) {
            if (isNaN(Date.parse(fecha_hasta))) {
                return res.status(400).json({ ok: false, mensaje: 'fecha_hasta no es una fecha válida.' });
            }
            where += ' AND CAST(d.fecha AS DATE) <= @fecha_hasta';
            params.fecha_hasta = { type: sql.Date, value: fecha_hasta };
        }
        if (fecha_desde && fecha_hasta && new Date(fecha_desde) > new Date(fecha_hasta)) {
            return res.status(400).json({ ok: false, mensaje: 'fecha_desde no puede ser mayor a fecha_hasta.' });
        }

        const result = await query(
            `SELECT
                d.id_devolucion,
                d.id_venta,
                d.fecha,
                d.motivo,
                d.tipo,
                d.estado,
                d.monto_reembolso,
                v.numero_comprobante,
                ISNULL(c.nombre, 'Sin cliente') AS cliente_nombre,
                e.nombre + ' ' + e.apellido     AS empleado_nombre
             FROM devoluciones d
             INNER JOIN ventas    v ON v.id_venta    = d.id_venta
             LEFT JOIN  clientes  c ON c.id_cliente  = v.id_cliente
             INNER JOIN empleados e ON e.id_empleado = d.id_empleado
             ${where}
             ORDER BY d.fecha DESC`,
            params
        );

        return res.json({
            ok: true,
            total: result.recordset.length,
            devoluciones: result.recordset
        });
    } catch (err) {
        console.error('Error al obtener devoluciones:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// Detalle de devolución + productos devueltos
const getById = async (req, res) => {
    const { id } = req.params;
    try {
        const devResult = await query(
            `SELECT
                d.id_devolucion,
                d.id_venta,
                d.fecha,
                d.motivo,
                d.tipo,
                d.estado,
                d.monto_reembolso,
                v.numero_comprobante,
                ISNULL(c.nombre, 'Sin cliente') AS cliente_nombre,
                e.nombre + ' ' + e.apellido     AS empleado_nombre
             FROM devoluciones d
             INNER JOIN ventas    v ON v.id_venta    = d.id_venta
             LEFT JOIN  clientes  c ON c.id_cliente  = v.id_cliente
             INNER JOIN empleados e ON e.id_empleado = d.id_empleado
             WHERE d.id_devolucion = @id`,
            { id: { type: sql.Int, value: id } }
        );

        if (devResult.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Devolución no encontrada.' });
        }

        const detalleResult = await query(
            `SELECT
                dd.id_detalle,
                dd.id_producto,
                dd.cantidad,
                dd.reingresa_stock,
                dd.precio_devuelto,
                p.nombre   AS producto_nombre,
                p.codigo   AS producto_codigo
             FROM detalle_devolucion dd
             INNER JOIN productos p ON p.id_producto = dd.id_producto
             WHERE dd.id_devolucion = @id`,
            { id: { type: sql.Int, value: id } }
        );

        return res.json({
            ok: true,
            devolucion: devResult.recordset[0],
            detalle: detalleResult.recordset
        });
    } catch (err) {
        console.error('Error al obtener detalle de devolución:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// Crear devolución vinculada a una venta
const create = async (req, res) => {
    const { id_venta, id_caja, id_almacen, motivo, tipo, productos } = req.body;

    // id_usuario e id_empleado vienen del token
    const id_usuario  = req.user.id;
    const id_empleado = req.user.id_empleado;

    if (!id_venta || !id_caja || !id_almacen || !tipo || !productos || productos.length === 0) {
        return res.status(400).json({ ok: false, mensaje: 'Datos incompletos.' });
    }
    if (!['cambio', 'reembolso'].includes(tipo)) {
        return res.status(400).json({ ok: false, mensaje: 'Tipo debe ser cambio o reembolso.' });
    }

    try {
        // Validar que la venta exista y no esté anulada
        const ventaResult = await query(
            'SELECT id_venta, estado FROM ventas WHERE id_venta = @id_venta',
            { id_venta: { type: sql.Int, value: id_venta } }
        );
        if (ventaResult.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada.' });
        }
        if (ventaResult.recordset[0].estado === 'anulada') {
            return res.status(400).json({ ok: false, mensaje: 'No se puede hacer una devolución de una venta anulada.' });
        }

        // Validar que la caja esté abierta
        const cajaResult = await query(
            'SELECT estado FROM cajas WHERE id_caja = @id_caja',
            { id_caja: { type: sql.Int, value: id_caja } }
        );
        if (cajaResult.recordset.length === 0) {
            return res.status(400).json({ ok: false, mensaje: 'La caja seleccionada no existe.' });
        }
        if (cajaResult.recordset[0].estado === 'vencida') {
            return res.status(400).json({ ok: false, mensaje: 'La caja seleccionada venció su turno. Elige otra caja para continuar.' });
        }
        if (cajaResult.recordset[0].estado !== 'abierta') {
            return res.status(400).json({ ok: false, mensaje: 'La caja seleccionada ya se encuentra cerrada.' });
        }

        const result = await withTransaction(async (transaction) => {

            let monto_reembolso = 0;
            const productosConPrecio = [];

            // Validar productos y calcular monto dentro de la transacción
            for (const p of productos) {
                const reqDetalle = transaction.request();
                reqDetalle.input('id_venta',    sql.Int, id_venta);
                reqDetalle.input('id_producto', sql.Int, p.id_producto);
                const detalleResult = await reqDetalle.query(`
                    SELECT cantidad, precio_unitario
                    FROM detalle_venta
                    WHERE id_venta = @id_venta AND id_producto = @id_producto
                `);

                if (detalleResult.recordset.length === 0) {
                    throw new Error(`El producto ID ${p.id_producto} no pertenece a la venta original.`);
                }

                const { cantidad: cantidad_vendida, precio_unitario } = detalleResult.recordset[0];

                // Sumar lo ya devuelto en devoluciones anteriores (no anuladas) de esta misma venta
                const yaDevueltoResult = await reqDetalle.query(`
                    SELECT ISNULL(SUM(dd.cantidad), 0) AS ya_devuelto
                    FROM detalle_devolucion dd
                    INNER JOIN devoluciones d ON d.id_devolucion = dd.id_devolucion
                    WHERE d.id_venta = @id_venta
                      AND dd.id_producto = @id_producto
                      AND d.estado <> 'anulada'
                `);
                const ya_devuelto = parseFloat(yaDevueltoResult.recordset[0].ya_devuelto);
                const disponible_para_devolver = cantidad_vendida - ya_devuelto;

                if (p.cantidad > disponible_para_devolver) {
                    throw new Error(
                        `El producto ID ${p.id_producto} solo tiene ${disponible_para_devolver} unidades disponibles para devolver (vendidas: ${cantidad_vendida}, ya devueltas: ${ya_devuelto}).`
                    );
                }

                const precio_devuelto = parseFloat(precio_unitario);
                monto_reembolso += p.cantidad * precio_devuelto;
                productosConPrecio.push({ ...p, precio_devuelto });
            }

            // Si es cambio el monto_reembolso es 0
            if (tipo === 'cambio') monto_reembolso = 0;
            monto_reembolso = parseFloat(monto_reembolso.toFixed(2));

            // Insertar cabecera devolución
            const reqCab = transaction.request();
            reqCab.input('id_venta',        sql.Int,          id_venta);
            reqCab.input('id_empleado',     sql.Int,          id_empleado);
            reqCab.input('motivo',          sql.VarChar(200), motivo || null);
            reqCab.input('tipo',            sql.VarChar(10),  tipo);
            reqCab.input('monto_reembolso', sql.Decimal(10,2), monto_reembolso);
            const cabResult = await reqCab.query(`
                INSERT INTO devoluciones (id_venta, id_empleado, motivo, tipo, estado, monto_reembolso)
                OUTPUT INSERTED.*
                VALUES (@id_venta, @id_empleado, @motivo, @tipo, 'pendiente', @monto_reembolso)
            `);
            const nuevaDev = cabResult.recordset[0];

            for (const p of productosConPrecio) {

                // Insertar detalle devolución
                const reqDet = transaction.request();
                reqDet.input('id_devolucion',  sql.Int,          nuevaDev.id_devolucion);
                reqDet.input('id_producto',    sql.Int,          p.id_producto);
                reqDet.input('cantidad',       sql.Decimal(10,2), p.cantidad);
                reqDet.input('reingresa_stock', sql.Bit,          p.reingresa_stock ? 1 : 0);
                reqDet.input('precio_devuelto', sql.Decimal(10,2), p.precio_devuelto);
                await reqDet.query(`
                    INSERT INTO detalle_devolucion (id_devolucion, id_producto, cantidad, reingresa_stock, precio_devuelto)
                    VALUES (@id_devolucion, @id_producto, @cantidad, @reingresa_stock, @precio_devuelto)
                `);

                // Si reingresa al stock: actualizar productos y kardex
                if (p.reingresa_stock) {
                    const reqStock = transaction.request();
                    reqStock.input('id_producto', sql.Int,           p.id_producto);
                    reqStock.input('cantidad',    sql.Decimal(10,2), p.cantidad);
                    const resStock = await reqStock.query(`
                        UPDATE productos
                        SET stock_actual = stock_actual + @cantidad
                        OUTPUT DELETED.stock_actual AS stock_anterior, INSERTED.stock_actual AS stock_posterior
                        WHERE id_producto = @id_producto
                    `);
                    const { stock_anterior, stock_posterior } = resStock.recordset[0];

                    const reqKardex = transaction.request();
                    reqKardex.input('id_producto',     sql.Int,           p.id_producto);
                    reqKardex.input('id_almacen',      sql.Int,           id_almacen);
                    reqKardex.input('cantidad',        sql.Decimal(10,2), p.cantidad);
                    reqKardex.input('stock_anterior',  sql.Decimal(10,2), stock_anterior);
                    reqKardex.input('stock_posterior', sql.Decimal(10,2), stock_posterior);
                    reqKardex.input('id_usuario',      sql.Int,           id_usuario);
                    reqKardex.input('referencia_id',   sql.Int,           nuevaDev.id_devolucion);
                    await reqKardex.query(`
                        INSERT INTO kardex (id_producto, id_almacen, tipo_movimiento, motivo, referencia_id, referencia_tipo, cantidad, stock_anterior, stock_posterior, id_usuario)
                        VALUES (@id_producto, @id_almacen, 'entrada', 'Devolución de venta', @referencia_id, 'devolucion', @cantidad, @stock_anterior, @stock_posterior, @id_usuario)
                    `);
                }
            }

            // Si es reembolso: registrar egreso en caja
            if (tipo === 'reembolso') {
                const reqCaja = transaction.request();
                reqCaja.input('id_caja',      sql.Int,          id_caja);
                reqCaja.input('id_usuario',   sql.Int,          id_usuario);
                reqCaja.input('monto',        sql.Decimal(10,2), monto_reembolso);
                reqCaja.input('referencia_id', sql.Int,          nuevaDev.id_devolucion);
                reqCaja.input('concepto',     sql.VarChar(150), `Reembolso por devolución ID ${nuevaDev.id_devolucion}`);
                await reqCaja.query(`
                    INSERT INTO movimientos_caja (id_caja, id_usuario, tipo, concepto, referencia_id, monto)
                    VALUES (@id_caja, @id_usuario, 'egreso', @concepto, @referencia_id, @monto)
                `);

                const reqUpCaja = transaction.request();
                reqUpCaja.input('id_caja', sql.Int,           id_caja);
                reqUpCaja.input('monto',   sql.Decimal(10,2), monto_reembolso);
                await reqUpCaja.query(
                    'UPDATE cajas SET monto_esperado = monto_esperado - @monto WHERE id_caja = @id_caja'
                );
            }

            return nuevaDev;
        });

        return res.status(201).json({ ok: true, devolucion: result });

    } catch (err) {
        console.error('Error al crear devolución:', err);
        if (err.message.startsWith('El producto') || err.message.startsWith('La cantidad')) {
            return res.status(400).json({ ok: false, mensaje: err.message });
        }
        return res.status(500).json({ ok: false, mensaje: 'Error al procesar la devolución.' });
    }
};

// Procesar devolución
const procesar = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(
            `UPDATE devoluciones SET estado = 'procesada' 
             OUTPUT INSERTED.*
             WHERE id_devolucion = @id AND estado = 'pendiente'`,
            { id: { type: sql.Int, value: id } }
        );

        if (result.recordset.length === 0) {
            return res.status(400).json({ ok: false, mensaje: 'No se puede procesar la devolución.' });
        }

        return res.json({ ok: true, devolucion: result.recordset[0] });
    } catch (err) {
        console.error('Error al procesar devolución:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// Anular devolución
const anular = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(
            `UPDATE devoluciones SET estado = 'anulada' 
             OUTPUT INSERTED.*
             WHERE id_devolucion = @id AND estado = 'pendiente'`,
            { id: { type: sql.Int, value: id } }
        );

        if (result.recordset.length === 0) {
            return res.status(400).json({ ok: false, mensaje: 'No se puede anular la devolución.' });
        }

        return res.json({ ok: true, devolucion: result.recordset[0] });
    } catch (err) {
        console.error('Error al anular devolución:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    procesar,
    anular
};