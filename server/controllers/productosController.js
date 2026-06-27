const { sql, query, withTransaction } = require('../db/conexion_sql');

// Helper functions to verify existence of foreign keys
async function subcatExiste(id) {
    const result = await query('SELECT 1 FROM subcategorias WHERE id_subcategoria = @id', {
        id: { type: sql.Int, value: id }
    });
    return result.recordset.length > 0;
}

async function marcaExiste(id) {
    if (id == null) return true; // marca optional
    const result = await query('SELECT 1 FROM marcas WHERE id_marca = @id', {
        id: { type: sql.Int, value: id }
    });
    return result.recordset.length > 0;
}

async function unidadExiste(id) {
    const result = await query('SELECT 1 FROM unidades_medida WHERE id_unidad = @id', {
        id: { type: sql.Int, value: id }
    });
    return result.recordset.length > 0;
}


//funcion q trae todos los productos
const getAll = async (req, res) => {
    const { nombre, categoria, subcategoria, marca, activo, fecha_desde, fecha_hasta } = req.query;
    try {
        let where = 'WHERE 1=1';
        const params = {};

        if (nombre) {
            where += ' AND (p.nombre LIKE @nombre OR p.codigo LIKE @nombre)';
            params.nombre = { type: sql.VarChar, value: `%${nombre}%` };
        }
        if (categoria) {
            where += ' AND c.id_categoria = @categoria';
            params.categoria = { type: sql.Int, value: categoria };
        }
        if (subcategoria) {
            where += ' AND sc.id_subcategoria = @subcategoria';
            params.subcategoria = { type: sql.Int, value: subcategoria };
        }
        if (marca) {
            where += ' AND m.id_marca = @marca';
            params.marca = { type: sql.Int, value: marca };
        }
        if (activo === 'critico') {
            where += ' AND p.stock_actual <= p.stock_minimo AND p.activo = 1';
        } else if (activo === '1') {
            where += ' AND p.activo = 1';
        } else if (activo === '0') {
            where += ' AND p.activo = 0';
        } else {
            where += ' AND p.activo = 1';
        }

        // Filtro por rango de fecha de creación
        if (fecha_desde) {
            // Valida que sea una fecha válida antes de usarla
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
        // Validar que fecha_desde no sea mayor a fecha_hasta
        if (fecha_desde && fecha_hasta && new Date(fecha_desde) > new Date(fecha_hasta)) {
            return res.status(400).json({ ok: false, mensaje: 'fecha_desde no puede ser mayor a fecha_hasta.' });
        }

        const result = await query(
            `SELECT 
                p.id_producto,
                p.codigo,
                p.nombre,
                p.ubicacion,
                p.precio_compra,
                p.precio_venta,
                p.stock_actual,
                p.stock_minimo,
                p.activo,
                p.creado_en,
                c.nombre AS categoria,
                sc.id_subcategoria,
                sc.nombre AS subcategoria,
                m.nombre AS marca,
                u.abreviatura AS unidad,
                CASE WHEN p.stock_actual <= p.stock_minimo THEN 1 ELSE 0 END AS stock_critico
             FROM productos p
             INNER JOIN subcategorias sc ON sc.id_subcategoria = p.id_subcategoria
             INNER JOIN categorias c ON c.id_categoria = sc.id_categoria
             LEFT JOIN marcas m ON m.id_marca = p.id_marca
             INNER JOIN unidades_medida u ON u.id_unidad = p.id_unidad
             ${where}
             ORDER BY p.nombre ASC`,
            params
        );

        return res.json({
            ok: true,
            total: result.recordset.length,
            productos: result.recordset
        });
    } catch (err) {
        console.error('Error al obtener productos:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


//funcion q obtiene un prod por su id
const getById = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await query(
            `SELECT 
                p.id_producto,
                p.codigo,
                p.nombre,
                p.ubicacion,
                p.precio_compra,
                p.precio_venta,
                p.stock_actual,
                p.stock_minimo,
                p.activo,
                p.descripcion,
                p.stock_maximo,
                p.tiene_lote,
                p.creado_en,
                p.id_subcategoria,
                p.id_marca,
                p.id_unidad,
                c.nombre AS categoria,
                sc.nombre AS subcategoria,
                m.nombre AS marca,
                u.abreviatura AS unidad
            FROM productos p
            INNER JOIN subcategorias sc ON sc.id_subcategoria = p.id_subcategoria
            INNER JOIN categorias c ON sc.id_categoria = c.id_categoria
            LEFT JOIN marcas m ON m.id_marca = p.id_marca
            INNER JOIN unidades_medida u ON u.id_unidad = p.id_unidad
            WHERE p.id_producto = @id`,
            { id: { type: sql.Int, value: id } }
        );

        const producto = result.recordset[0];
        if (!producto) {
            return res.status(404).json({ ok: false, error: 'El producto no existe' });
        }

        // Imágenes del producto
        const imagenesResult = await query(
            `SELECT id_imagen, url_img 
             FROM imagenes_producto 
             WHERE id_producto = @id`,
            { id: { type: sql.Int, value: id } }
        );

        // Últimos 10 movimientos del kardex
        const kardexResult = await query(
            `SELECT TOP 10
                k.tipo_movimiento,
                k.motivo,
                k.cantidad,
                k.stock_anterior,
                k.stock_posterior,
                k.registrado_en,
                k.referencia_id,
                k.referencia_tipo,
                e.nombre + ' ' + e.apellido AS usuario
             FROM kardex k
             INNER JOIN usuarios u ON u.id_usuario = k.id_usuario
             INNER JOIN empleados e ON e.id_empleado = u.id_empleado
             WHERE k.id_producto = @id
             ORDER BY k.registrado_en DESC`,
            { id: { type: sql.Int, value: id } }
        );

        return res.json({
            ok: true,
            producto: producto,
            imagenes: imagenesResult.recordset,
            kardex: kardexResult.recordset
        });

    } catch (err) {
        console.error('Error al obtener el producto:', err);
        return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
};

//funcion q crea un producto
const crearProducto = async (req, res) => {

    // DESPUÉS:
    const {
        codigo, nombre, descripcion, id_subcategoria, id_marca, id_unidad,
        precio_compra, precio_venta, stock_minimo, stock_maximo,
        ubicacion, tiene_lote
    } = req.body;

    if (!codigo || !nombre || !id_subcategoria || !id_unidad ||
        !precio_compra || !precio_venta || stock_minimo == null ||
        !ubicacion || tiene_lote == null) {
        return res.status(400).json({ ok: false, mensaje: 'Complete los campos obligatorios.' });
    }

    if (Number(precio_compra) <= 0 || Number(precio_venta) <= 0) {
        return res.status(400).json({ ok: false, mensaje: 'Los precios deben ser mayores a 0.' });
    }

    if (Number(stock_minimo) < 0) {
        return res.status(400).json({ ok: false, mensaje: 'El stock mínimo no puede ser negativo.' });
    }

    if (stock_maximo != null && Number(stock_maximo) < Number(stock_minimo)) {
        return res.status(400).json({ ok: false, mensaje: 'El stock máximo no puede ser menor al mínimo.' });
    }

    try {
        const existe = await query(
            `SELECT id_producto FROM productos WHERE codigo = @codigo`,
            { codigo: { type: sql.VarChar, value: codigo } }
        );
        if (existe.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'El código ya está registrado.' });
        }

        if (!(await subcatExiste(id_subcategoria))) {
            return res.status(400).json({ ok: false, mensaje: 'Subcategoría no encontrada.' });
        }
        if (!(await unidadExiste(id_unidad))) {
            return res.status(400).json({ ok: false, mensaje: 'Unidad de medida no encontrada.' });
        }
        if (id_marca && !(await marcaExiste(id_marca))) {
            return res.status(400).json({ ok: false, mensaje: 'Marca no encontrada.' });
        }

        if (!req.fileUrl) {
            return res.status(400).json({ ok: false, mensaje: 'La imagen es obligatoria.' });
        }

        const result = await withTransaction(async (transaction) => {
            const reqProd = transaction.request();
            reqProd.input('id_subcategoria', sql.Int, id_subcategoria);
            reqProd.input('id_marca', sql.Int, id_marca || null);
            reqProd.input('id_unidad', sql.Int, id_unidad);
            reqProd.input('codigo', sql.VarChar, codigo);
            reqProd.input('nombre', sql.VarChar, nombre);
            reqProd.input('descripcion', sql.VarChar, descripcion || null);
            reqProd.input('precio_compra', sql.Decimal, precio_compra);
            reqProd.input('precio_venta', sql.Decimal, precio_venta);
            //reqProd.input('stock_actual', sql.Decimal, stock_actual); NO DESCOMENTAR 
            reqProd.input('stock_minimo', sql.Decimal, stock_minimo);
            reqProd.input('stock_maximo', sql.Decimal, stock_maximo || 0);
            reqProd.input('ubicacion', sql.VarChar, ubicacion);
            reqProd.input('tiene_lote', sql.Bit, tiene_lote);
            const prodResult = await reqProd.query(
                `INSERT INTO productos (id_subcategoria, id_marca, id_unidad, codigo, nombre, descripcion,
         precio_compra, precio_venta, stock_minimo, stock_maximo, ubicacion, tiene_lote)
         OUTPUT INSERTED.*
         VALUES (@id_subcategoria, @id_marca, @id_unidad, @codigo, @nombre, @descripcion,
         @precio_compra, @precio_venta, @stock_minimo, @stock_maximo, @ubicacion, @tiene_lote)`
            );

            const nuevoProducto = prodResult.recordset[0];

            const reqImg = transaction.request(); // nuevo request
            reqImg.input('id_producto', sql.Int, nuevoProducto.id_producto);
            reqImg.input('url_img', sql.VarChar, req.fileUrl);
            await reqImg.query(
                `INSERT INTO imagenes_producto (id_producto, url_img) VALUES (@id_producto, @url_img)`
            );

            return nuevoProducto;
        });

        return res.status(201).json({ ok: true, producto: result, url_img: req.fileUrl });

    } catch (err) {
        console.error('Error crear producto:', err);
        if (err?.code === 'EREF') {
            return res.status(400).json({ ok: false, mensaje: 'Violación de clave foránea.' });
        }
        return res.status(500).json({ ok: false, mensaje: 'Error al crear producto.' });
    }
};

//funcion q ediar un producto
/*const editarProducto = async (req, res) => {
    const id = req.params.id;
    const {
        precio_compra, precio_venta, stock_minimo, stock_maximo,
        ubicacion, nombre, id_subcategoria, tiene_lote, activo
    } = req.body;

    if (!nombre || !id_subcategoria || stock_maximo == null ||
        !precio_compra || !precio_venta || activo == null || stock_minimo == null ||
        !ubicacion || tiene_lote == null) {
        return res.status(400).json({ ok: false, mensaje: 'Complete los campos obligatorios.' });
    }

    // Validar que precio_compra y precio_venta sean positivos
    if (Number(precio_compra) <= 0 || Number(precio_venta) <= 0) {
        return res.status(400).json({ ok: false, mensaje: 'Los precios deben ser mayores a 0.' });
    }

    // Validar que stock_minimo no sea negativo
    if (Number(stock_minimo) < 0) {
        return res.status(400).json({ ok: false, mensaje: 'El stock mínimo no puede ser negativo.' });
    }

    // Validar que stock_maximo >= stock_minimo y que sea mayor a 0
    if (Number(stock_maximo) <= 0) {
        return res.status(400).json({ ok: false, mensaje: 'El stock máximo debe ser mayor a 0.' });
    }
    if (Number(stock_maximo) < Number(stock_minimo)) {
        return res.status(400).json({ ok: false, mensaje: 'El stock máximo no puede ser menor al mínimo.' });
    }

    try {
        // Verificar que el producto exista
        const existe = await query(
            `SELECT id_producto FROM productos WHERE id_producto = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (existe.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'El producto no existe.' });
        }

        // Verificar que la subcategoría exista
        if (!(await subcatExiste(id_subcategoria))) {
            return res.status(400).json({ ok: false, mensaje: 'Subcategoría no encontrada.' });
        }

        const dataProducts = await query(
            `UPDATE productos 
                SET id_subcategoria = @id_subcategoria,  
                    nombre = @nombre, 
                    precio_compra = @precio_compra, 
                    precio_venta = @precio_venta, 
                    stock_minimo = @stock_minimo, 
                    stock_maximo = @stock_maximo, 
                    ubicacion = @ubicacion, 
                    tiene_lote = @tiene_lote,
                    activo = @activo
                OUTPUT INSERTED.*
                WHERE id_producto = @id`,
            {
                id_subcategoria: { type: sql.Int, value: id_subcategoria },
                nombre: { type: sql.VarChar, value: nombre },
                precio_compra: { type: sql.Decimal, value: precio_compra },
                precio_venta: { type: sql.Decimal, value: precio_venta },
                stock_minimo: { type: sql.Decimal, value: stock_minimo },
                stock_maximo: { type: sql.Decimal, value: stock_maximo },
                ubicacion: { type: sql.VarChar, value: ubicacion },
                tiene_lote: { type: sql.Bit, value: tiene_lote },
                activo: { type: sql.Bit, value: activo },
                id: { type: sql.Int, value: id }
            }
        );

        return res.status(200).json({ ok: true, producto: dataProducts.recordset[0] });

    } catch (err) {
        console.error('Error al editar producto:', err);
        if (err?.code === 'EREF') {
            return res.status(400).json({ ok: false, mensaje: 'Violación de clave foránea.' });
        }
        return res.status(500).json({ ok: false, mensaje: 'Error al editar producto.' });
    }
};*/

const editarProducto = async (req, res) => {
    const id = req.params.id;
    const {
        precio_compra, precio_venta, stock_minimo, stock_maximo,
        ubicacion, nombre, id_subcategoria, tiene_lote, activo,
        id_marca, id_unidad, descripcion
    } = req.body;

    if (!nombre || !id_subcategoria || stock_maximo == null ||
        !precio_compra || !precio_venta || activo == null || stock_minimo == null ||
        !ubicacion || tiene_lote == null) {
        return res.status(400).json({ ok: false, mensaje: 'Complete los campos obligatorios.' });
    }

    // Validar que precio_compra y precio_venta sean positivos
    if (Number(precio_compra) <= 0 || Number(precio_venta) <= 0) {
        return res.status(400).json({ ok: false, mensaje: 'Los precios deben ser mayores a 0.' });
    }

    // Validar que stock_minimo no sea negativo
    if (Number(stock_minimo) < 0) {
        return res.status(400).json({ ok: false, mensaje: 'El stock mínimo no puede ser negativo.' });
    }

    // Validar que stock_maximo >= stock_minimo y que sea mayor a 0
    if (Number(stock_maximo) <= 0) {
        return res.status(400).json({ ok: false, mensaje: 'El stock máximo debe ser mayor a 0.' });
    }
    if (Number(stock_maximo) < Number(stock_minimo)) {
        return res.status(400).json({ ok: false, mensaje: 'El stock máximo no puede ser menor al mínimo.' });
    }

    try {
        // Verificar que el producto exista
        const existe = await query(
            `SELECT id_producto FROM productos WHERE id_producto = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (existe.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'El producto no existe.' });
        }

        // Verificar que la subcategoría exista
        if (!(await subcatExiste(id_subcategoria))) {
            return res.status(400).json({ ok: false, mensaje: 'Subcategoría no encontrada.' });
        }
        if (!(await unidadExiste(id_unidad))) {
            return res.status(400).json({ ok: false, mensaje: 'Unidad de medida no encontrada.' });
        }
        if (id_marca && !(await marcaExiste(id_marca))) {
            return res.status(400).json({ ok: false, mensaje: 'Marca no encontrada.' });
        }

        const dataProducts = await query(
            `UPDATE productos 
                SET id_subcategoria = @id_subcategoria,  
                    id_marca = @id_marca,
                    id_unidad = @id_unidad,
                    nombre = @nombre, 
                    descripcion = @descripcion,
                    precio_compra = @precio_compra, 
                    precio_venta = @precio_venta, 
                    stock_minimo = @stock_minimo, 
                    stock_maximo = @stock_maximo, 
                    ubicacion = @ubicacion, 
                    tiene_lote = @tiene_lote,
                    activo = @activo
                OUTPUT INSERTED.*
                WHERE id_producto = @id`,
            {
                id_subcategoria: { type: sql.Int, value: id_subcategoria },
                id_marca: { type: sql.Int, value: id_marca || null },
                id_unidad: { type: sql.Int, value: id_unidad },
                nombre: { type: sql.VarChar, value: nombre },
                descripcion: { type: sql.VarChar, value: descripcion || null },
                precio_compra: { type: sql.Decimal, value: precio_compra },
                precio_venta: { type: sql.Decimal, value: precio_venta },
                stock_minimo: { type: sql.Decimal, value: stock_minimo },
                stock_maximo: { type: sql.Decimal, value: stock_maximo },
                ubicacion: { type: sql.VarChar, value: ubicacion },
                tiene_lote: { type: sql.Bit, value: tiene_lote },
                activo: { type: sql.Bit, value: activo },
                id: { type: sql.Int, value: id }
            }
        );

        
        // Si se subió una imagen nueva, reemplaza la anterior (mantiene siempre
        // como máximo una imagen por producto, sin acumular filas viejas)
        if (req.fileUrl) {
            const anteriores = await query(
                `SELECT id_imagen FROM imagenes_producto WHERE id_producto = @id`,
                { id: { type: sql.Int, value: id } }
            );
            if (anteriores.recordset.length > 0) {
                await query(
                    `DELETE FROM imagenes_producto WHERE id_producto = @id`,
                    { id: { type: sql.Int, value: id } }
                );
            }
            await query(
                `INSERT INTO imagenes_producto (id_producto, url_img) VALUES (@id_producto, @url_img)`,
                {
                    id_producto: { type: sql.Int, value: id },
                    url_img: { type: sql.VarChar, value: req.fileUrl }
                }
            );
        }

        return res.status(200).json({ ok: true, producto: dataProducts.recordset[0] });

    } catch (err) {
        console.error('Error al editar producto:', err);
        if (err?.code === 'EREF') {
            return res.status(400).json({ ok: false, mensaje: 'Violación de clave foránea.' });
        }
        return res.status(500).json({ ok: false, mensaje: 'Error al editar producto.' });
    }
};

//funcion q desactiva un producto
const desactivarProducto = async (req, res) => {
    const id = req.params.id;
    try {
        const existe = await query(
            `SELECT id_producto, activo FROM productos WHERE id_producto = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (existe.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'El producto no existe.' });
        }
        if (existe.recordset[0].activo === false) {
            return res.status(400).json({ ok: false, mensaje: 'El producto ya está inactivo.' });
        }

        const dataProducts = await query(
            `UPDATE productos SET activo = 0 OUTPUT INSERTED.* WHERE id_producto = @id`,
            { id: { type: sql.Int, value: id } }
        );

        return res.status(200).json({ ok: true, producto: dataProducts.recordset[0] });

    } catch (err) {
        console.error('Error al desactivar producto:', err.message);
        return res.status(500).json({ ok: false, mensaje: 'Error al desactivar producto.' });
    }
};

