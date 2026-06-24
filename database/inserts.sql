
--  DATOS DE PRUEBA - Ferretería
--  Ejecutar en orden

USE Ferreteria;

-- 1. CONFIGURACIÓN
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('igv',      '0.18',          'Tasa de IGV aplicada a ventas'),
('negocio',  'Ferretería Don Pepe', 'Nombre del negocio'),
('moneda',   'Soles',         'Moneda del sistema'),
('simbolo',  'S/',            'Símbolo monetario');


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


-- 4. EMPLEADOS
INSERT INTO empleados (id_cargo, dni, nombre, apellido, telefono, correo, fecha_ingreso, activo) VALUES
(1, '12345678', 'Ana', 'García', '987654321', 'ana.garcia@ferreteria.com', '2022-01-10', 1),
(2, '23456789', 'Luis', 'Ramírez', '976543210', 'luis.ramirez@ferreteria.com', '2022-03-15', 1),
(3, '34567890', 'Carlos', 'Mendoza', '965432109', 'carlos.mendoza@ferreteria.com','2022-06-01', 1),
(4, '45678901', 'María', 'Torres', '954321098', 'maria.torres@ferreteria.com', '2023-01-05', 1),
(2, '56789012', 'Pedro', 'Quispe', '943210987', 'pedro.quispe@ferreteria.com', '2023-04-20', 1),
(4, '67890123', 'Sofía', 'Huanca', '932109876', 'sofia.huanca@ferreteria.com', '2023-07-01', 1),
(2, '78901234', 'Diego', 'Flores', '921098765', 'diego.flores@ferreteria.com', '2024-01-10', 1),
(3, '89012345', 'Valeria', 'Castro', '910987654', 'valeria.castro@ferreteria.com','2024-03-01', 1);
-- IDs: 1=Ana(Admin), 2=Luis(Vendedor), 3=Carlos(Almacenero),
-- 4=María(Cajero), 5=Pedro(Vendedor), 6=Sofía(Cajero),
-- 7=Diego(Vendedor), 8=Valeria(Almacenero)


-- 5. USUARIOS
--  CONTRASEÑAS (generar hash con bcrypt)
INSERT INTO usuarios (id_empleado, id_rol, username, contrasena, activo) VALUES
(1, 1, 'ana.admin', '$2b$10$lZlGueq.dbr5.qBGUny4wOL1PCOHVD3v3MotDeqD1y52JnAa9K6p.', 1), --admin123
(2, 2, 'luis.vend', '$2b$10$IAVtUwKkhj/X.ph6QhVRUOaCkZ/gKNFLAtD/67HVz0UVJhTfe3leW', 1), --vendedor123
(3, 3, 'carlos.alm', '$2b$10$XHWVu6/TQNvbhdg.CXVXn.FFWtW9TTcF/5Ip.hIwgYUaFMBuhTZU2', 1), -- almacen123
(4, 4, 'maria.caj', '$2b$10$WyTfd42Lrj5A.9kP.iF2p.OqSOY2R6icTiQk.eMA.GOpQVWAl731O', 1), -- cajero123
(5, 2, 'pedro.vend', '$2b$10$ZxDeLgf.9NGHz9H/7RbASOYRQPpqIjmu6EvPCI2qr0e4ielTN/dei', 1), -- vendedor123
(6, 4, 'sofia.caj', '$2b$10$NCx5CEgTHQ7MW81gkqpdSeaDSMYnfRHere9C1Y150FSavcQOOhrym', 1), -- cajero123
(7, 2, 'diego.vend', '$2b$10$SW4mKXT/Ht2RrnkyczZm.Ow0ph6ZuMpqY92S1S2L6YYMKveZioTda', 1), -- vendedor123
(8, 3, 'valeria.alm', '$2b$10$gCYy/qXPHX52VDtufGK2Q.U1CpP0nJUsha4cmGvKxy5FacyPsEiAe', 1); -- almacen123


-- 6. CLIENTES
INSERT INTO clientes (tipo_documento, numero_documento, nombre, telefono, correo, activo) VALUES
('DNI', '11111111', 'Roberto Salas', '911111111', 'roberto.salas@gmail.com',     1),
('DNI', '22222222', 'Carmen Vega', '922222222', 'carmen.vega@gmail.com',       1),
('RUC', '20123456789', 'Constructora Lima SAC','933333333', 'compras@constructoralima.com',1),
('DNI', '33333333', 'Jorge Paredes', '944444444', NULL,                          1),
('RUC', '20987654321', 'Ferremax EIRL', '955555555', 'ferremax@outlook.com',        1),
('DNI', '44444444', 'Lucía Rojas', '966666666', 'lucia.rojas@gmail.com',       1),
('CE',  'CE12345678', 'Jean Pierre Dupont', '977777777', 'jp.dupont@gmail.com',         1),
('DNI', '55555555', 'Miguel Ángel Soto', '988888888', 'miguel.soto@hotmail.com',     1),
('RUC', '20111222333', 'Obras & Más SAC', '999999990', 'obras@obrasmass.com',         1),
('DNI', '66666666', 'Patricia Núñez', '900000001', NULL,                          1),
('DNI', '77777777', 'Raúl Chávez', '900000002', 'raul.chavez@gmail.com',       1),
('DNI', '88888888', 'Elena Pinto', '900000003', 'elena.pinto@gmail.com',       1);


-- 7. CATEGORÍAS
INSERT INTO categorias (nombre, descripcion, activo) VALUES
('Eléctrico', 'Materiales y equipos eléctricos', 1),
('Plomería', 'Tuberías, llaves y accesorios de agua', 1),
('Herramientas', 'Herramientas manuales y eléctricas', 1),
('Pinturas', 'Pinturas, barnices y solventes', 1),
('Construcción', 'Cemento, arena y materiales de obra', 1),
('Ferretería General', 'Tornillos, clavos y sujetadores', 1),
('Seguridad', 'EPP y equipos de protección', 1);
-- IDs: 1=Eléctrico, 2=Plomería, 3=Herramientas, 4=Pinturas,
-- 5=Construcción, 6=Ferretería General, 7=Seguridad


