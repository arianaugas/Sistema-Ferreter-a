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
            INNER JOIN ventas v ON v.id_venta = d.id_venta
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
                e.nombre + ' ' + e.apellido AS empleado_nombre
            FROM devoluciones d
            INNER JOIN ventas v ON v.id_venta = d.id_venta
            LEFT JOIN  clientes c ON c.id_cliente  = v.id_cliente
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
                p.nombre AS producto_nombre,
                p.codigo AS producto_codigo
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
    const id_usuario = req.user.id;
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
                reqDetalle.input('id_venta', sql.Int, id_venta);
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
            reqCab.input('id_venta', sql.Int, id_venta);
            reqCab.input('id_empleado', sql.Int, id_empleado);
            reqCab.input('motivo', sql.VarChar(200), motivo || null);
            reqCab.input('tipo', sql.VarChar(10), tipo);
            reqCab.input('monto_reembolso', sql.Decimal(10, 2), monto_reembolso);
            const cabResult = await reqCab.query(`
                INSERT INTO devoluciones (id_venta, id_empleado, motivo, tipo, estado, monto_reembolso)
                OUTPUT INSERTED.*
                VALUES (@id_venta, @id_empleado, @motivo, @tipo, 'pendiente', @monto_reembolso)
            `);
            const nuevaDev = cabResult.recordset[0];

            for (const p of productosConPrecio) {

                // Insertar detalle devolución
                const reqDet = transaction.request();
                reqDet.input('id_devolucion', sql.Int, nuevaDev.id_devolucion);
                reqDet.input('id_producto', sql.Int, p.id_producto);
                reqDet.input('cantidad', sql.Decimal(10, 2), p.cantidad);
                reqDet.input('reingresa_stock', sql.Bit, p.reingresa_stock ? 1 : 0);
                reqDet.input('precio_devuelto', sql.Decimal(10, 2), p.precio_devuelto);
                await reqDet.query(`
                    INSERT INTO detalle_devolucion (id_devolucion, id_producto, cantidad, reingresa_stock, precio_devuelto)
                    VALUES (@id_devolucion, @id_producto, @cantidad, @reingresa_stock, @precio_devuelto)
                `);

                // Si reingresa al stock: actualizar productos, productos_almacen y kardex
                if (p.reingresa_stock) {
                    // Stock global
                    const reqStock = transaction.request();
                    reqStock.input('id_producto', sql.Int, p.id_producto);
                    reqStock.input('cantidad', sql.Decimal(10, 2), p.cantidad);
                    const resStock = await reqStock.query(`
                        UPDATE productos
                        SET stock_actual = stock_actual + @cantidad
                        OUTPUT DELETED.stock_actual AS stock_anterior, INSERTED.stock_actual AS stock_posterior
                        WHERE id_producto = @id_producto
                    `);
                    const { stock_anterior, stock_posterior } = resStock.recordset[0];

                    // Stock por almacén (el almacén viene del body: id_almacen)
                    const reqStockAlm = transaction.request();
                    reqStockAlm.input('id_producto', sql.Int, p.id_producto);
                    reqStockAlm.input('id_almacen', sql.Int, id_almacen);
                    reqStockAlm.input('cantidad', sql.Decimal(10, 2), p.cantidad);
                    await reqStockAlm.query(`
                        IF EXISTS (
                            SELECT 1 FROM productos_almacen
                            WHERE id_producto = @id_producto AND id_almacen = @id_almacen
                        )
                            UPDATE productos_almacen
                            SET stock = stock + @cantidad
                            WHERE id_producto = @id_producto AND id_almacen = @id_almacen
                        ELSE
                            INSERT INTO productos_almacen (id_producto, id_almacen, stock)
                            VALUES (@id_producto, @id_almacen, @cantidad)
                    `);

                    // Kardex
                    const reqKardex = transaction.request();
                    reqKardex.input('id_producto', sql.Int, p.id_producto);
                    reqKardex.input('id_almacen', sql.Int, id_almacen);
                    reqKardex.input('cantidad', sql.Decimal(10, 2), p.cantidad);
                    reqKardex.input('stock_anterior', sql.Decimal(10, 2), stock_anterior);
                    reqKardex.input('stock_posterior', sql.Decimal(10, 2), stock_posterior);
                    reqKardex.input('id_usuario', sql.Int, id_usuario);
                    reqKardex.input('referencia_id', sql.Int, nuevaDev.id_devolucion);
                    await reqKardex.query(`
                        INSERT INTO kardex (id_producto, id_almacen, tipo_movimiento, motivo, referencia_id, referencia_tipo, cantidad, stock_anterior, stock_posterior, id_usuario)
                        VALUES (@id_producto, @id_almacen, 'entrada', 'Devolución de venta', @referencia_id, 'devolucion', @cantidad, @stock_anterior, @stock_posterior, @id_usuario)
                    `);
                }
            }

            // Si es reembolso: registrar egreso en caja.
            // Regla de negocio: TODO reembolso se entrega en efectivo desde la
            // caja física, sin importar cómo pagó el cliente originalmente.
            if (tipo === 'reembolso') {
                const reqCaja = transaction.request();
                reqCaja.input('id_caja', sql.Int, id_caja);
                reqCaja.input('id_usuario', sql.Int, id_usuario);
                reqCaja.input('monto', sql.Decimal(10, 2), monto_reembolso);
                reqCaja.input('referencia_id', sql.Int, nuevaDev.id_devolucion);
                reqCaja.input('concepto', sql.VarChar(150), `Reembolso por devolución ID ${nuevaDev.id_devolucion}`);
                await reqCaja.query(`
                    INSERT INTO movimientos_caja (id_caja, id_usuario, tipo, concepto, referencia_id, monto)
                    VALUES (@id_caja, @id_usuario, 'egreso', @concepto, @referencia_id, @monto)
                `);

                const reqUpCaja = transaction.request();
                reqUpCaja.input('id_caja', sql.Int, id_caja);
                reqUpCaja.input('monto', sql.Decimal(10, 2), monto_reembolso);
                await reqUpCaja.query(
                    'UPDATE cajas SET monto_esperado = monto_esperado - @monto WHERE id_caja = @id_caja'
                );
            }
            const reqUpVenta = transaction.request();
            reqUpVenta.input('id_venta', sql.Int, id_venta);
            await reqUpVenta.query(`
                        UPDATE ventas
                        SET estado = 'con_devolucion'
                        WHERE id_venta = @id_venta
                            AND estado <> 'anulada'
                    `);

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


