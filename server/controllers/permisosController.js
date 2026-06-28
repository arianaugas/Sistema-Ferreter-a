const { sql, query, withTransaction } = require('../db/conexion_sql');
const { invalidarCachePermisos } = require('../middlewares/auth');

//todos los módulos
const getModulos = async (req, res) => {
    try {
        const result = await query(
            `SELECT id_modulo, nombre, ruta, descripcion FROM modulos ORDER BY id_modulo ASC`
        );
        return res.json({ ok: true, modulos: result.recordset });
    } catch (err) {
        console.error('Error getModulos:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

//permisos de un rol específico
const getPermisosPorRol = async (req, res) => {
    const { id_rol } = req.params;
    try {
        const result = await query(
            `SELECT 
                m.id_modulo, m.nombre, m.ruta, m.descripcion,
                ISNULL(p.tiene_acceso, 0) AS tiene_acceso
            FROM modulos m
            LEFT JOIN permisos_rol p 
                ON p.id_modulo = m.id_modulo AND p.id_rol = @id_rol
            ORDER BY m.id_modulo ASC`,
            { id_rol: { type: sql.Int, value: id_rol } }
        );
        return res.json({ ok: true, permisos: result.recordset });
    } catch (err) {
        console.error('Error getPermisosPorRol:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

//módulos a los que el usuario logueado tiene acceso (para armar el sidebar)
const getMisPermisos = async (req, res) => {
    const { rol } = req.user;

    // Administrador tiene acceso total: devolver todos los módulos
    if (rol === 'Administrador') {
        try {
            const result = await query(
                `SELECT id_modulo, nombre, ruta, descripcion
                FROM modulos ORDER BY id_modulo ASC`
            );
            return res.json({ ok: true, esAdmin: true, modulos: result.recordset });
        } catch (err) {
            return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
        }
    }

    try {
        // Buscar id_rol por nombre de rol desde el token
        const rolResult = await query(
            `SELECT id_rol FROM roles WHERE nombre = @nombre`,
            { nombre: { type: sql.VarChar, value: rol } }
        );
        if (!rolResult.recordset.length) {
            return res.status(404).json({ ok: false, mensaje: 'Rol no encontrado.' });
        }
        const id_rol = rolResult.recordset[0].id_rol;

        const result = await query(
            `SELECT m.id_modulo, m.nombre, m.ruta, m.descripcion
            FROM modulos m
            INNER JOIN permisos_rol p ON p.id_modulo = m.id_modulo
            WHERE p.id_rol = @id_rol AND p.tiene_acceso = 1
            ORDER BY m.id_modulo ASC`,
            { id_rol: { type: sql.Int, value: id_rol } }
        );
        return res.json({ ok: true, esAdmin: false, modulos: result.recordset });
    } catch (err) {
        console.error('Error getMisPermisos:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


//guardar permisos completos de un rol (upsert) por módulo
const guardarPermisos = async (req, res) => {
    const { id_rol } = req.params;
    const { permisos } = req.body; // array: [{ id_modulo, tiene_acceso }]

    if (!Array.isArray(permisos) || permisos.length === 0) {
        return res.status(400).json({ ok: false, mensaje: 'Se requiere el array de permisos.' });
    }

    try {
        // Verificar que el rol exista
        const rolExiste = await query(
            `SELECT id_rol, nombre FROM roles WHERE id_rol = @id_rol`,
            { id_rol: { type: sql.Int, value: id_rol } }
        );
        if (!rolExiste.recordset.length) {
            return res.status(404).json({ ok: false, mensaje: 'Rol no encontrado.' });
        }
        if (rolExiste.recordset[0].nombre === 'Administrador') {
            return res.status(400).json({ ok: false, mensaje: 'Los permisos del Administrador no son configurables.' });
        }

        await withTransaction(async (transaction) => {
            for (const p of permisos) {
                const req2 = transaction.request();
                req2.input('id_rol', sql.Int, parseInt(id_rol));
                req2.input('id_modulo', sql.Int, parseInt(p.id_modulo));
                req2.input('tiene_acceso', sql.Bit, p.tiene_acceso ? 1 : 0);
                await req2.query(`
                    MERGE permisos_rol AS target
                    USING (SELECT @id_rol AS id_rol, @id_modulo AS id_modulo) AS source
                        ON target.id_rol = source.id_rol AND target.id_modulo = source.id_modulo
                    WHEN MATCHED THEN
                        UPDATE SET tiene_acceso = @tiene_acceso
                    WHEN NOT MATCHED THEN
                        INSERT (id_rol, id_modulo, tiene_acceso)
                        VALUES (@id_rol, @id_modulo, @tiene_acceso);
                `);
            }
        });

        invalidarCachePermisos();
        return res.json({ ok: true, mensaje: 'Permisos guardados correctamente.' });
    } catch (err) {
        console.error('Error guardarPermisos:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error al guardar permisos.' });
    }
};

module.exports = { 
    getModulos, 
    getPermisosPorRol, 
    getMisPermisos, 
    guardarPermisos 
};