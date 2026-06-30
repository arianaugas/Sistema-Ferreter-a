const { sql, query } = require('../db/conexion_sql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Los campos están incompletos' });
    }

    try {
        const result = await query(
            `SELECT u.id_usuario, u.username, u.contrasena, u.activo,
                    u.id_empleado,
                    r.nombre AS rol,
                    e.nombre AS nombre_empleado
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            INNER JOIN empleados e ON u.id_empleado = e.id_empleado
            WHERE u.username = @username`,
            { username: { type: sql.VarChar, value: username } }
        );

        const usuario = result.recordset[0];

        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        if (!usuario.activo) {
            return res.status(403).json({ error: 'Usuario desactivado' });
        }

        const passwordOk = await bcrypt.compare(password, usuario.contrasena);
        if (!passwordOk) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const user = {
            id: usuario.id_usuario,
            id_empleado: usuario.id_empleado,
            username: usuario.username,
            rol: usuario.rol
        };

        const token = jwt.sign(user, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION
        });

        const cookieOption = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            // CORRECTO
            maxAge: 24 * 60 * 60 * 1000 * (parseInt(process.env.JWT_COOKIE_EXPIRES) || 3)
        };

        await query(
            `UPDATE usuarios SET ultimo_acceso = GETDATE() WHERE id_usuario = @id`,
            { id: { type: sql.Int, value: usuario.id_usuario } }
        );

        res.cookie('token', token, cookieOption);

        return res.json({
            ok: true,
            usuario: {
                id: usuario.id_usuario,
                id_empleado: usuario.id_empleado,
                username: usuario.username,
                rol: usuario.rol,
                nombre: usuario.nombre_empleado
            }
        });

    } catch (err) {
        console.error('Error en login:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getUsuario = async (req, res) => {
    const id = req.user.id;//seleccionamos el id del user q nos dejo la cookie
    try {
        //consultamos la db
        const filasData = await query(
            `SELECT u.id_usuario, u.username, u.activo,
                    r.nombre AS rol,
                    e.nombre AS nombre_empleado
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            INNER JOIN empleados e ON u.id_empleado = e.id_empleado
            WHERE u.id_usuario = @id`,
            {//aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
                id: { type: sql.Int, value: id }
            }
        );

        const usuario = filasData.recordset[0];//guardo guadro

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        //retornamos
        return res.status(200).json({
            ok: true,
            usuario: {
                id: usuario.id_usuario,
                username: usuario.username,
                rol: usuario.rol,
                nombre: usuario.nombre_empleado
            }
        });

    } catch (err) {
        console.error('Error al obtener usuario:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

const logout = (req, res) => {
    //limpiamos la cookie
    res.clearCookie('token');
    res.json({
        ok: true
    });
}

//exportamos las funciones
module.exports = {
    login,
    logout,
    getUsuario
};