const jwt = require('jsonwebtoken');//importamos el token

//leemos la cookie con el token jwt
function revisarToken(req, res, next) {
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

// Restringe el acceso según el rol. Se usa SIEMPRE después de revisarToken,
// que es quien deja el rol del usuario en req.user.rol
function permitirRoles(...rolesPermitidos) {
    return (req, res, next) => {
        if (!rolesPermitidos.includes(req.user?.rol)) {
            return res.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
        }
        next();
    };
}

module.exports = {
    revisarToken, 
    permitirRoles 
};