const uploadImage = async (req, res) => {
    const id = req.params.id;
    try {
        const existe = await query(
            `SELECT id_producto FROM productos WHERE id_producto = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (existe.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'El producto no existe.' });
        }

        if (!req.fileUrl) {
            return res.status(400).json({ ok: false, mensaje: 'No se recibió ninguna imagen.' });
        }

        const result = await query(
            `INSERT INTO imagenes_producto (id_producto, url_img)
             OUTPUT INSERTED.*
             VALUES (@id_producto, @url_img)`,
            {
                id_producto: { type: sql.Int, value: id },
                url_img: { type: sql.VarChar, value: req.fileUrl }
            }
        );

        return res.status(201).json({ ok: true, imagen: result.recordset[0] });

    } catch (err) {
        console.error('Error al subir imagen:', err.message);
        return res.status(500).json({ ok: false, mensaje: 'Error al subir imagen.' });
    }
};

const deleteImage = async (req, res) => {
    const { id, idImagen } = req.params;
    try {
        // Verificar que la imagen exista y pertenezca al producto
        const existe = await query(
            `SELECT id_imagen, url_img FROM imagenes_producto 
             WHERE id_imagen = @idImagen AND id_producto = @id`,
            {
                idImagen: { type: sql.Int, value: idImagen },
                id: { type: sql.Int, value: id }
            }
        );

        if (existe.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Imagen no encontrada.' });
        }

        const imagen = existe.recordset[0];

        // Eliminar de Cloudinary
        const cloudinary = require('cloudinary').v2;
        const urlParts = imagen.url_img.split('/');
        const fileName = urlParts[urlParts.length - 1].split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${fileName}`;

        await cloudinary.uploader.destroy(publicId);

        // Eliminar de la BD
        await query(
            `DELETE FROM imagenes_producto WHERE id_imagen = @idImagen`,
            { idImagen: { type: sql.Int, value: idImagen } }
        );

        return res.status(200).json({ ok: true, mensaje: 'Imagen eliminada correctamente.' });

    } catch (err) {
        console.error('Error al eliminar imagen:', err.message);
        return res.status(500).json({ ok: false, mensaje: 'Error al eliminar imagen.' });
    }
};



module.exports = {
    getAll,
    getById,
    crearProducto,
    editarProducto,
    desactivarProducto,
    uploadImage,
    deleteImage
}