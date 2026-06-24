const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);
    let statusCode = 500;
    let message = 'Error interno del servidor.';

    if (err.name === 'ValidationError') statusCode = 400;
    else if (err.name === 'UnauthorizedError') statusCode = 401;
    else if (err.statusCode) statusCode = err.statusCode;

    if (req.originalUrl.startsWith('/api')) {
        res.status(statusCode).json({ ok: false, mensaje: err.message || message });
    } else {
        if (statusCode === 401) res.redirect('/login');
        else res.status(statusCode).send(`<h1>Error ${statusCode}</h1><p>${err.message || message}</p>`);
    }
};

module.exports = errorMiddleware;