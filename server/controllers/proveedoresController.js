const { sql, query, withTransaction } = require('../db/conexion_sql');

// PROVEEDORES

const getAll = async (req, res) => {
    const { buscar, condicion_pago, activo, fecha_desde, fecha_hasta } = req.query;
    try {
        let where = 'WHERE 1=1';
        const params = {};

        if (buscar) {
            where += ' AND (p.nombre LIKE @buscar OR p.ruc LIKE @buscar)';
            params.buscar = { type: sql.VarChar, value: `%${buscar}%` };
        }
        if (condicion_pago) {
            where += ' AND p.condicion_pago = @condicion_pago';
            params.condicion_pago = { type: sql.VarChar, value: condicion_pago };
        }
        if (activo !== undefined && activo !== '') {
            where += ' AND p.activo = @activo';
            params.activo = { type: sql.Bit, value: parseInt(activo) };
        }

        //validamos las fechas CAMBIE AQUI
        if (fecha_desde) {
            if (isNaN(Date.parse(fecha_desde))) {
                return res.status(400).json({ ok: false, mensaje: 'fecha_desde no es una fecha válida.' });
            }
            where += ' AND CAST(p.creado_en AS DATE) >= @fecha_desde';
            params.fecha_desde = { type: sql.Date, value: fecha_desde };
        }
        if (fecha_hasta) {
            if (isNaN(Date.parse(fecha_hasta))) {
                return res.status(400).json({ ok: false, mensaje: 'fecha_hasta no es una fecha válida.' });
            }
            where += ' AND CAST(p.creado_en AS DATE) <= @fecha_hasta';
            params.fecha_hasta = { type: sql.Date, value: fecha_hasta };
        }
        if (fecha_desde && fecha_hasta && new Date(fecha_desde) > new Date(fecha_hasta)) {
            return res.status(400).json({ ok: false, mensaje: 'fecha_desde no puede ser mayor a fecha_hasta.' });
        }

        const result = await query(
            `SELECT
                p.id_proveedor,
                p.ruc,
                p.nombre,
                p.direccion,
                p.telefono,
                p.correo,
                p.web,
                p.condicion_pago,
                p.activo,
                p.creado_en,
                COUNT(DISTINCT pp.id) AS total_productos,
                COUNT(DISTINCT cp.id_contacto) AS total_contactos
             FROM proveedores p
             LEFT JOIN productos_proveedor pp ON pp.id_proveedor = p.id_proveedor
             LEFT JOIN contactos_proveedor cp ON cp.id_proveedor = p.id_proveedor
             ${where}
             GROUP BY p.id_proveedor, p.ruc, p.nombre, p.direccion, p.telefono,
                      p.correo, p.web, p.condicion_pago, p.activo, p.creado_en
             ORDER BY p.nombre ASC`,
            params
        );

        return res.json({
            ok: true,
            total: result.recordset.length,
            proveedores: result.recordset
        });
    } catch (err) {
        console.error('Error al obtener proveedores:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const getById = async (req, res) => {
    const { id } = req.params;
    try {
        // Datos del proveedor
        const provResult = await query(
            `SELECT
                p.id_proveedor,
                p.ruc,
                p.nombre,
                p.direccion,
                p.telefono,
                p.correo,
                p.web,
                p.condicion_pago,
                p.activo,
                p.creado_en
             FROM proveedores p
             WHERE p.id_proveedor = @id`,
            { id: { type: sql.Int, value: id } }
        );

        const proveedor = provResult.recordset[0];
        if (!proveedor) {
            return res.status(404).json({ ok: false, mensaje: 'Proveedor no encontrado.' });
        }

        // Contactos del proveedor
        const contactosResult = await query(
            `SELECT id_contacto, nombre, cargo, telefono, correo, es_principal
             FROM contactos_proveedor
             WHERE id_proveedor = @id
             ORDER BY es_principal DESC`,
            { id: { type: sql.Int, value: id } }
        );

        // Productos que provee
        const productosResult = await query(
            `SELECT
                pp.id,
                pp.codigo_proveedor,
                pp.precio_compra,
                pp.tiempo_entrega_dias,
                pp.es_preferido,
                pr.id_producto,
                pr.codigo,
                pr.nombre AS producto
             FROM productos_proveedor pp
             INNER JOIN productos pr ON pr.id_producto = pp.id_producto
             WHERE pp.id_proveedor = @id`,
            { id: { type: sql.Int, value: id } }
        );

        return res.json({
            ok: true,
            proveedor,
            contactos: contactosResult.recordset,
            productos: productosResult.recordset
        });
    } catch (err) {
        console.error('Error al obtener proveedor:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const crearProveedor = async (req, res) => {
    const { ruc, nombre, direccion, telefono, correo, web, condicion_pago } = req.body;

    if (!ruc || !nombre) {
        return res.status(400).json({ ok: false, mensaje: 'RUC y nombre son obligatorios.' });
    }

    try {
        // Verificar RUC único
        const existe = await query(
            `SELECT id_proveedor FROM proveedores WHERE ruc = @ruc`,
            { ruc: { type: sql.VarChar, value: ruc } }
        );
        if (existe.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'El RUC ya está registrado.' });
        }

        const result = await query(
            `INSERT INTO proveedores (ruc, nombre, direccion, telefono, correo, web, condicion_pago, activo)
             OUTPUT INSERTED.*
             VALUES (@ruc, @nombre, @direccion, @telefono, @correo, @web, @condicion_pago, 1)`,
            {
                ruc: { type: sql.VarChar, value: ruc },
                nombre: { type: sql.VarChar, value: nombre },
                direccion: { type: sql.VarChar, value: direccion || null },
                telefono: { type: sql.VarChar, value: telefono || null },
                correo: { type: sql.VarChar, value: correo || null },
                web: { type: sql.VarChar, value: web || null },
                condicion_pago: { type: sql.VarChar, value: condicion_pago || 'contado' }
            }
        );

        return res.status(201).json({ ok: true, proveedor: result.recordset[0] });
    } catch (err) {
        console.error('Error al crear proveedor:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const editarProveedor = async (req, res) => {
    const { id } = req.params;
    const { ruc, nombre, direccion, telefono, correo, web, condicion_pago } = req.body;

    if (!ruc || !nombre) {
        return res.status(400).json({ ok: false, mensaje: 'RUC y nombre son obligatorios.' });
    }

    try {
        const existe = await query(
            `SELECT id_proveedor FROM proveedores WHERE id_proveedor = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (existe.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Proveedor no encontrado.' });
        }

        // Verificar que el RUC no esté tomado por otro proveedor
        const rucExiste = await query(
            `SELECT id_proveedor FROM proveedores WHERE ruc = @ruc AND id_proveedor <> @id`,
            {
                ruc: { type: sql.VarChar, value: ruc },
                id: { type: sql.Int, value: id }
            }
        );
        if (rucExiste.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'El RUC ya está registrado por otro proveedor.' });
        }

        const result = await query(
            `UPDATE proveedores
             SET ruc = @ruc, nombre = @nombre, direccion = @direccion,
                 telefono = @telefono, correo = @correo, web = @web,
                 condicion_pago = @condicion_pago
             OUTPUT INSERTED.*
             WHERE id_proveedor = @id`,
            {
                ruc: { type: sql.VarChar, value: ruc },
                nombre: { type: sql.VarChar, value: nombre },
                direccion: { type: sql.VarChar, value: direccion || null },
                telefono: { type: sql.VarChar, value: telefono || null },
                correo: { type: sql.VarChar, value: correo || null },
                web: { type: sql.VarChar, value: web || null },
                condicion_pago: { type: sql.VarChar, value: condicion_pago || 'contado' },
                id: { type: sql.Int, value: id }
            }
        );

        return res.json({ ok: true, proveedor: result.recordset[0] });
    } catch (err) {
        console.error('Error al editar proveedor:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const desactivarProveedor = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(
            `UPDATE proveedores SET activo = 0 OUTPUT INSERTED.*
             WHERE id_proveedor = @id AND activo = 1`,
            { id: { type: sql.Int, value: id } }
        );
        if (result.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Proveedor no encontrado o ya inactivo.' });
        }
        return res.json({ ok: true, proveedor: result.recordset[0] });
    } catch (err) {
        console.error('Error al desactivar proveedor:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// CONTACTOS

const addContacto = async (req, res) => {
    const { id } = req.params;
    const { nombre, cargo, telefono, correo, es_principal } = req.body;

    if (!nombre) {
        return res.status(400).json({ ok: false, mensaje: 'El nombre del contacto es obligatorio.' });
    }

    try {
        const existe = await query(
            `SELECT id_proveedor FROM proveedores WHERE id_proveedor = @id AND activo = 1`,
            { id: { type: sql.Int, value: id } }
        );
        if (existe.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Proveedor no encontrado.' });
        }

        // Si es_principal = 1, desmarcar los demás
        if (es_principal) {
            await query(
                `UPDATE contactos_proveedor SET es_principal = 0 WHERE id_proveedor = @id`,
                { id: { type: sql.Int, value: id } }
            );
        }

        const result = await query(
            `INSERT INTO contactos_proveedor (id_proveedor, nombre, cargo, telefono, correo, es_principal)
             OUTPUT INSERTED.*
             VALUES (@id_proveedor, @nombre, @cargo, @telefono, @correo, @es_principal)`,
            {
                id_proveedor: { type: sql.Int, value: id },
                nombre: { type: sql.VarChar, value: nombre },
                cargo: { type: sql.VarChar, value: cargo || null },
                telefono: { type: sql.VarChar, value: telefono || null },
                correo: { type: sql.VarChar, value: correo || null },
                es_principal: { type: sql.Bit, value: es_principal ? 1 : 0 }
            }
        );

        return res.status(201).json({ ok: true, contacto: result.recordset[0] });
    } catch (err) {
        console.error('Error al agregar contacto:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const removeContacto = async (req, res) => {
    const { id, idContacto } = req.params;
    try {
        const result = await query(
            `DELETE FROM contactos_proveedor
             OUTPUT DELETED.*
             WHERE id_contacto = @idContacto AND id_proveedor = @id`,
            {
                idContacto: { type: sql.Int, value: idContacto },
                id: { type: sql.Int, value: id }
            }
        );
        if (result.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Contacto no encontrado.' });
        }
        return res.json({ ok: true, mensaje: 'Contacto eliminado correctamente.' });
    } catch (err) {
        console.error('Error al eliminar contacto:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// PRODUCTOS DEL PROVEEDOR

const addProducto = async (req, res) => {
    const { id } = req.params;
    const { id_producto, codigo_proveedor, precio_compra, tiempo_entrega_dias, es_preferido } = req.body;

    if (!id_producto || precio_compra === undefined) {
        return res.status(400).json({ ok: false, mensaje: 'id_producto y precio_compra son obligatorios.' });
    }

    try {
        // Verificar que el proveedor exista
        const provExiste = await query(
            `SELECT id_proveedor FROM proveedores WHERE id_proveedor = @id AND activo = 1`,
            { id: { type: sql.Int, value: id } }
        );
        if (provExiste.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Proveedor no encontrado.' });
        }

        // Verificar que el producto exista
        const prodExiste = await query(
            `SELECT id_producto FROM productos WHERE id_producto = @id_producto AND activo = 1`,
            { id_producto: { type: sql.Int, value: id_producto } }
        );
        if (prodExiste.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
        }

        // Verificar que no esté ya asociado
        const yaExiste = await query(
            `SELECT id FROM productos_proveedor WHERE id_producto = @id_producto AND id_proveedor = @id`,
            {
                id_producto: { type: sql.Int, value: id_producto },
                id: { type: sql.Int, value: id }
            }
        );
        if (yaExiste.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'Este producto ya está asociado al proveedor.' });
        }

        const result = await query(
            `INSERT INTO productos_proveedor (id_producto, id_proveedor, codigo_proveedor, precio_compra, tiempo_entrega_dias, es_preferido)
             OUTPUT INSERTED.*
             VALUES (@id_producto, @id_proveedor, @codigo_proveedor, @precio_compra, @tiempo_entrega_dias, @es_preferido)`,
            {
                id_producto: { type: sql.Int, value: id_producto },
                id_proveedor: { type: sql.Int, value: id },
                codigo_proveedor: { type: sql.VarChar, value: codigo_proveedor || null },
                precio_compra: { type: sql.Decimal, value: precio_compra },
                tiempo_entrega_dias: { type: sql.Int, value: tiempo_entrega_dias || null },
                es_preferido: { type: sql.Bit, value: es_preferido ? 1 : 0 }
            }
        );

        return res.status(201).json({ ok: true, producto_proveedor: result.recordset[0] });
    } catch (err) {
        console.error('Error al asociar producto:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const removeProducto = async (req, res) => {
    const { id, idProducto } = req.params;
    try {
        const result = await query(
            `DELETE FROM productos_proveedor
             OUTPUT DELETED.*
             WHERE id_producto = @idProducto AND id_proveedor = @id`,
            {
                idProducto: { type: sql.Int, value: idProducto },
                id: { type: sql.Int, value: id }
            }
        );
        if (result.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Asociación no encontrada.' });
        }
        return res.json({ ok: true, mensaje: 'Producto desasociado correctamente.' });
    } catch (err) {
        console.error('Error al desasociar producto:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const getComparativa = async (req, res) => {
    const { buscar, categoria } = req.query;
    try {
        let where = 'WHERE p.activo = 1 AND pp.id IS NOT NULL';
        const params = {};

        if (buscar) {
            where += ' AND (p.nombre LIKE @buscar OR p.codigo LIKE @buscar)';
            params.buscar = { type: sql.VarChar, value: `%${buscar}%` };
        }
        if (categoria) {
            where += ' AND c.id_categoria = @categoria';
            params.categoria = { type: sql.Int, value: categoria };
        }

        // Traer productos con sus proveedores agrupados
        const productosResult = await query(
            `SELECT
                p.id_producto,
                p.codigo,
                p.nombre AS producto,
                c.nombre AS categoria,
                sc.nombre AS subcategoria,
                u.abreviatura AS unidad,
                COUNT(pp.id) AS total_proveedores,
                MIN(pp.precio_compra) AS mejor_precio
             FROM productos p
             INNER JOIN subcategorias sc ON sc.id_subcategoria = p.id_subcategoria
             INNER JOIN categorias c ON c.id_categoria = sc.id_categoria
             INNER JOIN unidades_medida u ON u.id_unidad = p.id_unidad
             LEFT JOIN productos_proveedor pp ON pp.id_producto = p.id_producto
             ${where}
             GROUP BY p.id_producto, p.codigo, p.nombre, c.nombre, sc.nombre, u.abreviatura
             HAVING COUNT(pp.id) > 0
             ORDER BY p.nombre ASC`,
            params
        );

        // Para cada producto traer el detalle de sus proveedores
        //CAMBIE AQUI
        const productos = productosResult.recordset;

        if (productos.length > 0) {

            // DESPUÉS
            const detalleResult = await query(
                `SELECT
                    pp.id,
                    pp.codigo_proveedor,
                    pp.precio_compra,
                    pp.tiempo_entrega_dias,
                    pp.es_preferido,
                    pp.id_producto,
                    pv.id_proveedor,
                    pv.nombre AS proveedor,
                    pv.ruc
                FROM productos_proveedor pp
                INNER JOIN proveedores pv ON pv.id_proveedor = pp.id_proveedor
                INNER JOIN (${productos.map((_, i) => `SELECT @id${i} AS id_producto`).join(' UNION ALL ')}) ids
                    ON ids.id_producto = pp.id_producto
                WHERE pv.activo = 1
                ORDER BY pp.id_producto, pp.precio_compra ASC`,
                Object.fromEntries(productos.map((p, i) => [`id${i}`, { type: sql.Int, value: p.id_producto }]))
            );

            // Agrupar proveedores por producto en JS
            const mapaProveedores = detalleResult.recordset.reduce((mapa, row) => {
                if (!mapa[row.id_producto]) mapa[row.id_producto] = [];
                mapa[row.id_producto].push(row);
                return mapa;
            }, {});

            productos.forEach(p => {
                p.proveedores = mapaProveedores[p.id_producto] || [];
            });
        }

        return res.json({
            ok: true,
            total: productos.length,
            comparativa: productos
        });

    } catch (err) {
        console.error('Error al obtener comparativa:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const getProductosByProveedor = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(
            `SELECT
                p.id_producto,
                p.nombre,
                p.codigo,
                pp.precio_compra,
                pp.codigo_proveedor,
                pp.tiempo_entrega_dias
            FROM productos_proveedor pp
            INNER JOIN productos p ON p.id_producto = pp.id_producto
            WHERE pp.id_proveedor = @id AND p.activo = 1
            ORDER BY p.nombre ASC`,
            { id: { type: sql.Int, value: id } }
        );
        return res.json({ ok: true, productos: result.recordset });
    } catch (err) {
        console.error('Error getProductosByProveedor:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error al obtener productos del proveedor.' });
    }
};

module.exports = {
    getAll,
    getById,
    crearProveedor,
    editarProveedor,
    desactivarProveedor,
    addContacto,
    removeContacto,
    addProducto,
    removeProducto,
    getComparativa,
    getProductosByProveedor
};