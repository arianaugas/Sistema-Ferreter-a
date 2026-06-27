const { sql, query } = require('../db/conexion_sql');

// CARGOSSSSSSSSSSSSSSSS
const getCargos = async (req, res) => {
    try {
        const result = await query(
            `SELECT c.id_cargo, c.nombre, c.activo,
                    COUNT(e.id_empleado) AS total_empleados
             FROM cargos c
             LEFT JOIN empleados e ON e.id_cargo = c.id_cargo AND e.activo = 1
             GROUP BY c.id_cargo, c.nombre, c.activo
             ORDER BY c.nombre ASC`
        );
        return res.json({ ok: true, cargos: result.recordset });
    } catch (err) {
        console.error('Error al obtener cargos:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


const crearCargo = async (req, res) => {
    const { nombre, activo } = req.body;

    if (!nombre) {
        return res.status(400).json({ ok: false, mensaje: 'El nombre del cargo es obligatorio.' });
    }

    try {
        const existe = await query(
            `SELECT id_cargo FROM cargos WHERE nombre = @nombre`,
            { nombre: { type: sql.VarChar, value: nombre } }
        );
        if (existe.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'Ya existe un cargo con ese nombre.' });
        }

        const result = await query(
            `INSERT INTO cargos (nombre, activo)
             OUTPUT INSERTED.*
             VALUES (@nombre, @activo)`,
            {
                nombre: { type: sql.VarChar, value: nombre },
                activo: { type: sql.Bit, value: activo !== undefined ? (activo ? 1 : 0) : 1 }
            }
        );
        return res.status(201).json({ ok: true, cargo: result.recordset[0] });
    } catch (err) {
        console.error('Error al crear cargo:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const editarCargo = async (req, res) => {
    const { id } = req.params;
    const { nombre, activo } = req.body;

    if (!nombre) {
        return res.status(400).json({ ok: false, mensaje: 'El nombre del cargo es obligatorio.' });
    }

    try {
        const existe = await query(
            `SELECT id_cargo FROM cargos WHERE id_cargo = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (existe.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Cargo no encontrado.' });
        }

        // Verificar que el nombre no esté tomado por otro cargo
        const nombreExiste = await query(
            `SELECT id_cargo FROM cargos WHERE nombre = @nombre AND id_cargo <> @id`,
            {
                nombre: { type: sql.VarChar, value: nombre },
                id: { type: sql.Int, value: id }
            }
        );
        if (nombreExiste.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'Ya existe otro cargo con ese nombre.' });
        }

        const result = await query(
            `UPDATE cargos
             SET nombre = @nombre, activo = @activo
             OUTPUT INSERTED.*
             WHERE id_cargo = @id`,
            {
                nombre: { type: sql.VarChar, value: nombre },
                activo: { type: sql.Bit, value: activo ? 1 : 0 },
                id: { type: sql.Int, value: id }
            }
        );
        return res.json({ ok: true, cargo: result.recordset[0] });
    } catch (err) {
        console.error('Error al editar cargo:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const eliminarCargo = async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar que no tenga empleados asignados
        const tieneEmpleados = await query(
            `SELECT id_empleado FROM empleados WHERE id_cargo = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (tieneEmpleados.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'No se puede eliminar un cargo con empleados asignados.' });
        }

        const result = await query(
            `DELETE FROM cargos OUTPUT DELETED.* WHERE id_cargo = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (result.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Cargo no encontrado.' });
        }
        return res.json({ ok: true, mensaje: 'Cargo eliminado correctamente.' });
    } catch (err) {
        console.error('Error al eliminar cargo:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

//EMPLEADOSSSSSSSSSSSSSS
const getAll = async (req, res) => {
    const { busqueda, id_cargo, activo } = req.query;
    try {
        let conditions = [];
        let params = {};

        if (busqueda) {
            conditions.push(`(e.nombre LIKE @busqueda OR e.apellido LIKE @busqueda OR e.dni LIKE @busqueda)`);
            params.busqueda = { type: sql.VarChar, value: `%${busqueda}%` };
        }
        if (id_cargo) {
            conditions.push(`e.id_cargo = @id_cargo`);
            params.id_cargo = { type: sql.Int, value: id_cargo };
        }
        if (activo !== undefined && activo !== '') {
            conditions.push(`e.activo = @activo`);
            params.activo = { type: sql.Bit, value: parseInt(activo) };
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await query(
                `SELECT
                    e.id_empleado,
                    e.dni,
                    e.nombre,
                    e.apellido,
                    e.telefono,
                    e.correo,
                    e.fecha_ingreso,
                    e.fecha_cese,
                    e.activo,
                    c.id_cargo,
                    c.nombre AS cargo,
                    e.id_turno,
                    t.nombre AS turno_nombre
                FROM empleados e
                INNER JOIN cargos c ON c.id_cargo = e.id_cargo
                LEFT JOIN turnos t ON t.id_turno = e.id_turno
                ${where}
                ORDER BY e.apellido ASC, e.nombre ASC`,
                    params
        );

        return res.json({ ok: true, total: result.recordset.length, empleados: result.recordset });
    } catch (err) {
        console.error('Error al obtener empleados:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const getById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query(
                `SELECT
                    e.id_empleado,
                    e.dni,
                    e.nombre,
                    e.apellido,
                    e.telefono,
                    e.correo,
                    e.fecha_ingreso,
                    e.fecha_cese,
                    e.activo,
                    c.id_cargo,
                    c.nombre AS cargo,
                    e.id_turno,
                    t.nombre AS turno_nombre
                FROM empleados e
                INNER JOIN cargos c ON c.id_cargo = e.id_cargo
                LEFT JOIN turnos t ON t.id_turno = e.id_turno
                WHERE e.id_empleado = @id`,
                { id: { type: sql.Int, value: id } }
);

        const empleado = result.recordset[0];
        if (!empleado) {
            return res.status(404).json({ ok: false, mensaje: 'Empleado no encontrado.' });
        }
        return res.json({ ok: true, empleado });
    } catch (err) {
        console.error('Error al obtener empleado:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};


const crearEmpleado = async (req, res) => {
    const { dni, nombre, apellido, id_cargo, telefono, correo, fecha_ingreso, fecha_cese } = req.body;

    if (!dni || !nombre || !apellido || !id_cargo || !fecha_ingreso) {
        return res.status(400).json({ ok: false, mensaje: 'Complete los campos obligatorios.' });
    }

    if (!/^\d{8}$/.test(dni)) {
        return res.status(400).json({ ok: false, mensaje: 'El DNI debe tener exactamente 8 dígitos.' });
    }

    if (fecha_cese && new Date(fecha_cese) <= new Date(fecha_ingreso)) {
        return res.status(400).json({ ok: false, mensaje: 'La fecha de cese debe ser posterior a la fecha de ingreso.' });
    }

    try {
        // Verificar DNI único
        const dniExiste = await query(
            `SELECT id_empleado FROM empleados WHERE dni = @dni`,
            { dni: { type: sql.VarChar, value: dni } }
        );
        if (dniExiste.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'El DNI ya está registrado.' });
        }

        // Verificar que el cargo exista
        const cargoExiste = await query(
            `SELECT id_cargo FROM cargos WHERE id_cargo = @id_cargo AND activo = 1`,
            { id_cargo: { type: sql.Int, value: id_cargo } }
        );
        if (cargoExiste.recordset.length === 0) {
            return res.status(400).json({ ok: false, mensaje: 'El cargo seleccionado no existe o está inactivo.' });
        }

        const result = await query(
            `INSERT INTO empleados (id_cargo, dni, nombre, apellido, telefono, correo, fecha_ingreso, fecha_cese, activo)
             OUTPUT INSERTED.*
             VALUES (@id_cargo, @dni, @nombre, @apellido, @telefono, @correo, @fecha_ingreso, @fecha_cese, 1)`,
            {
                id_cargo: { type: sql.Int, value: id_cargo },
                dni: { type: sql.VarChar, value: dni },
                nombre: { type: sql.VarChar, value: nombre },
                apellido: { type: sql.VarChar, value: apellido },
                telefono: { type: sql.VarChar, value: telefono || null },
                correo: { type: sql.VarChar, value: correo || null },
                fecha_ingreso: { type: sql.Date, value: fecha_ingreso },
                fecha_cese: { type: sql.Date, value: fecha_cese || null }
            }
        );
        return res.status(201).json({ ok: true, empleado: result.recordset[0] });
    } catch (err) {
        console.error('Error al crear empleado:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

const editarEmpleado = async (req, res) => {
    const { id } = req.params;
    const { dni, nombre, apellido, id_cargo, telefono, correo, fecha_ingreso, fecha_cese, activo } = req.body;

    if (!dni || !nombre || !apellido || !id_cargo || !fecha_ingreso || activo === undefined) {
        return res.status(400).json({ ok: false, mensaje: 'Complete los campos obligatorios.' });
    }

    if (!/^\d{8}$/.test(dni)) {
        return res.status(400).json({ ok: false, mensaje: 'El DNI debe tener exactamente 8 dígitos.' });
    }

    if (fecha_cese && new Date(fecha_cese) <= new Date(fecha_ingreso)) {
        return res.status(400).json({ ok: false, mensaje: 'La fecha de cese debe ser posterior a la fecha de ingreso.' });
    }

    try {
        // Verificar que el empleado exista
        const existe = await query(
            `SELECT id_empleado FROM empleados WHERE id_empleado = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (existe.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Empleado no encontrado.' });
        }

        // Verificar que el DNI no esté tomado por otro empleado
        const dniExiste = await query(
            `SELECT id_empleado FROM empleados WHERE dni = @dni AND id_empleado <> @id`,
            {
                dni: { type: sql.VarChar, value: dni },
                id: { type: sql.Int, value: id }
            }
        );
        if (dniExiste.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'El DNI ya está registrado por otro empleado.' });
        }

        // Verificar que el cargo exista
        const cargoExiste = await query(
            `SELECT id_cargo FROM cargos WHERE id_cargo = @id_cargo`,
            { id_cargo: { type: sql.Int, value: id_cargo } }
        );
        if (cargoExiste.recordset.length === 0) {
            return res.status(400).json({ ok: false, mensaje: 'El cargo seleccionado no existe.' });
        }

        const result = await query(
            `UPDATE empleados
             SET id_cargo = @id_cargo,
                 dni = @dni,
                 nombre = @nombre,
                 apellido = @apellido,
                 telefono = @telefono,
                 correo = @correo,
                 fecha_ingreso = @fecha_ingreso,
                 fecha_cese = @fecha_cese,
                 activo = @activo
             OUTPUT INSERTED.*
             WHERE id_empleado = @id`,
            {
                id_cargo: { type: sql.Int, value: id_cargo },
                dni: { type: sql.VarChar, value: dni },
                nombre: { type: sql.VarChar, value: nombre },
                apellido: { type: sql.VarChar, value: apellido },
                telefono: { type: sql.VarChar, value: telefono || null },
                correo: { type: sql.VarChar, value: correo || null },
                fecha_ingreso: { type: sql.Date, value: fecha_ingreso },
                fecha_cese: { type: sql.Date, value: fecha_cese || null },
                activo: { type: sql.Bit, value: activo ? 1 : 0 },
                id: { type: sql.Int, value: id }
            }
        );
        return res.json({ ok: true, empleado: result.recordset[0] });
    } catch (err) {
        console.error('Error al editar empleado:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
};

module.exports = {
    getCargos,
    crearCargo,
    editarCargo,
    eliminarCargo,
    getAll,
    getById,
    crearEmpleado,
    editarEmpleado
};