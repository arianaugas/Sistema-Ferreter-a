function validateUsername(req, res, next) {
  const username = req.body?.username;
  if (!username || typeof username !== 'string' || username.trim() === '') {
    return res.status(400).json({ error: 'El nombre de usuario es requerido y no puede estar vacío.' });
  }
  next();
}


function validatePassword(req, res, next) {
  const password = req.body?.password;
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res
      .status(400)
      .json({ error: 'La contraseña es requerida y debe tener al menos 6 caracteres.' });
  }
  next();
}


function validarLogin(req, res, next) {

  const runUsername = () => validateUsername(req, res, (err) => err ? next(err) : runPassword());
  const runPassword = () => validatePassword(req, res, next);
  runUsername();
}

module.exports = {
  validarLogin,
  validateUsername,
  validatePassword,
};