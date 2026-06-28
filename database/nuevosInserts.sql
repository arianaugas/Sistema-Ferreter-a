-- 1. TURNOS (necesario antes que empleados, ahora id_turno es requerido)
INSERT INTO turnos (nombre, hora_inicio, hora_fin, activo) VALUES
('Turno Mañana', '07:00:00', '15:00:00', 1),
('Turno Tarde',  '15:00:00', '23:00:00', 1);
-- IDs: 1=Mañana, 2=Tarde

-- 2. CARGOS
INSERT INTO cargos (nombre, activo) VALUES
('Administrador', 1),
('Vendedor',      1),
('Almacenero',    1),
('Cajero',        1);
-- IDs: 1=Administrador, 2=Vendedor, 3=Almacenero, 4=Cajero

-- 3. ROLES
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso total al sistema'),
('Vendedor',      'Puede registrar ventas y consultar productos'),
('Almacenero',    'Gestiona inventario y recepciones'),
('Cajero',        'Gestiona caja y cobros');
-- IDs: 1=Administrador, 2=Vendedor, 3=Almacenero, 4=Cajero

-- 4. EMPLEADOS (ahora incluye id_turno)
INSERT INTO empleados (id_cargo, id_turno, dni, nombre, apellido, telefono, correo, fecha_ingreso, activo) VALUES
(1, 1, '12345678', 'Ana',     'García',  '987654321', 'ana.garcia@ferreteria.com',     '2022-01-10', 1),
(2, 1, '23456789', 'Luis',    'Ramírez', '976543210', 'luis.ramirez@ferreteria.com',   '2022-03-15', 1),
(3, 1, '34567890', 'Carlos',  'Mendoza', '965432109', 'carlos.mendoza@ferreteria.com', '2022-06-01', 1),
(4, 2, '45678901', 'María',   'Torres',  '954321098', 'maria.torres@ferreteria.com',   '2023-01-05', 1),
(2, 1, '56789012', 'Pedro',   'Quispe',  '943210987', 'pedro.quispe@ferreteria.com',   '2023-04-20', 1),
(4, 2, '67890123', 'Sofía',   'Huanca',  '932109876', 'sofia.huanca@ferreteria.com',   '2023-07-01', 1),
(2, 1, '78901234', 'Diego',   'Flores',  '921098765', 'diego.flores@ferreteria.com',   '2024-01-10', 1),
(3, 2, '89012345', 'Valeria', 'Castro',  '910987654', 'valeria.castro@ferreteria.com', '2024-03-01', 1);
-- IDs: 1=Ana(Admin/Mañana), 2=Luis(Vendedor/Mañana), 3=Carlos(Almacenero/Mañana)
--      4=María(Cajero/Tarde), 5=Pedro(Vendedor/Mañana), 6=Sofía(Cajero/Tarde)
--      7=Diego(Vendedor/Mañana), 8=Valeria(Almacenero/Tarde)

-- 5. USUARIOS (sin cambios, mismos hashes)
INSERT INTO usuarios (id_empleado, id_rol, username, contrasena, activo) VALUES
(1, 1, 'ana.admin',   '$2b$10$lZlGueq.dbr5.qBGUny4wOL1PCOHVD3v3MotDeqD1y52JnAa9K6p.', 1), -- admin123
(2, 2, 'luis.vend',   '$2b$10$IAVtUwKkhj/X.ph6QhVRUOaCkZ/gKNFLAtD/67HVz0UVJhTfe3leW', 1), -- vendedor123
(3, 3, 'carlos.alm',  '$2b$10$XHWVu6/TQNvbhdg.CXVXn.FFWtW9TTcF/5Ip.hIwgYUaFMBuhTZU2', 1), -- almacen123
(4, 4, 'maria.caj',   '$2b$10$WyTfd42Lrj5A.9kP.iF2p.OqSOY2R6icTiQk.eMA.GOpQVWAl731O', 1), -- cajero123
(5, 2, 'pedro.vend',  '$2b$10$ZxDeLgf.9NGHz9H/7RbASOYRQPpqIjmu6EvPCI2qr0e4ielTN/dei', 1), -- vendedor123
(6, 4, 'sofia.caj',   '$2b$10$NCx5CEgTHQ7MW81gkqpdSeaDSMYnfRHere9C1Y150FSavcQOOhrym', 1), -- cajero123
(7, 2, 'diego.vend',  '$2b$10$SW4mKXT/Ht2RrnkyczZm.Ow0ph6ZuMpqY92S1S2L6YYMKveZioTda', 1), -- vendedor123
(8, 3, 'valeria.alm', '$2b$10$gCYy/qXPHX52VDtufGK2Q.U1CpP0nJUsha4cmGvKxy5FacyPsEiAe', 1); -- almacen123

INSERT INTO modulos (nombre, ruta, descripcion) VALUES
('Productos',     '/productos',               'Catálogo de productos, categorías, marcas y unidades'),
('Clientes',      '/clientes',                'Gestión de clientes'),
('Proveedores',   '/proveedores',             'Gestión de proveedores'),
('Compras',       '/compras',                 'Órdenes de compra y recepciones'),
('Inventario',    '/inventario',              'Stock, kardex, almacenes y transferencias'),
('Ventas',        '/ventas',                  'Registro de ventas'),
('Caja',          '/caja',                    'Apertura, movimientos y cierre de caja'),
('Devoluciones',  '/devoluciones',            'Cambios y reembolsos'),
('Empleados',     '/empleados',               'Gestión de empleados y cargos'),
('Usuarios',      '/usuarios',                'Cuentas de acceso y roles'),
('Reportes',      '/reportes',                'Reportes y estadísticas'),
('Configuración y Auditoría', '/configuracion-auditoria', 'Configuración del sistema, turnos y auditoría');