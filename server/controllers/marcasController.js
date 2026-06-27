
const { sql, query } = require('../db/conexion_sql');

async function nombreExiste(nombre, idExcluir = null) {
  const filtro = idExcluir ? 'AND id_marca <> @idExcluir' : '';
  const result = await query(
    `SELECT 1 FROM marcas WHERE nombre = @nombre ${filtro}`,
    { nombre: { type: sql.VarChar, value: nombre }, ...(idExcluir && { idExcluir: { type: sql.Int, value: idExcluir } }) }
  );
  return result.recordset.length > 0;
}


// Obtener todas las marcas (activas e inactivas)
async function getAll(req, res) {
  try {
    //consultamos
    const { recordset } = await query('SELECT * FROM marcas ORDER BY nombre ASC');
    return res.json({ ok: true, marcas: recordset });

  } catch (err) {
    console.error('Error getAll marcas:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno al obtener marcas.' });
  }
}

// Obtener una marca por id
async function getById(req, res) {
  const { id } = req.params;//traemos el id
  try {
    //realizamos una consulta
    const { recordset } = await query(
      'SELECT * FROM marcas WHERE id_marca = @id',
      { id: { type: sql.Int, value: id } }
    );
    //validamos q exista
    if (!recordset.length) return res.status(404).json({ ok: false, mensaje: 'Marca no encontrada.' });

    return res.json({ ok: true, marca: recordset[0] });//retornamos

  } catch (err) {
    console.error('Error getById marca:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno al buscar marca.' });
  }
}

async function crearMarca(req, res) {
  const { nombre, pais_origen } = req.body;  // descripcion → pais_origen

  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ ok: false, mensaje: 'El campo nombre es obligatorio.' });
  }
  if (await nombreExiste(nombre)) {
    return res.status(400).json({ ok: false, mensaje: 'Ya existe una marca con ese nombre.' });
  }

  try {
    const { recordset } = await query(
      `INSERT INTO marcas (nombre, pais_origen, activo)
       OUTPUT INSERTED.*
       VALUES (@nombre, @pais_origen, 1)`,
      {
        nombre:      { type: sql.VarChar, value: nombre },
        pais_origen: { type: sql.VarChar, value: pais_origen || null }  // descripcion → pais_origen
      }
    );
    return res.status(201).json({ ok: true, marca: recordset[0] });
  } catch (err) {
    console.error('Error crearMarca:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error al crear la marca.' });
  }
}

async function editarMarca(req, res) {
  const { id } = req.params;
  const { nombre, pais_origen, activo } = req.body;  // descripcion → pais_origen

  const { recordset: existentes } = await query(
    'SELECT * FROM marcas WHERE id_marca = @id',
    { id: { type: sql.Int, value: id } }
  );
  if (!existentes.length) return res.status(404).json({ ok: false, mensaje: 'Marca no encontrada.' });

  if (nombre && await nombreExiste(nombre, id)) {
    return res.status(400).json({ ok: false, mensaje: 'Otra marca ya tiene ese nombre.' });
  }

  try {
    const { recordset } = await query(
      `UPDATE marcas SET
         nombre      = COALESCE(@nombre, nombre),
         pais_origen = COALESCE(@pais_origen, pais_origen),
         activo      = COALESCE(@activo, activo)
       OUTPUT INSERTED.*
       WHERE id_marca = @id`,
      {
        id:          { type: sql.Int,     value: id },
        nombre:      { type: sql.VarChar, value: nombre      || null },
        pais_origen: { type: sql.VarChar, value: pais_origen || null },  // descripcion → pais_origen
        activo:      { type: sql.Bit,     value: activo !== undefined ? activo : null }
      }
    );
    return res.json({ ok: true, marca: recordset[0] });
  } catch (err) {
    console.error('Error editarMarca:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar la marca.' });
  }
}

// Desactivar una marca
async function desactivarMarca(req, res) {
  const { id } = req.params;
  try {
    const { recordset } = await query(
      `UPDATE marcas SET activo = 0 OUTPUT INSERTED.* WHERE id_marca = @id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!recordset.length) return res.status(404).json({ ok: false, mensaje: 'Marca no encontrada.' });
    return res.json({ ok: true, marca: recordset[0] });
  } catch (err) {
    console.error('Error desactivarMarca:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error al desactivar la marca.' });
  }
}

module.exports = {
  getAll,
  getById,
  crearMarca,
  editarMarca,
  desactivarMarca,
};