-- 8. SUBCATEGORÍAS
INSERT INTO subcategorias (id_categoria, nombre, activo) VALUES
(1, 'Cables', 1),  -- 1
(1, 'Tomacorrientes', 1),  -- 2
(1, 'Interruptores', 1),  -- 3
(1, 'Tableros', 1),  -- 4
(2, 'Tuberías PVC', 1),  -- 5
(2, 'Llaves de paso', 1),  -- 6
(2, 'Pegamentos PVC', 1),  -- 7
(3, 'Herramientas manuales', 1), -- 8
(3, 'Herramientas eléctricas', 1), -- 9
(4, 'Pinturas de pared', 1),  -- 10
(4, 'Esmaltes', 1),  -- 11
(4, 'Solventes', 1),  -- 12
(5, 'Cemento', 1),  -- 13
(5, 'Ladrillos', 1),  -- 14
(6, 'Tornillos', 1),  -- 15
(6, 'Clavos', 1),  -- 16
(7, 'Cascos', 1),  -- 17
(7, 'Guantes', 1);  -- 18


-- 9. MARCAS
INSERT INTO marcas (nombre, pais_origen, activo) VALUES
('Indeco', 'Perú', 1),
('Bticino', 'Italia', 1),
('Stanley', 'USA', 1),
('3M', 'USA', 1),
('Eternit', 'Perú', 1),
('Vencedor', 'Perú', 1),
('Bosch', 'Alemania', 1),
('Pegaflex', 'Perú', 1),
('Cemento Sol','Perú', 1),
('Makita', 'Japón', 1);
-- IDs: 1=Indeco, 2=Bticino, 3=Stanley, 4=3M, 5=Eternit,
-- 6=Vencedor, 7=Bosch, 8=Pegaflex, 9=Cemento Sol, 10=Makita


-- 10. UNIDADES DE MEDIDA
INSERT INTO unidades_medida (nombre, abreviatura, activo) VALUES
('Unidad', 'und', 1),
('Metro', 'm',   1),
('Kilo', 'kg',  1),
('Litro', 'lt',  1),
('Caja', 'cja', 1),
('Rollo', 'rol', 1),
('Bolsa', 'bol', 1),
('Galon', 'gal', 1);
-- IDs: 1=und, 2=m, 3=kg, 4=lt, 5=cja, 6=rol, 7=bol, 8=gal


-- 11. ALMACENES
INSERT INTO almacenes (nombre, direccion, responsable, activo) VALUES
('Almacén Principal', 'Av. Industrial 123, Lima',    3, 1),
('Depósito Secundario','Jr. Comercio 456, Lima',     8, 1);
-- IDs: 1=Principal (responsable: Carlos), 2=Secundario (responsable: Valeria)


-- 12. PRODUCTOS (30 productos variados)
INSERT INTO productos (id_subcategoria, id_marca, id_unidad, codigo, nombre, descripcion,
    precio_compra, precio_venta, stock_actual, stock_minimo, stock_maximo, ubicacion, tiene_lote, activo) VALUES
