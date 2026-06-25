const { sql, query } = require('../db/conexion_sql');

//ESTO ES DE CONFIGURACIONNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN

// Lista todos los pares clave/valor de configuracion
const getAll = async (req, res) => {
    try {
        const result = await query(
            `SELECT id_config, clave, valor, descripcion
             FROM configuracion
             ORDER BY clave ASC`
        );
        return res.json({ ok: true, configuracion: result.recordset });
    } catch (err) {
        console.error('Error en getAll (configuracion):', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// Obtiene un valor específico por clave
const getByKey = async (req, res) => {
    const { clave } = req.params;
    if (!clave) return res.status(400).json({ ok: false, mensaje: 'Se requiere la clave.' });

    try {
        const result = await query(
            `SELECT id_config, clave, valor, descripcion
             FROM configuracion
             WHERE clave = @clave`,
            { clave: { type: sql.VarChar, value: clave } }
        );
        const item = result.recordset[0];
        if (!item) return res.status(404).json({ ok: false, mensaje: 'Clave no encontrada.' });
        return res.json({ ok: true, configuracion: item });
    } catch (err) {
        console.error('Error en getByKey (configuracion):', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


// Actualiza el valor de una clave existente
const update = async (req, res) => {
    const { clave } = req.params;
    const { valor } = req.body;

    if (!clave) return res.status(400).json({ ok: false, mensaje: 'Se requiere la clave.' });
    if (valor === undefined || valor === null) {
        return res.status(400).json({ ok: false, mensaje: 'Se requiere el campo valor.' });
    }

    try {
        // Verificar que la clave existe
        const existe = await query(
            `SELECT id_config FROM configuracion WHERE clave = @clave`,
            { clave: { type: sql.VarChar, value: clave } }
        );
        if (!existe.recordset.length) {
            return res.status(404).json({ ok: false, mensaje: 'Clave no encontrada.' });
        }

        const result = await query(
            `UPDATE configuracion
             SET valor = @valor
             OUTPUT INSERTED.*
             WHERE clave = @clave`,
            {
                clave: { type: sql.VarChar, value: clave },
                valor: { type: sql.VarChar, value: String(valor) }
            }
        );
        return res.json({ ok: true, configuracion: result.recordset[0] });
    } catch (err) {
        console.error('Error en update (configuracion):', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


//ESTO ES DE AUDITORIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

// Listar registros de auditoría con filtros
const getLogs = async (req, res) => {
    const { tabla, operacion, usuario, fecha_desde, fecha_hasta } = req.query;
    try {
        let where = 'WHERE 1=1';
        const params = {};

        if (tabla) {
            where += ' AND a.tabla_afectada = @tabla';
            params.tabla = { type: sql.VarChar, value: tabla };
        }
        if (operacion) {
            where += ' AND a.operacion = @operacion';
            params.operacion = { type: sql.VarChar, value: operacion };
        }
        if (usuario) {
            where += ' AND (u.username LIKE @usuario OR e.nombre LIKE @usuario OR e.apellido LIKE @usuario)';
            params.usuario = { type: sql.VarChar, value: `%${usuario}%` };
        }
        if (fecha_desde) {
            if (isNaN(Date.parse(fecha_desde))) {
                return res.status(400).json({ ok: false, mensaje: 'fecha_desde no es una fecha válida.' });
            }
            where += ' AND CAST(a.registrado_en AS DATE) >= @fecha_desde';
            params.fecha_desde = { type: sql.Date, value: fecha_desde };
        }
        if (fecha_hasta) {
            if (isNaN(Date.parse(fecha_hasta))) {
                return res.status(400).json({ ok: false, mensaje: 'fecha_hasta no es una fecha válida.' });
            }
            where += ' AND CAST(a.registrado_en AS DATE) <= @fecha_hasta';
            params.fecha_hasta = { type: sql.Date, value: fecha_hasta };
        }

        const result = await query(
            `SELECT 
                a.id_auditoria,
                a.tabla_afectada,
                a.operacion,
                a.registro_id,
                a.registrado_en,
                u.username AS usuario_nombre,
                e.nombre + ' ' + e.apellido AS empleado_nombre
             FROM auditoria a
             LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
             LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
             ${where}
             ORDER BY a.registrado_en DESC`,
            params
        );

        return res.json({
            ok: true,
            total: result.recordset.length,
            logs: result.recordset
        });
    } catch (err) {
        console.error('Error al obtener logs de auditoría:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// Detalle de un log
const getLogById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(
            `SELECT 
                a.id_auditoria,
                a.tabla_afectada,
                a.operacion,
                a.registro_id,
                a.datos_anteriores,
                a.datos_nuevos,
                a.registrado_en,
                u.username AS usuario_nombre,
                e.nombre + ' ' + e.apellido AS empleado_nombre
             FROM auditoria a
             LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
             LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
             WHERE a.id_auditoria = @id`,
            { id: { type: sql.Int, value: id } }
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Registro de auditoría no encontrado.' });
        }

        const log = result.recordset[0];

        try {
            if (log.datos_anteriores) log.datos_anteriores = JSON.parse(log.datos_anteriores);
            if (log.datos_nuevos) log.datos_nuevos = JSON.parse(log.datos_nuevos);
        } catch (e) {
            // Si no son JSON se dejan como están
        }

        return res.json({ ok: true, log });
    } catch (err) {
        console.error('Error al obtener detalle de auditoría:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

module.exports = { 
    getAll, 
    getByKey, 
    update,
    getLogs,
    getLogById
};