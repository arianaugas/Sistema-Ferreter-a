-- un usuario xd
INSERT INTO cargos (nombre) VALUES ('Administrador');

INSERT INTO empleados (id_cargo, dni, nombre, apellido, fecha_ingreso)
VALUES (1, '12345678', 'Admin', 'Sistema', GETDATE());

INSERT INTO roles (nombre, descripcion)
VALUES ('admin', 'Acceso total al sistema');
/*HASH GENERADO CON BCRYPTJS
node -e "const b = require('bcryptjs'); b.hash('admin123', 10).then(h => console.log(h));"
*/
INSERT INTO usuarios (id_empleado, id_rol, username, contrasena)
VALUES (1, 1, 'admin', '$2b$10$./NE4rcbw7/cjtro57WNWONDsF7wYMY.oqLCngwQwDVfqhS4BjdOK');-- Contra: admin123
