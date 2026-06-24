
function createValidator(rules) {
  return async (req, res, next) => {
    const errors = [];
    for (const { field, validator, message } of rules) {
      const value = req.body?.[field];
      if (!validator(value)) {
        errors.push({ field, message });
      }
    }
    if (errors.length) {
      return res.status(400).json({ errors });
    }
    next();
  };
}

// Specific product validations
const { sql, query } = require('../db/conexion_sql');

async function validateProductCreate(req, res, next) {
  const { codigo, precio_compra, stock_minimo } = req.body;
  // Código obligatorio y único
  if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
    return res.status(400).json({ error: 'El código del producto es obligatorio.' });
  }
  const codeExists = await query(
    'SELECT 1 FROM productos WHERE codigo = @codigo',
    { codigo: { type: sql.VarChar, value: codigo } }
  );
  if (codeExists.recordset.length) {
    return res.status(400).json({ error: 'El código del producto ya está registrado.' });
  }
  // Precio > 0
  if (typeof precio_compra !== 'number' || precio_compra <= 0) {
    return res.status(400).json({ error: 'El precio de compra debe ser mayor a 0.' });
  }
  // Stock mínimo no negativo
  if (typeof stock_minimo !== 'number' || stock_minimo < 0) {
    return res.status(400).json({ error: 'El stock mínimo no puede ser negativo.' });
  }
  next();
}


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


function validateEmail(req, res, next) {
  const email = req.body?.email;
  if (email) {
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de correo electrónico inválido.' });
    }
  }
  next();
}

function validateRole(allowedRoles = []) {
  return (req, res, next) => {
    const role = req.body?.rol;
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ error: `El rol '${role}' no está permitido.` });
    }
    next();
  };
}


function validarLogin(req, res, next) {

  const runUsername = () => validateUsername(req, res, (err) => err ? next(err) : runPassword());
  const runPassword = () => validatePassword(req, res, next);
  runUsername();
}

module.exports = {
  validarLogin,
  createValidator,
  validateUsername,
  validatePassword,
  validateEmail,
  validateRole,
  validateProductCreate
};
