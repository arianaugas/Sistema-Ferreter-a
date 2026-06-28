const jwt = require('jsonwebtoken');//importamos el token
const { sql, query } = require('../db/conexion_sql');

//leemos la cookie con el token jwt
async function revisarToken(req, res, next) {
    try {
        //leemos la cookie del navegador q contiene el token q contiene el usuario
        const cookieJWT = req.cookies.token;

        //si no hay
        if (!cookieJWT) {
            if (req.originalUrl.startsWith('/api')) {//mandamos error
                return res.status(401).json({ error: "No hay sesión activa" });
            }
            return res.redirect('/login');//redirigimos
        }

        //verificamos la cookie
        const verificada = jwt.verify(cookieJWT, process.env.JWT_SECRET);

        // El JWT puede seguir siendo válido aunque el usuario haya sido
        // desactivado DESPUÉS de iniciar sesión, así que confirmamos contra
        // la BD en cada request en vez de confiar solo en el token.
        const resUsuario = await query(
            'SELECT activo FROM usuarios WHERE id_usuario = @id',
            { id: { type: sql.Int, value: verificada.id } }
        );

        if (resUsuario.recordset.length === 0 || !resUsuario.recordset[0].activo) {
            res.clearCookie('token');
            if (req.originalUrl.startsWith('/api')) {
                return res.status(401).json({ error: 'Tu cuenta fue desactivada. Contacta a un administrador.' });
            }
            return res.redirect('/login');
        }

        req.user = verificada;//guardamos en la req
        next();
    }
    catch (err) {
        if (req.originalUrl.startsWith('/api')) {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }
        return res.redirect('/login');
    }
}

// Cache en memoria: 'id_rol:id_modulo' → true/false (tiene acceso o no).
// Se invalida cuando se guardan permisos nuevos desde el panel de admin.
const _permisosCache = new Map();

function invalidarCachePermisos() {
    _permisosCache.clear();
}

// Resuelve el id_rol a partir del nombre del rol (req.user.rol), con caché.
async function _resolverIdRol(rol) {
    const { sql: sqlType, query } = require('../db/conexion_sql');
    const rolKey = `rol:${rol}`;
    let id_rol = _permisosCache.get(rolKey);
    if (id_rol) return id_rol;

    const r = await query(
        `SELECT id_rol FROM roles WHERE nombre = @nombre`,
        { nombre: { type: sqlType.VarChar, value: rol } }
    );
    if (!r.recordset.length) return null;
    id_rol = r.recordset[0].id_rol;
    _permisosCache.set(rolKey, id_rol);
    return id_rol;
}

// Middleware de acceso por módulo: todo o nada. Si el rol tiene el módulo
// asignado, puede ver/crear/editar/eliminar libremente dentro de él. Si no
// lo tiene, queda bloqueado por completo (incluyendo del sidebar, que se
// arma a partir de /api/auth/mis-modulos).
// Uso: router.post('/', revisarToken, verificarAccesoModulo('/ventas'), ctrl.crear)
function verificarAccesoModulo(moduloRuta) {
    return async (req, res, next) => {
        try {
            const rol = req.user?.rol;
            if (!rol) return res.status(401).json({ error: 'Sin sesión activa.' });

            // Administrador siempre pasa
            if (rol === 'Administrador') return next();

            const id_rol = await _resolverIdRol(rol);
            if (!id_rol) return res.status(403).json({ error: 'Rol no reconocido.' });

            const cacheKey = `${id_rol}:${moduloRuta}`;
            let tieneAcceso = _permisosCache.get(cacheKey);

            if (tieneAcceso === undefined) {
                const { sql: sqlType, query } = require('../db/conexion_sql');
                const p = await query(
                    `SELECT p.tiene_acceso
                    FROM permisos_rol p
                    INNER JOIN modulos m ON m.id_modulo = p.id_modulo
                    WHERE p.id_rol = @id_rol AND m.ruta = @ruta`,
                    {
                        id_rol: { type: sqlType.Int, value: id_rol },
                        ruta: { type: sqlType.VarChar, value: moduloRuta }
                    }
                );
                tieneAcceso = !!(p.recordset[0]?.tiene_acceso);
                _permisosCache.set(cacheKey, tieneAcceso);
            }

            if (!tieneAcceso) {
                return res.status(403).json({ error: 'No tienes acceso a este módulo.' });
            }
            next();
        } catch (err) {
            console.error('verificarAccesoModulo error:', err);
            return res.status(500).json({ error: 'Error al verificar permisos.' });
        }
    };
}

module.exports = {
    revisarToken,
    verificarAccesoModulo,
    invalidarCachePermisos
};