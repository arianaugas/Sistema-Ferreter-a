const { sql, query } = require('../db/conexion_sql');
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios (con filtros opcionales)
const getAll = async (req, res) => {
    try {
        const { busqueda, id_rol, activo, fecha_desde, fecha_hasta } = req.query;

        let conditions = [];
        let params = {};

        // Filtro de búsqueda: por username, nombre o apellido del empleado
        if (busqueda) {
            conditions.push(`(u.username LIKE @busqueda OR e.nombre LIKE @busqueda OR e.apellido LIKE @busqueda)`);
            params.busqueda = { type: sql.VarChar, value: `%${busqueda}%` };
        }

        // Filtro por rol
        if (id_rol) {
            conditions.push(`u.id_rol = @id_rol`);
            params.id_rol = { type: sql.Int, value: id_rol };
        }

        // Filtro por estado activo (acepta "1", "0", true, false)
        if (activo !== undefined && activo !== '') {
            conditions.push(`u.activo = @activo`);
            params.activo = { type: sql.Bit, value: parseInt(activo) };
        }

        // Filtro por fecha de registro desde
        if (fecha_desde) {
            conditions.push(`CAST(u.creado_en AS DATE) >= @fecha_desde`);
            params.fecha_desde = { type: sql.Date, value: fecha_desde };
        }

        // Filtro por fecha de registro hasta
        if (fecha_hasta) {
            conditions.push(`CAST(u.creado_en AS DATE) <= @fecha_hasta`);
            params.fecha_hasta = { type: sql.Date, value: fecha_hasta };
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await query(
            `SELECT u.id_usuario, u.username, u.activo, u.ultimo_acceso, u.creado_en,
                    r.id_rol, r.nombre AS rol,
                    e.id_empleado, e.nombre AS nombre_empleado, e.apellido AS apellido_empleado, e.dni AS dni_empleado
             FROM usuarios u
             INNER JOIN roles r ON u.id_rol = r.id_rol
             INNER JOIN empleados e ON u.id_empleado = e.id_empleado
             ${whereClause}
             ORDER BY u.creado_en DESC`,
            params
        );

        res.json({
            ok: true,
            usuarios: result.recordset
        });
    } catch (err) {
        console.error('Error al obtener usuarios:', err);
        res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
};
// Obtener detalle de un usuario por ID
const getById = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await query(
            `SELECT u.id_usuario, u.username, u.activo, u.ultimo_acceso, u.creado_en,
                    r.id_rol, r.nombre AS rol,
                    e.id_empleado, e.nombre AS nombre_empleado, e.apellido AS apellido_empleado, e.dni AS dni_empleado
             FROM usuarios u
             INNER JOIN roles r ON u.id_rol = r.id_rol
             INNER JOIN empleados e ON u.id_empleado = e.id_empleado
             WHERE u.id_usuario = @id`,
            { id: { type: sql.Int, value: id } }
        );

        const usuario = result.recordset[0];
        if (!usuario) {
            return res.status(404).json({ ok: false, error: 'El usuario no existe' });
        }

        res.json({
            ok: true,
            usuario: usuario
        });
    } catch (err) {
        console.error('Error al obtener usuario por ID:', err);
        res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
};

// Crear un nuevo usuario
const crearUsuario = async (req, res) => {
    const { id_empleado, id_rol, username, contrasena } = req.body;

    if (!id_empleado || !id_rol || !username || !contrasena) {
        return res.status(400).json({ ok: false, mensaje: 'Complete todos los campos requeridos.' });
    }

    try {
        // 1. Verificar si el empleado existe
        const empleadoExiste = await query(
            `SELECT id_empleado FROM empleados WHERE id_empleado = @id_empleado AND activo = 1`,
            { id_empleado: { type: sql.Int, value: id_empleado } }
        );
        if (empleadoExiste.recordset.length === 0) {
            return res.status(400).json({ ok: false, mensaje: 'El empleado seleccionado no existe o no está activo.' });
        }

        // 2. Verificar si el empleado ya tiene una cuenta asociada (UQ_usuarios_emp)
        const empleadoConUsuario = await query(
            `SELECT id_usuario FROM usuarios WHERE id_empleado = @id_empleado`,
            { id_empleado: { type: sql.Int, value: id_empleado } }
        );
        if (empleadoConUsuario.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'Este empleado ya tiene una cuenta de usuario asociada.' });
        }

        // 3. Verificar si el username ya está tomado (UQ_usuarios_user)
        const usuarioExiste = await query(
            `SELECT id_usuario FROM usuarios WHERE username = @username`,
            { username: { type: sql.VarChar, value: username } }
        );
        if (usuarioExiste.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'El nombre de usuario ya está registrado.' });
        }

        // 4. Hashear contraseña
        const contrasenaHasheada = await bcrypt.hash(contrasena, 10);

        // 5. Insertar usuario
        const result = await query(
            `INSERT INTO usuarios (id_empleado, id_rol, username, contrasena, activo)
             OUTPUT INSERTED.id_usuario, INSERTED.username, INSERTED.id_rol, INSERTED.activo, INSERTED.creado_en
             VALUES (@id_empleado, @id_rol, @username, @contrasena, 1)`,
            {
                id_empleado: { type: sql.Int, value: id_empleado },
                id_rol: { type: sql.Int, value: id_rol },
                username: { type: sql.VarChar, value: username },
                contrasena: { type: sql.VarChar, value: contrasenaHasheada }
            }
        );

        res.status(201).json({
            ok: true,
            usuario: result.recordset[0]
        });
    } catch (err) {
        console.error('Error al crear usuario:', err);
        res.status(500).json({ ok: false, mensaje: 'Error al crear el usuario.' });
    }
};

