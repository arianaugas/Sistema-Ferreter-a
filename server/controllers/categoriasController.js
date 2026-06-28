const { sql, query } = require('../db/conexion_sql');

// Obtener todas las categorías activas
const getAll = async (req, res) => {
  try {
    //creamos una consulta
    const result = await query(`SELECT id_categoria, nombre, descripcion, activo FROM categorias ORDER BY nombre ASC`);
    res.json({ ok: true, categorias: result.recordset });

  } catch (err) {
    console.error('Error al obtener categorias:', err);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

const getById = async (req, res) => {
  const { id } = req.params;//traemos el id de la peticion
  try {
    //realizamos la consulta
    const result = await query(
      `SELECT id_categoria, nombre, descripcion, activo FROM categorias WHERE id_categoria = @id`,
      {
        id: { type: sql.Int, value: id }
      });
    //guardamos en una constante
    const categoria = result.recordset[0];

    //validamos q exista
    if (!categoria) return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });
    res.json({ ok: true, categoria });//retornamos

  } catch (err) {
    console.error('Error al obtener categoría:', err);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};


// Crear nueva categoría
const crearCategoria = async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ ok: false, mensaje: 'Nombre es obligatorio' });

  try {
    const existe = await query(
      `SELECT id_categoria FROM categorias WHERE nombre = @nombre`,
      { nombre: { type: sql.VarChar, value: nombre } }
    );
    if (existe.recordset.length > 0) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre ya está registrado.' });
    }

    const result = await query(
      `INSERT INTO categorias (nombre, descripcion, activo)
       OUTPUT INSERTED.*
       VALUES (@nombre, @descripcion, 1)`,
      {
        nombre:      { type: sql.VarChar, value: nombre },
        descripcion: { type: sql.VarChar, value: descripcion || null }
      }
    );

    res.status(201).json({ ok: true, categoria: result.recordset[0] });
  } catch (err) {
    console.error('Error al crear categoría:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear categoría' });
  }
};


// Actualizar categoría existente
const actualizarCategoria = async (req, res) => {
  const { id } = req.params;//traemos el id
  const { nombre, descripcion, activo } = req.body;//traemos los datos de la peticion
  if (!nombre) return res.status(400).json({ ok: false, mensaje: 'Nombre es obligatorio' });

  try {

    // Verificar que el nombre no esté en uso por OTRA categoría
    const existe = await query(
      `SELECT id_categoria FROM categorias WHERE nombre = @nombre AND id_categoria <> @id`,
      {
        nombre: { type: sql.VarChar, value: nombre },
        id: { type: sql.Int, value: id }
      }
    );
    if (existe.recordset.length > 0) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre ya está registrado.' });
    }

    //realizamos el updated
    const result = await query(
      `UPDATE categorias SET nombre = @nombre, descripcion = @descripcion, activo = @activo OUTPUT INSERTED.* 
      WHERE id_categoria = @id`, {
      id: { type: sql.Int, value: id },
      nombre: { type: sql.VarChar, value: nombre },
      descripcion: { type: sql.VarChar, value: descripcion || null },
      activo: { type: sql.Bit, value: activo !== undefined ? (activo ? 1 : 0) : 1 }
    });

    const categoria = result.recordset[0];
    if (!categoria) return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });

    res.json({ ok: true, categoria });
  } catch (err) {
    console.error('Error al actualizar categoría:', err);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};


// Desactivar categoría
/*const desactivarCategoria = async (req, res) => { IGNORAR
  const { id } = req.params;//traemos el id

  try {
    //consultamos
    const result = await query(`UPDATE categorias SET activo = 0 OUTPUT INSERTED.* 
      WHERE id_categoria = @id AND activo = 1`, {
      id: { type: sql.Int, value: id }
    });

    const categoria = result.recordset[0];
    if (!categoria) return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada o ya inactiva' });
    res.json({ ok: true, categoria });

  } catch (err) {
    console.error('Error al desactivar categoría:', err);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};*/

module.exports = {
  getAll,
  getById,
  crearCategoria,
  actualizarCategoria
};
