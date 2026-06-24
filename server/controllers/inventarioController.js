const { sql, query, withTransaction } = require('../db/conexion_sql');

// ALMACENES
const getAlmacenes = async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                a.id_almacen,
                a.nombre,
                a.direccion,
                a.activo,
                e.nombre + ' ' + e.apellido AS responsable
             FROM almacenes a
             LEFT JOIN empleados e ON e.id_empleado = a.responsable
             WHERE a.activo = 1
             ORDER BY a.nombre ASC`
        );
        return res.json({ ok: true, almacenes: result.recordset });
    } catch (err) {
        console.error('Error al obtener almacenes:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const getAlmacenById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(
            `SELECT 
                a.id_almacen,
                a.nombre,
                a.direccion,
                a.activo,
                e.nombre + ' ' + e.apellido AS responsable
             FROM almacenes a
             LEFT JOIN empleados e ON e.id_empleado = a.responsable
             WHERE a.id_almacen = @id`,
            { id: { type: sql.Int, value: id } }
        );
        const almacen = result.recordset[0];
        if (!almacen) return res.status(404).json({ ok: false, mensaje: 'Almacén no encontrado.' });
        return res.json({ ok: true, almacen });
    } catch (err) {
        console.error('Error al obtener almacén:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const crearAlmacen = async (req, res) => {
    const { nombre, direccion, responsable } = req.body;
    if (!nombre) return res.status(400).json({ ok: false, mensaje: 'El nombre es obligatorio.' });

    try {
        const existe = await query(
            `SELECT id_almacen FROM almacenes WHERE nombre = @nombre`,
            { nombre: { type: sql.VarChar, value: nombre } }
        );
        if (existe.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'Ya existe un almacén con ese nombre.' });
        }

        const result = await query(
            `INSERT INTO almacenes (nombre, direccion, responsable, activo)
             OUTPUT INSERTED.*
             VALUES (@nombre, @direccion, @responsable, 1)`,
            {
                nombre: { type: sql.VarChar, value: nombre },
                direccion: { type: sql.VarChar, value: direccion || null },
                responsable: { type: sql.Int, value: responsable || null }
            }
        );
        return res.status(201).json({ ok: true, almacen: result.recordset[0] });
    } catch (err) {
        console.error('Error al crear almacén:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const editarAlmacen = async (req, res) => {
    const { id } = req.params;
    const { nombre, direccion, responsable } = req.body;
    if (!nombre) return res.status(400).json({ ok: false, mensaje: 'El nombre es obligatorio.' });

    try {
        const existe = await query(
            `SELECT id_almacen FROM almacenes WHERE id_almacen = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (existe.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Almacén no encontrado.' });
        }

        const result = await query(
            `UPDATE almacenes 
             SET nombre = @nombre, direccion = @direccion, responsable = @responsable
             OUTPUT INSERTED.*
             WHERE id_almacen = @id`,
            {
                nombre: { type: sql.VarChar, value: nombre },
                direccion: { type: sql.VarChar, value: direccion || null },
                responsable: { type: sql.Int, value: responsable || null },
                id: { type: sql.Int, value: id }
            }
        );
        return res.json({ ok: true, almacen: result.recordset[0] });
    } catch (err) {
        console.error('Error al editar almacén:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const desactivarAlmacen = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(
            `UPDATE almacenes SET activo = 0 OUTPUT INSERTED.* WHERE id_almacen = @id AND activo = 1`,
            { id: { type: sql.Int, value: id } }
        );
        if (result.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Almacén no encontrado o ya inactivo.' });
        }
        return res.json({ ok: true, almacen: result.recordset[0] });
    } catch (err) {
        console.error('Error al desactivar almacén:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// STOCK
const getStock = async (req, res) => {
    const { id_almacen, critico, buscar, estado, id_categoria } = req.query;
    try {
        let whereExtra = '';
        const params = {};

        if (buscar) {
            whereExtra += ' AND (p.nombre LIKE @buscar OR p.codigo LIKE @buscar)';
            params.buscar = { type: sql.VarChar, value: `%${buscar}%` };
        }
        /*if (id_almacen) {
            whereExtra += ' AND p.id_almacen = @id_almacen';
            params.id_almacen = { type: sql.Int, value: id_almacen };
        }IGNORAR*/

        // El HTML tiene: critico, normal, sobrestock
        if (estado === 'critico' || critico === 'true') {
            whereExtra += ' AND p.stock_actual <= p.stock_minimo';
        } else if (estado === 'normal') {
            whereExtra += ' AND p.stock_actual > p.stock_minimo AND (p.stock_maximo IS NULL OR p.stock_actual <= p.stock_maximo)';
        } else if (estado === 'sobrestock') {
            whereExtra += ' AND p.stock_maximo IS NOT NULL AND p.stock_actual > p.stock_maximo';
        }

        if (id_categoria) {
            whereExtra += ' AND c.id_categoria = @id_categoria';
            params.id_categoria = { type: sql.Int, value: id_categoria };
        }

        const result = await query(
            `SELECT 
                p.id_producto,
                p.codigo,
                p.nombre,
                p.stock_actual,
                p.stock_minimo,
                p.stock_maximo,
                p.ubicacion,
                c.nombre AS categoria,
                sc.nombre AS subcategoria,
                u.abreviatura AS unidad,
                CASE 
                    WHEN p.stock_actual <= p.stock_minimo THEN 'critico'
                    WHEN p.stock_maximo IS NOT NULL AND p.stock_actual > p.stock_maximo THEN 'sobrestock'
                    ELSE 'normal'
                END AS estado_stock
             FROM productos p
             INNER JOIN subcategorias sc ON sc.id_subcategoria = p.id_subcategoria
             INNER JOIN categorias c ON c.id_categoria = sc.id_categoria
             INNER JOIN unidades_medida u ON u.id_unidad = p.id_unidad
             WHERE p.activo = 1 ${whereExtra}
             ORDER BY 
                CASE WHEN p.stock_actual <= p.stock_minimo THEN 0 ELSE 1 END ASC,
                p.nombre ASC`,
            params
        );

        return res.json({ ok: true, stock: result.recordset });
    } catch (err) {
        console.error('Error al obtener stock:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// KARDEX
const getKardex = async (req, res) => {
    const { idProducto } = req.params;
    const { id_almacen, tipo, fecha_desde, fecha_hasta } = req.query;
    try {
        let whereExtra = '';
        const params = {
            idProducto: { type: sql.Int, value: idProducto }
        };

        if (id_almacen) {
            whereExtra += ' AND k.id_almacen = @id_almacen';
            params.id_almacen = { type: sql.Int, value: id_almacen };
        }
        if (tipo) {
            whereExtra += ' AND k.tipo_movimiento = @tipo';
            params.tipo = { type: sql.VarChar, value: tipo };
        }
        if (fecha_desde) {
            if (isNaN(Date.parse(fecha_desde))) {
                return res.status(400).json({ ok: false, mensaje: 'fecha_desde no es una fecha válida.' });
            }
            whereExtra += ' AND CAST(k.registrado_en AS DATE) >= @fecha_desde';
            params.fecha_desde = { type: sql.Date, value: fecha_desde };
        }
        if (fecha_hasta) {
            if (isNaN(Date.parse(fecha_hasta))) {
                return res.status(400).json({ ok: false, mensaje: 'fecha_hasta no es una fecha válida.' });
            }
            whereExtra += ' AND CAST(k.registrado_en AS DATE) <= @fecha_hasta';
            params.fecha_hasta = { type: sql.Date, value: fecha_hasta };
        }
        if (fecha_desde && fecha_hasta && new Date(fecha_desde) > new Date(fecha_hasta)) {
            return res.status(400).json({ ok: false, mensaje: 'fecha_desde no puede ser mayor a fecha_hasta.' });
        }

        const result = await query(
            `SELECT
                k.id_kardex,
                k.tipo_movimiento,
                k.motivo,
                k.referencia_id,
                k.referencia_tipo,
                k.cantidad,
                k.stock_anterior,
                k.stock_posterior,
                k.registrado_en,
                a.nombre AS almacen,
                e.nombre + ' ' + e.apellido AS empleado
            FROM kardex k
            INNER JOIN almacenes a ON a.id_almacen = k.id_almacen
            INNER JOIN usuarios u ON u.id_usuario = k.id_usuario
            INNER JOIN empleados e ON e.id_empleado = u.id_empleado
            WHERE k.id_producto = @idProducto ${whereExtra}
            ORDER BY k.registrado_en DESC`,
            params
        );

        return res.json({ ok: true, kardex: result.recordset });
    } catch (err) {
        console.error('Error al obtener kardex:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// AJUSTE DE STOCK
const ajustarStock = async (req, res) => {
    const { id_producto, id_almacen, cantidad, motivo } = req.body;
    const id_usuario = req.user.id;

    if (!id_producto || !id_almacen || cantidad === undefined || !motivo) {
        return res.status(400).json({ ok: false, mensaje: 'Complete todos los campos.' });
    }

    try {
        const prodResult = await query(
            `SELECT stock_actual FROM productos WHERE id_producto = @id AND activo = 1`,
            { id: { type: sql.Int, value: id_producto } }
        );

        if (prodResult.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
        }

        const stockAnterior = parseFloat(prodResult.recordset[0].stock_actual);
        const stockPosterior = stockAnterior + parseFloat(cantidad);

        if (stockPosterior < 0) {
            return res.status(400).json({ ok: false, mensaje: 'El ajuste dejaría el stock en negativo.' });
        }

        await withTransaction(async (transaction) => {
            const reqKardex = transaction.request();
            reqKardex.input('id_producto', sql.Int, id_producto);
            reqKardex.input('id_almacen', sql.Int, id_almacen);
            reqKardex.input('motivo', sql.VarChar, motivo);
            reqKardex.input('cantidad', sql.Decimal, cantidad);
            reqKardex.input('stock_anterior', sql.Decimal, stockAnterior);
            reqKardex.input('stock_posterior', sql.Decimal, stockPosterior);
            reqKardex.input('id_usuario', sql.Int, id_usuario);
            await reqKardex.query(
                `INSERT INTO kardex (id_producto, id_almacen, tipo_movimiento, motivo, cantidad, stock_anterior, stock_posterior, id_usuario)
         VALUES (@id_producto, @id_almacen, 'ajuste', @motivo, @cantidad, @stock_anterior, @stock_posterior, @id_usuario)`
            );

            const reqStock = transaction.request();
            reqStock.input('stock_posterior', sql.Decimal, stockPosterior);
            reqStock.input('id_producto', sql.Int, id_producto);
            await reqStock.query(
                `UPDATE productos SET stock_actual = @stock_posterior WHERE id_producto = @id_producto`
            );
        });

        return res.status(201).json({
            ok: true,
            mensaje: 'Ajuste registrado correctamente.',
            stock_anterior: stockAnterior,
            stock_posterior: stockPosterior
        });
    } catch (err) {
        console.error('Error al ajustar stock:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// LOTES
const getLotes = async (req, res) => {
    const { idProducto } = req.params;
    const { id_almacen, estado_vencimiento } = req.query;
    try {
        const prodResult = await query(
            `SELECT tiene_lote FROM productos WHERE id_producto = @id AND activo = 1`,
            { id: { type: sql.Int, value: idProducto } }
        );

        if (prodResult.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
        }
        if (!prodResult.recordset[0].tiene_lote) {
            return res.status(400).json({ ok: false, mensaje: 'Este producto no maneja lotes.' });
        }

        let whereExtra = '';
        const params = {
            idProducto: { type: sql.Int, value: idProducto }
        };

        if (id_almacen) {
            whereExtra += ' AND l.id_almacen = @id_almacen';
            params.id_almacen = { type: sql.Int, value: id_almacen };
        }

        // El HTML tiene: vigente, proximo (30 días), vencido, sin_vencimiento
        if (estado_vencimiento === 'vencido') {
            whereExtra += ' AND l.fecha_vencimiento IS NOT NULL AND l.fecha_vencimiento < CAST(GETDATE() AS DATE)';
        } else if (estado_vencimiento === 'proximo') {
            whereExtra += ' AND l.fecha_vencimiento IS NOT NULL AND l.fecha_vencimiento >= CAST(GETDATE() AS DATE) AND l.fecha_vencimiento <= CAST(DATEADD(DAY, 30, GETDATE()) AS DATE)';
        } else if (estado_vencimiento === 'vigente') {
            whereExtra += ' AND l.fecha_vencimiento IS NOT NULL AND l.fecha_vencimiento > CAST(DATEADD(DAY, 30, GETDATE()) AS DATE)';
        } else if (estado_vencimiento === 'sin_vencimiento') {
            whereExtra += ' AND l.fecha_vencimiento IS NULL';
        }

        const result = await query(
            `SELECT
        l.id_lote,
        l.numero_lote,
        l.fecha_vencimiento,
        l.cantidad,
        l.creado_en,
        p.nombre AS producto,          
        a.nombre AS almacen,
        CASE
            WHEN l.fecha_vencimiento IS NULL THEN 'sin_vencimiento'
            WHEN l.fecha_vencimiento < CAST(GETDATE() AS DATE) THEN 'vencido'
            WHEN l.fecha_vencimiento <= CAST(DATEADD(DAY, 30, GETDATE()) AS DATE) THEN 'proximo'
            ELSE 'vigente'
        END AS estado_vencimiento
     FROM lotes l
     INNER JOIN almacenes a ON a.id_almacen = l.id_almacen
     INNER JOIN productos p ON p.id_producto = l.id_producto  
     WHERE l.id_producto = @idProducto ${whereExtra}
     ORDER BY l.fecha_vencimiento ASC`,
            { ...params }
        );

        return res.json({ ok: true, lotes: result.recordset });
    } catch (err) {
        console.error('Error al obtener lotes:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// TRANSFERENCIAS
const getTransferencias = async (req, res) => {
    const { estado, fecha_desde, fecha_hasta } = req.query;
    try {
        let whereExtra = '';
        const params = {};

        if (estado) {
            whereExtra += ' AND t.estado = @estado';
            params.estado = { type: sql.VarChar, value: estado };
        }
        if (fecha_desde) {
            if (isNaN(Date.parse(fecha_desde))) {
                return res.status(400).json({ ok: false, mensaje: 'fecha_desde no es una fecha válida.' });
            }
            whereExtra += ' AND CAST(t.fecha AS DATE) >= @fecha_desde';
            params.fecha_desde = { type: sql.Date, value: fecha_desde };
        }
        if (fecha_hasta) {
            if (isNaN(Date.parse(fecha_hasta))) {
                return res.status(400).json({ ok: false, mensaje: 'fecha_hasta no es una fecha válida.' });
            }
            whereExtra += ' AND CAST(t.fecha AS DATE) <= @fecha_hasta';
            params.fecha_hasta = { type: sql.Date, value: fecha_hasta };
        }
        if (fecha_desde && fecha_hasta && new Date(fecha_desde) > new Date(fecha_hasta)) {
            return res.status(400).json({ ok: false, mensaje: 'fecha_desde no puede ser mayor a fecha_hasta.' });
        }

        const result = await query(
            `SELECT
                t.id_transferencia,
                t.fecha,
                t.motivo,
                t.estado,
                ao.nombre AS almacen_origen,
                ad.nombre AS almacen_destino,
                e.nombre + ' ' + e.apellido AS empleado
             FROM transferencias_almacen t
             INNER JOIN almacenes ao ON ao.id_almacen = t.id_almacen_origen
             INNER JOIN almacenes ad ON ad.id_almacen = t.id_almacen_destino
             INNER JOIN empleados e ON e.id_empleado = t.id_empleado
             WHERE 1=1 ${whereExtra}
             ORDER BY t.fecha DESC`,
            params
        );

        return res.json({ ok: true, transferencias: result.recordset });
    } catch (err) {
        console.error('Error al obtener transferencias:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


const crearTransferencia = async (req, res) => {
    const { id_almacen_origen, id_almacen_destino, motivo, detalle } = req.body;

    if (!id_almacen_origen || !id_almacen_destino || !detalle || !detalle.length) {
        return res.status(400).json({ ok: false, mensaje: 'Complete todos los campos.' });
    }
    if (parseInt(id_almacen_origen) === parseInt(id_almacen_destino)) {
        return res.status(400).json({ ok: false, mensaje: 'Los almacenes de origen y destino deben ser diferentes.' });
    }

    try {

        //traemos el empleado
        const userResult = await query(
            'SELECT id_empleado FROM usuarios WHERE id_usuario = @id',
            { id: { type: sql.Int, value: req.user.id } }
        );
        const id_empleado = userResult.recordset[0]?.id_empleado;
        if (!id_empleado) {
            return res.status(400).json({ ok: false, mensaje: 'No se encontró el empleado asociado al usuario.' });
        }

        const result = await withTransaction(async (transaction) => {
            const reqTrans = transaction.request();
            reqTrans.input('id_almacen_origen', sql.Int, id_almacen_origen);
            reqTrans.input('id_almacen_destino', sql.Int, id_almacen_destino);
            reqTrans.input('id_empleado', sql.Int, id_empleado);
            reqTrans.input('motivo', sql.VarChar, motivo || null);
            const transResult = await reqTrans.query(
                `INSERT INTO transferencias_almacen (id_almacen_origen, id_almacen_destino, id_empleado, motivo, estado)
         OUTPUT INSERTED.*
         VALUES (@id_almacen_origen, @id_almacen_destino, @id_empleado, @motivo, 'pendiente')`
            );
            const transferencia = transResult.recordset[0];

            for (const item of detalle) {
                const reqDetalle = transaction.request(); // nuevo request por cada iteración
                reqDetalle.input('id_transferencia', sql.Int, transferencia.id_transferencia);
                reqDetalle.input('id_producto', sql.Int, item.id_producto);
                reqDetalle.input('cantidad', sql.Decimal, item.cantidad);
                await reqDetalle.query(
                    `INSERT INTO detalle_transferencia (id_transferencia, id_producto, cantidad)
             VALUES (@id_transferencia, @id_producto, @cantidad)`
                );
            }

            return transferencia;
        });

        return res.status(201).json({ ok: true, transferencia: result });
    } catch (err) {
        console.error('Error al crear transferencia:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


const completarTransferencia = async (req, res) => {
    const { id } = req.params;
    const id_usuario = req.user.id;

    try {
        const transResult = await query(
            `SELECT * FROM transferencias_almacen WHERE id_transferencia = @id`,
            { id: { type: sql.Int, value: id } }
        );

        if (transResult.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Transferencia no encontrada.' });
        }

        const transferencia = transResult.recordset[0];

        if (transferencia.estado !== 'pendiente') {
            return res.status(400).json({ ok: false, mensaje: `La transferencia ya está ${transferencia.estado}.` });
        }

        const detalleResult = await query(
            `SELECT id_producto, cantidad FROM detalle_transferencia WHERE id_transferencia = @id`,
            { id: { type: sql.Int, value: id } }
        );

        await withTransaction(async (transaction) => {

            //REALIZE UN CAMBIO AQUIII
            for (const item of detalleResult.recordset) {
                //El stock global no cambia, solo lo leemos para dejarlo como referencia
                const stockResult = await query(
                    `SELECT stock_actual FROM productos WHERE id_producto = @id_producto`,
                    { id_producto: { type: sql.Int, value: item.id_producto } }
                );

                const stockActual = parseFloat(stockResult.recordset[0].stock_actual);

                const reqKardex = transaction.request();
                reqKardex.input('id_producto', sql.Int, item.id_producto);
                reqKardex.input('id_almacen', sql.Int, transferencia.id_almacen_origen);
                reqKardex.input('id_almacen_destino', sql.Int, transferencia.id_almacen_destino);
                reqKardex.input('referencia_id', sql.Int, id);
                reqKardex.input('cantidad', sql.Decimal, item.cantidad);
                reqKardex.input('stock_actual', sql.Decimal, stockActual);
                reqKardex.input('id_usuario', sql.Int, id_usuario);
                await reqKardex.query(
                    `INSERT INTO kardex (id_producto, id_almacen, tipo_movimiento, motivo, referencia_id, referencia_tipo, cantidad, stock_anterior, stock_posterior, id_usuario)
                    VALUES (@id_producto, @id_almacen, 'transferencia', 
                    'Transferencia al almacén ' + CAST(@id_almacen_destino AS VARCHAR(10)),
                    @referencia_id, 'transferencia', @cantidad, @stock_actual, @stock_actual, @id_usuario)`
                );
            }

            const reqCompletar = transaction.request();
            reqCompletar.input('id', sql.Int, id);
            await reqCompletar.query(
                `UPDATE transferencias_almacen SET estado = 'completada', fecha_completada = GETDATE() WHERE id_transferencia = @id`
            );
        });

        return res.json({ ok: true, mensaje: 'Transferencia completada correctamente.' });

    } catch (err) {
        console.error('Error al completar transferencia:', err);
        if (err.message.startsWith('Stock insuficiente')) {
            return res.status(400).json({ ok: false, mensaje: err.message });
        }
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const getAllLotes = async (req, res) => {
    const { id_almacen, estado_vencimiento, producto } = req.query;
    try {
        let whereExtra = '';
        const params = {};

        if (id_almacen) {
            whereExtra += ' AND l.id_almacen = @id_almacen';
            params.id_almacen = { type: sql.Int, value: id_almacen };
        }
        if (producto) {
            whereExtra += ' AND p.nombre LIKE @producto';
            params.producto = { type: sql.VarChar, value: `%${producto}%` };
        }
        if (estado_vencimiento === 'vencido') {
            whereExtra += ' AND l.fecha_vencimiento IS NOT NULL AND l.fecha_vencimiento < CAST(GETDATE() AS DATE)';
        } else if (estado_vencimiento === 'proximo') {
            whereExtra += ' AND l.fecha_vencimiento IS NOT NULL AND l.fecha_vencimiento >= CAST(GETDATE() AS DATE) AND l.fecha_vencimiento <= CAST(DATEADD(DAY, 30, GETDATE()) AS DATE)';
        } else if (estado_vencimiento === 'vigente') {
            whereExtra += ' AND l.fecha_vencimiento IS NOT NULL AND l.fecha_vencimiento > CAST(DATEADD(DAY, 30, GETDATE()) AS DATE)';
        } else if (estado_vencimiento === 'sin_vencimiento') {
            whereExtra += ' AND l.fecha_vencimiento IS NULL';
        }

        const result = await query(
            `SELECT
                l.id_lote,
                l.numero_lote,
                l.fecha_vencimiento,
                l.cantidad,
                l.creado_en,
                p.nombre AS producto,
                a.nombre AS almacen,
                CASE
                    WHEN l.fecha_vencimiento IS NULL THEN 'sin_vencimiento'
                    WHEN l.fecha_vencimiento < CAST(GETDATE() AS DATE) THEN 'vencido'
                    WHEN l.fecha_vencimiento <= CAST(DATEADD(DAY, 30, GETDATE()) AS DATE) THEN 'proximo'
                    ELSE 'vigente'
                END AS estado_vencimiento
             FROM lotes l
             INNER JOIN almacenes a ON a.id_almacen = l.id_almacen
             INNER JOIN productos p ON p.id_producto = l.id_producto
             WHERE 1=1 ${whereExtra}
             ORDER BY l.fecha_vencimiento ASC`,
            params
        );

        return res.json({ ok: true, lotes: result.recordset });
    } catch (err) {
        console.error('Error al obtener lotes:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


module.exports = {
    getAlmacenes,
    getAlmacenById,
    crearAlmacen,
    editarAlmacen,
    desactivarAlmacen,
    getStock,
    getKardex,
    ajustarStock,
    getLotes,
    getTransferencias,
    crearTransferencia,
    completarTransferencia,
    getAllLotes
};