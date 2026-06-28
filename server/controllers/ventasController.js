const { sql, withTransaction, query } = require('../db/conexion_sql');

const ventasController = {

    // creo una venta
    create: async (req, res, next) => {
        const {
            id_cliente,
            id_caja,
            id_serie,
            tipo_comprobante,
            id_almacen,
            detalle_venta,
            pagos_venta
        } = req.body;

        const id_empleado = req.user.id_empleado;
        const id_usuario = req.user.id;

        if (!id_empleado || !id_caja || !id_serie || !tipo_comprobante || !id_almacen || !detalle_venta || detalle_venta.length === 0) {
            return res.status(400).json({ error: 'Faltan datos críticos para procesar la venta (caja, serie, comprobante, almacén o productos).' });
        }
        if (!pagos_venta || pagos_venta.length === 0) {
            return res.status(400).json({ error: 'Debe registrar al menos un pago.' });
        }

        try {
            const resultadoTransaccion = await withTransaction(async (tx) => {

                // 1. Verificar que la caja elegida por el vendedor exista y siga
                // abierta (nunca se confía ciegamente en lo que manda el frontend,
                // por si se cerró/venció justo entre que el vendedor la eligió y
                // ahora registra la venta).
                const reqCaja = tx.request();
                reqCaja.input('id_caja', sql.Int, id_caja);
                const resCaja = await reqCaja.query('SELECT estado FROM cajas WHERE id_caja = @id_caja');
                if (resCaja.recordset.length === 0) {
                    throw new Error('La caja seleccionada no existe.');
                }
                if (resCaja.recordset[0].estado === 'vencida') {
                    throw new Error('La caja seleccionada venció su turno. Elige otra caja o pide que un cajero abra una nueva.');
                }
                if (resCaja.recordset[0].estado !== 'abierta') {
                    throw new Error('La caja seleccionada ya se encuentra cerrada. Elige otra caja para continuar vendiendo.');
                }

                // 2. Leer IGV desde configuracion
                const resIgv = await tx.request().query("SELECT valor FROM configuracion WHERE clave = 'igv'");
                if (resIgv.recordset.length === 0) {
                    throw new Error("No se encontró la configuración de IGV. Contacte al administrador.");
                }
                const TASA_IGV = parseFloat(resIgv.recordset[0].valor);

                // 2b. Identificar el tipo de pago "Efectivo" (monto_esperado de caja solo
                // debe reflejar dinero físico, no pagos por Yape/tarjeta/transferencia)
                const resEfectivo = await tx.request().query("SELECT id_tipo_pago FROM tipos_pago WHERE nombre = 'Efectivo'");
                const idTipoEfectivo = resEfectivo.recordset[0]?.id_tipo_pago ?? null;

                // 3. Actualizar correlativo y obtener número de comprobante
                const reqSerie = tx.request();
                reqSerie.input('id_serie', sql.Int, id_serie);
                reqSerie.input('tipo', sql.VarChar(10), tipo_comprobante);
                const resSerie = await reqSerie.query(`
                    UPDATE serie_comprobantes
                    SET correlativo_actual = correlativo_actual + 1
                    OUTPUT INSERTED.serie, INSERTED.correlativo_actual
                    WHERE id_serie = @id_serie AND tipo_comprobante = @tipo AND activo = 1
                `);
                if (resSerie.recordset.length === 0) {
                    throw new Error('La serie seleccionada no existe, está inactiva o no coincide con el tipo de comprobante.');
                }
                const { serie, correlativo_actual } = resSerie.recordset[0];
                const numero_comprobante = `${serie}-${String(correlativo_actual).padStart(8, '0')}`;

                // 4. Validar stock ANTES de modificar (por almacén)
                for (const item of detalle_venta) {
                    const reqCheck = tx.request();
                    reqCheck.input('id_producto', sql.Int, item.id_producto);
                    reqCheck.input('id_almacen', sql.Int, id_almacen);
                    const resCheck = await reqCheck.query(`
                        SELECT p.nombre, ISNULL(pa.stock, 0) AS stock_almacen
                        FROM productos p
                        LEFT JOIN productos_almacen pa
                            ON pa.id_producto = p.id_producto AND pa.id_almacen = @id_almacen
                        WHERE p.id_producto = @id_producto AND p.activo = 1
                    `);
                    if (resCheck.recordset.length === 0) {
                        throw new Error(`El producto con ID ${item.id_producto} no existe o está inactivo.`);
                    }
                    const { nombre, stock_almacen } = resCheck.recordset[0];
                    if (parseFloat(stock_almacen) < item.cantidad) {
                        throw new Error(`Stock insuficiente para "${nombre}" en el almacén seleccionado. Disponible: ${parseFloat(stock_almacen).toFixed(2)}, solicitado: ${item.cantidad}.`);
                    }
                }


                // 5. Calcular totales
                let subtotal = 0;
                for (const item of detalle_venta) {
                    subtotal += item.cantidad * item.precio_unitario;
                }
                const igv = parseFloat((subtotal * TASA_IGV).toFixed(2));
                const total = parseFloat((subtotal + igv).toFixed(2));
                subtotal = parseFloat(subtotal.toFixed(2));

                // 6. Insertar cabecera de venta
                const reqVenta = tx.request();
                reqVenta.input('id_cliente', sql.Int, id_cliente || null);
                reqVenta.input('id_empleado', sql.Int, id_empleado);
                reqVenta.input('id_serie', sql.Int, id_serie);
                reqVenta.input('numero_comprobante', sql.VarChar(20), numero_comprobante);
                reqVenta.input('subtotal', sql.Decimal(10, 2), subtotal);
                reqVenta.input('igv', sql.Decimal(10, 2), igv);
                reqVenta.input('total', sql.Decimal(10, 2), total);
                const resVenta = await reqVenta.query(`
                    INSERT INTO ventas (id_cliente, id_empleado, id_serie, numero_comprobante, subtotal, igv, total, estado)
                    OUTPUT INSERTED.id_venta
                    VALUES (@id_cliente, @id_empleado, @id_serie, @numero_comprobante, @subtotal, @igv, @total, 'pagada')
                `);
                const id_venta = resVenta.recordset[0].id_venta;

                // 7. Insertar detalle, descontar stock y registrar kardex
                for (const item of detalle_venta) {
                    const itemSubtotal = parseFloat((item.cantidad * item.precio_unitario).toFixed(2));

                    const reqDet = tx.request();
                    reqDet.input('id_venta', sql.Int, id_venta);
                    reqDet.input('id_producto', sql.Int, item.id_producto);
                    reqDet.input('cantidad', sql.Decimal(10, 2), item.cantidad);
                    reqDet.input('precio_unitario', sql.Decimal(10, 2), item.precio_unitario);
                    reqDet.input('subtotal', sql.Decimal(10, 2), itemSubtotal);
                    await reqDet.query(`
                        INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
                        VALUES (@id_venta, @id_producto, @cantidad, @precio_unitario, @subtotal)
                    `);

                    // Descontar stock en productos_almacen
                    const reqStockAlm = tx.request();
                    reqStockAlm.input('id_producto', sql.Int, item.id_producto);
                    reqStockAlm.input('id_almacen', sql.Int, id_almacen);
                    reqStockAlm.input('cantidad', sql.Decimal(10, 2), item.cantidad);
                    const resStockAlm = await reqStockAlm.query(`
                        UPDATE productos_almacen
                        SET stock = stock - @cantidad
                        OUTPUT DELETED.stock AS stock_anterior, INSERTED.stock AS stock_posterior
                        WHERE id_producto = @id_producto AND id_almacen = @id_almacen
                    `);
                    const { stock_anterior, stock_posterior } = resStockAlm.recordset[0];

                    // Sincronizar stock general en productos
                    const reqStockGral = tx.request();
                    reqStockGral.input('id_producto', sql.Int, item.id_producto);
                    reqStockGral.input('cantidad', sql.Decimal(10, 2), item.cantidad);
                    await reqStockGral.query(`
                        UPDATE productos SET stock_actual = stock_actual - @cantidad
                        WHERE id_producto = @id_producto AND activo = 1
                    `);

                    const reqKardex = tx.request();
                    reqKardex.input('id_producto', sql.Int, item.id_producto);
                    reqKardex.input('id_almacen', sql.Int, id_almacen);
                    reqKardex.input('referencia_id', sql.Int, id_venta);
                    reqKardex.input('cantidad', sql.Decimal(10, 2), item.cantidad);
                    reqKardex.input('stock_anterior', sql.Decimal(10, 2), stock_anterior);
                    reqKardex.input('stock_posterior', sql.Decimal(10, 2), stock_posterior);
                    reqKardex.input('id_usuario', sql.Int, id_usuario);
                    await reqKardex.query(`
                        INSERT INTO kardex (id_producto, id_almacen, tipo_movimiento, motivo, referencia_id, referencia_tipo, cantidad, stock_anterior, stock_posterior, id_usuario, registrado_en)
                        VALUES (@id_producto, @id_almacen, 'salida', 'Venta', @referencia_id, 'ventas', -@cantidad, @stock_anterior, @stock_posterior, @id_usuario, GETDATE())
                    `);
                }

                // 8. Registrar pagos y movimientos de caja
                let montoEfectivo = 0;
                for (const pago of pagos_venta) {
                    const reqPago = tx.request();
                    reqPago.input('id_venta', sql.Int, id_venta);
                    reqPago.input('id_tipo_pago', sql.Int, pago.id_tipo_pago);
                    reqPago.input('monto', sql.Decimal(10, 2), pago.monto);
                    reqPago.input('numero_operacion', sql.VarChar(50), pago.numero_operacion || null);
                    await reqPago.query(`
                        INSERT INTO pagos_venta (id_venta, id_tipo_pago, monto, numero_operacion)
                        VALUES (@id_venta, @id_tipo_pago, @monto, @numero_operacion)
                    `);

                    const reqMov = tx.request();
                    reqMov.input('id_caja', sql.Int, id_caja);
                    reqMov.input('id_usuario', sql.Int, id_usuario);
                    reqMov.input('referencia_id', sql.Int, id_venta);
                    reqMov.input('monto', sql.Decimal(10, 2), pago.monto);
                    reqMov.input('concepto', sql.VarChar(150), `Venta N° ${numero_comprobante}`);
                    await reqMov.query(`
                        INSERT INTO movimientos_caja (id_caja, id_usuario, tipo, concepto, referencia_id, monto, registrado_en)
                        VALUES (@id_caja, @id_usuario, 'ingreso', @concepto, @referencia_id, @monto, GETDATE())
                    `);

                    // Solo el efectivo afecta el conteo físico de caja
                    if (idTipoEfectivo && pago.id_tipo_pago === idTipoEfectivo) {
                        montoEfectivo += parseFloat(pago.monto);
                    }
                }
                montoEfectivo = parseFloat(montoEfectivo.toFixed(2));

                // 9. Actualizar monto esperado de caja (solo con la parte en efectivo)
                const reqUpCaja = tx.request();
                reqUpCaja.input('id_caja', sql.Int, id_caja);
                reqUpCaja.input('monto_efectivo', sql.Decimal(10, 2), montoEfectivo);
                await reqUpCaja.query('UPDATE cajas SET monto_esperado = monto_esperado + @monto_efectivo WHERE id_caja = @id_caja');

                return { id_venta, numero_comprobante, total };
            });

            return res.status(201).json({
                success: true,
                message: 'Venta registrada con éxito y stock actualizado.',
                data: resultadoTransaccion
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: 'La venta no pudo procesarse. Operación cancelada de forma segura.',
                detalle: error.message
            });
        }
    },

    // lista de ventas, con filtros
    getAll: async (req, res, next) => {
        try {
            const { estado, numero_comprobante, id_empleado, fecha_desde, fecha_hasta, tipo_comprobante } = req.query;

            let where = 'WHERE 1=1';
            const params = {};

            if (estado) {
                where += ' AND v.estado = @estado';
                params.estado = { type: sql.VarChar(15), value: estado };
            }
            if (numero_comprobante) {
                where += ' AND v.numero_comprobante LIKE @num';
                params.num = { type: sql.VarChar(20), value: `%${numero_comprobante}%` };
            }
            if (id_empleado) {
                where += ' AND v.id_empleado = @id_empleado';
                params.id_empleado = { type: sql.Int, value: parseInt(id_empleado) };
            }
            if (fecha_desde) {
                if (isNaN(Date.parse(fecha_desde))) {
                    return res.status(400).json({ error: 'fecha_desde no es una fecha válida.' });
                }
                where += ' AND CAST(v.fecha AS DATE) >= @fecha_desde';
                params.fecha_desde = { type: sql.Date, value: fecha_desde };
            }
            if (fecha_hasta) {
                if (isNaN(Date.parse(fecha_hasta))) {
                    return res.status(400).json({ error: 'fecha_hasta no es una fecha válida.' });
                }
                where += ' AND CAST(v.fecha AS DATE) <= @fecha_hasta';
                params.fecha_hasta = { type: sql.Date, value: fecha_hasta };
            }
            if (fecha_desde && fecha_hasta && new Date(fecha_desde) > new Date(fecha_hasta)) {
                return res.status(400).json({ error: 'fecha_desde no puede ser mayor a fecha_hasta.' });
            }
            if (tipo_comprobante) {
                where += ' AND sc.tipo_comprobante = @tipo_comprobante';
                params.tipo_comprobante = { type: sql.VarChar(10), value: tipo_comprobante };
            }

            const queryStr = `
            SELECT
                v.id_venta,
                v.numero_comprobante,
                v.fecha,
                v.subtotal,
                v.igv,
                v.total,
                v.estado,
                sc.tipo_comprobante,
                ISNULL(c.nombre, 'Sin cliente') AS cliente_nombre,
                e.nombre + ' ' + e.apellido     AS empleado_nombre
            FROM ventas v
            LEFT JOIN  clientes          c  ON c.id_cliente  = v.id_cliente
            INNER JOIN empleados         e  ON e.id_empleado = v.id_empleado
            INNER JOIN serie_comprobantes sc ON sc.id_serie  = v.id_serie
            ${where}
            ORDER BY v.id_venta DESC
        `;

            const resultado = await query(queryStr, params);
            return res.status(200).json(resultado.recordset);
        } catch (error) {
            next(error);
        }
    },

    //para obtener detalle de venta con el id
    getById: async (req, res, next) => {
        try {
            const { id } = req.params;

            // Cabecera
            const queryCabecera = "SELECT v.*, c.nombre AS cliente_nombre, e.nombre AS empleado_nombre FROM ventas v LEFT JOIN clientes c ON v.id_cliente = c.id_cliente INNER JOIN empleados e ON v.id_empleado = e.id_empleado WHERE v.id_venta = @id";
            const resCabecera = await query(queryCabecera, { id: { type: sql.Int, value: id } });

            if (resCabecera.recordset.length === 0) {
                return res.status(404).json({ error: "La venta especificada no existe." });
            }

            const ventaCompleta = resCabecera.recordset[0];

            const queryDetalle = "SELECT dv.*, p.nombre AS producto_nombre FROM detalle_venta dv INNER JOIN productos p ON dv.id_producto = p.id_producto WHERE dv.id_venta = @id";
            const resDetalle = await query(queryDetalle, { id: { type: sql.Int, value: id } });

            const queryPagos = "SELECT pv.*, tp.nombre AS tipo_pago_nombre FROM pagos_venta pv INNER JOIN tipos_pago tp ON pv.id_tipo_pago = tp.id_tipo_pago WHERE pv.id_venta = @id";
            const resPagos = await query(queryPagos, { id: { type: sql.Int, value: id } });

            ventaCompleta.items = resDetalle.recordset;
            ventaCompleta.pagos = resPagos.recordset;

            return res.status(200).json(ventaCompleta);
        } catch (error) {
            next(error);
        }
    },

    //para anular una venta
    anular: async (req, res, next) => {
        const { id } = req.params;
        const { id_caja, motivo_anulacion } = req.body;
        const id_usuario = req.user.id;

        if (!id_caja) {
            return res.status(400).json({ error: 'id_caja es obligatorio para proceder con la anulación.' });
        }

        try {
            const resultadoAnulacion = await withTransaction(async (tx) => {

                // 1. Verificar que la venta exista y no esté ya anulada
                const reqVenta = tx.request();
                reqVenta.input('id_venta', sql.Int, id);
                const resVenta = await reqVenta.query('SELECT estado, total, numero_comprobante FROM ventas WHERE id_venta = @id_venta');
                if (resVenta.recordset.length === 0) {
                    throw new Error('La venta que intentas anular no existe.');
                }
                if (resVenta.recordset[0].estado === 'anulada') {
                    throw new Error('Esta venta ya fue anulada previamente.');
                }
                const { total, numero_comprobante } = resVenta.recordset[0];

                // 2. Verificar que la caja elegida exista y siga abierta
                const reqCaja = tx.request();
                reqCaja.input('id_caja', sql.Int, id_caja);
                const resCaja = await reqCaja.query('SELECT estado FROM cajas WHERE id_caja = @id_caja');
                if (resCaja.recordset.length === 0) {
                    throw new Error('La caja seleccionada no existe.');
                }
                if (resCaja.recordset[0].estado !== 'abierta') {
                    throw new Error('La caja seleccionada para la anulación no está abierta.');
                }

                // 3. Marcar venta como anulada
                const reqUpVenta = tx.request();
                reqUpVenta.input('id_venta', sql.Int, id);
                await reqUpVenta.query("UPDATE ventas SET estado = 'anulada' WHERE id_venta = @id_venta");

                // 4. Devolver stock y registrar kardex por cada producto
                const reqItems = tx.request();
                reqItems.input('id_venta', sql.Int, id);
                const resItems = await reqItems.query('SELECT id_producto, cantidad FROM detalle_venta WHERE id_venta = @id_venta');

                // REEMPLAZA todo el for loop del paso 4 con esto:
                for (const item of resItems.recordset) {

                    // Leer el almacén desde el kardex de la venta original
                    // (evita que el frontend mande un almacén incorrecto)
                    const reqAlm = tx.request();
                    reqAlm.input('referencia_id', sql.Int, parseInt(id));
                    reqAlm.input('id_producto', sql.Int, item.id_producto);
                    const resAlm = await reqAlm.query(`
                        SELECT TOP 1 id_almacen
                        FROM kardex
                        WHERE referencia_tipo = 'ventas'
                            AND referencia_id = @referencia_id
                            AND id_producto = @id_producto
                            AND tipo_movimiento = 'salida'
                        ORDER BY id DESC
                    `);

                    if (resAlm.recordset.length === 0) {
                        throw new Error(`No se encontró el registro de kardex para el producto ID ${item.id_producto}. No se puede revertir el stock.`);
                    }
                    const id_almacen = resAlm.recordset[0].id_almacen;

                    // Devolver stock a productos_almacen (almacén original de la venta)
                    const reqStockAlm = tx.request();
                    reqStockAlm.input('id_producto', sql.Int, item.id_producto);
                    reqStockAlm.input('id_almacen', sql.Int, id_almacen);
                    reqStockAlm.input('cantidad', sql.Decimal(10, 2), item.cantidad);
                    const resStockAlm = await reqStockAlm.query(`
                        IF EXISTS (SELECT 1 FROM productos_almacen WHERE id_producto = @id_producto AND id_almacen = @id_almacen)
                            UPDATE productos_almacen
                            SET stock = stock + @cantidad
                            OUTPUT DELETED.stock AS stock_anterior, INSERTED.stock AS stock_posterior
                            WHERE id_producto = @id_producto AND id_almacen = @id_almacen
                        ELSE
                            INSERT INTO productos_almacen (id_producto, id_almacen, stock)
                            OUTPUT 0 AS stock_anterior, INSERTED.stock AS stock_posterior
                            VALUES (@id_producto, @id_almacen, @cantidad)
                    `);
                    const { stock_anterior, stock_posterior } = resStockAlm.recordset[0];

                    // Sincronizar stock general en productos
                    const reqStockGral = tx.request();
                    reqStockGral.input('id_producto', sql.Int, item.id_producto);
                    reqStockGral.input('cantidad', sql.Decimal(10, 2), item.cantidad);
                    await reqStockGral.query(`
                        UPDATE productos SET stock_actual = stock_actual + @cantidad WHERE id_producto = @id_producto
                    `);

                    // Registrar en kardex la entrada (reversión de la salida original)
                    const reqKardex = tx.request();
                    reqKardex.input('id_producto', sql.Int, item.id_producto);
                    reqKardex.input('id_almacen', sql.Int, id_almacen);
                    reqKardex.input('referencia_id', sql.Int, parseInt(id));
                    reqKardex.input('cantidad', sql.Decimal(10, 2), item.cantidad);
                    reqKardex.input('stock_anterior', sql.Decimal(10, 2), stock_anterior);
                    reqKardex.input('stock_posterior', sql.Decimal(10, 2), stock_posterior);
                    reqKardex.input('id_usuario', sql.Int, id_usuario);
                    await reqKardex.query(`
                        INSERT INTO kardex (id_producto, id_almacen, tipo_movimiento, motivo, referencia_id, referencia_tipo, cantidad, stock_anterior, stock_posterior, id_usuario, registrado_en)
                        VALUES (@id_producto, @id_almacen, 'entrada', 'Anulación de venta', @referencia_id, 'ventas', @cantidad, @stock_anterior, @stock_posterior, @id_usuario, GETDATE())
                    `);
                }

                // 5. Calcular cuánto fue pagado en efectivo en esta venta
                const reqEfectivoVenta = tx.request();
                reqEfectivoVenta.input('id_venta', sql.Int, id);
                const resEfectivoVenta = await reqEfectivoVenta.query(`
                    SELECT ISNULL(SUM(pv.monto), 0) AS monto_efectivo
                    FROM pagos_venta pv
                    INNER JOIN tipos_pago tp ON tp.id_tipo_pago = pv.id_tipo_pago
                    WHERE pv.id_venta = @id_venta AND tp.nombre = 'Efectivo'
                `);
                const montoEfectivoVenta = parseFloat(resEfectivoVenta.recordset[0].monto_efectivo);

                // 6. Registrar egreso en caja SOLO por el monto en efectivo
                //    (Yape, tarjeta, etc. no afectan el conteo físico de la caja)
                if (montoEfectivoVenta > 0) {
                    const reqMovCaja = tx.request();
                    reqMovCaja.input('id_caja', sql.Int, id_caja);
                    reqMovCaja.input('id_usuario', sql.Int, id_usuario);
                    reqMovCaja.input('referencia_id', sql.Int, parseInt(id));
                    reqMovCaja.input('monto', sql.Decimal(10, 2), montoEfectivoVenta);
                    reqMovCaja.input('concepto', sql.VarChar(150), `Anulación de venta N° ${numero_comprobante}`);
                    await reqMovCaja.query(`
                        INSERT INTO movimientos_caja
                            (id_caja, id_usuario, tipo, concepto, referencia_id, monto, registrado_en)
                        VALUES
                            (@id_caja, @id_usuario, 'egreso', @concepto, @referencia_id, @monto, GETDATE())
                    `);
                }

                // 7. Descontar monto_esperado de caja (solo la parte en efectivo)
                const reqUpCaja = tx.request();
                reqUpCaja.input('id_caja', sql.Int, id_caja);
                reqUpCaja.input('monto', sql.Decimal(10, 2), montoEfectivoVenta);
                await reqUpCaja.query(
                    'UPDATE cajas SET monto_esperado = monto_esperado - @monto WHERE id_caja = @id_caja'
                );

                return { numero_comprobante, monto_devuelto: total };
            });

            return res.status(200).json({
                success: true,
                message: 'Venta anulada correctamente. Inventario y caja restablecidos.',
                data: resultadoAnulacion
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: 'No se pudo anular la venta.',
                detalle: error.message
            });
        }
    }
};

module.exports = ventasController;