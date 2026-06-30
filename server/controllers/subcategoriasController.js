const { sql, query, withTransaction } = require('../db/conexion_sql');

// Obtener todas las subcategorías activas (falta aplicar el filtro de categorias)
const getAll = async (req, res) => {
  const { id_categoria } = req.query; // leer filtro opcional

  try {
    let queryStr = `SELECT id_subcategoria, nombre, descripcion, id_categoria, activo FROM subcategorias WHERE 1=1`;
    const params = {};

    if (id_categoria) {
      queryStr += ` AND id_categoria = @id_categoria`;
      params.id_categoria = { type: sql.Int, value: id_categoria };
    }

    queryStr += ` ORDER BY nombre ASC`;

    const result = await query(queryStr, params);
    res.json({ ok: true, subcategorias: result.recordset });

  } catch (err) {
    console.error('Error al obtener subcategorías:', err);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

// Obtener subcategoría por ID
const getById = async (req, res) => {
  const { id } = req.params;//traemos el id
  try {
    //realizamos una consulta
    const result = await query(`SELECT id_subcategoria, nombre, descripcion, id_categoria, activo FROM subcategorias WHERE id_subcategoria = @id`, {
      id: { type: sql.Int, value: id }
    });
    //guardamos en una constante
    const sub = result.recordset[0];
    //validamos q exista
    if (!sub) return res.status(404).json({ ok: false, mensaje: 'Subcategoría no encontrada' });
    res.json({ ok: true, subcategoria: sub });//retornamos

  } catch (err) {
    console.error('Error al obtener subcategoría:', err);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};


// Crear nueva subcategoría
const crear = async (req, res) => {
  const { nombre, descripcion, id_categoria } = req.body;

  if (!nombre || !id_categoria) return res.status(400).json({ ok: false, mensaje: 'Nombre e id_categoria son obligatorios' });

  try {
    const existe = await query('SELECT id_subcategoria FROM subcategorias WHERE nombre = @nombre',
      { nombre: { type: sql.VarChar, value: nombre } }
    );
    if (existe.recordset.length > 0) return res.status(400).json({ ok: false, mensaje: 'Error, la subcategoria ya existe' });

    const result = await withTransaction(async trx => {
      const reqTr = trx.request();
      reqTr.input('nombre',       sql.VarChar, nombre);
      reqTr.input('descripcion',  sql.VarChar, descripcion || null);
      reqTr.input('id_categoria', sql.Int,     id_categoria);
      const resp = await reqTr.query(
        `INSERT INTO subcategorias (nombre, descripcion, id_categoria, activo) OUTPUT INSERTED.* 
        VALUES (@nombre, @descripcion, @id_categoria, 1)`
      );
      return resp.recordset[0];
    });

    res.status(201).json({ ok: true, subcategoria: result });

  } catch (err) {
    console.error('Error al crear subcategoría:', err);
    res.status(500).json({ ok: false, mensaje: 'Error interno al crear subcategoría' });
  }
};


// Actualizar subcategoría existente
const actualizar = async (req, res) => {
  const { id } = req.params;//traemos el id
  const { nombre, descripcion, id_categoria, activo } = req.body;//los datos

  //validamos
  if (!nombre || !id_categoria) return res.status(400).json({ ok: false, mensaje: 'Nombre e id_categoria son obligatorios' });
  try {

    // Verificar que el nombre no esté tomado por otra subcategoría
    const duplicado = await query(
        'SELECT id_subcategoria FROM subcategorias WHERE nombre = @nombre AND id_subcategoria <> @id',
        {
            nombre: { type: sql.VarChar, value: nombre },
            id:     { type: sql.Int,     value: id }
        }
    );
    if (duplicado.recordset.length > 0) {
        return res.status(400).json({ ok: false, mensaje: 'Ya existe otra subcategoría con ese nombre.' });
    }
    
    //realizamos una consulta
    const result = await query(
      `UPDATE subcategorias 
          SET nombre = @nombre, 
              descripcion = @descripcion, 
              id_categoria = @id_categoria,
              activo = @activo
          OUTPUT INSERTED.* 
          WHERE id_subcategoria = @id`, {
      id: { type: sql.Int, value: id },
      nombre: { type: sql.VarChar, value: nombre },
      descripcion: { type: sql.VarChar, value: descripcion || null },
      id_categoria: { type: sql.Int, value: id_categoria },
      activo: { type: sql.Bit, value: activo !== undefined ? (activo ? 1 : 0) : 1 }
    });
    //guardamos
    const sub = result.recordset[0];
    if (!sub) return res.status(404).json({ ok: false, mensaje: 'Subcategoría no encontrada' });
    res.json({ ok: true, subcategoria: sub });

  } catch (err) {
    console.error('Error al actualizar subcategoría:', err);
    res.status(500).json({ ok: false, mensaje: 'Error interno al actualizar' });
  }
};

module.exports = {
  getAll,
  getById,
  crear,
  actualizar
};