-- ELÉCTRICO - Cables
(1, 1, 2, 'CAB-001', 'Cable THW 2.5mm', 'Cable sólido 2.5mm azul', 1.80,  2.50,  500, 100, 2000, 'A1-Est1', 0, 1),
(1, 1, 2, 'CAB-002', 'Cable THW 4mm', 'Cable sólido 4mm amarillo', 2.50,  3.50,  300,  80, 1500, 'A1-Est1', 0, 1),
(1, 1, 6, 'CAB-003', 'Cable NMT 2x2.5mm', 'Cable mellizo 2x2.5mm', 8.50, 12.00,   80,  20,  300, 'A1-Est2', 0, 1),
-- ELÉCTRICO - Tomacorrientes
(2, 2, 1, 'TOM-001', 'Tomacorriente Doble',  'Tomacorriente 2 salidas', 4.50,  8.50,  150,  30,  500, 'A1-Est3', 0, 1),
(2, 2, 1, 'TOM-002', 'Tomacorriente Triple', 'Tomacorriente 3 salidas', 6.00, 11.00,  100,  20,  400, 'A1-Est3', 0, 1),
-- ELÉCTRICO - Interruptores
(3, 2, 1, 'INT-001', 'Interruptor Simple', 'Interruptor 10A', 3.50,  7.00,  200,  40,  600, 'A1-Est4', 0, 1),
(3, 2, 1, 'INT-002', 'Interruptor Doble', 'Interruptor doble 10A', 5.50, 10.50,  120,  25,  400, 'A1-Est4', 0, 1),
-- PLOMERÍA - Tuberías
(5, 5, 2, 'TUB-001', 'Tubería PVC 1/2"', 'Tubería PVC presión 1/2"', 1.20,  2.00,  400,  80, 1500, 'B1-Est1', 0, 1),
(5, 5, 2, 'TUB-002', 'Tubería PVC 3/4"', 'Tubería PVC presión 3/4"', 1.80,  2.80,  300,  60, 1200, 'B1-Est1', 0, 1),
(5, 5, 2, 'TUB-003', 'Tubería PVC 1"', 'Tubería PVC presión 1"', 2.50,  3.80,  200,  40,  800, 'B1-Est2', 0, 1),
-- PLOMERÍA - Llaves de paso
(6, NULL,1, 'LLA-001','Llave de Paso 1/2"', 'Llave esférica bronce 1/2"', 8.00, 14.00,   80,  15,  300, 'B1-Est3', 0, 1),
(6, NULL,1, 'LLA-002','Llave de Paso 3/4"', 'Llave esférica bronce 3/4"',11.00, 19.00,   60,  10,  200, 'B1-Est3', 0, 1),
-- PLOMERÍA - Pegamentos
(7, 8, 4, 'PEG-001', 'Pegamento PVC 1/4lt', 'Pegamento para PVC 250ml', 6.00, 10.00,   90,  20,  300, 'B1-Est4', 1, 1),
(7, 8, 4, 'PEG-002', 'Pegamento PVC 1/2lt', 'Pegamento para PVC 500ml',  10.00, 17.00,   60,  15,  200, 'B1-Est4', 1, 1),
-- HERRAMIENTAS - Manuales
(8, 3, 1, 'HER-001', 'Martillo 16oz', 'Martillo de acero 16oz',    18.00, 32.00,   50,  10,  150, 'C1-Est1', 0, 1),
(8, 3, 1, 'HER-002', 'Alicate Universal 8"', 'Alicate multiuso 8 pulgadas',12.00, 22.00,  60,  10,  180, 'C1-Est1', 0, 1),
(8, 3, 1, 'HER-003', 'Destornillador Plano', 'Destornillador plano 6"',    4.50,  9.00,   80,  15,  250, 'C1-Est2', 0, 1),
(8, 3, 1, 'HER-004', 'Destornillador Estrella','Destornillador estrella 6"',4.50, 9.00,   80,  15,  250, 'C1-Est2', 0, 1),
-- HERRAMIENTAS - Eléctricas
(9, 7, 1, 'HEE-001', 'Taladro Percutor 13mm','Taladro Bosch 13mm 800W',  180.00,299.00,   15,   3,   50, 'C2-Est1', 0, 1),
(9,10, 1, 'HEE-002', 'Amoladora 4.5"',       'Amoladora Makita 720W',    120.00,199.00,   20,   4,   60, 'C2-Est1', 0, 1),
-- PINTURAS
(10,6, 8, 'PIN-001', 'Pintura Látex Blanco 4gl','Pintura Vencedor látex blanco',85.00,140.00, 40,  8, 150, 'D1-Est1', 1, 1),
(10,6, 8, 'PIN-002', 'Pintura Látex Marfil 4gl','Pintura Vencedor látex marfil',85.00,140.00, 35,  8, 120, 'D1-Est1', 1, 1),
(11,6, 4, 'ESM-001', 'Esmalte Negro 1lt',    'Esmalte sintético negro 1lt', 18.00, 30.00,  50, 10,  180, 'D1-Est2', 1, 1),
(12,NULL,4,'SOL-001', 'Thinner Acrílico 1lt', 'Solvente para pintura 1lt',   8.00, 14.00,  70, 15,  250, 'D1-Est3', 1, 1),
-- FERRETERÍA GENERAL
(15,NULL,5,'TOR-001', 'Tornillo 1/4x1" (caja 100)',  'Tornillo autorroscante galv.',  5.00,  9.00, 100, 20, 400, 'E1-Est1', 0, 1),
(15,NULL,5,'TOR-002', 'Tornillo 3/8x2" (caja 50)',   'Tornillo galvanizado 3/8x2"',   7.00, 12.00,  80, 15, 300, 'E1-Est1', 0, 1),
(16,NULL,7,'CLA-001', 'Clavo 2" (bolsa 1kg)',        'Clavo de acero 2 pulgadas',      4.50,  8.00, 120, 25, 500, 'E1-Est2', 0, 1),
(16,NULL,7,'CLA-002', 'Clavo 3" (bolsa 1kg)',        'Clavo de acero 3 pulgadas',      4.50,  8.00, 100, 20, 400, 'E1-Est2', 0, 1),
-- SEGURIDAD
(17,4, 1, 'SEG-001', 'Casco de Seguridad',  'Casco 3M blanco clase E',    22.00, 38.00,  30,   5,  100, 'F1-Est1', 0, 1),
(18,4, 1, 'SEG-002', 'Guantes de Cuero',    'Guantes protección cuero',    8.00, 15.00,  60,  10,  200, 'F1-Est1', 0, 1);
-- IDs productos: 1-30 en el orden de inserción


-- 13. PROVEEDORES
INSERT INTO proveedores (ruc, nombre, direccion, telefono, correo, condicion_pago, activo) VALUES
('20100123456', 'Indeco SA',           'Av. Argentina 2000, Callao',   '014561234', 'ventas@indeco.com.pe',    '30_dias', 1),
('20200234567', 'Bticino Perú SAC',    'Av. Javier Prado 1500, Miraflores','014322100','ventas@bticino.pe',   '30_dias', 1),
('20300345678', 'Eternit SAC',         'Carretera Central Km 8, Lima', '015671890', 'comercial@eternit.pe',   '60_dias', 1),
('20400456789', 'Distribuidora Hertz', 'Jr. Paruro 890, Cercado',      '013281900', 'hertz.dist@gmail.com',   'contado', 1),
('20500567890', 'Pinturas Vencedor',   'Av. Venezuela 3400, Breña',    '014239000', 'ventas@vencedor.com.pe', '30_dias', 1),
('20600678901', 'Ferromax Import SAC', 'Av. Caquetá 1100, Rímac',      '014811500', 'ferromax@import.pe',     '60_dias', 1);
-- IDs: 1=Indeco, 2=Bticino, 3=Eternit, 4=Hertz, 5=Vencedor, 6=Ferromax


-- 14. CONTACTOS DE PROVEEDORES
INSERT INTO contactos_proveedor (id_proveedor, nombre, cargo, telefono, correo, es_principal) VALUES
(1, 'Ricardo Ore',     'Ejecutivo de ventas',  '987001001', 'r.ore@indeco.com.pe',       1),
(1, 'Área de créditos','Créditos y cobranzas', '014561234', 'creditos@indeco.com.pe',    0),
(2, 'Sandra Mejía',    'Asesora comercial',    '987002002', 's.mejia@bticino.pe',        1),
(3, 'Gustavo Parra',   'Representante ventas', '987003003', 'g.parra@eternit.pe',        1),
(4, 'Willy Tapia',     'Propietario',          '987004004', 'wtapia@hertz.dist.com',     1),
(5, 'Claudia Ríos',    'Ejecutiva comercial',  '987005005', 'c.rios@vencedor.com.pe',    1),
(6, 'Manuel Estrada',  'Jefe de ventas',       '987006006', 'm.estrada@ferromax.pe',     1);


