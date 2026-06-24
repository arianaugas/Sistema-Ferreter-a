
// Captura todas las rutas no definidas
const notFound = (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
        // Para rutas de la API respondemos JSON 404
        return res.status(404).json({ error: 'Ruta no encontrada' });
    }
    // Para el resto redirigimos a /inicio (si hay sesión) o mostramos 404
    return res.redirect('/inicio');
};

module.exports = { notFound };