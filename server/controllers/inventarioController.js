const { sql, query, withTransaction } = require('../db/conexion_sql');

// ALMACENES
const getAlmacenes = async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                a.id_almacen,
                a.nombre,
                a.direccion,
                a.responsable AS id_responsable,
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
                a.responsable AS id_responsable,
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
        
        let stockSelect = 'p.stock_actual';
        let joinAlmacen = '';
        
        if (id_almacen) {
            joinAlmacen = 'INNER JOIN productos_almacen pa ON pa.id_producto = p.id_producto';
            whereExtra += ' AND pa.id_almacen = @id_almacen';
            params.id_almacen = { type: sql.Int, value: parseInt(id_almacen) };
            stockSelect = 'pa.stock';
        }

        // El HTML tiene: critico, normal, sobrestock
        if (estado === 'critico' || critico === 'true') {
            whereExtra += ` AND ${stockSelect} <= p.stock_minimo`;
        } else if (estado === 'normal') {
            whereExtra += ` AND ${stockSelect} > p.stock_minimo AND (p.stock_maximo IS NULL OR ${stockSelect} <= p.stock_maximo)`;
        } else if (estado === 'sobrestock') {
            whereExtra += ` AND p.stock_maximo IS NOT NULL AND ${stockSelect} > p.stock_maximo`;
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
                ${stockSelect} AS stock_actual,
                p.stock_minimo,
                p.stock_maximo,
                p.ubicacion,
                c.nombre AS categoria,
                sc.nombre AS subcategoria,
                u.abreviatura AS unidad,
                CASE 
                    WHEN ${stockSelect} <= p.stock_minimo THEN 'critico'
                    WHEN p.stock_maximo IS NOT NULL AND ${stockSelect} > p.stock_maximo THEN 'sobrestock'
                    ELSE 'normal'
                END AS estado_stock
             FROM productos p
             INNER JOIN subcategorias sc ON sc.id_subcategoria = p.id_subcategoria
             INNER JOIN categorias c ON c.id_categoria = sc.id_categoria
             INNER JOIN unidades_medida u ON u.id_unidad = p.id_unidad
             ${joinAlmacen}
             WHERE p.activo = 1 ${whereExtra}
             ORDER BY 
                CASE WHEN ${stockSelect} <= p.stock_minimo THEN 0 ELSE 1 END ASC,
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

        // Obtener stock actual en el almacén seleccionado
        const stockAlmResult = await query(
            `SELECT stock FROM productos_almacen WHERE id_producto = @id_producto AND id_almacen = @id_almacen`,
            {
                id_producto: { type: sql.Int, value: id_producto },
                id_almacen: { type: sql.Int, value: id_almacen }
            }
        );

        const stockAnteriorAlmacen = stockAlmResult.recordset.length > 0
            ? parseFloat(stockAlmResult.recordset[0].stock)
            : 0.0;

        const stockPosteriorAlmacen = stockAnteriorAlmacen + parseFloat(cantidad);

        if (stockPosteriorAlmacen < 0) {
            return res.status(400).json({ ok: false, mensaje: 'El ajuste dejaría el stock del almacén en negativo.' });
        }

        await withTransaction(async (transaction) => {
            const reqKardex = transaction.request();
            reqKardex.input('id_producto', sql.Int, id_producto);
            reqKardex.input('id_almacen', sql.Int, id_almacen);
            reqKardex.input('motivo', sql.VarChar, motivo);
            reqKardex.input('cantidad', sql.Decimal(10, 2), cantidad);
            reqKardex.input('stock_anterior', sql.Decimal(10, 2), stockAnteriorAlmacen);
            reqKardex.input('stock_posterior', sql.Decimal(10, 2), stockPosteriorAlmacen);
            reqKardex.input('id_usuario', sql.Int, id_usuario);
            await reqKardex.query(
                `INSERT INTO kardex (id_producto, id_almacen, tipo_movimiento, motivo, cantidad, stock_anterior, stock_posterior, id_usuario)
                 VALUES (@id_producto, @id_almacen, 'ajuste', @motivo, @cantidad, @stock_anterior, @stock_posterior, @id_usuario)`
            );

            // Upsert en productos_almacen
            const reqStockAlmacen = transaction.request();
            reqStockAlmacen.input('id_producto', sql.Int, id_producto);
            reqStockAlmacen.input('id_almacen', sql.Int, id_almacen);
            reqStockAlmacen.input('stock_posterior', sql.Decimal(10, 2), stockPosteriorAlmacen);
            await reqStockAlmacen.query(`
                IF EXISTS (SELECT * FROM productos_almacen WHERE id_producto = @id_producto AND id_almacen = @id_almacen)
                    UPDATE productos_almacen SET stock = @stock_posterior WHERE id_producto = @id_producto AND id_almacen = @id_almacen
                ELSE
                    INSERT INTO productos_almacen (id_producto, id_almacen, stock) VALUES (@id_producto, @id_almacen, @stock_posterior)
            `);

            // Actualizar stock general en tabla productos (sumando cantidad de ajuste)
            const reqStockGral = transaction.request();
            reqStockGral.input('id_producto', sql.Int, id_producto);
            await reqStockGral.query(`
                UPDATE productos
                SET stock_actual = (
                    SELECT ISNULL(SUM(stock), 0)
                    FROM productos_almacen
                    WHERE id_producto = @id_producto
                )
                WHERE id_producto = @id_producto
            `);
        });

        return res.status(201).json({
            ok: true,
            mensaje: 'Ajuste registrado correctamente.',
            stock_anterior: stockAnteriorAlmacen,
            stock_posterior: stockPosteriorAlmacen
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
                ISNULL(ao.nombre, 'Almacén eliminado') AS almacen_origen,
                ISNULL(ad.nombre, 'Almacén eliminado') AS almacen_destino,
                ISNULL(e.nombre + ' ' + e.apellido, 'Empleado no disponible') AS empleado
             FROM transferencias_almacen t
             LEFT JOIN almacenes ao ON ao.id_almacen = t.id_almacen_origen
             LEFT JOIN almacenes ad ON ad.id_almacen = t.id_almacen_destino
             LEFT JOIN empleados e ON e.id_empleado = t.id_empleado
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

const getTransferenciaById = async (req, res) => {
    const { id } = req.params;
    try {
        const transResult = await query(
            `SELECT
                t.id_transferencia,
                t.fecha,
                t.motivo,
                t.estado,
                t.fecha_completada,
                ISNULL(ao.nombre, 'Almacén eliminado') AS almacen_origen,
                ISNULL(ad.nombre, 'Almacén eliminado') AS almacen_destino,
                ISNULL(e.nombre + ' ' + e.apellido, 'Empleado no disponible') AS empleado
             FROM transferencias_almacen t
             LEFT JOIN almacenes ao ON ao.id_almacen = t.id_almacen_origen
             LEFT JOIN almacenes ad ON ad.id_almacen = t.id_almacen_destino
             LEFT JOIN empleados e ON e.id_empleado = t.id_empleado
             WHERE t.id_transferencia = @id`,
            { id: { type: sql.Int, value: id } }
        );

        if (transResult.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Transferencia no encontrada.' });
        }

        const detalleResult = await query(
            `SELECT
                dt.id_producto,
                dt.cantidad,
                p.nombre AS producto_nombre,
                p.codigo AS producto_codigo,
                u.abreviatura AS unidad
             FROM detalle_transferencia dt
             INNER JOIN productos p ON p.id_producto = dt.id_producto
             INNER JOIN unidades_medida u ON u.id_unidad = p.id_unidad
             WHERE dt.id_transferencia = @id`,
            { id: { type: sql.Int, value: id } }
        );

        return res.json({
            ok: true,
            transferencia: transResult.recordset[0],
            detalle: detalleResult.recordset
        });
    } catch (err) {
        console.error('Error al obtener transferencia por ID:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


const crearTransferencia = async (req, res) => {
    const { id_almacen_origen, id_almacen_destino, motivo, detalle } = req.body;

    if (!id_almacen_origen || !id_almacen_destino || !detalle || !detalle.length) {
        return res.status(400).json({ ok: false, mensaje: 'Complete todos los campos.' });
    }
    if (!motivo || !motivo.trim()) {
        return res.status(400).json({ ok: false, mensaje: 'El motivo de la transferencia es obligatorio.' });
    }
    if (parseInt(id_almacen_origen) === parseInt(id_almacen_destino)) {
        return res.status(400).json({ ok: false, mensaje: 'Los almacenes de origen y destino deben ser diferentes.' });
    }

    try {
        // Validar stock suficiente en el almacén de origen para cada producto
        for (const item of detalle) {
            const stockRes = await query(
                `SELECT pa.stock, p.nombre
                 FROM productos_almacen pa
                 INNER JOIN productos p ON p.id_producto = pa.id_producto
                 WHERE pa.id_producto = @id_producto AND pa.id_almacen = @id_almacen`,
                {
                    id_producto: { type: sql.Int, value: item.id_producto },
                    id_almacen:  { type: sql.Int, value: id_almacen_origen }
                }
            );
            const stockDisp = stockRes.recordset.length > 0 ? parseFloat(stockRes.recordset[0].stock) : 0;
            const nombreProd = stockRes.recordset[0]?.nombre ?? `ID ${item.id_producto}`;
            if (stockDisp < parseFloat(item.cantidad)) {
                return res.status(400).json({
                    ok: false,
                    mensaje: `Stock insuficiente para "${nombreProd}" en el almacén de origen. Disponible: ${stockDisp.toFixed(2)}, solicitado: ${parseFloat(item.cantidad).toFixed(2)}.`
                });
            }
        }

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
            reqTrans.input('motivo', sql.VarChar, motivo.trim());
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

        // Validar stock suficiente en origen antes de ejecutar la transacción
        for (const item of detalleResult.recordset) {
            const stockRes = await query(
                `SELECT pa.stock, p.nombre
                 FROM productos_almacen pa
                 INNER JOIN productos p ON p.id_producto = pa.id_producto
                 WHERE pa.id_producto = @id_producto AND pa.id_almacen = @id_almacen`,
                {
                    id_producto: { type: sql.Int, value: item.id_producto },
                    id_almacen:  { type: sql.Int, value: transferencia.id_almacen_origen }
                }
            );
            const stockDisp = stockRes.recordset.length > 0 ? parseFloat(stockRes.recordset[0].stock) : 0;
            const nombreProd = stockRes.recordset[0]?.nombre ?? `ID ${item.id_producto}`;
            if (stockDisp < parseFloat(item.cantidad)) {
                throw new Error(`Stock insuficiente para "${nombreProd}". Disponible en origen: ${stockDisp.toFixed(2)}, requerido: ${parseFloat(item.cantidad).toFixed(2)}.`);
            }
        }

        await withTransaction(async (transaction) => {
            for (const item of detalleResult.recordset) {
                const cantidad = parseFloat(item.cantidad);

                // 1. Obtener stock en almacén origen para Kardex
                const stockOrigenRes = await query(
                    `SELECT stock FROM productos_almacen WHERE id_producto = @id_producto AND id_almacen = @id_almacen`,
                    {
                        id_producto: { type: sql.Int, value: item.id_producto },
                        id_almacen:  { type: sql.Int, value: transferencia.id_almacen_origen }
                    }
                );
                const stockOrigenAntes = parseFloat(stockOrigenRes.recordset[0].stock);
                const stockOrigenDespues = stockOrigenAntes - cantidad;

                // 2. Restar stock en almacén origen
                const reqDescontar = transaction.request();
                reqDescontar.input('id_producto', sql.Int, item.id_producto);
                reqDescontar.input('id_almacen',  sql.Int, transferencia.id_almacen_origen);
                reqDescontar.input('cantidad',     sql.Decimal(10, 2), cantidad);
                await reqDescontar.query(
                    `UPDATE productos_almacen
                     SET stock = stock - @cantidad
                     WHERE id_producto = @id_producto AND id_almacen = @id_almacen`
                );

                // 3. Obtener stock en almacén destino ANTES del upsert (para el Kardex de entrada)
                const stockDestinoRes = await query(
                    `SELECT stock FROM productos_almacen WHERE id_producto = @id_producto AND id_almacen = @id_almacen`,
                    {
                        id_producto: { type: sql.Int, value: item.id_producto },
                        id_almacen:  { type: sql.Int, value: transferencia.id_almacen_destino }
                    }
                );
                const stockDestinoAntes = stockDestinoRes.recordset.length > 0
                    ? parseFloat(stockDestinoRes.recordset[0].stock)
                    : 0;
                const stockDestinoDespues = stockDestinoAntes + cantidad;

                // 4. Sumar stock en almacén destino (upsert)
                const reqAgregar = transaction.request();
                reqAgregar.input('id_producto', sql.Int, item.id_producto);
                reqAgregar.input('id_almacen',  sql.Int, transferencia.id_almacen_destino);
                reqAgregar.input('cantidad',     sql.Decimal(10, 2), cantidad);
                await reqAgregar.query(
                    `IF EXISTS (SELECT 1 FROM productos_almacen WHERE id_producto = @id_producto AND id_almacen = @id_almacen)
                         UPDATE productos_almacen SET stock = stock + @cantidad
                         WHERE id_producto = @id_producto AND id_almacen = @id_almacen
                     ELSE
                         INSERT INTO productos_almacen (id_producto, id_almacen, stock)
                         VALUES (@id_producto, @id_almacen, @cantidad)`
                );

                // 5. El stock global (productos.stock_actual) no cambia: la transferencia solo mueve entre almacenes

                // 6. Registrar en Kardex la SALIDA del origen (cantidad negativa: el stock de ese almacén baja)
                const reqKardexSalida = transaction.request();
                reqKardexSalida.input('id_producto',       sql.Int, item.id_producto);
                reqKardexSalida.input('id_almacen',         sql.Int, transferencia.id_almacen_origen);
                reqKardexSalida.input('id_almacen_destino', sql.Int, transferencia.id_almacen_destino);
                reqKardexSalida.input('referencia_id',      sql.Int, id);
                reqKardexSalida.input('cantidad',           sql.Decimal(10, 2), cantidad);
                reqKardexSalida.input('stock_antes',        sql.Decimal(10, 2), stockOrigenAntes);
                reqKardexSalida.input('stock_despues',      sql.Decimal(10, 2), stockOrigenDespues);
                reqKardexSalida.input('id_usuario',         sql.Int, id_usuario);
                await reqKardexSalida.query(
                    `INSERT INTO kardex (id_producto, id_almacen, tipo_movimiento, motivo, referencia_id, referencia_tipo, cantidad, stock_anterior, stock_posterior, id_usuario)
                     VALUES (@id_producto, @id_almacen, 'transferencia',
                     'Transferencia al almacén ' + CAST(@id_almacen_destino AS VARCHAR(10)),
                     @referencia_id, 'transferencia', -@cantidad, @stock_antes, @stock_despues, @id_usuario)`
                );

                // 7. Registrar en Kardex la ENTRADA al destino (cantidad positiva: el stock de ese almacén sube)
                const reqKardexEntrada = transaction.request();
                reqKardexEntrada.input('id_producto',     sql.Int, item.id_producto);
                reqKardexEntrada.input('id_almacen',       sql.Int, transferencia.id_almacen_destino);
                reqKardexEntrada.input('id_almacen_origen', sql.Int, transferencia.id_almacen_origen);
                reqKardexEntrada.input('referencia_id',    sql.Int, id);
                reqKardexEntrada.input('cantidad',         sql.Decimal(10, 2), cantidad);
                reqKardexEntrada.input('stock_antes',      sql.Decimal(10, 2), stockDestinoAntes);
                reqKardexEntrada.input('stock_despues',    sql.Decimal(10, 2), stockDestinoDespues);
                reqKardexEntrada.input('id_usuario',       sql.Int, id_usuario);
                await reqKardexEntrada.query(
                    `INSERT INTO kardex (id_producto, id_almacen, tipo_movimiento, motivo, referencia_id, referencia_tipo, cantidad, stock_anterior, stock_posterior, id_usuario)
                     VALUES (@id_producto, @id_almacen, 'transferencia',
                     'Transferencia desde el almacén ' + CAST(@id_almacen_origen AS VARCHAR(10)),
                     @referencia_id, 'transferencia', @cantidad, @stock_antes, @stock_despues, @id_usuario)`
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
    getTransferenciaById,
    crearTransferencia,
    completarTransferencia,
    getAllLotes
};
