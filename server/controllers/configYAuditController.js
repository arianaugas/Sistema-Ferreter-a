const { sql, query, withTransaction } = require('../db/conexion_sql');

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


//ESTO ES DE AUDITORIA

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


//ESTO ES DE TURNOS

// Lista todos los turnos (activos e inactivos)
const getTurnos = async (req, res) => {
    try {
        const result = await query(
            `SELECT id_turno, nombre, hora_inicio, hora_fin, activo
            FROM turnos
            ORDER BY hora_inicio ASC`
        );
        return res.json({ ok: true, turnos: result.recordset });
    } catch (err) {
        console.error('Error en getTurnos:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// Detalle de un turno por id
const getTurnoById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(
            `SELECT id_turno, nombre, hora_inicio, hora_fin, activo FROM turnos WHERE id_turno = @id`,
            { id: { type: sql.Int, value: id } }
        );
        const turno = result.recordset[0];
        if (!turno) return res.status(404).json({ ok: false, mensaje: 'Turno no encontrado.' });
        return res.json({ ok: true, turno });
    } catch (err) {
        console.error('Error en getTurnoById:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// Crea un nuevo turno (horario de trabajo del negocio)
const crearTurno = async (req, res) => {
    const { nombre, hora_inicio, hora_fin } = req.body;

    const horaRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
    if (!nombre || !hora_inicio || !hora_fin) {
        return res.status(400).json({ ok: false, mensaje: 'Nombre, hora_inicio y hora_fin son obligatorios.' });
    }
    if (!horaRegex.test(hora_inicio) || !horaRegex.test(hora_fin)) {
        return res.status(400).json({ ok: false, mensaje: 'Formato de hora inválido. Use HH:mm (00:00 – 23:59).' });
    }
    if (hora_inicio === hora_fin) {
        return res.status(400).json({ ok: false, mensaje: 'La hora de inicio y fin no pueden ser iguales.' });
    }

    try {
        const existe = await query(
            `SELECT id_turno FROM turnos WHERE nombre = @nombre`,
            { nombre: { type: sql.VarChar, value: nombre } }
        );
        if (existe.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'Ya existe un turno con ese nombre.' });
        }

        const result = await query(
            `INSERT INTO turnos (nombre, hora_inicio, hora_fin, activo)
            OUTPUT INSERTED.*
            VALUES (@nombre, @hora_inicio, @hora_fin, 1)`,
            {
                nombre: { type: sql.VarChar, value: nombre },
                hora_inicio: { type: sql.VarChar, value: hora_inicio }, // 'HH:mm' o 'HH:mm:ss'
                hora_fin: { type: sql.VarChar, value: hora_fin }
            }
        );
        return res.status(201).json({ ok: true, turno: result.recordset[0] });
    } catch (err) {
        console.error('Error en crearTurno:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno al crear el turno.' });
    }
};

// Edita un turno existente (nombre, horario o estado activo)
const editarTurno = async (req, res) => {
    const { id } = req.params;
    const { nombre, hora_inicio, hora_fin, activo } = req.body;

    if (!nombre || !hora_inicio || !hora_fin) {
        return res.status(400).json({ ok: false, mensaje: 'Nombre, hora_inicio y hora_fin son obligatorios.' });
    }
    if (hora_inicio === hora_fin) {
        return res.status(400).json({ ok: false, mensaje: 'La hora de inicio y fin no pueden ser iguales.' });
    }

    try {
        const duplicado = await query(
            `SELECT id_turno FROM turnos WHERE nombre = @nombre AND id_turno <> @id`,
            { nombre: { type: sql.VarChar, value: nombre }, id: { type: sql.Int, value: id } }
        );
        if (duplicado.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'Ya existe otro turno con ese nombre.' });
        }

        const result = await query(
            `UPDATE turnos
            SET nombre = @nombre, hora_inicio = @hora_inicio, hora_fin = @hora_fin, activo = @activo
            OUTPUT INSERTED.*
            WHERE id_turno = @id`,
            {
                id: { type: sql.Int, value: id },
                nombre: { type: sql.VarChar, value: nombre },
                hora_inicio: { type: sql.VarChar, value: hora_inicio },
                hora_fin: { type: sql.VarChar, value: hora_fin },
                activo: { type: sql.Bit, value: activo !== undefined ? (activo ? 1 : 0) : 1 }
            }
        );
        const turno = result.recordset[0];
        if (!turno) return res.status(404).json({ ok: false, mensaje: 'Turno no encontrado.' });
        return res.json({ ok: true, turno });
    } catch (err) {
        console.error('Error en editarTurno:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno al editar el turno.' });
    }
};