-- 15. PRODUCTOS POR PROVEEDOR
INSERT INTO productos_proveedor (id_producto, id_proveedor, precio_compra, tiempo_entrega_dias, es_preferido) VALUES
-- Cables → Indeco (preferido) y Ferromax
(1,  1, 1.80, 3, 1), (1,  6, 1.95, 7, 0),
(2,  1, 2.50, 3, 1), (2,  6, 2.65, 7, 0),
(3,  1, 8.50, 3, 1),
-- Tomacorrientes e Interruptores → Bticino
(4,  2, 4.50, 5, 1),
(5,  2, 6.00, 5, 1),
(6,  2, 3.50, 5, 1),
(7,  2, 5.50, 5, 1),
-- Tuberías → Eternit
(8,  3, 1.20, 7, 1),
(9,  3, 1.80, 7, 1),
(10, 3, 2.50, 7, 1),
-- Llaves de paso → Hertz
(11, 4, 8.00, 2, 1),
(12, 4,11.00, 2, 1),
-- Pegamentos → Hertz y Ferromax
(13, 4, 6.00, 2, 1), (13, 6, 6.50, 5, 0),
(14, 4,10.00, 2, 1),
-- Herramientas manuales → Hertz
(15, 4,18.00, 2, 1),
(16, 4,12.00, 2, 1),
(17, 4, 4.50, 2, 1),
(18, 4, 4.50, 2, 1),
-- Herramientas eléctricas → Ferromax
(19, 6,180.00,10, 1),
(20, 6,120.00,10, 1),
-- Pinturas → Vencedor
(21, 5,85.00, 7, 1),
(22, 5,85.00, 7, 1),
(23, 5,18.00, 7, 1),
(24, 5, 8.00, 7, 1),
-- Ferretería general → Hertz y Ferromax
(25, 4, 5.00, 2, 1), (25, 6, 5.20, 5, 0),
(26, 4, 7.00, 2, 1),
(27, 4, 4.50, 2, 1),
(28, 4, 4.50, 2, 1),
-- Seguridad → Ferromax
(29, 6,22.00, 5, 1),
(30, 6, 8.00, 5, 1);


-- 16. LOTES (solo productos con tiene_lote = 1)
-- Productos con lote: 13=PEG-001, 14=PEG-002, 21=PIN-001,
--                     22=PIN-002, 23=ESM-001, 24=SOL-001
INSERT INTO lotes (id_producto, id_almacen, numero_lote, fecha_vencimiento, cantidad) VALUES
(13, 1, 'LOT-PEG-2401', '2026-01-31', 45.00),
(13, 1, 'LOT-PEG-2402', '2026-06-30', 45.00),
(14, 1, 'LOT-PEG-2403', '2026-03-31', 60.00),
(21, 1, 'LOT-PIN-2401', '2027-12-31', 40.00),
(22, 1, 'LOT-PIN-2402', '2027-12-31', 35.00),
(23, 1, 'LOT-ESM-2401', '2026-08-31', 50.00),
(24, 1, 'LOT-SOL-2401', '2026-05-31', 70.00);


-- 17. SERIES DE COMPROBANTES
INSERT INTO serie_comprobantes (tipo_comprobante, serie, correlativo_actual, activo) VALUES
('boleta',     'B001', 0, 1),
('factura',    'F001', 0, 1),
('nota_venta', 'NV01', 0, 1);
-- IDs: 1=B001, 2=F001, 3=NV01


-- 18. TIPOS DE PAGO
INSERT INTO tipos_pago (nombre, requiere_voucher, activo) VALUES
('Efectivo',      0, 1),
('Tarjeta',       1, 1),
('Yape',          1, 1),
('Plin',          1, 1),
('Transferencia', 1, 1);
-- IDs: 1=Efectivo, 2=Tarjeta, 3=Yape, 4=Plin, 5=Transferencia


