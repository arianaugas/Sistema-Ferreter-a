const { sql, query } = require('../db/conexion_sql');

// Obtener todos los roles
const getAll = async (req, res) => {
    try {
        const result = await query(
            `SELECT id_rol, nombre, descripcion FROM roles ORDER BY id_rol ASC`
        );
        res.json({ ok: true, roles: result.recordset });
    } catch (err) {
        console.error('Error al obtener roles:', err);
        res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
};

// Obtener un rol por ID
const getById = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await query(
            `SELECT id_rol, nombre, descripcion FROM roles WHERE id_rol = @id`,
            { id: { type: sql.Int, value: id } }
        );

        const rol = result.recordset[0];
        if (!rol) {
            return res.status(404).json({ ok: false, mensaje: 'El rol no existe.' });
        }

        res.json({ ok: true, rol });
    } catch (err) {
        console.error('Error al obtener rol:', err);
        res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
};

// Crear un nuevo rol
const crearRol = async (req, res) => {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
        return res.status(400).json({ ok: false, mensaje: 'El nombre del rol es obligatorio.' });
    }

    try {
        // Verificar nombre duplicado
        const existe = await query(
            `SELECT id_rol FROM roles WHERE nombre = @nombre`,
            { nombre: { type: sql.VarChar, value: nombre } }
        );
        if (existe.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'Ya existe un rol con ese nombre.' });
        }

        const result = await query(
            `INSERT INTO roles (nombre, descripcion)
             OUTPUT INSERTED.id_rol, INSERTED.nombre, INSERTED.descripcion
             VALUES (@nombre, @descripcion)`,
            {
                nombre:      { type: sql.VarChar, value: nombre },
                descripcion: { type: sql.VarChar, value: descripcion || null }
            }
        );

        res.status(201).json({ ok: true, rol: result.recordset[0] });
    } catch (err) {
        console.error('Error al crear rol:', err);
        res.status(500).json({ ok: false, mensaje: 'Error al crear el rol.' });
    }
};

// Editar un rol
const editarRol = async (req, res) => {
    const id = req.params.id;
    const { nombre, descripcion } = req.body;

    if (!nombre) {
        return res.status(400).json({ ok: false, mensaje: 'El nombre del rol es obligatorio.' });
    }

    try {
        // Verificar que existe
        const existe = await query(
            `SELECT id_rol FROM roles WHERE id_rol = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (existe.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'El rol no existe.' });
        }

        // Verificar nombre duplicado en otro rol
        const nombreDuplicado = await query(
            `SELECT id_rol FROM roles WHERE nombre = @nombre AND id_rol <> @id`,
            {
                nombre: { type: sql.VarChar, value: nombre },
                id: { type: sql.Int, value: id }
            }
        );
        if (nombreDuplicado.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'Ya existe otro rol con ese nombre.' });
        }

        const result = await query(
            `UPDATE roles
             SET nombre = @nombre, descripcion = @descripcion
             OUTPUT INSERTED.id_rol, INSERTED.nombre, INSERTED.descripcion
             WHERE id_rol = @id`,
            {
                nombre: { type: sql.VarChar, value: nombre },
                descripcion: { type: sql.VarChar, value: descripcion || null },
                id: { type: sql.Int, value: id }
            }
        );

        res.json({ ok: true, rol: result.recordset[0] });
    } catch (err) {
        console.error('Error al editar rol:', err);
        res.status(500).json({ ok: false, mensaje: 'Error al editar el rol.' });
    }
};


module.exports = { 
    getAll, 
    getById, 
    crearRol, 
    editarRol
};