// Lista los empleados con su turno asignado actual (para la pantalla de asignación)
const getEmpleadosConTurno = async (req, res) => {
    try {
        const { id_cargo, id_rol, busqueda } = req.query;

        let queryStr = `
            SELECT e.id_empleado, e.nombre, e.apellido, e.dni, e.activo,
                t.id_turno, t.nombre AS turno_nombre, t.hora_inicio, t.hora_fin,
                c.id_cargo, c.nombre AS cargo_nombre,
                r.id_rol, r.nombre AS rol_nombre
            FROM empleados e
            LEFT JOIN turnos t ON t.id_turno = e.id_turno
            LEFT JOIN cargos c ON c.id_cargo = e.id_cargo
            LEFT JOIN usuarios u ON u.id_empleado = e.id_empleado
            LEFT JOIN roles r ON r.id_rol = u.id_rol
            WHERE e.activo = 1
        `;
        const params = {};

        if (id_cargo) {
            queryStr += ' AND e.id_cargo = @id_cargo';
            params.id_cargo = { type: sql.Int, value: parseInt(id_cargo) };
        }
        if (id_rol) {
            queryStr += ' AND r.id_rol = @id_rol';
            params.id_rol = { type: sql.Int, value: parseInt(id_rol) };
        }
        if (busqueda) {
            queryStr += ' AND (e.nombre LIKE @busqueda OR e.apellido LIKE @busqueda OR e.dni LIKE @busqueda)';
            params.busqueda = { type: sql.VarChar, value: `%${busqueda}%` };
        }

        queryStr += ' ORDER BY e.apellido ASC, e.nombre ASC';

        const result = await query(queryStr, params);
        return res.json({ ok: true, empleados: result.recordset });
    } catch (err) {
        console.error('Error en getEmpleadosConTurno:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

// Asigna o reasigna el turno de un empleado (se puede volver a llamar
// en cualquier momento si cambia su horario de trabajo)
const asignarTurnoEmpleado = async (req, res) => {
    const { id } = req.params; // id_empleado
    const { id_turno } = req.body; // puede venir null para "sin turno asignado"

    try {
        const existeEmpleado = await query(
            `SELECT id_empleado FROM empleados WHERE id_empleado = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (!existeEmpleado.recordset.length) {
            return res.status(404).json({ ok: false, mensaje: 'Empleado no encontrado.' });
        }

        if (id_turno !== null && id_turno !== undefined) {
            const existeTurno = await query(
                `SELECT id_turno FROM turnos WHERE id_turno = @id_turno`,
                { id_turno: { type: sql.Int, value: id_turno } }
            );
            if (!existeTurno.recordset.length) {
                return res.status(400).json({ ok: false, mensaje: 'Turno no encontrado.' });
            }
        }

        const result = await query(
            `UPDATE empleados SET id_turno = @id_turno OUTPUT INSERTED.* WHERE id_empleado = @id`,
            {
                id: { type: sql.Int, value: id },
                id_turno: { type: sql.Int, value: id_turno ?? null }
            }
        );
        return res.json({ ok: true, empleado: result.recordset[0] });
    } catch (err) {
        console.error('Error en asignarTurnoEmpleado:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno al asignar el turno.' });
    }
};


// Eliminar un turno. Si hay empleados con ese turno asignado, quedan en
// id_turno = NULL (el frontend avisa esto antes de confirmar). Si el turno
// ya tiene historial en `cajas` (alguien abrió caja con él alguna vez), NO
// se permite borrar: perderíamos ese dato histórico.
const eliminarTurno = async (req, res) => {
    const { id } = req.params;
    try {
        const enHistorialCajas = await query(
            `SELECT TOP 1 id_caja FROM cajas WHERE id_turno = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (enHistorialCajas.recordset.length > 0) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se puede eliminar este turno porque ya tiene cajas registradas en su historial. Puedes desactivarlo en su lugar.'
            });
        }

        const empleadosAfectados = await query(
            `SELECT id_empleado FROM empleados WHERE id_turno = @id`,
            { id: { type: sql.Int, value: id } }
        );

        const resultado = await withTransaction(async (transaction) => {
            if (empleadosAfectados.recordset.length > 0) {
                const reqNull = transaction.request();
                reqNull.input('id', sql.Int, id);
                await reqNull.query(`UPDATE empleados SET id_turno = NULL WHERE id_turno = @id`);
            }

            const reqDel = transaction.request();
            reqDel.input('id', sql.Int, id);
            return await reqDel.query(`DELETE FROM turnos OUTPUT DELETED.* WHERE id_turno = @id`);
        });

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Turno no encontrado.' });
        }

        return res.json({
            ok: true,
            mensaje: 'Turno eliminado correctamente.',
            empleadosDesvinculados: empleadosAfectados.recordset.length
        });
    } catch (err) {
        console.error('Error al eliminar turno:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

module.exports = { 
    getAll, 
    getByKey, 
    update,
    getLogs,
    getLogById,
    getTurnos,
    getTurnoById,
    crearTurno,
    editarTurno,
    eliminarTurno,
    getEmpleadosConTurno,
    asignarTurnoEmpleado
};