// Actualizar datos del usuario (username, rol, estado activo)
const editarUsuario = async (req, res) => {
    const id = req.params.id;
    const { username, id_rol, activo } = req.body;

    if (!username || !id_rol || activo === undefined) {
        return res.status(400).json({ ok: false, mensaje: 'Complete todos los campos requeridos.' });
    }

    try {
        // 1. Verificar si el usuario existe
        const existe = await query(
            `SELECT id_usuario FROM usuarios WHERE id_usuario = @id`,
            { id: { type: sql.Int, value: id } }
        );
        if (existe.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'El usuario no existe.' });
        }

        // 2. Verificar que el nuevo username no esté ocupado por otro usuario
        const usernameExiste = await query(
            `SELECT id_usuario FROM usuarios WHERE username = @username AND id_usuario <> @id`,
            {
                username: { type: sql.VarChar, value: username },
                id: { type: sql.Int, value: id }
            }
        );
        if (usernameExiste.recordset.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'El nombre de usuario ya está registrado por otra cuenta.' });
        }

        // 3. Actualizar
        const result = await query(
            `UPDATE usuarios
             SET username = @username,
                 id_rol = @id_rol,
                 activo = @activo
             OUTPUT INSERTED.id_usuario, INSERTED.username, INSERTED.id_rol, INSERTED.activo
             WHERE id_usuario = @id`,
            {
                username: { type: sql.VarChar, value: username },
                id_rol: { type: sql.Int, value: id_rol },
                activo: { type: sql.Bit, value: activo ? 1 : 0 },
                id: { type: sql.Int, value: id }
            }
        );

        res.json({
            ok: true,
            usuario: result.recordset[0]
        });
    } catch (err) {
        console.error('Error al editar usuario:', err);
        res.status(500).json({ ok: false, mensaje: 'Error al editar el usuario.' });
    }
};

// Cambiar contraseña (verifica la anterior primero)
const cambiarContrasena = async (req, res) => {
    const id = req.params.id;
    const { contrasenaAnterior, contrasenaNueva } = req.body;

    // Solo el propio usuario o un Administrador pueden cambiar la contraseña
    const esAdmin    = req.user.rol === 'Administrador';
    const esPropioId = parseInt(id) === parseInt(req.user.id);

    if (!esAdmin && !esPropioId) {
        return res.status(403).json({ ok: false, mensaje: 'No tienes permiso para cambiar la contraseña de otro usuario.' });
    }

    if (!contrasenaAnterior || !contrasenaNueva) {
        return res.status(400).json({ ok: false, mensaje: 'Complete todos los campos de contraseñas.' });
    }

    if (contrasenaNueva.length < 6) {
        return res.status(400).json({ ok: false, mensaje: 'La nueva contraseña debe tener mínimo 6 caracteres.' });
    }

    try {
        ////Obtener contraseña actual del usuario
        const result = await query(
            `SELECT contrasena FROM usuarios WHERE id_usuario = @id`,
            { id: { type: sql.Int, value: id } }
        );

        const usuario = result.recordset[0];
        if (!usuario) {
            return res.status(404).json({ ok: false, mensaje: 'El usuario no existe.' });
        }

        //Comparar contraseñas con bcrypt
        const passwordOk = await bcrypt.compare(contrasenaAnterior, usuario.contrasena);
        if (!passwordOk) {
            return res.status(401).json({ ok: false, mensaje: 'La contraseña anterior es incorrecta.' });
        }

        //Hashear nueva contraseña
        const nuevaContrasenaHasheada = await bcrypt.hash(contrasenaNueva, 10);

        //Actualizar contraseña en BD
        await query(
            `UPDATE usuarios SET contrasena = @contrasena WHERE id_usuario = @id`,
            {
                contrasena: { type: sql.VarChar, value: nuevaContrasenaHasheada },
                id: { type: sql.Int, value: id }
            }
        );

        res.json({ ok: true, mensaje: 'Contraseña cambiada con éxito.' });
    } catch (err) {
        console.error('Error al cambiar contraseña:', err);
        res.status(500).json({ ok: false, mensaje: 'Error al cambiar la contraseña.' });
    }
};

// Desactivar un usuario
const desactivarUsuario = async (req, res) => {
    const id = req.params.id;

    // Evitar que un admin se desactive a sí mismo
    if (parseInt(id) === parseInt(req.user.id)) {
        return res.status(400).json({ ok: false, mensaje: 'No puedes desactivar tu propia cuenta.' });
    }

    try {

        const existe = await query(
            `SELECT id_usuario FROM usuarios WHERE id_usuario = @id`,
            { id: { type: sql.Int, value: id } }
        );

        if (existe.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'El usuario no existe.' });
        }

        const result = await query(
            `UPDATE usuarios 
             SET activo = 0
             OUTPUT INSERTED.id_usuario, INSERTED.username, INSERTED.activo
             WHERE id_usuario = @id`,
            { id: { type: sql.Int, value: id } }
        );

        res.json({
            ok: true,
            mensaje: 'Usuario desactivado con éxito.',
            usuario: result.recordset[0]
        });
    } catch (err) {
        console.error('Error al desactivar usuario:', err);
        res.status(500).json({ ok: false, mensaje: 'Error al desactivar el usuario.' });
    }
};

module.exports = {
    getAll,
    getById,
    crearUsuario,
    editarUsuario,
    cambiarContrasena,
    desactivarUsuario
};