// Anular devolución (revierte stock y caja si aplica)
const anular = async (req, res) => {
    const { id } = req.params;
    const id_usuario = req.user.id;

    try {
        await withTransaction(async (transaction) => {

            // 1. Leer la devolución (solo se puede anular si está pendiente)
            const reqDev = transaction.request();
            reqDev.input('id', sql.Int, id);
            const resDev = await reqDev.query(`
                    SELECT id_devolucion, id_venta, tipo, monto_reembolso
                    FROM devoluciones
                    WHERE id_devolucion = @id AND estado = 'pendiente'
                `);
            if (resDev.recordset.length === 0) {
                throw Object.assign(
                    new Error('No se puede anular: la devolución no existe o ya no está pendiente.'),
                    { statusCode: 400 }
                );
            }
            const dev = resDev.recordset[0];

            // 2. Leer el detalle de productos
            const reqDetalle = transaction.request();
            reqDetalle.input('id', sql.Int, id);
            const resDetalle = await reqDetalle.query(`
                SELECT id_producto, cantidad, reingresa_stock
                FROM detalle_devolucion
                WHERE id_devolucion = @id
            `);

            // 3. Por cada producto que reingresó al stock, revertirlo
            for (const item of resDetalle.recordset) {
                if (!item.reingresa_stock) continue;

                // Leer el almacén desde el kardex de esta devolución
                // (fue registrado ahí cuando se creó la devolución)
                const reqAlm = transaction.request();
                reqAlm.input('referencia_id', sql.Int, id);
                reqAlm.input('id_producto', sql.Int, item.id_producto);
                const resAlm = await reqAlm.query(`
                    SELECT TOP 1 id_almacen
                    FROM kardex
                    WHERE referencia_tipo = 'devolucion'
                        AND referencia_id = @referencia_id
                        AND id_producto = @id_producto
                        AND tipo_movimiento = 'entrada'
                    ORDER BY id DESC
                `);

                if (resAlm.recordset.length === 0) {
                    throw new Error(`No se encontró el registro de almacén para el producto ID ${item.id_producto}. No se puede revertir el stock.`);
                }
                const id_almacen = resAlm.recordset[0].id_almacen;

                // Descontar del stock global
                const reqStockGral = transaction.request();
                reqStockGral.input('id_producto', sql.Int, item.id_producto);
                reqStockGral.input('cantidad', sql.Decimal(10, 2), item.cantidad);
                const resStockGral = await reqStockGral.query(`
                    UPDATE productos
                    SET stock_actual = stock_actual - @cantidad
                    OUTPUT DELETED.stock_actual AS stock_anterior, INSERTED.stock_actual AS stock_posterior
                    WHERE id_producto = @id_producto
                `);
                const { stock_anterior, stock_posterior } = resStockGral.recordset[0];

                // Descontar del almacén específico
                const reqStockAlm = transaction.request();
                reqStockAlm.input('id_producto', sql.Int, item.id_producto);
                reqStockAlm.input('id_almacen', sql.Int, id_almacen);
                reqStockAlm.input('cantidad', sql.Decimal(10, 2), item.cantidad);
                await reqStockAlm.query(`
                    UPDATE productos_almacen
                    SET stock = stock - @cantidad
                    WHERE id_producto = @id_producto AND id_almacen = @id_almacen
                `);

                // Registrar en kardex la salida (reversión del ingreso)
                const reqKardex = transaction.request();
                reqKardex.input('id_producto', sql.Int, item.id_producto);
                reqKardex.input('id_almacen', sql.Int, id_almacen);
                reqKardex.input('cantidad', sql.Decimal(10, 2), item.cantidad);
                reqKardex.input('stock_anterior', sql.Decimal(10, 2), stock_anterior);
                reqKardex.input('stock_posterior', sql.Decimal(10, 2), stock_posterior);
                reqKardex.input('id_usuario', sql.Int, id_usuario);
                reqKardex.input('referencia_id', sql.Int, parseInt(id));
                await reqKardex.query(`
                    INSERT INTO kardex (id_producto, id_almacen, tipo_movimiento, motivo, referencia_id, referencia_tipo, cantidad, stock_anterior, stock_posterior, id_usuario)
                    VALUES (@id_producto, @id_almacen, 'salida', 'Anulación de devolución', @referencia_id, 'devolucion', -@cantidad, @stock_anterior, @stock_posterior, @id_usuario)
                `);
            }

            // 4. Si era reembolso, revertir el egreso de caja
            if (dev.tipo === 'reembolso' && dev.monto_reembolso > 0) {
                // Buscar el movimiento de caja original de esta devolución
                const reqMov = transaction.request();
                reqMov.input('referencia_id', sql.Int, parseInt(id));
                const resMov = await reqMov.query(`
                    SELECT TOP 1 id_caja, monto
                    FROM movimientos_caja
                    WHERE referencia_id = @referencia_id AND tipo = 'egreso'
                    ORDER BY id_movimiento DESC
                `);

                if (resMov.recordset.length > 0) {
                    const { id_caja, monto } = resMov.recordset[0];

                    // Insertar ingreso para compensar el egreso original
                    const reqMovRev = transaction.request();
                    reqMovRev.input('id_caja', sql.Int, id_caja);
                    reqMovRev.input('id_usuario', sql.Int, id_usuario);
                    reqMovRev.input('monto', sql.Decimal(10, 2), monto);
                    reqMovRev.input('referencia_id', sql.Int, parseInt(id));
                    await reqMovRev.query(`
                        INSERT INTO movimientos_caja (id_caja, id_usuario, tipo, concepto, referencia_id, monto)
                        VALUES (@id_caja, @id_usuario, 'ingreso',
                                'Anulación de reembolso por devolución ID ' + CAST(@referencia_id AS VARCHAR),
                                @referencia_id, @monto)
                    `);

                    // Restaurar monto_esperado de la caja
                    const reqUpCaja = transaction.request();
                    reqUpCaja.input('id_caja', sql.Int, id_caja);
                    reqUpCaja.input('monto', sql.Decimal(10, 2), monto);
                    await reqUpCaja.query(
                        'UPDATE cajas SET monto_esperado = monto_esperado + @monto WHERE id_caja = @id_caja'
                    );
                }
            }

            // 5. Marcar como anulada
            const reqAnular = transaction.request();
            reqAnular.input('id', sql.Int, id);
            await reqAnular.query(
                `UPDATE devoluciones SET estado = 'anulada' WHERE id_devolucion = @id`
            );


            // Restaurar estado de la venta si ya no tiene devoluciones activas
            const reqCheckDevs = transaction.request();
            reqCheckDevs.input('id_venta_check', sql.Int, resDev.recordset[0].id_venta ?? null);

            // Primero leer el id_venta de esta devolución
            const resIdVenta = await reqAnular.query(
                `SELECT id_venta FROM devoluciones WHERE id_devolucion = @id`
            )

        });

        // Revertir estado de la venta si ya no tiene devoluciones no-anuladas
        const reqRevert = transaction.request();
        reqRevert.input('id_venta_r', sql.Int, dev.id_venta);
        const resDevActivas = await reqRevert.query(`
                            SELECT COUNT(*) AS total
                            FROM devoluciones
                            WHERE id_venta = @id_venta_r
                                AND estado <> 'anulada'
                                AND id_devolucion <> @id
                        `);
        reqRevert.input('id', sql.Int, parseInt(id)); 

        if (resDevActivas.recordset[0].total === 0) {
            const reqRevertVenta = transaction.request();
            reqRevertVenta.input('id_venta_rv', sql.Int, dev.id_venta);
            await reqRevertVenta.query(`
        UPDATE ventas SET estado = 'pagada'
        WHERE id_venta = @id_venta_rv AND estado = 'con_devolucion'
    `);
        }

        return res.json({ ok: true, mensaje: 'Devolución anulada y cambios revertidos correctamente.' });

    } catch (err) {
        console.error('Error al anular devolución:', err);
        if (err.statusCode === 400) {
            return res.status(400).json({ ok: false, mensaje: err.message });
        }
        return res.status(500).json({ ok: false, mensaje: 'Error al anular la devolución.' });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    procesar,
    anular
};