const { sql, query, withTransaction } = require('../db/conexion_sql');

// Listar órdenes de compra con filtros
const getOrdenes = async (req, res) => {
    const { proveedor, estado, fecha_desde, fecha_hasta } = req.query;
    try {
        let where = 'WHERE 1=1';
        const params = {};

        if (proveedor) {
            where += ' AND (p.nombre LIKE @proveedor OR oc.numero_orden LIKE @proveedor)';
            params.proveedor = { type: sql.VarChar, value: `%${proveedor}%` };
        }
        if (estado) {
            where += ' AND oc.estado = @estado';
            params.estado = { type: sql.VarChar, value: estado };
        }
        if (fecha_desde) {
            if (isNaN(Date.parse(fecha_desde))) {
                return res.status(400).json({ ok: false, mensaje: 'fecha_desde no es una fecha válida.' });
            }
            where += ' AND CAST(oc.fecha AS DATE) >= @fecha_desde';
            params.fecha_desde = { type: sql.Date, value: fecha_desde };
        }
        if (fecha_hasta) {
            if (isNaN(Date.parse(fecha_hasta))) {
                return res.status(400).json({ ok: false, mensaje: 'fecha_hasta no es una fecha válida.' });
            }
            where += ' AND CAST(oc.fecha AS DATE) <= @fecha_hasta';
            params.fecha_hasta = { type: sql.Date, value: fecha_hasta };
        }

        const result = await query(
            `SELECT 
                oc.*,
                p.nombre AS proveedor_nombre,
                e.nombre + ' ' + e.apellido AS empleado_nombre
             FROM ordenes_compra oc
             INNER JOIN proveedores p ON oc.id_proveedor = p.id_proveedor
             INNER JOIN empleados e ON oc.id_empleado = e.id_empleado
             ${where}
             ORDER BY oc.fecha DESC`,
            params
        );

        return res.json({
            ok: true,
            total: result.recordset.length,
            ordenes: result.recordset
        });
    } catch (err) {
        console.error('Error al obtener órdenes:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// Detalle de una orden + líneas + recepciones asociadas
const getOrdenById = async (req, res) => {
    const { id } = req.params;
    try {
        const ordenResult = await query(
            `SELECT oc.*, p.nombre AS proveedor_nombre, p.ruc AS proveedor_ruc,
                    e.nombre + ' ' + e.apellido AS empleado_nombre
             FROM ordenes_compra oc
             INNER JOIN proveedores p ON oc.id_proveedor = p.id_proveedor
             INNER JOIN empleados e ON oc.id_empleado = e.id_empleado
             WHERE oc.id_orden = @id`,
            { id: { type: sql.Int, value: id } }
        );

        if (ordenResult.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Orden de compra no encontrada.' });
        }

        const detalleResult = await query(
            `SELECT d.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
             FROM detalle_orden_compra d
             INNER JOIN productos p ON d.id_producto = p.id_producto
             WHERE d.id_orden = @id`,
            { id: { type: sql.Int, value: id } }
        );

        const recepcionesResult = await query(
            `SELECT r.*, e.nombre + ' ' + e.apellido AS empleado_nombre
             FROM recepciones r
             INNER JOIN empleados e ON r.id_empleado = e.id_empleado
             WHERE r.id_orden = @id`,
            { id: { type: sql.Int, value: id } }
        );

        return res.json({
            ok: true,
            orden: ordenResult.recordset[0],
            detalle: detalleResult.recordset,
            recepciones: recepcionesResult.recordset
        });
    } catch (err) {
        console.error('Error al obtener detalle de orden:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// Crear nueva orden en estado borrador
const crearOrden = async (req, res) => {
    const { id_proveedor, fecha_esperada, productos, observacion } = req.body;
    const id_usuario = req.user.id;

    if (!id_proveedor || !productos || productos.length === 0) {
        return res.status(400).json({ ok: false, mensaje: 'Datos incompletos.' });
    }

    try {
        // Obtener id_empleado desde el token
        const id_empleado = req.user.id_empleado;

        if (!id_empleado) {
            return res.status(400).json({ ok: false, mensaje: 'No se pudo obtener el empleado desde la sesión.' });
        }

        const result = await withTransaction(async (transaction) => {
            const countResult = await transaction.request()
                .query("SELECT ISNULL(MAX(CAST(SUBSTRING(numero_orden, 4, LEN(numero_orden)) AS INT)), 0) + 1 AS siguiente FROM ordenes_compra");
            const num = countResult.recordset[0].siguiente.toString().padStart(4, '0');
            const numero_orden = `OC-${num}`;

            // Leer IGV desde configuracion
            const igvResult = await transaction.request()
                .query("SELECT valor FROM configuracion WHERE clave = 'igv'");
            if (igvResult.recordset.length === 0) {
                throw new Error('No se encontró la configuración de IGV.');
            }
            const TASA_IGV = parseFloat(igvResult.recordset[0].valor);

            // Calcular subtotal, IGV y total
            let subtotal = 0;
            productos.forEach(p => subtotal += p.cantidad * p.precio_unitario);
            const igv = parseFloat((subtotal * TASA_IGV).toFixed(2));
            const total = parseFloat((subtotal + igv).toFixed(2));
            subtotal = parseFloat(subtotal.toFixed(2));
            // INSERT cabecera
            const reqCab = transaction.request();
            reqCab.input('numero_orden', sql.VarChar(20), numero_orden);
            reqCab.input('id_proveedor', sql.Int, id_proveedor);
            reqCab.input('id_empleado', sql.Int, id_empleado);
            reqCab.input('fecha_esperada', sql.Date, fecha_esperada || null);
            reqCab.input('subtotal', sql.Decimal(10, 2), subtotal);
            reqCab.input('igv', sql.Decimal(10, 2), igv);
            reqCab.input('total', sql.Decimal(10, 2), total);
            reqCab.input('observacion', sql.NVarChar, observacion || null);

            const cabResult = await reqCab.query(
                `INSERT INTO ordenes_compra 
                    (numero_orden, id_proveedor, id_empleado, fecha_esperada, subtotal, igv, total, estado, observacion)
                 OUTPUT INSERTED.*
                 VALUES (@numero_orden, @id_proveedor, @id_empleado, @fecha_esperada, @subtotal, @igv, @total, 'borrador', @observacion)`
            );

            const nuevaOrden = cabResult.recordset[0];

            // INSERT detalle
            for (const p of productos) {
                const subtotalLinea = parseFloat((p.cantidad * p.precio_unitario).toFixed(2));
                const reqDet = transaction.request();
                reqDet.input('id_orden', sql.Int, nuevaOrden.id_orden);
                reqDet.input('id_producto', sql.Int, p.id_producto);
                reqDet.input('cantidad_solicitada', sql.Decimal(10, 2), p.cantidad);
                reqDet.input('precio_unitario', sql.Decimal(10, 2), p.precio_unitario);
                reqDet.input('subtotal', sql.Decimal(10, 2), subtotalLinea);
                await reqDet.query(
                    `INSERT INTO detalle_orden_compra 
                        (id_orden, id_producto, cantidad_solicitada, cantidad_recibida, precio_unitario, subtotal)
                     VALUES (@id_orden, @id_producto, @cantidad_solicitada, 0, @precio_unitario, @subtotal)`
                );
            }

            return nuevaOrden;
        });

        return res.status(201).json({ ok: true, orden: result });
    } catch (err) {
        console.error('Error al crear orden:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error al crear la orden de compra.' });
    }
};

// Cambiar estado a enviada
const enviarOrden = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(
            `UPDATE ordenes_compra SET estado = 'enviada' 
             OUTPUT INSERTED.*
             WHERE id_orden = @id AND estado = 'borrador'`,
            { id: { type: sql.Int, value: id } }
        );

        if (result.recordset.length === 0) {
            return res.status(400).json({ ok: false, mensaje: 'No se puede enviar la orden (debe estar en borrador).' });
        }

        return res.json({ ok: true, orden: result.recordset[0] });
    } catch (err) {
        console.error('Error al enviar orden:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// Anular orden
const anularOrden = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(
            `UPDATE ordenes_compra SET estado = 'anulada' 
             OUTPUT INSERTED.*
             WHERE id_orden = @id AND estado IN ('borrador', 'enviada')`,
            { id: { type: sql.Int, value: id } }
        );

        if (result.recordset.length === 0) {
            return res.status(400).json({ ok: false, mensaje: 'No se puede anular la orden.' });
        }

        return res.json({ ok: true, orden: result.recordset[0] });
    } catch (err) {
        console.error('Error al anular orden:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// Crear recepción de mercadería
const crearRecepcion = async (req, res) => {
    const { id } = req.params; // id_orden
    const { productos, id_almacen, guia_remision } = req.body;
    const id_usuario = req.user.id;
    const id_empleado = req.user.id_empleado; //traemos el user del tokenn

    if (!productos || productos.length === 0 || !id_almacen) {
        return res.status(400).json({ ok: false, mensaje: 'Datos de recepción incompletos.' });
    }
    if (!id_empleado) {
        return res.status(400).json({ ok: false, mensaje: 'No se pudo obtener el empleado desde la sesión.' });
    }

    try {

        // Validar que la orden exista y esté en estado válido para recibir
        const ordenCheck = await query(
            `SELECT estado FROM ordenes_compra WHERE id_orden = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (ordenCheck.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Orden de compra no encontrada.' });
        }
        const estadoOrden = ordenCheck.recordset[0].estado;
        if (estadoOrden === 'anulada') {
            return res.status(400).json({ ok: false, mensaje: 'No se puede recepcionar una orden anulada.' });
        }
        if (estadoOrden === 'borrador') {
            return res.status(400).json({ ok: false, mensaje: 'La orden debe estar enviada antes de recepcionarse.' });
        }
        
        await withTransaction(async (transaction) => {
            const reqRec = transaction.request();
            reqRec.input('id_orden', sql.Int, id);
            reqRec.input('id_almacen', sql.Int, id_almacen);
            reqRec.input('id_empleado', sql.Int, id_empleado);
            reqRec.input('numero_guia', sql.VarChar, guia_remision || null);
            const recResult = await reqRec.query(
                `INSERT INTO recepciones (id_orden, id_almacen, id_empleado, numero_guia)
                OUTPUT INSERTED.id_recepcion
                VALUES (@id_orden, @id_almacen, @id_empleado, @numero_guia)`
            );
            const id_recepcion = recResult.recordset[0].id_recepcion;

            for (const p of productos) {
                // Obtener el precio unitario pactado si no se envía en el cuerpo
                let precio_unitario = p.precio_unitario;
                if (precio_unitario === undefined || precio_unitario === null) {
                    const reqPrecio = transaction.request();
                    reqPrecio.input('id_orden', sql.Int, id);
                    reqPrecio.input('id_producto', sql.Int, p.id_producto);
                    const resPrecio = await reqPrecio.query(`
                        SELECT precio_unitario 
                        FROM detalle_orden_compra 
                        WHERE id_orden = @id_orden AND id_producto = @id_producto
                    `);
                    if (resPrecio.recordset.length > 0) {
                        precio_unitario = parseFloat(resPrecio.recordset[0].precio_unitario);
                    } else {
                        precio_unitario = 0;
                    }
                }

                // 2. Insertar detalle de recepción
                const reqDetRec = transaction.request();
                reqDetRec.input('id_recepcion', sql.Int, id_recepcion);
                reqDetRec.input('id_producto', sql.Int, p.id_producto);
                reqDetRec.input('cantidad_recibida', sql.Decimal(10, 2), p.cantidad);
                reqDetRec.input('precio_unitario', sql.Decimal(10, 2), precio_unitario);
                reqDetRec.input('numero_lote', sql.VarChar(50), p.numero_lote || null);
                reqDetRec.input('fecha_vencimiento', sql.Date, p.fecha_vencimiento || null);
                await reqDetRec.query(
                    `INSERT INTO detalle_recepcion (id_recepcion, id_producto, cantidad_recibida, precio_unitario, numero_lote, fecha_vencimiento)
                     VALUES (@id_recepcion, @id_producto, @cantidad_recibida, @precio_unitario, @numero_lote, @fecha_vencimiento)`
                );

                // 3. Actualizar cantidad_recibida en detalle_orden_compra
                const reqUpdDet = transaction.request();
                reqUpdDet.input('id_orden', sql.Int, id);
                reqUpdDet.input('id_producto', sql.Int, p.id_producto);
                reqUpdDet.input('cantidad', sql.Decimal(10, 2), p.cantidad);
                await reqUpdDet.query(
                    `UPDATE detalle_orden_compra 
                     SET cantidad_recibida = cantidad_recibida + @cantidad
                     WHERE id_orden = @id_orden AND id_producto = @id_producto`
                );

                // 4. Actualizar Stock y registrar Kardex
                const prodResult = await transaction.request()
                    .input('id_p', sql.Int, p.id_producto)
                    .query('SELECT stock_actual, tiene_lote FROM productos WHERE id_producto = @id_p');

                const stockAnterior = parseFloat(prodResult.recordset[0].stock_actual);
                const stockPosterior = stockAnterior + parseFloat(p.cantidad);

                // Kardex
                const reqKardex = transaction.request();
                reqKardex.input('id_producto', sql.Int, p.id_producto);
                reqKardex.input('id_almacen', sql.Int, id_almacen);
                reqKardex.input('cantidad', sql.Decimal(10, 2), p.cantidad);
                reqKardex.input('stock_anterior', sql.Decimal(10, 2), stockAnterior);
                reqKardex.input('stock_posterior', sql.Decimal(10, 2), stockPosterior);
                reqKardex.input('id_usuario', sql.Int, id_usuario);
                reqKardex.input('referencia_id', sql.Int, id_recepcion);
                await reqKardex.query(
                    `INSERT INTO kardex (id_producto, id_almacen, tipo_movimiento, motivo, cantidad, stock_anterior, stock_posterior, id_usuario, referencia_id, referencia_tipo)
                     VALUES (@id_producto, @id_almacen, 'entrada', 'Compra', @cantidad, @stock_anterior, @stock_posterior, @id_usuario, @referencia_id, 'recepcion')`
                );

                // Update Stock
                await transaction.request()
                    .input('stock', sql.Decimal(10, 2), stockPosterior)
                    .input('id_p', sql.Int, p.id_producto)
                    .query('UPDATE productos SET stock_actual = @stock WHERE id_producto = @id_p');

                // 5. Crear lote si aplica
                if (prodResult.recordset[0].tiene_lote && p.numero_lote) {
                    const reqLote = transaction.request();
                    reqLote.input('id_producto', sql.Int, p.id_producto);
                    reqLote.input('id_almacen', sql.Int, id_almacen);
                    reqLote.input('numero_lote', sql.VarChar(50), p.numero_lote);
                    reqLote.input('fecha_vencimiento', sql.Date, p.fecha_vencimiento || null);
                    reqLote.input('stock', sql.Decimal(10, 2), p.cantidad);
                    await reqLote.query(
                        `INSERT INTO lotes (id_producto, id_almacen, numero_lote, fecha_vencimiento, cantidad)
                        VALUES (@id_producto, @id_almacen, @numero_lote, @fecha_vencimiento, @stock)`
                    );
                }
            }

            // 6. Verificar si la orden está totalmente recibida
            const checkResult = await transaction.request()
                .input('id_orden', sql.Int, id)
                .query('SELECT SUM(cantidad_solicitada) as total, SUM(cantidad_recibida) as recibida FROM detalle_orden_compra WHERE id_orden = @id_orden');

            const { total, recibida } = checkResult.recordset[0];
            if (recibida >= total) {
                await transaction.request()
                    .input('id_orden', sql.Int, id)
                    .query("UPDATE ordenes_compra SET estado = 'recibida' WHERE id_orden = @id_orden");
            }
        });

        return res.status(201).json({ ok: true, mensaje: 'Recepción registrada con éxito.' });
    } catch (err) {
        console.error('Error al crear recepción:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error al procesar la recepción.' });
    }
};

// Obtener todas las recepciones de una orden de compra
const getRecepcionesByOrdenId = async (req, res) => {
    const { id } = req.params;
    try {
        const recepcionesResult = await query(
            `SELECT r.*, 
                    e.nombre + ' ' + e.apellido AS empleado_nombre,
                    a.nombre AS almacen_nombre
             FROM recepciones r
             INNER JOIN empleados e ON r.id_empleado = e.id_empleado
             INNER JOIN almacenes a ON r.id_almacen = a.id_almacen
             WHERE r.id_orden = @id
             ORDER BY r.fecha DESC`,
            { id: { type: sql.Int, value: id } }
        );

        if (recepcionesResult.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'No se encontraron recepciones para esta orden.' });
        }

        const recepcionesConDetalle = await Promise.all(
            recepcionesResult.recordset.map(async (recepcion) => {
                const detalleResult = await query(
                    `SELECT dr.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
                     FROM detalle_recepcion dr
                     INNER JOIN productos p ON p.id_producto = dr.id_producto
                     WHERE dr.id_recepcion = @id_recepcion`,
                    { id_recepcion: { type: sql.Int, value: recepcion.id_recepcion } }
                );
                return { ...recepcion, productos: detalleResult.recordset };
            })
        );

        return res.json({
            ok: true,
            total: recepcionesConDetalle.length,
            recepciones: recepcionesConDetalle
        });
    } catch (err) {
        console.error('Error al obtener recepciones por orden:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};



module.exports = {
    getOrdenes,
    getOrdenById,
    crearOrden,
    enviarOrden,
    anularOrden,
    crearRecepcion,
    getRecepcionesByOrdenId
};