-- FIN DEL SCRIPT
-- RESUMEN DE IDs CLAVE PARA POSTMAN:
--
-- Usuarios para login:
--   ana.admin   / admin123     → id_usuario=1, rol=Administrador
--   luis.vend   / vendedor123  → id_usuario=2, rol=Vendedor
--   carlos.alm  / almacen123   → id_usuario=3, rol=Almacenero
--   maria.caj   / cajero123    → id_usuario=4, rol=Cajero
--   pedro.vend  / vendedor123  → id_usuario=5, rol=Vendedor
--
-- Almacenes: 1=Principal, 2=Secundario
-- Series:    1=B001(boleta), 2=F001(factura), 3=NV01(nota_venta)
-- Tipos pago:1=Efectivo, 2=Tarjeta, 3=Yape
-- Productos con stock suficiente para ventas:
--   id=1 (Cable 2.5mm, stock 500), id=8 (Tubería 1/2", stock 400)
--   id=15 (Martillo, stock 50),    id=25 (Tornillos, stock 100)




USE Ferreteria;

-- ============================================================
-- DATOS TRANSACCIONALES - Ferretería Don Pepe
-- Ejecutar completo de una sola vez
-- ============================================================


-- ============================================================
-- 19. CAJAS (5 turnos: 4 cerrados, 1 abierto)
-- ============================================================
INSERT INTO cajas (id_empleado, numero_turno, fecha_apertura, fecha_cierre,
    monto_inicial, monto_esperado, monto_real, diferencia, observacion, estado) VALUES
(4, 1, '2026-05-01 08:00:00', '2026-05-01 18:30:00', 200.00, 1850.00, 1850.00,  0.00, NULL,                    'cerrada'),
(6, 2, '2026-05-08 08:00:00', '2026-05-08 19:00:00', 200.00, 2340.00, 2320.00, -20.00,'Faltante en efectivo', 'cerrada'),
(4, 3, '2026-05-15 08:00:00', '2026-05-15 18:00:00', 300.00, 3100.00, 3100.00,  0.00, NULL,                    'cerrada'),
(6, 4, '2026-05-22 08:00:00', '2026-05-22 18:30:00', 200.00, 1620.00, 1640.00,  20.00,'Sobrante en efectivo', 'cerrada'),
(4, 5, '2026-06-09 08:00:00', NULL,                   300.00, 0.00,    NULL,     NULL,  NULL,                   'abierta');
-- IDs: 1=cerrada(María), 2=cerrada(Sofía), 3=cerrada(María), 4=cerrada(Sofía), 5=abierta(María)


-- ============================================================
-- 20. ÓRDENES DE COMPRA (6 órdenes: varios estados)
-- ============================================================
INSERT INTO ordenes_compra (id_proveedor, id_empleado, numero_orden, fecha,
    fecha_esperada, estado, subtotal, igv, total, observacion) VALUES
(1, 1, 'OC-2026-001', '2026-04-15 10:00:00', '2026-04-22', 'recibida',  847.46,  152.54, 1000.00, 'Reposición cables mensual'),
(2, 1, 'OC-2026-002', '2026-04-20 09:30:00', '2026-04-28', 'recibida',  677.97,  122.03,  800.00, 'Interruptores y tomacorrientes'),
(3, 1, 'OC-2026-003', '2026-05-02 11:00:00', '2026-05-10', 'recibida', 1186.44, 213.56, 1400.00, 'Tuberías PVC stock bajo'),
(4, 1, 'OC-2026-004', '2026-05-20 10:00:00', '2026-05-28', 'enviada',   847.46,  152.54, 1000.00, 'Herramientas y pegamentos'),
(5, 1, 'OC-2026-005', '2026-06-03 09:00:00', '2026-06-12', 'enviada',   593.22,  106.78,  700.00, 'Pinturas temporada'),
(6, 1, 'OC-2026-006', '2026-06-09 10:30:00', NULL,          'borrador',  423.73,   76.27,  500.00, NULL);
-- IDs: 1-6


-- ============================================================
-- 21. DETALLE ÓRDENES DE COMPRA
-- ============================================================
INSERT INTO detalle_orden_compra (id_orden, id_producto, cantidad_solicitada,
    cantidad_recibida, precio_unitario, subtotal) VALUES
-- OC-001 → Indeco (cables)
(1,  1, 200, 200, 1.80,  360.00),
(1,  2, 100, 100, 2.50,  250.00),
(1,  3,  28,  28, 8.50,  238.00),
-- OC-002 → Bticino (tomacorrientes e interruptores)
(2,  4, 60,  60, 4.50,  270.00),
(2,  5, 40,  40, 6.00,  240.00),
(2,  6, 48,  48, 3.50,  168.00),
-- OC-003 → Eternit (tuberías)
(3,  8, 200, 200, 1.20,  240.00),
(3,  9, 150, 150, 1.80,  270.00),
(3, 10, 100, 100, 2.50,  250.00),
(3, 11,  60,  60, 8.00,  480.00),
-- OC-004 → Hertz (herramientas y pegamentos) — enviada, sin recepciones aún
(4, 15,  20,   0, 18.00,  360.00),
(4, 16,  20,   0, 12.00,  240.00),
(4, 13,  30,   0,  6.00,  180.00),
(4, 25,  10,   0,  5.00,   50.00),
-- OC-005 → Vencedor (pinturas) — enviada
(5, 21,  20,   0, 85.00, 1700.00),   -- nota: subtotal total ajustado a proporción
(5, 23,  15,   0, 18.00,  270.00),
(5, 24,  20,   0,  8.00,  160.00),
-- OC-006 → Ferromax — borrador
(6, 19,   2,   0, 180.00,  360.00),
(6, 20,   2,   0, 120.00,  240.00),
(6, 29,  10,   0,  22.00,  220.00);


-- ============================================================
-- 22. RECEPCIONES (solo para órdenes recibidas: 1, 2, 3)
-- ============================================================
INSERT INTO recepciones (id_orden, id_almacen, id_empleado, fecha, numero_guia, observacion) VALUES
(1, 1, 3, '2026-04-22 14:00:00', 'GR-IND-0041', 'Recibido completo, sin observaciones'),
(2, 1, 3, '2026-04-29 11:30:00', 'GR-BTI-0088', 'Recibido completo'),
(3, 1, 8, '2026-05-10 15:00:00', 'GR-ETN-0210', 'Todo en orden');
-- IDs: 1, 2, 3


-- ============================================================
-- 23. DETALLE RECEPCIONES
-- ============================================================
INSERT INTO detalle_recepcion (id_recepcion, id_producto, cantidad_recibida,
    precio_unitario, numero_lote, fecha_vencimiento) VALUES
-- Recepción 1 (OC-001 / Indeco / cables)
(1,  1, 200, 1.80,  NULL, NULL),
(1,  2, 100, 2.50,  NULL, NULL),
(1,  3,  28, 8.50,  NULL, NULL),
-- Recepción 2 (OC-002 / Bticino)
(2,  4,  60, 4.50,  NULL, NULL),
(2,  5,  40, 6.00,  NULL, NULL),
(2,  6,  48, 3.50,  NULL, NULL),
-- Recepción 3 (OC-003 / Eternit / tuberías)
(3,  8, 200, 1.20,  NULL, NULL),
(3,  9, 150, 1.80,  NULL, NULL),
(3, 10, 100, 2.50,  NULL, NULL),
(3, 11,  60, 8.00,  NULL, NULL);


-- ============================================================
-- 24. VENTAS (12 ventas en distintas fechas y estados)
-- Correlativo manual porque la serie empieza en 0
-- ============================================================
INSERT INTO ventas (id_cliente, id_empleado, id_serie, numero_comprobante, fecha,
    subtotal, igv, total, estado, observacion) VALUES
-- Mayo semana 1 (caja 1 - María)
(1,  2, 1, 'B001-00001', '2026-05-01 09:15:00',  42.37,  7.63,  50.00, 'pagada', NULL),
(3,  2, 2, 'F001-00001', '2026-05-01 10:30:00', 338.98, 61.02, 400.00, 'pagada', 'Compra para obra'),
(NULL,2, 3, 'NV01-00001', '2026-05-01 15:00:00',  16.95,  3.05,  20.00, 'pagada', NULL),
-- Mayo semana 2 (caja 2 - Sofía)
(2,  5, 1, 'B001-00002', '2026-05-08 09:00:00',  84.75, 15.25, 100.00, 'pagada', NULL),
(4,  5, 1, 'B001-00003', '2026-05-08 11:30:00',  59.32, 10.68,  70.00, 'pagada', NULL),
(9,  7, 2, 'F001-00002', '2026-05-08 14:00:00', 507.63, 91.37, 599.00, 'pagada', 'Pedido empresarial'),
-- Mayo semana 3 (caja 3 - María)
(6,  2, 1, 'B001-00004', '2026-05-15 10:00:00',  25.42,  4.58,  30.00, 'pagada', NULL),
(8,  2, 1, 'B001-00005', '2026-05-15 12:00:00', 169.49, 30.51, 200.00, 'pagada', NULL),
(5,  7, 2, 'F001-00003', '2026-05-15 16:00:00', 847.46,152.54,1000.00, 'pagada', 'Cliente frecuente'),
-- Mayo semana 4 (caja 4 - Sofía)
(11, 5, 1, 'B001-00006', '2026-05-22 09:30:00',  33.90,  6.10,  40.00, 'pagada', NULL),
(1,  5, 1, 'B001-00007', '2026-05-22 14:00:00',  59.32, 10.68,  70.00, 'anulada','Cliente solicitó anulación'),
-- Junio (caja 5 abierta - hoy)
(12, 2, 1, 'B001-00008', '2026-06-09 09:00:00',  76.27, 13.73,  90.00, 'pagada', NULL);
-- Actualizar correlativo de series
UPDATE serie_comprobantes SET correlativo_actual = 8 WHERE id_serie = 1; -- B001
UPDATE serie_comprobantes SET correlativo_actual = 3 WHERE id_serie = 2; -- F001
UPDATE serie_comprobantes SET correlativo_actual = 1 WHERE id_serie = 3; -- NV01
-- IDs ventas: 1-12


-- ============================================================
-- 25. DETALLE VENTAS
-- ============================================================
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES
-- Venta 1: B001-00001 (Roberto, S/50) — cables
(1,  1, 10,  2.50,  25.00),
(1,  6,  3,  7.00,  21.00),   -- 25+21=46 aprox (redondeado a subtotal sin IGV)
-- Venta 2: F001-00001 (Constructora Lima, S/400) — tubería + herramientas
(2,  8, 50,  2.00, 100.00),
(2,  9, 30,  2.80,  84.00),
(2, 15,  3, 32.00,  96.00),
(2, 16,  3, 22.00,  66.00),
-- Venta 3: NV01-00001 (anónimo, S/20) — pequeña venta
(3, 17,  1,  9.00,   9.00),
(3, 25,  1,  9.00,   9.00),
-- Venta 4: B001-00002 (Carmen, S/100) — pintura
(4, 21,  1,140.00, 140.00),  -- 1 galón pintura (precio con IGV incluido)
-- Venta 5: B001-00003 (Jorge, S/70) — interruptores y tornillos
(5,  6,  5,  7.00,  35.00),
(5,  7,  3, 10.50,  31.50),
-- Venta 6: F001-00002 (Obras & Más, S/599) — materiales obra grande
(6,  8, 80,  2.00, 160.00),
(6,  9, 50,  2.80, 140.00),
(6, 10, 30,  3.80, 114.00),
(6, 11, 10, 14.00, 140.00),
-- Venta 7: B001-00004 (Lucía, S/30) — pintura esmalte
(7, 23,  1, 30.00,  30.00),
-- Venta 8: B001-00005 (Miguel, S/200) — taladro
(8, 19,  1,299.00, 299.00),
-- Venta 9: F001-00003 (Ferremax, S/1000) — compra grande mixta
(9,  1, 50,  2.50, 125.00),
(9,  2, 30,  3.50, 105.00),
(9,  4, 20,  8.50, 170.00),
(9,  5, 15, 11.00, 165.00),
(9, 15,  5, 32.00, 160.00),
-- Venta 10: B001-00006 (Raúl, S/40) — tornillos y clavos
(10, 25, 2,  9.00,  18.00),
(10, 27, 2,  8.00,  16.00),
-- Venta 11: B001-00007 anulada (Roberto) — no descontar stock
(11,  6, 5,  7.00,  35.00),
(11, 17, 3,  9.00,  27.00),
-- Venta 12: B001-00008 (Elena, S/90) — casco + guantes + interruptor
(12, 29, 1, 38.00,  38.00),
(12, 30, 2, 15.00,  30.00),
(12,  6, 1,  7.00,   7.00);


-- ============================================================
-- 26. PAGOS DE VENTAS
-- ============================================================
INSERT INTO pagos_venta (id_venta, id_tipo_pago, monto, numero_operacion, fecha) VALUES
-- Venta 1 — efectivo
(1,  1,  50.00, NULL,          '2026-05-01 09:15:00'),
-- Venta 2 — transferencia bancaria
(2,  5, 400.00, 'TRF-0501001', '2026-05-01 10:30:00'),
-- Venta 3 — efectivo
(3,  1,  20.00, NULL,          '2026-05-01 15:00:00'),
-- Venta 4 — Yape
(4,  3, 100.00, 'YAP-0508001', '2026-05-08 09:00:00'),
-- Venta 5 — efectivo
(5,  1,  70.00, NULL,          '2026-05-08 11:30:00'),
-- Venta 6 — pago mixto: tarjeta + transferencia
(6,  2, 300.00, 'TAR-0508001', '2026-05-08 14:00:00'),
(6,  5, 299.00, 'TRF-0508001', '2026-05-08 14:00:00'),
-- Venta 7 — Plin
(7,  4,  30.00, 'PLN-0515001', '2026-05-15 10:00:00'),
-- Venta 8 — tarjeta
(8,  2, 200.00, 'TAR-0515001', '2026-05-15 12:00:00'),
-- Venta 9 — transferencia
(9,  5,1000.00, 'TRF-0515001', '2026-05-15 16:00:00'),
-- Venta 10 — efectivo
(10, 1,  40.00, NULL,          '2026-05-22 09:30:00'),
-- Venta 11 — anulada, igual registra el pago original
(11, 1,  70.00, NULL,          '2026-05-22 14:00:00'),
-- Venta 12 — Yape
(12, 3,  90.00, 'YAP-0609001', '2026-06-09 09:00:00');


-- ============================================================
-- 27. MOVIMIENTOS DE CAJA
-- ============================================================
INSERT INTO movimientos_caja (id_caja, id_usuario, tipo, concepto, referencia_id, monto, registrado_en) VALUES
-- Caja 1 (María / 01-mayo)
(1, 4, 'ingreso', 'Venta B001-00001',  1,  50.00, '2026-05-01 09:15:00'),
(1, 4, 'ingreso', 'Venta F001-00001',  2, 400.00, '2026-05-01 10:30:00'),
(1, 4, 'ingreso', 'Venta NV01-00001',  3,  20.00, '2026-05-01 15:00:00'),
(1, 4, 'egreso',  'Pago flete proveedor Indeco', NULL, 30.00, '2026-05-01 16:00:00'),
-- Caja 2 (Sofía / 08-mayo)
(2, 6, 'ingreso', 'Venta B001-00002',  4, 100.00, '2026-05-08 09:00:00'),
(2, 6, 'ingreso', 'Venta B001-00003',  5,  70.00, '2026-05-08 11:30:00'),
(2, 6, 'ingreso', 'Venta F001-00002',  6, 599.00, '2026-05-08 14:00:00'),
(2, 6, 'egreso',  'Compra útiles de oficina', NULL, 25.00, '2026-05-08 17:00:00'),
-- Caja 3 (María / 15-mayo)
(3, 4, 'ingreso', 'Venta B001-00004',  7,  30.00, '2026-05-15 10:00:00'),
(3, 4, 'ingreso', 'Venta B001-00005',  8, 200.00, '2026-05-15 12:00:00'),
(3, 4, 'ingreso', 'Venta F001-00003',  9,1000.00, '2026-05-15 16:00:00'),
(3, 4, 'egreso',  'Pago servicio limpieza',  NULL, 80.00, '2026-05-15 17:30:00'),
-- Caja 4 (Sofía / 22-mayo)
(4, 6, 'ingreso', 'Venta B001-00006', 10,  40.00, '2026-05-22 09:30:00'),
(4, 6, 'ingreso', 'Venta B001-00007', 11,  70.00, '2026-05-22 14:00:00'),
(4, 6, 'egreso',  'Venta B001-00007 anulada - reembolso', 11, 70.00, '2026-05-22 14:30:00'),
-- Caja 5 (María / hoy - abierta)
(5, 4, 'ingreso', 'Venta B001-00008', 12,  90.00, '2026-06-09 09:00:00');


-- ============================================================
-- 28. DEVOLUCIONES (2 devoluciones: 1 procesada, 1 pendiente)
-- ============================================================
INSERT INTO devoluciones (id_venta, id_empleado, fecha, motivo, tipo, estado, monto_reembolso) VALUES
-- Devolución de venta 5 (Jorge compró interruptores, uno defectuoso)
(5,  2, '2026-05-10 10:00:00', 'Interruptor doble defectuoso, no enciende',   'reembolso', 'procesada', 10.50),
-- Devolución de venta 8 (Miguel, taladro con problema)
(8,  2, '2026-06-09 10:30:00', 'Taladro presenta falla en el mandril a los pocos días de uso', 'cambio', 'pendiente', 0.00);
-- IDs: 1, 2


-- ============================================================
-- 29. DETALLE DEVOLUCIONES
-- ============================================================
INSERT INTO detalle_devolucion (id_devolucion, id_producto, cantidad, reingresa_stock, precio_devuelto) VALUES
-- Devolución 1: 1 interruptor doble
(1, 7, 1, 1, 10.50),
-- Devolución 2: 1 taladro (cambio, reingresa para revisión)
(2, 19, 1, 1, 299.00);


-- ============================================================
-- 30. TRANSFERENCIA ENTRE ALMACENES
-- ============================================================
INSERT INTO transferencias_almacen (id_almacen_origen, id_almacen_destino, id_empleado,
    fecha, fecha_completada, motivo, estado) VALUES
(1, 2, 3, '2026-05-05 10:00:00', '2026-05-05 14:00:00',
    'Reabastecimiento depósito secundario con stock sobrante', 'completada');
-- ID: 1

INSERT INTO detalle_transferencia (id_transferencia, id_producto, cantidad) VALUES
(1,  1,  50),   -- 50m cable THW 2.5mm
(1,  8, 100),   -- 100m tubería PVC 1/2"
(1, 25,  20),   -- 20 cajas tornillos
(1, 27,  20);   -- 20 bolsas clavos 2"


-- ============================================================
-- 31. KARDEX (movimientos de inventario trazables)
-- Cubre: recepciones + ventas pagadas + devolución procesada + transferencia
-- ============================================================
INSERT INTO kardex (id_producto, id_almacen, tipo_movimiento, motivo, referencia_id,
    referencia_tipo, cantidad, stock_anterior, stock_posterior, id_usuario, registrado_en) VALUES

-- ── Entradas por recepciones ──────────────────────────────
-- Recepción 1 (cables Indeco)
(1,  1, 'entrada', 'Recepción OC-2026-001', 1, 'recepcion', 200, 300, 500, 3, '2026-04-22 14:00:00'),
(2,  1, 'entrada', 'Recepción OC-2026-001', 1, 'recepcion', 100, 200, 300, 3, '2026-04-22 14:00:00'),
(3,  1, 'entrada', 'Recepción OC-2026-001', 1, 'recepcion',  28,  52,  80, 3, '2026-04-22 14:00:00'),
-- Recepción 2 (Bticino)
(4,  1, 'entrada', 'Recepción OC-2026-002', 2, 'recepcion',  60,  90, 150, 3, '2026-04-29 11:30:00'),
(5,  1, 'entrada', 'Recepción OC-2026-002', 2, 'recepcion',  40,  60, 100, 3, '2026-04-29 11:30:00'),
(6,  1, 'entrada', 'Recepción OC-2026-002', 2, 'recepcion',  48, 152, 200, 3, '2026-04-29 11:30:00'),
-- Recepción 3 (Eternit / tuberías)
(8,  1, 'entrada', 'Recepción OC-2026-003', 3, 'recepcion', 200, 200, 400, 8, '2026-05-10 15:00:00'),
(9,  1, 'entrada', 'Recepción OC-2026-003', 3, 'recepcion', 150, 150, 300, 8, '2026-05-10 15:00:00'),
(10, 1, 'entrada', 'Recepción OC-2026-003', 3, 'recepcion', 100, 100, 200, 8, '2026-05-10 15:00:00'),
(11, 1, 'entrada', 'Recepción OC-2026-003', 3, 'recepcion',  60,  20,  80, 8, '2026-05-10 15:00:00'),

-- ── Salidas por ventas pagadas ────────────────────────────
-- Venta 1
(1,  1, 'salida', 'Venta B001-00001',  1, 'venta',  10, 500, 490, 2, '2026-05-01 09:15:00'),
(6,  1, 'salida', 'Venta B001-00001',  1, 'venta',   3, 200, 197, 2, '2026-05-01 09:15:00'),
-- Venta 2
(8,  1, 'salida', 'Venta F001-00001',  2, 'venta',  50, 400, 350, 2, '2026-05-01 10:30:00'),
(9,  1, 'salida', 'Venta F001-00001',  2, 'venta',  30, 300, 270, 2, '2026-05-01 10:30:00'),
(15, 1, 'salida', 'Venta F001-00001',  2, 'venta',   3,  50,  47, 2, '2026-05-01 10:30:00'),
(16, 1, 'salida', 'Venta F001-00001',  2, 'venta',   3,  60,  57, 2, '2026-05-01 10:30:00'),
-- Venta 3
(17, 1, 'salida', 'Venta NV01-00001',  3, 'venta',   1,  80,  79, 2, '2026-05-01 15:00:00'),
(25, 1, 'salida', 'Venta NV01-00001',  3, 'venta',   1, 100,  99, 2, '2026-05-01 15:00:00'),
-- Venta 4
(21, 1, 'salida', 'Venta B001-00002',  4, 'venta',   1,  40,  39, 5, '2026-05-08 09:00:00'),
-- Venta 5
(6,  1, 'salida', 'Venta B001-00003',  5, 'venta',   5, 197, 192, 5, '2026-05-08 11:30:00'),
(7,  1, 'salida', 'Venta B001-00003',  5, 'venta',   3, 120, 117, 5, '2026-05-08 11:30:00'),
-- Venta 6
(8,  1, 'salida', 'Venta F001-00002',  6, 'venta',  80, 350, 270, 7, '2026-05-08 14:00:00'),
(9,  1, 'salida', 'Venta F001-00002',  6, 'venta',  50, 270, 220, 7, '2026-05-08 14:00:00'),
(10, 1, 'salida', 'Venta F001-00002',  6, 'venta',  30, 200, 170, 7, '2026-05-08 14:00:00'),
(11, 1, 'salida', 'Venta F001-00002',  6, 'venta',  10,  80,  70, 7, '2026-05-08 14:00:00'),
-- Venta 7
(23, 1, 'salida', 'Venta B001-00004',  7, 'venta',   1,  50,  49, 2, '2026-05-15 10:00:00'),
-- Venta 8
(19, 1, 'salida', 'Venta B001-00005',  8, 'venta',   1,  15,  14, 2, '2026-05-15 12:00:00'),
-- Venta 9
(1,  1, 'salida', 'Venta F001-00003',  9, 'venta',  50, 490, 440, 7, '2026-05-15 16:00:00'),
(2,  1, 'salida', 'Venta F001-00003',  9, 'venta',  30, 300, 270, 7, '2026-05-15 16:00:00'),
(4,  1, 'salida', 'Venta F001-00003',  9, 'venta',  20, 150, 130, 7, '2026-05-15 16:00:00'),
(5,  1, 'salida', 'Venta F001-00003',  9, 'venta',  15, 100,  85, 7, '2026-05-15 16:00:00'),
(15, 1, 'salida', 'Venta F001-00003',  9, 'venta',   5,  47,  42, 7, '2026-05-15 16:00:00'),
-- Venta 10
(25, 1, 'salida', 'Venta B001-00006', 10, 'venta',   2,  99,  97, 5, '2026-05-22 09:30:00'),
(27, 1, 'salida', 'Venta B001-00006', 10, 'venta',   2, 120, 118, 5, '2026-05-22 09:30:00'),
-- Venta 12
(29, 1, 'salida', 'Venta B001-00008', 12, 'venta',   1,  30,  29, 2, '2026-06-09 09:00:00'),
(30, 1, 'salida', 'Venta B001-00008', 12, 'venta',   2,  60,  58, 2, '2026-06-09 09:00:00'),
(6,  1, 'salida', 'Venta B001-00008', 12, 'venta',   1, 192, 191, 2, '2026-06-09 09:00:00'),

-- ── Entrada por devolución procesada ─────────────────────
(7,  1, 'entrada', 'Devolución DEV-00001', 1, 'devolucion', 1, 117, 118, 2, '2026-05-10 10:00:00'),

-- ── Transferencia almacén 1 → 2 ──────────────────────────
(1,  1, 'transferencia', 'Transferencia a Depósito Secundario', 1, 'transferencia',  50, 440, 390, 3, '2026-05-05 14:00:00'),
(1,  2, 'transferencia', 'Recepción desde Almacén Principal',   1, 'transferencia',  50,   0,  50, 3, '2026-05-05 14:00:00'),
(8,  1, 'transferencia', 'Transferencia a Depósito Secundario', 1, 'transferencia', 100, 270, 170, 3, '2026-05-05 14:00:00'),
(8,  2, 'transferencia', 'Recepción desde Almacén Principal',   1, 'transferencia', 100,   0, 100, 3, '2026-05-05 14:00:00'),
(25, 1, 'transferencia', 'Transferencia a Depósito Secundario', 1, 'transferencia',  20,  97,  77, 3, '2026-05-05 14:00:00'),
(25, 2, 'transferencia', 'Recepción desde Almacén Principal',   1, 'transferencia',  20,   0,  20, 3, '2026-05-05 14:00:00'),
(27, 1, 'transferencia', 'Transferencia a Depósito Secundario', 1, 'transferencia',  20, 118,  98, 3, '2026-05-05 14:00:00'),
(27, 2, 'transferencia', 'Recepción desde Almacén Principal',   1, 'transferencia',  20,   0,  20, 3, '2026-05-05 14:00:00');

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
-- RESUMEN DE LO INSERTADO:
--   Cajas:            5  (4 cerradas, 1 abierta)
--   Órdenes compra:   6  (2 recibidas, 2 enviadas, 1 borrador) -- corregido arriba son 3 recibidas
--   Recepciones:      3
--   Ventas:          12  (10 pagadas, 1 anulada, 1 pagada hoy)
--   Devoluciones:     2  (1 procesada, 1 pendiente)
--   Transferencias:   1  (completada)
--   Movimientos caja: 16
--   Kardex:          52  registros
-- ============================================================