
const { sql, query, withTransaction } = require('../db/conexion_sql');


async function existeUnidad({ nombre, abreviatura }, idExcluir = null) {
  const filtro = idExcluir ? 'AND id_unidad <> @idExcluir' : '';
  const result = await query(
    `SELECT 1 FROM unidades_medida WHERE (nombre = @nombre OR abreviatura = @abreviatura) ${filtro}`,
    {
      nombre: { type: sql.VarChar, value: nombre },
      abreviatura: { type: sql.VarChar, value: abreviatura },
      ...(idExcluir && { idExcluir: { type: sql.Int, value: idExcluir } })
    }
  );
  return result.recordset.length > 0;
}


// Obtener todas las unidades activas
async function getAll(req, res) {
    const { activo } = req.query;
    try {
        let where = 'WHERE 1=1';
        const params = {};

        if (activo === '0') {
            where += ' AND activo = 0';
        } else if (activo === 'todos') {
            // sin filtro, trae todas
        } else {
            // por defecto solo activas
            where += ' AND activo = 1';
        }

        const { recordset } = await query(`SELECT * FROM unidades_medida ${where}`, params);
        return res.json({ ok: true, unidades: recordset });
    } catch (err) {
        console.error('Error al obtener unidades:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno al obtener unidades.' });
    }
}

// Obtener una unidad por id
async function getById(req, res) {
  const { id } = req.params;
  try {
    const { recordset } = await query('SELECT * FROM unidades_medida WHERE id_unidad = @id', {
      id: { type: sql.Int, value: id }
    });
    if (!recordset.length) return res.status(404).json({ ok: false, mensaje: 'Unidad no encontrada.' });
    return res.json({ ok: true, unidad: recordset[0] });
  } catch (err) {
    console.error('Error getById unidad:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno al buscar unidad.' });
  }
}

// Crear una nueva unidad
async function crearUnidad(req, res) {
    const { nombre, abreviatura } = req.body;

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ ok: false, mensaje: 'El campo "nombre" es obligatorio.' });
    }
    if (!abreviatura || typeof abreviatura !== 'string' || !abreviatura.trim()) {
        return res.status(400).json({ ok: false, mensaje: 'El campo "abreviatura" es obligatorio.' });
    }
    if (await existeUnidad({ nombre, abreviatura })) {
        return res.status(400).json({ ok: false, mensaje: 'Ya existe una unidad con ese nombre o abreviatura.' });
    }

    try {
        const { recordset } = await query(
            `INSERT INTO unidades_medida (nombre, abreviatura, activo)
             OUTPUT INSERTED.*
             VALUES (@nombre, @abreviatura, 1)`,
            {
                nombre:      { type: sql.VarChar, value: nombre.trim()      },
                abreviatura: { type: sql.VarChar, value: abreviatura.trim() }
            }
        );
        return res.status(201).json({ ok: true, unidad: recordset[0] });
    } catch (err) {
        console.error('Error crearUnidad:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error al crear la unidad.' });
    }
}

// Editar una unidad existente
async function editarUnidad(req, res) {
  const { id } = req.params;//traemos el id
  const { nombre, abreviatura } = req.body;//traemos los datos
  // Verificamos si ya existe

  const { recordset: existentes } = await query('SELECT * FROM unidades_medida WHERE id_unidad = @id', {
    id: { type: sql.Int, value: id }
  });

  if (!existentes.length) return res.status(404).json({ ok: false, mensaje: 'Unidad no encontrada.' });

  // validamos que no exista otra unidad con el mismo nombre o abreviatura
  if ((nombre || abreviatura) && await existeUnidad({ nombre: nombre || existentes[0].nombre, abreviatura: abreviatura || existentes[0].abreviatura }, id)) {
    return res.status(400).json({ ok: false, mensaje: 'Otra unidad ya posee ese nombre o abreviatura.' });
  }

  try {
    //actualizamos
    const { recordset } = await query(
      `UPDATE unidades_medida SET
         nombre = COALESCE(@nombre, nombre),
         abreviatura = COALESCE(@abreviatura, abreviatura)
       OUTPUT INSERTED.*
       WHERE id_unidad = @id`,
      {
        id: { type: sql.Int, value: id },
        nombre: { type: sql.VarChar, value: nombre || null },
        abreviatura: { type: sql.VarChar, value: abreviatura || null }
      }
    );
    //retornamos la unidad actualizada
    return res.json({ ok: true, unidad: recordset[0] });

  } catch (err) {
    console.error('Error editarUnidad:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar la unidad.' });
  }
}

// Desactivar una unidad
async function desactivarUnidad(req, res) {
    const { id } = req.params;
    try {
        // Verificar que existe y está activa
        const { recordset: existe } = await query(
            'SELECT id_unidad, activo FROM unidades_medida WHERE id_unidad = @id',
            { id: { type: sql.Int, value: id } }
        );
        if (!existe.length) {
            return res.status(404).json({ ok: false, mensaje: 'Unidad no encontrada.' });
        }
        if (!existe[0].activo) {
            return res.status(400).json({ ok: false, mensaje: 'La unidad ya está desactivada.' });
        }

        // Verificar que no tenga productos activos asociados
        const { recordset: productos } = await query(
            'SELECT id_producto FROM productos WHERE id_unidad = @id AND activo = 1',
            { id: { type: sql.Int, value: id } }
        );
        if (productos.length > 0) {
            return res.status(400).json({
                ok: false,
                mensaje: `No se puede desactivar esta unidad porque tiene ${productos.length} producto(s) activo(s) asociado(s).`
            });
        }

        // Desactivar lógicamente
        const { recordset } = await query(
            `UPDATE unidades_medida
             SET activo = 0
             OUTPUT INSERTED.*
             WHERE id_unidad = @id`,
            { id: { type: sql.Int, value: id } }
        );
        return res.json({ ok: true, unidad: recordset[0] });
    } catch (err) {
        console.error('Error desactivarUnidad:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error al desactivar la unidad.' });
    }
}

module.exports = {
  getAll,
  getById,
  crearUnidad,
  editarUnidad,
  desactivarUnidad
};
