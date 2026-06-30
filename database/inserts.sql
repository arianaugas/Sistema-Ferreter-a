-- ==========================================================
--  INSERTS COMPLETOS v2 - SISTEMA FERRETERÍA EL TORNILLO
--  100 productos · imágenes Cloudinary mapeadas a archivos
--  reales · categorías/subcategorías alineadas con carpetas
-- ==========================================================

-- 1. CONFIGURACIÓN -----------------------------------------
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('empresa_nombre', 'Ferretería El Tornillo SAC', 'Nombre comercial del negocio'),
('empresa_ruc', '20601234567', 'RUC de la empresa'),
('empresa_direccion','Av. Industrial 1245, Trujillo', 'Dirección principal'),
('empresa_telefono', '044-234567', 'Teléfono de contacto'),
('empresa_correo', 'ventas@eltornillo.com.pe', 'Correo de contacto'),
('igv_porcentaje', '18', 'Porcentaje de IGV vigente'),
('moneda', 'PEN', 'Moneda del sistema'),
('stock_alerta', '10', 'Umbral para alerta de stock bajo'),
('logo_url', 'https://res.cloudinary.com/ferreteria/image/upload/v1/config/logo.png', 'URL del logo del negocio');

-- 2. TURNOS ------------------------------------------------
INSERT INTO turnos (nombre, hora_inicio, hora_fin, activo) VALUES
('Turno Mañana', '07:00:00', '15:00:00', 1), -- id 1
('Turno Tarde', '15:00:00', '23:00:00', 1), -- id 2
('Turno Nocturno', '23:00:00', '07:00:00', 1); -- id 3

-- 3. CARGOS ------------------------------------------------
INSERT INTO cargos (nombre, activo) VALUES
('Administrador', 1), -- id 1
('Vendedor', 1), -- id 2
('Almacenero', 1), -- id 3
('Cajero', 1), -- id 4
('Supervisor', 1), -- id 5
('Asistente de Compras', 1); -- id 6

-- 4. ROLES -------------------------------------------------
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso total al sistema'), -- id 1
('Vendedor', 'Puede registrar ventas y consultar productos'), -- id 2
('Almacenero', 'Gestiona inventario y recepciones'), -- id 3
('Cajero', 'Gestiona caja y cobros'), -- id 4
('Supervisor', 'Acceso de supervisión sin modificar configuración');   -- id 5

-- 5. EMPLEADOS ---------------------------------------------
INSERT INTO empleados (id_cargo, id_turno, dni, nombre, apellido, telefono, correo, fecha_ingreso, activo) VALUES
(1, 1, '12345678', 'Ana', 'García Soto', '987654321', 'ana.garcia@eltornillo.com.pe', '2022-01-10', 1), -- id 1
(2, 1, '23456789', 'Luis', 'Ramírez Pérez', '976543210', 'luis.ramirez@eltornillo.com.pe', '2022-03-15', 1), -- id 2
(3, 1, '34567890', 'Carlos', 'Mendoza Ruiz', '965432109', 'carlos.mendoza@eltornillo.com.pe', '2022-06-01', 1), -- id 3
(4, 2, '45678901', 'María', 'Torres Vega', '954321098', 'maria.torres@eltornillo.com.pe', '2023-01-05', 1), -- id 4
(2, 1, '56789012', 'Pedro', 'Quispe Llanos', '943210987', 'pedro.quispe@eltornillo.com.pe', '2023-04-20', 1), -- id 5
(4, 2, '67890123', 'Sofía', 'Huanca Mamani', '932109876', 'sofia.huanca@eltornillo.com.pe', '2023-07-01', 1), -- id 6
(2, 1, '78901234', 'Diego', 'Flores Castillo', '921098765', 'diego.flores@eltornillo.com.pe', '2024-01-10', 1), -- id 7
(3, 2, '89012345', 'Valeria', 'Castro Díaz', '910987654', 'valeria.castro@eltornillo.com.pe', '2024-03-01', 1), -- id 8
(5, 1, '90123456', 'Roberto', 'Silva Paredes', '999111222', 'roberto.silva@eltornillo.com.pe',  '2021-08-15', 1), -- id 9
(6, 1, '01234567', 'Gisela', 'Núñez Alva', '988222333', 'gisela.nunez@eltornillo.com.pe', '2023-09-10', 1), -- id 10
(2, 2, '11223344', 'Kevin', 'Morales León', '977333444', 'kevin.morales@eltornillo.com.pe', '2024-02-01', 1), -- id 11
(3, 3, '22334455', 'Beatriz', 'Vargas Chávez', '966444555', 'beatriz.vargas@eltornillo.com.pe', '2024-05-15', 1); -- id 12

-- 6. USUARIOS (bcrypt) -------------------------------------
INSERT INTO usuarios (id_empleado, id_rol, username, contrasena, activo) VALUES
(1,  1, 'ana.admin', '$2b$10$lZlGueq.dbr5.qBGUny4wOL1PCOHVD3v3MotDeqD1y52JnAa9K6p.', 1), -- admin123
(2,  2, 'luis.vend', '$2b$10$oClJs9PLxbtinMqF9LgHrOTlHbucNOGAulkXCZi92Ffx3P.DDkRwS', 1), -- LuisVend123
(3,  3, 'carlos.alm', '$2b$10$xna/E49lqBQOakqLbO3mju4XJbtV63R8o8JUPQvaVarKUZDUAQF7u', 1), -- carlos123
(4,  4, 'maria.caj', '$2b$10$O28qtTOgzll8FStdaLOPyOdRTPR0hmM9fmx9JX4JmzvuTb/Qq0nXK', 1), -- maria123
(5,  2, 'pedro.vend', '$2b$10$Gy2AOFDSRKKRJjZrqxCQC.8.D4dX1odxBHTXid0Q/JPtumgTlbaki', 1), -- pedro123
(6,  4, 'sofia.caj', '$2b$10$izfZXU2PKS3CGKsUddz6he1smmH5Q5qH0NrO.scInAkbt//WpR/tO', 1), -- sofsof123
(7,  2, 'diego.vend', '$2b$10$mBLPJJs/vFQvD8MOhEyVkuV2P.dXXGeXOuqnRuoOLw4qQuJlozAVW', 1), -- diego123
(8,  3, 'valeria.alm', '$2b$10$5gPVWa4hkhJfq91WKh/KRul/gFP4EDyH9aum/yD1JriusIeMMcj9W', 1), -- vale1234
(9,  5, 'roberto.sup', '$2b$10$n/IIOnWSpXpee5ixyUGkx.7xELL7mp/h8QWr95CIS/0WFjiG3SAfi', 1), -- robert123
(10, 2, 'gisela.comp', '$2b$10$LWgpninW46xcceB7UTx9wO4JgH7.uDt4svuafwx34xc1miPEKSVVK', 1), -- gisel123
(11, 2, 'kevin.vend', '$2b$10$ugO1ZSC7JqMg9RCa5lZGI.OfKvz.t/C2oHMmKVXFvAwchGhvy6kXO', 1), -- kevin123
(12, 3, 'beatriz.alm', '$2b$10$c5gwRX0kHn0WCv.mJc1i6eEvjv.xgySY8Dsm817vZoYl35oTdoiw2', 1); -- bea12345

-- 7. MÓDULOS -----------------------------------------------
INSERT INTO modulos (nombre, ruta, descripcion) VALUES
('Productos', '/productos', 'Catálogo de productos, categorías, marcas y unidades'), -- id 1
('Clientes', '/clientes', 'Gestión de clientes'), -- id 2
('Proveedores', '/proveedores', 'Gestión de proveedores'), -- id 3
('Compras', '/compras', 'Órdenes de compra y recepciones'), -- id 4
('Inventario', '/inventario', 'Stock, kardex, almacenes y transferencias'), -- id 5
('Ventas', '/ventas', 'Registro de ventas'), -- id 6
('Caja', '/caja', 'Apertura, movimientos y cierre de caja'), -- id 7
('Devoluciones', '/devoluciones', 'Cambios y reembolsos'), -- id 8
('Empleados', '/empleados', 'Gestión de empleados y cargos'), -- id 9
('Usuarios', '/usuarios', 'Cuentas de acceso y roles'), -- id 10
('Reportes', '/reportes', 'Reportes y estadísticas'), -- id 11
('Configuración y Auditoría', '/configuracion-auditoria', 'Configuración del sistema, turnos y auditoría');      -- id 12

-- 8. PERMISOS POR ROL --------------------------------------
-- Administrador (1): acceso total
INSERT INTO permisos_rol (id_rol, id_modulo, tiene_acceso) VALUES
(1,1,1),(1,2,1),(1,3,1),(1,4,1),(1,5,1),(1,6,1),
(1,7,1),(1,8,1),(1,9,1),(1,10,1),(1,11,1),(1,12,1);
-- Supervisor (5): todo menos Usuarios(10) y Configuración(12)
INSERT INTO permisos_rol (id_rol, id_modulo, tiene_acceso) VALUES
(5,1,1),(5,2,1),(5,3,1),(5,4,1),(5,5,1),(5,6,1),
(5,7,1),(5,8,1),(5,9,1),(5,10,0),(5,11,1),(5,12,0);
-- Vendedor (2): Productos, Clientes, Ventas, Devoluciones
INSERT INTO permisos_rol (id_rol, id_modulo, tiene_acceso) VALUES
(2,1,1),(2,2,1),(2,3,0),(2,4,0),(2,5,0),(2,6,1),
(2,7,0),(2,8,1),(2,9,0),(2,10,0),(2,11,0),(2,12,0);
-- Almacenero (3): Productos, Inventario, Compras
INSERT INTO permisos_rol (id_rol, id_modulo, tiene_acceso) VALUES
(3,1,1),(3,2,0),(3,3,1),(3,4,1),(3,5,1),(3,6,0),
(3,7,0),(3,8,0),(3,9,0),(3,10,0),(3,11,0),(3,12,0);
-- Cajero (4): Ventas, Caja, Clientes
INSERT INTO permisos_rol (id_rol, id_modulo, tiene_acceso) VALUES
(4,1,0),(4,2,1),(4,3,0),(4,4,0),(4,5,0),(4,6,1),
(4,7,1),(4,8,1),(4,9,0),(4,10,0),(4,11,0),(4,12,0);

-- 9. CLIENTES ----------------------------------------------
INSERT INTO clientes (tipo_documento, numero_documento, nombre, telefono, correo, activo) VALUES
('DNI', '48291037', 'Marco Antonio Reyes Burgos', '956123456',  'marco.reyes@gmail.com',       1), -- id 1
('DNI', '71038294', 'Elena Quispe Sánchez', '967234567',  'elena.quispe@hotmail.com', 1), -- id 2
('RUC', '20456789123', 'Constructora Pérez & Hijos SAC',  '044-391234', 'compras@perezhijos.com.pe',   1), -- id 3
('DNI', '60294817', 'Jorge Villanueva Chávez', '978345678',  'j.villanueva@gmail.com', 1), -- id 4
('RUC', '20578234901', 'Inmobiliaria Los Pinos EIRL', '044-456123', 'lospinos@hotmail.com',        1), -- id 5
('DNI', '52837461', 'Patricia Luna Soto', '989456789',  'patricia.luna@yahoo.com', 1), -- id 6
('CE',  'CE-1234567', 'Roberto Fernández Silva', '944567890',  'rfernandez@outlook.com',      1), -- id 7
('DNI', '38402956', 'Hugo Salinas Vargas', '933678901',  'h.salinas@gmail.com', 1), -- id 8
('RUC', '20612345678', 'Ferretería Norte SAC', '044-512345', 'admin@ferreteria-norte.com',  1), -- id 9
('DNI', '44719283', 'Carmen Rosa Navarro Díaz', '922789012',  'carmen.navarro@gmail.com', 1), -- id 10
('DNI', '83019274', 'Andrés Cabrera León', '911890123', 'andres.cabrera@gmail.com', 1), -- id 11
('RUC', '20734567890', 'Taller Mecánico El Perno SRL', '044-623456', 'elperno@gmail.com', 1), -- id 12
('DNI', '57384920', 'Lucía Mendoza Alva', '999001122', 'lucia.mendoza@gmail.com', 1), -- id 13
('DNI', '29103847', 'Óscar Ramos Paredes', '988002233', 'oscar.ramos@hotmail.com', 1), -- id 14
('RUC', '20890123456', 'Empresa Constructora Trujillo SA','044-734567', 'contacto@ectrujillo.pe',      1); -- id 15

-- 10. CATEGORÍAS -------------------------------------------
-- (8 categorías, descripciones alineadas con las carpetas de imágenes)
INSERT INTO categorias (nombre, descripcion, activo) VALUES
('Herramientas Manuales', 'Martillos, llaves, alicates, sierras manuales, winchas y más', 1), -- id 1
('Herramientas Eléctricas', 'Taladros, amoladoras, sierras eléctricas, rotomartillos y accesorios',1), -- id 2
('Materiales de Construcción','Cemento, varillas de acero, mallas, mortero y accesorios metálicos', 1), -- id 3
('Plomería y Gasfitería', 'Tuberías PVC, válvulas, accesorios de unión y adhesivos', 1), -- id 4
('Electricidad e Iluminación','Cables, accesorios eléctricos, tomacorrientes, focos LED y pilas', 1), -- id 5
('Pinturas y Acabados', 'Pinturas, esmaltes, selladores, disolventes y herramientas de pintura',1), -- id 6
('Fijaciones y Tornillería', 'Pernos, clavos, tornillos, remaches, anclajes y tarugos', 1), -- id 7
('Seguridad Industrial', 'EPP: cascos de seguridad, guantes y conos de señalización', 1); -- id 8

-- 11. SUBCATEGORÍAS ----------------------------------------
-- Conteo: 6+6+3+4+6+5+4+3 = 37 subcategorías
INSERT INTO subcategorias (id_categoria, nombre, descripcion, activo) VALUES
-- Herramientas Manuales (cat 1) → subcategorías 1-6
(1, 'Martillos y Mazos', 'Martillos de carpintero, demoledor, bola y mazos de goma', 1), -- id 1
(1, 'Llaves y Alicates', 'Llaves combinadas, inglesas, coronas, alicates y pinzas', 1), -- id 2
(1, 'Destornilladores', 'Sets de destornilladores planos, estrella y de impacto', 1), -- id 3
(1, 'Serruchos y Cortadores', 'Sierras manuales, cutter, tijeras hojalatera y cinceles', 1), -- id 4
(1, 'Medición y Trazado', 'Winchas, niveles de burbuja y escuadras metálicas', 1), -- id 5
(1, 'Herramientas de Madera', 'Formones, limas y remachadoras manuales', 1), -- id 6
-- Herramientas Eléctricas (cat 2) → subcategorías 7-12
(2, 'Taladros', 'Taladros percutores, inalámbricos y de impacto', 1), -- id 7
(2, 'Amoladoras', 'Amoladoras angulares y esmeriles de banco', 1), -- id 8
(2, 'Sierras Eléctricas', 'Sierras circulares y caladoras eléctricas', 1), -- id 9
(2, 'Lijadoras', 'Lijadoras orbitales y de banda', 1), -- id 10
(2, 'Rotomartillos y Especiales','Rotomartillos SDS, pistolas de calor y de clavos', 1), -- id 11
(2, 'Accesorios para Herramientas','Brocas, discos de corte, mandriles, cargadores y cepillos', 1), -- id 12
-- Materiales de Construcción (cat 3) → subcategorías 13-15
(3, 'Cementos y Morteros', 'Cemento Portland Tipo I, mortero premezclado y estuco', 1), -- id 13
(3, 'Acero y Fierro', 'Varillas corrugadas, roscadas, mallas electrosoldadas y alambre',1), -- id 14
(3, 'Perfiles y Accesorios Metálicos','Esquineros y abrazaderas de acero galvanizado', 1), -- id 15
-- Plomería y Gasfitería (cat 4) → subcategorías 16-19
(4, 'Tuberías PVC', 'Tuberías PVC para agua fría y desagüe', 1), -- id 16
(4, 'Válvulas y Llaves de Paso','Válvulas esfera y compuerta de bronce', 1), -- id 17
(4, 'Accesorios de Unión PVC', 'Codos, tees y trampas PVC para agua y desagüe', 1), -- id 18
(4, 'Adhesivos de Plomería', 'Cinta teflón, pegamento PVC y accesorios de sellado', 1), -- id 19
-- Electricidad e Iluminación (cat 5) → subcategorías 20-25
(5, 'Cables y Conductores', 'Cable THW, mellizo SPT y extensiones eléctricas', 1), -- id 20
(5, 'Accesorios Eléctricos', 'Cajas octagonales, rectangulares, canaletas y tubos corrugados',1), -- id 21
(5, 'Tomacorrientes e Interruptores','Tomacorrientes dobles, interruptores simples, soquetes y timbres',1), -- id 22
(5, 'Iluminación LED', 'Focos LED y reflectores LED para interiores y exteriores', 1), -- id 23
(5, 'Protección Eléctrica', 'Cintas aislante y vulcanizante, probadores y llaves diferenciales',1), -- id 24
(5, 'Pilas y Baterías', 'Pilas alcalinas y recargables AA/AAA y cargadores', 1), -- id 25
-- Pinturas y Acabados (cat 6) → subcategorías 26-30
(6, 'Pinturas Látex', 'Pinturas de base acuosa mate y satinada para interior/exterior', 1), -- id 26
(6, 'Pinturas Esmalte', 'Esmaltes alkídicos al aceite para metal y madera', 1), -- id 27
(6, 'Selladores y Adhesivos', 'Selladores de poros, silicona, pegamento madera y epoxi', 1), -- id 28
(6, 'Disolventes', 'Thiner acrílico, aguarrás y diluyentes para pinturas', 1), -- id 29
(6, 'Herramientas de Pintura', 'Brochas, rodillos, bandejas, espátulas y lijas', 1), -- id 30
-- Fijaciones y Tornillería (cat 7) → subcategorías 31-34
(7, 'Pernos, Tuercas y Arandelas','Pernos hexagonales, tuercas y arandelas zincadas', 1), -- id 31
(7, 'Clavos y Grapas', 'Clavos para madera, concreto, calamina y clavo de concreto', 1), -- id 32
(7, 'Tornillos y Remaches', 'Tornillos autorroscantes, drywall y remaches de aluminio', 1), -- id 33
(7, 'Anclajes y Tarugos', 'Pernos de anclaje expansivo, tarugos Fischer y abrazaderas', 1), -- id 34
-- Seguridad Industrial (cat 8) → subcategorías 35-37
(8, 'Cascos y Lentes', 'Cascos de seguridad industrial clase E y lentes protectores', 1), -- id 35
(8, 'Guantes y Botas', 'Guantes de nitrilo, cuero y botas punta de acero', 1), -- id 36
(8, 'Señalización', 'Conos, cintas de peligro y letreros de seguridad', 1); -- id 37

-- 12. MARCAS -----------------------------------------------
INSERT INTO marcas (nombre, pais_origen, activo) VALUES
('Stanley',  'Estados Unidos', 1), -- id 1
('Bosch',    'Alemania',       1), -- id 2
('Makita',   'Japón',          1), -- id 3
('Truper',   'México', 1), -- id 4
('Sika',     'Suiza',          1), -- id 5
('3M',       'Estados Unidos', 1), -- id 6
('Forsage',  'Rusia',          1), -- id 7
('Dewalt',   'Estados Unidos', 1), -- id 8
('Nicoll',   'Francia',        1), -- id 9
('Tigre',    'Brasil',         1), -- id 10
('Indeco',   'Perú',           1), -- id 11
('Tekno',    'Perú',           1), -- id 12
('Cppq',     'Perú',           1), -- id 13
('Philips',  'Países Bajos',   1), -- id 14
('Bahco',    'Suecia',         1); -- id 15

-- 13. UNIDADES DE MEDIDA -----------------------------------
INSERT INTO unidades_medida (nombre, abreviatura, activo) VALUES
('Unidad',         'UND', 1), -- id 1
('Par',            'PAR', 1), -- id 2
('Bolsa',          'BOL', 1), -- id 3
('Saco',           'SAC', 1), -- id 4
('Rollo',          'ROL', 1), -- id 5
('Metro',          'MT',  1), -- id 6
('Metro cuadrado', 'M2',  1), -- id 7
('Litro',          'LT',  1), -- id 8
('Galón',          'GAL', 1), -- id 9
('Kilogramo',      'KG',  1), -- id 10
('Caja',           'CJA', 1), -- id 11
('Varilla',        'VAR', 1); -- id 12

-- 14. PRODUCTOS (100 en total) -----------------------------
INSERT INTO productos (id_subcategoria, id_marca, id_unidad, codigo, nombre, descripcion,
    precio_compra, precio_venta, stock_actual, stock_minimo, stock_maximo, ubicacion, tiene_lote, activo) VALUES

-- ── HERRAMIENTAS MANUALES ── (IDs 1-20) ──────────────────

-- Martillos y Mazos (sub 1) — 4 productos
(1, 1, 1,'HM-001','Martillo de carpintero 16oz Stanley',
 'Martillo de orejas 16oz, mango de fibra de vidrio, cabeza de acero forjado, anti-vibración',
 28.00, 45.00,  35, 10, 100,'A-01-01', 0, 1),                           -- id 1
(1, 4, 1,'HM-002','Mazo de goma Truper 2lb',
 'Mazo de goma 2lb para golpes sin daño en superficies delicadas, mango de madera dura',
 18.00, 30.00,  20,  5,  60,'A-01-02', 0, 1),                           -- id 2
(1, 1, 1,'HM-003','Martillo demoledor 4lb Stanley',
 'Martillo demoledor 4lb, mango anti-vibración fibra de vidrio, cabeza de acero templado',
 55.00, 89.00,  15,  5,  40,'A-01-01', 0, 1),                           -- id 3
(1, 4, 1,'HM-004','Martillo de bola 20oz Truper',
 'Martillo de bola 20oz con mango de fibra de vidrio, cabeza forjada de acero, doble uso',
 32.00, 52.00,  18,  5,  50,'A-01-01', 0, 1),                           -- id 4

-- Llaves y Alicates (sub 2) — 5 productos
(2, 7, 1,'LL-001','Set de llaves combinadas Forsage 8-22mm (12 piezas)',
 'Juego 12 llaves combinadas cromo-vanadio en estuche de tela, bocas 8 a 22mm',
 85.00,140.00,  18,  5,  40,'A-02-01', 0, 1),                           -- id 5
(2, 1, 1,'LL-002','Alicate de corte diagonal Stanley 8"',
 'Alicate corte diagonal 8", mango bimaterial ergonómico, acero especial tratado al calor',
 22.00, 38.00,  30, 10,  80,'A-02-02', 0, 1),                           -- id 6
(2, 4, 1,'LL-003','Llave inglesa ajustable Truper 12"',
 'Llave ajustable 12 pulgadas, mandíbula cromada, capacidad hasta 35mm, mango ergonómico',
 32.00, 55.00,  25,  8,  60,'A-02-01', 0, 1),                           -- id 7
(2,15, 1,'LL-004','Alicate de punta Bahco 6"',
 'Alicate punta larga 6", acero cromo-vanadio, mango bicolor antideslizante, corte integrado',
 28.00, 46.00,  22,  8,  60,'A-02-02', 0, 1),                           -- id 8
(2, 7, 1,'LL-005','Llave corona 17mm Forsage',
 'Llave de corona doble offset 17mm, acero cromo-vanadio, acabado cromado satinado',
 18.00, 30.00,  28,  8,  70,'A-02-01', 0, 1),                           -- id 9

-- Destornilladores (sub 3) — 1 producto
(3, 1, 1,'DS-001','Set de destornilladores Stanley (6 piezas)',
 'Juego 6 destornilladores (3 planos + 3 estrella), mango trilobular antideslizante',
 35.00, 58.00,  22,  8,  60,'A-03-01', 0, 1),                           -- id 10

-- Serruchos y Cortadores (sub 4) — 5 productos
(4, 4, 1,'SC-001','Cincel puntero 3/4" Truper',
 'Cincel puntero 3/4" de acero templado, mango de hule para mayor agarre y protección',
 12.00, 20.00,  30, 10,  80,'A-04-01', 0, 1),                           -- id 11
(4, 1, 1,'SC-002','Cutter Stanley 18mm',
 'Cutter profesional 18mm, hoja retráctil de acero SK5, cuerpo metálico anti-caída',
 15.00, 25.00,  35, 10,  90,'A-04-02', 0, 1),                           -- id 12
(4, 4, 1,'SC-003','Sierra de arco Truper 12"',
 'Sierra de arco metálica 12", tensado rápido, compatible con hoja bi-metal o HSS',
 25.00, 42.00,  20,  5,  50,'A-04-03', 0, 1),                           -- id 13
(4, 1, 1,'SC-004','Tijera hojalatera Stanley 10"',
 'Tijera para corte de chapa, calamina y mallas metálicas, hoja de acero inoxidable 10"',
 32.00, 52.00,  15,  5,  40,'A-04-04', 0, 1),                           -- id 14
(4, 1, 1,'SC-005','Cincel pala 1" Stanley',
 'Cincel de pala 1" de acero templado para mampostería y demolición ligera, mango de goma',
 14.00, 23.00,  25,  8,  60,'A-04-01', 0, 1),                           -- id 15

-- Medición y Trazado (sub 5) — 3 productos
(5, 1, 1,'MT-001','Wincha 5m Stanley',
 'Cinta métrica retráctil 5m, bloqueo rápido, lámina con recubrimiento protector, clip cinturón',
 18.00, 30.00,  40, 12, 100,'A-05-01', 0, 1),                           -- id 16
(5, 1, 1,'MT-002','Nivel de burbuja 24" Stanley',
 'Nivel de burbuja 60cm, 3 viales (horizontal/vertical/45°), perfil de aluminio reforzado',
 42.00, 68.00,  18,  5,  45,'A-05-02', 0, 1),                           -- id 17
(5, 1, 1,'MT-003','Escuadra metálica 12" Stanley',
 'Escuadra de carpintero 12", acero inoxidable, ángulo recto 90° garantizado, regla marcada',
 25.00, 42.00,  20,  6,  50,'A-05-03', 0, 1),                           -- id 18

-- Herramientas de Madera (sub 6) — 2 productos
(6, 1, 1,'MD-001','Formón para madera 1" Stanley',
 'Formón 1" para carpintería, acero cromo-vanadio, mango bicolor con refuerzo metálico',
 28.00, 46.00,  18,  5,  45,'A-06-01', 0, 1),                           -- id 19
(6, 4, 1,'MD-002','Lima plana 10" Truper',
 'Lima plana bastarda 10" para metal y madera, acero al carbono templado, mango plástico',
 12.00, 20.00,  25,  8,  60,'A-06-02', 0, 1),                           -- id 20

-- ── HERRAMIENTAS ELÉCTRICAS ── (IDs 21-40) ───────────────

-- Taladros (sub 7) — 3 productos
(7, 2, 1,'TE-001','Taladro percutor Bosch 550W',
 'Taladro percutor 550W, 2800rpm, chuck 13mm, maletín incluido, ideal concreto y madera',
210.00,350.00,  10,  3,  25,'B-01-01', 0, 1),                           -- id 21
(7, 3, 1,'TE-002','Taladro inalámbrico Makita 18V',
 'Taladro atornillador a batería 18V Li-Ion, 2 velocidades, 13 pares de torsión (sin batería)',
280.00,480.00,   8,  2,  20,'B-01-02', 0, 1),                           -- id 22
(7, 8, 1,'TE-003','Taladro percutor Dewalt 750W',
 'Taladro percutor 750W, velocidad variable 0-3000rpm, mango auxiliar incluido, 13mm',
245.00,420.00,   6,  2,  15,'B-01-01', 0, 1),                           -- id 23

-- Amoladoras (sub 8) — 3 productos
(8, 2, 1,'AM-001','Amoladora angular Bosch 4.5"',
 'Amoladora angular 4.5" 670W, protector regulable, botón de apagado de seguridad, 11000rpm',
175.00,290.00,  12,  3,  30,'B-02-01', 0, 1),                           -- id 24
(8, 3, 1,'AM-002','Amoladora angular Makita 4.5" 720W',
 'Amoladora angular 720W, disco 4.5", protector regulable, velocidad constante bajo carga',
195.00,320.00,   9,  3,  25,'B-02-01', 0, 1),                           -- id 25
(8, 4, 1,'AM-003','Esmeril de banco Truper 6" 1/3HP',
 'Esmeril de banco 1/3HP, dos muelas abrasivas 6" (grano 36 y 60), base metálica con tornillo',
145.00,240.00,   6,  2,  15,'B-02-02', 0, 1),                           -- id 26

-- Sierras Eléctricas (sub 9) — 2 productos
(9, 3, 1,'SE-001','Sierra circular Makita 7-1/4" 1200W',
 'Sierra circular 1200W, disco 7-1/4", profundidad corte 66mm, guía paralela y maletín',
320.00,520.00,   5,  2,  12,'B-03-01', 0, 1),                           -- id 27
(9, 2, 1,'SE-002','Sierra caladora Bosch 450W',
 'Sierra caladora 450W, 3100 carreras/min, soplador de viruta, agarre tipo D ergonómico',
185.00,300.00,   6,  2,  15,'B-03-02', 0, 1),                           -- id 28

-- Lijadoras (sub 10) — 1 producto
(10,3, 1,'LJ-001','Lijadora orbital Makita 200W',
 'Lijadora orbital 200W, 12000 opm, plato 93x185mm, bolsa recolectora de polvo incluida',
155.00,255.00,   6,  2,  15,'B-04-01', 0, 1),                           -- id 29

-- Rotomartillos y Especiales (sub 11) — 3 productos
(11,2, 1,'RT-001','Rotomartillo Bosch SDS-Plus 800W',
 'Rotomartillo SDS-Plus 800W, 3 funciones (perforación/cincelado/combinado), 2.7J, maletín',
420.00,680.00,   4,  1,  10,'B-05-01', 0, 1),                           -- id 30
(11,2, 1,'RT-002','Pistola de calor Bosch 1600W',
 'Pistola de calor 1600W, 2 temperaturas (300°C y 500°C), 2 boquillas incluidas',
168.00,275.00,   5,  2,  12,'B-05-02', 0, 1),                           -- id 31
(11,4, 1,'RT-003','Pistola neumática de clavos Truper 2"',
 'Pistola clavadora neumática para clavos 25-50mm, cuerpo aluminio ligero, 70-100psi',
225.00,370.00,   4,  1,  10,'B-05-03', 0, 1),                           -- id 32

-- Accesorios para Herramientas (sub 12) — 8 productos
(12,2, 1,'AC-001','Set de brocas para metal Bosch 1/8"-1/2" (13 piezas)',
 'Juego 13 brocas HSS para metal en estuche metálico, corte limpio, recubrimiento TIN',
 42.00, 68.00,  20,  6,  50,'B-06-01', 0, 1),                           -- id 33
(12,2, 1,'AC-002','Set de brocas para concreto Bosch 5-13mm (5 piezas)',
 'Kit 5 brocas SDS-Plus para concreto y mampostería, punta de carburo de tungsteno',
 55.00, 90.00,  18,  5,  45,'B-06-01', 0, 1),                           -- id 34
(12,2, 1,'AC-003','Broca copa bi-metal 32mm Bosch',
 'Broca copa bi-metal 32mm para madera, plástico y metal delgado, vástago hexagonal 1/4"',
 22.00, 36.00,  22,  6,  55,'B-06-02', 0, 1),                           -- id 35
(12,2, 1,'AC-004','Disco de corte para metal 4.5" Bosch (caja x25)',
 'Disco de corte para metal 4.5" x 1mm, caja 25 unidades, acero reforzado con fibra de vidrio',
 65.00,105.00,  15,  4,  35,'B-06-03', 0, 1),                           -- id 36
(12,2, 1,'AC-005','Disco diamantado para concreto 4.5" Bosch',
 'Disco diamantado segmentado para concreto 4.5", corte rápido y frío, núcleo de acero',
 35.00, 58.00,  18,  5,  45,'B-06-03', 0, 1),                           -- id 37
(12,2, 1,'AC-006','Disco para sierra de madera 7-1/4" Bosch',
 'Disco de sierra circular para madera 7-1/4", 24 dientes de widia, corte limpio y rápido',
 28.00, 46.00,  15,  5,  40,'B-06-03', 0, 1),                           -- id 38
(12,4, 1,'AC-007','Mandril portabrocas con llave 13mm Truper',
 'Mandril con llave para taladro 13mm, compatible husillos 1/2"-20UNF y 3/8"-24UNF',
 18.00, 30.00,  20,  6,  50,'B-06-04', 0, 1),                           -- id 39
(12,4, 1,'AC-008','Cepillo metálico copa 4" Truper',
 'Cepillo copa 4" para amoladora angular, alambre de acero ondulado, vástago 5/8"-11',
 12.00, 20.00,  25,  8,  60,'B-06-05', 0, 1),                           -- id 40

-- ── MATERIALES DE CONSTRUCCIÓN ── (IDs 41-49) ────────────

-- Cementos y Morteros (sub 13) — 2 productos
(13,13, 4,'CM-001','Cemento Portland Tipo I Pacasmayo 42.5kg',
 'Cemento Portland Tipo I uso general, saco 42.5kg, norma NTP 334.009, alta resistencia inicial',
 28.00, 38.00, 200, 50, 500,'C-01-01', 1, 1),                           -- id 41
(13, 5, 3,'CM-002','Mortero seco Sika Mix 25kg',
 'Mortero premezclado para asentado de ladrillos y tarrajeo, bolsa 25kg, resistencia 140kg/cm²',
 22.00, 32.00, 150, 30, 400,'C-01-02', 1, 1),                           -- id 42

-- Acero y Fierro (sub 14) — 5 productos
(14,NULL,12,'AF-001','Varilla corrugada 3/8" x 9m',
 'Varilla corrugada 3/8", barra 9m, fy=4200 kg/cm², norma NTP 341.031',
 32.00, 48.00, 300, 50, 600,'C-02-01', 0, 1),                           -- id 43
(14,NULL,12,'AF-002','Varilla corrugada 1/2" x 9m',
 'Varilla corrugada 1/2", barra 9m, fy=4200 kg/cm², norma NTP 341.031',
 55.00, 82.00, 200, 40, 500,'C-02-01', 0, 1),                           -- id 44
(14,NULL,10,'AF-003','Alambre negro N°16 (por kg)',
 'Alambre negro recocido calibre 16, venta por kilogramo, para amarre de estructuras de fierro',
  4.50,  8.00, 150, 30, 350,'C-02-02', 0, 1),                           -- id 45
(14,NULL, 7,'AF-004','Malla electrosoldada 15x15cm (plancha 2.4x6m)',
 'Malla electrosoldada de acero trefilado, cuadrado 15x15cm, varilla 6mm, plancha 2.4x6m',
 85.00,130.00,  60, 10, 150,'C-02-03', 0, 1),                           -- id 46
(14,NULL,12,'AF-005','Varilla roscada galvanizada 3/8"x1m',
 'Varilla roscada zincada 3/8" x 1 metro, para anclajes, tensores y montajes metálicos',
 12.00, 20.00,  80, 20, 200,'C-02-01', 0, 1),                           -- id 47

-- Perfiles y Accesorios Metálicos (sub 15) — 2 productos
(15,NULL, 1,'PM-001','Esquinero metálico galvanizado 2"x2" (caja x10)',
 'Esquinero de acero galvanizado 2x2 pulgadas para protección de bordes y columnas, caja x10',
 18.00, 30.00,  60, 15, 150,'C-03-01', 0, 1),                           -- id 48
(15,NULL, 1,'PM-002','Abrazadera metálica galvanizada 2" (caja x5)',
 'Abrazadera de acero galvanizado 2 pulgadas para sujeción de tuberías, caja x5 unidades',
  8.00, 14.00,  80, 20, 200,'C-03-02', 0, 1),                           -- id 49

-- ── PLOMERÍA Y GASFITERÍA ── (IDs 50-60) ─────────────────

-- Tuberías PVC (sub 16) — 4 productos
(16, 9, 6,'PV-001','Tubería PVC desagüe 2" x 3m Nicoll',
 'Tubo PVC desagüe clase pesada 2", longitud 3m, color gris, norma NTP 399.003',
  8.50, 14.00, 120, 30, 300,'D-01-01', 0, 1),                           -- id 50
(16,10, 6,'PV-002','Tubería PVC desagüe 4" x 3m Tigre',
 'Tubo PVC desagüe pesado 4", longitud 3m, alta resistencia química y mecánica',
 18.00, 28.00,  80, 20, 200,'D-01-02', 0, 1),                           -- id 51
(16, 9, 6,'PV-003','Tubería PVC agua fría 1/2" x 5m Nicoll',
 'Tubo PVC agua fría clase C-10, 1/2", longitud 5m, color blanco, PN=10bar',
 10.00, 16.00, 100, 25, 250,'D-01-01', 0, 1),                           -- id 52
(16, 9, 6,'PV-004','Tubería PVC agua fría 3/4" x 5m Nicoll',
 'Tubo PVC agua fría clase C-10, 3/4", longitud 5m, color blanco, PN=10bar',
 14.00, 22.00,  80, 20, 200,'D-01-01', 0, 1),                           -- id 53

-- Válvulas y Llaves de Paso (sub 17) — 2 productos
(17,NULL, 1,'VA-001','Válvula de paso esfera 1/2" bronce',
 'Válvula de esfera cromada agua fría y caliente 1/2", cuerpo bronce, rosca hembra-hembra',
 12.00, 20.00,  60, 15, 150,'D-02-01', 0, 1),                           -- id 54
(17,NULL, 1,'VA-002','Válvula compuerta bronce 3/4"', 
 'Válvula compuerta bronce fundido 3/4", rosca hembra BSP, presión máx 200psi',
 25.00, 40.00,  40, 10, 100,'D-02-01', 0, 1),                           -- id 55

-- Accesorios de Unión PVC (sub 18) — 3 productos
(18, 9, 1,'PU-001','Codo PVC 90° 1/2" agua Nicoll',
 'Codo 90° PVC agua fría 1/2", presión máx 10bar, color blanco, unión a soldar',
  1.80,  3.00, 200, 50, 500,'D-03-01', 0, 1),                           -- id 56
(18, 9, 1,'PU-002','Tee PVC 1/2" agua Nicoll',
 'Tee PVC agua fría 1/2", unión 3 ramales iguales, color blanco, a soldar, 10bar',
  2.50,  4.20, 180, 40, 450,'D-03-01', 0, 1),                           -- id 57
(18, 9, 1,'PU-003','Trampa PVC 2" para lavatorio',
 'Trampa sifónica PVC 2" para lavatorio de baño, sello hidráulico permanente anti-olores',
  8.00, 14.00,  60, 15, 150,'D-03-02', 0, 1),                           -- id 58

-- Adhesivos de Plomería (sub 19) — 2 productos
(19, 9, 1,'AD-001','Cinta teflón 1/2"x10m Nicoll',
 'Cinta PTFE 1/2" x 10m densidad media para sellado de roscas de plomería',
  1.50,  2.50, 300, 60, 600,'D-04-01', 0, 1),                           -- id 59
(19, 9, 8,'AD-002','Pegamento PVC 250ml Nicoll',
 'Cemento solvente para unión de tuberías y accesorios PVC, envase 250ml con pincel aplicador',
 12.00, 20.00,  80, 20, 200,'D-04-02', 0, 1),                           -- id 60

-- ── ELECTRICIDAD E ILUMINACIÓN ── (IDs 61-81) ────────────

-- Cables y Conductores (sub 20) — 5 productos
(20,11, 5,'CA-001','Cable THW 2.5mm² Indeco x100m',
 'Cable Cu TW-THW 2.5mm² negro, rollo 100m, 750V, temperatura máx 75°C, norma NTP 370.252',
 68.00,110.00,  50, 10, 100,'E-01-01', 1, 1),                           -- id 61
(20,11, 5,'CA-002','Cable THW 4mm² Indeco x100m',
 'Cable Cu TW-THW 4mm² negro, rollo 100m, 750V, temperatura máx 75°C, norma NTP 370.252',
105.00,168.00,  35,  8,  80,'E-01-01', 1, 1),                           -- id 62
(20,11, 5,'CA-003','Cable mellizo 2x1mm² Indeco x100m',
 'Cable mellizo paralelo 2x1mm² blanco para instalaciones domiciliarias, rollo 100m, 300V',
 52.00, 85.00,  40, 10,  90,'E-01-02', 1, 1),                           -- id 63
(20,11, 5,'CA-004','Cable THW 1.5mm² Indeco x100m',
 'Cable Cu TW-THW 1.5mm² negro, rollo 100m, 750V, para circuitos de iluminación',
 48.00, 78.00,  40, 10,  90,'E-01-01', 1, 1),                           -- id 64
(20,NULL,6,'CA-005','Extensión eléctrica 10m 3 tomacorrientes',
 'Extensión eléctrica 10m, 3 tomas dobles, cable NLT 2x1mm², corriente máx 10A, con tierra',
 22.00, 36.00,  30,  8,  70,'E-01-03', 0, 1),                           -- id 65

-- Accesorios Eléctricos (sub 21) — 4 productos
(21,NULL, 1,'AE-001','Caja octagonal galvanizada 4"',
 'Caja eléctrica octagonal galvanizada 4" para empalmes y salidas de iluminación empotradas',
  2.50,  4.20, 200, 50, 500,'E-02-01', 0, 1),                           -- id 66
(21,NULL, 1,'AE-002','Caja rectangular galvanizada 2"x4"',
 'Caja eléctrica rectangular galvanizada 2x4" para tomacorrientes e interruptores empotrados',
  2.00,  3.50, 200, 50, 500,'E-02-01', 0, 1),                           -- id 67
(21,NULL, 6,'AE-003','Canaleta plástica 20x10mm x2m',
 'Canaleta PVC blanca 20x10mm para cableado superficial, longitud 2m, autoadhesiva + tornillos',
  4.50,  7.50, 120, 30, 300,'E-02-02', 0, 1),                           -- id 68
(21,NULL, 5,'AE-004','Tubo corrugado flexible 3/4" (rollo x25m)',
 'Tubo corrugado flexible PVC 3/4" para conductos empotrados, rollo 25m, auto-extinguible',
 18.00, 30.00,  60, 15, 150,'E-02-03', 0, 1),                           -- id 69

-- Tomacorrientes e Interruptores (sub 22) — 4 productos
(22,NULL, 1,'TI-001','Tomacorriente doble con tierra empotrable',
 'Tomacorriente doble 10A/250V con puesta a tierra, color blanco, para empotrar en caja',
  5.50,  9.00, 150, 40, 400,'E-03-01', 0, 1),                           -- id 70
(22,NULL, 1,'TI-002','Interruptor simple empotrable',
 'Interruptor unipolar simple 10A/250V, color blanco, para empotrar, compatible con LED',
  4.50,  7.50, 150, 40, 400,'E-03-01', 0, 1),                           -- id 71
(22,NULL, 1,'TI-003','Soquete portalámparas E27',
 'Portalámparas baquelita blanca E27, 60W máx/250V, para empotrar o superficie, rosca estándar',
  2.50,  4.20, 120, 30, 300,'E-03-02', 0, 1),                           -- id 72
(22,NULL, 1,'TI-004','Timbre zumbador eléctrico 220V',
 'Timbre zumbador 220V, tono intermitente, caja plástica, fácil instalación, incluye tornillos',
  8.50, 14.00,  40, 10, 100,'E-03-03', 0, 1),                           -- id 73

-- Iluminación LED (sub 23) — 2 productos
(23,14, 1,'IL-001','Foco LED 9W Philips',
 'Lámpara LED 9W equiv. 60W, rosca E27, luz blanca fría 6500K, 806 lúmenes, vida 15000h',
  8.00, 13.00,  80, 20, 200,'E-04-01', 0, 1),                           -- id 74
(23,14, 1,'IL-002','Reflector LED 50W exterior Philips',
 'Reflector LED 50W para exteriores, IP65, 6500K, 4000 lúmenes, base ajustable, 50000h',
 42.00, 68.00,  30,  8,  75,'E-04-02', 0, 1),                           -- id 75

-- Protección Eléctrica (sub 24) — 4 productos
(24, 6, 5,'PE-001','Cinta aislante 3M 19mm x20m',
 'Cinta aislante PVC 19mm x 20m, resistente a aceites y humedad, negro, -18°C a 105°C',
  5.50,  9.00, 100, 25, 250,'E-05-01', 0, 1),                           -- id 76
(24, 6, 5,'PE-002','Cinta vulcanizante 3M 19mm x3m',
 'Cinta autofusionante EPDM 19mm x 3m para sellado resistente intemperie y agua, negro',
 12.00, 20.00,  60, 15, 150,'E-05-01', 0, 1),                           -- id 77
(24,NULL, 1,'PE-003','Probador de voltaje tipo lápiz',
 'Probador tensión AC tipo lápiz 70-250V, indicador luminoso y sonoro, clip de bolsillo',
  5.00,  8.50,  60, 15, 150,'E-05-02', 0, 1),                           -- id 78
(24,NULL, 1,'PE-004','Llave diferencial bipolar 25A',
 'Interruptor diferencial bipolar 25A/30mA para protección de personas, montaje riel DIN',
 55.00, 88.00,  20,  5,  50,'E-05-03', 0, 1),                           -- id 79

-- Pilas y Baterías (sub 25) — 2 productos
(25,NULL,11,'PB-001','Pilas alcalinas AA Duracell (caja x12)',
 'Pilas alcalinas AA 1.5V, caja 12 unidades, 10 años de vida en almacén, baja autodescarga',
 15.00, 25.00,  60, 15, 150,'E-06-01', 0, 1),                           -- id 80
(25, 3, 2,'PB-002','Pilas recargables AA Makita (4 unidades)',
 'Pilas recargables NiMH AA 1900mAh, pack x4, hasta 500 recargas, bajo autodescar carga',
 25.00, 42.00,  30,  8,  75,'E-06-01', 0, 1),                           -- id 81

-- ── PINTURAS Y ACABADOS ── (IDs 82-93) ───────────────────

-- Pinturas Látex (sub 26) — 1 producto
(26,12, 9,'PI-001','Pintura látex Tekno blanco mate 4gal',
 'Pintura látex mate lavable interior/exterior, blanco humo, lata 4 galones, alto rendimiento',
 72.00,115.00,  30,  8,  80,'F-01-01', 0, 1),                           -- id 82

-- Pinturas Esmalte (sub 27) — 1 producto
(27,12, 9,'PI-002','Esmalte Tekno negro brillante 1gal',
 'Esmalte alkídico al aceite acabado brillante negro para metal y madera, lata 1 galón',
 38.00, 62.00,  25,  6,  60,'F-01-02', 0, 1),                           -- id 83

-- Selladores y Adhesivos (sub 28) — 4 productos
(28, 5, 8,'PI-003','Sellador para pared Sika 1L',
 'Sellador transparente de poros para muros y techos, 1L, base agua, secado 2h',
 18.00, 30.00,  40, 10, 100,'F-02-01', 0, 1),                           -- id 84
(28, 5, 1,'PI-004','Silicona transparente Sika 280ml',
 'Silicona acética multiusos 280ml, transparente, resistente a la intemperie, secado 24h',
 15.00, 25.00,  50, 12, 120,'F-02-02', 0, 1),                           -- id 85
(28, 5, 1,'PI-005','Pegamento para madera Sika 250ml',
 'Adhesivo PVA para madera 250ml, interior, alta resistencia al corte, sin solventes',
  8.00, 14.00,  60, 15, 150,'F-02-03', 0, 1),                           -- id 86
(28, 5, 1,'PI-006','Pegamento epóxico Sika 50g',
 'Adhesivo epoxi bicomponente 50g para metal, piedra y concreto, fraguado en 5 minutos',
 12.00, 20.00,  40, 10, 100,'F-02-04', 0, 1),                           -- id 87

-- Disolventes (sub 29) — 1 producto
(29,12, 8,'DI-001','Thiner acrílico Tekno 1L',
 'Disolvente para pinturas acrílicas y poliuretano, envase 1L, evaporación media, baja toxicidad',
 10.00, 17.00,  50, 12, 120,'F-03-01', 0, 1),                           -- id 88

-- Herramientas de Pintura (sub 30) — 5 productos
(30, 4, 1,'HP-001','Brocha 2" Truper',
 'Brocha 2" cerdas nylon/poliéster mezcladas para pinturas látex y al aceite, mango plástico',
  5.50,  9.00,  60, 15, 150,'F-04-01', 0, 1),                           -- id 89
(30, 4, 1,'HP-002','Rodillo de felpa 9" Truper',
 'Rodillo de felpa 9" para pintura látex en paredes y cielos rasos, acabado liso, con eje',
  8.00, 14.00,  50, 12, 120,'F-04-02', 0, 1),                           -- id 90
(30, 4, 1,'HP-003','Espátula de acero 4" Truper',
 'Espátula de acero inoxidable 4" para masillas y pintura, mango de madera, flexible',
  5.00,  8.50,  50, 12, 120,'F-04-03', 0, 1),                           -- id 91
(30, 6, 1,'HP-004','Lija al agua grano 220 3M',
 'Lija al agua base papel grano 220 para madera y superficies lacadas, hoja 230x280mm',
  1.80,  3.00, 150, 40, 400,'F-04-04', 0, 1),                           -- id 92
(30, 6, 1,'HP-005','Lija de fierro grano 80 3M',
 'Lija abrasiva para metal grano 80 base tela, resistente al desgarro, hoja 230x280mm',
  2.00,  3.50, 120, 30, 300,'F-04-05', 0, 1),                           -- id 93

-- ── FIJACIONES Y TORNILLERÍA ── (IDs 94-97) ──────────────

-- Pernos, Tuercas y Arandelas (sub 31) — 1 producto
(31,NULL,11,'FI-001','Perno hexagonal 3/8"x2.5" zincado (caja x50)',
 'Perno hexagonal zincado 3/8"x2.5" con tuerca y arandela, caja x50 unidades',
 18.00, 30.00,  55, 10, 120,'G-01-01', 0, 1),                           -- id 94

-- Clavos y Grapas (sub 32) — 2 productos
(32,NULL,10,'FI-002','Clavo con cabeza 3" (por kg)',
 'Clavo con cabeza para madera 3 pulgadas, venta por kilogramo, acero brillante',
  5.00,  8.50, 100, 20, 250,'G-02-01', 0, 1),                           -- id 95
(32,NULL,10,'FI-003','Clavo para calamina 2.5" (por kg)',
 'Clavo para calamina/plancha metálica 2.5", con cabeza cuadrada ancha, venta por kg',
  5.50,  9.00,  80, 15, 200,'G-02-01', 0, 1),                           -- id 96

-- Anclajes y Tarugos (sub 34) — 1 producto
(34, NULL,11,'FI-004','Taco Fischer S8 (caja x100)',
 'Taco plástico Fisher S8 para concreto, ladrillo y mampostería, caja x100 unidades',
 22.00, 36.00,  45, 10, 100,'G-04-01', 0, 1),                           -- id 97

-- ── SEGURIDAD INDUSTRIAL ── (IDs 98-100) ─────────────────

-- Cascos y Lentes (sub 35) — 1 producto
(35, 6, 1,'SI-001','Casco de seguridad 3M blanco',
 'Casco seguridad industrial clase E, ABS de alta densidad, suspensión Fas-Trac III, 6 puntos',
 35.00, 58.00,  30,  8,  80,'H-01-01', 0, 1),                           -- id 98

-- Guantes y Botas (sub 36) — 1 producto
(36, 6, 2,'SI-002','Guantes de nitrilo 3M talla M',
 'Guantes nitrilo resistentes a químicos y corte leve, talla M, grip texturizado en palma',
 12.00, 20.00,  60, 15, 150,'H-02-01', 0, 1),                           -- id 99

-- Señalización (sub 37) — 1 producto
(37,NULL, 1,'SI-003','Cono de seguridad naranja 70cm',
 'Cono señalización vial naranja 70cm con franja reflectante plateada, base de goma',
 18.00, 30.00,  25,  5,  60,'H-03-01', 0, 1);                           -- id 100



-- ==========================================================
-- HABILITAR LOTES en cables Indeco (tienen fecha de fabricación)
-- ==========================================================
UPDATE productos SET tiene_lote = 1 WHERE codigo IN ('CA-001','CA-002','CA-003','CA-004');
UPDATE productos SET tiene_lote = 1 WHERE codigo IN ('CM-001','CM-002');

-- ==========================================================
-- 15. IMÁGENES DE PRODUCTOS
-- url_img guarda solo el NOMBRE del producto (sin URL real todavía,
-- pendiente de subir a Cloudinary/almacenamiento definitivo)
-- ==========================================================
INSERT INTO imagenes_producto (id_producto, url_img) VALUES
(1, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786418/productos/martillo.webp'),
(2, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786418/productos/martillo.webp'),
(3, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786418/productos/martillo.webp'),
(4, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786418/productos/martillo.webp'),
(5, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786420/productos/juegoDeLlabes.jpg'),
(6, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786421/productos/alicateDeCorte.webp'),
(7, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786422/productos/llaveFrancesa.jpg'),
(8, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786423/productos/alicateDePunta.png'),
(9, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786425/productos/llaveCorona.jpg'),
(10, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786427/productos/juegoDeDestornilladores.webp'),
(11, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786429/productos/cincelPuntero.jpg'),
(12, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786430/productos/cutter.jpg'),
(13, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786431/productos/sierraDeArco.jpg'),
(14, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786432/productos/tijeraHojalatera.webp'),
(15, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786429/productos/cincelPuntero.jpg'),
(16, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786435/productos/wincha.jpg'),
(17, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786437/productos/nivelBurbuja.jpg'),
(18, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786438/productos/escuadraMetalica.jpg'),
(19, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786439/productos/formoMadera.webp'),
(20, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786440/productos/lima.jpg'),
(21, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786442/productos/taladroInalambrico.webp'),
(22, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786442/productos/taladroInalambrico.webp'),
(23, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786442/productos/taladroInalambrico.webp'),
(24, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786444/productos/amoledoraAngular.webp'),
(25, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786444/productos/amoledoraAngular.webp'),
(26, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786445/productos/esmerilDeBanco.webp'),
(27, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786446/productos/sierraCircular.jpg'),
(28, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786447/productos/sierraCaladora.webp'),
(29, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786457/productos/lijadoraOrbital.jpg'),
(30, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786458/productos/rotomartillo.jpg'),
(31, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786459/productos/pistolaDeCalor.webp'),
(32, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786460/productos/pistolaDeClavos.webp'),
(33, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786462/productos/brocasMetal.webp'),
(34, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786462/productos/setBrocasConcreto.webp'),
(35, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786467/productos/brocaCopaMadera.webp'),
(36, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786477/productos/discoCorteMetal.webp'),
(37, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786479/productos/discoDiamantadoParaConcreto.webp'),
(38, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786485/productos/discoParaMadera.webp'),
(39, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786486/productos/mandrilLlaveTaladro.webp'),
(40, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786487/productos/cepilloDeMadera.jpg'),
(41, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786489/productos/varillaFierroCorrucado.webp'),
(42, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786489/productos/varillaFierroCorrucado.webp'),
(43, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786489/productos/varillaFierroCorrucado.webp'),
(44, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786489/productos/varillaFierroCorrucado.webp'),
(45, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786490/productos/alambreNegro.jpg'),
(46, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786492/productos/mallaElectrosoldad.jpg'),
(47, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786495/productos/varillaRoscada.jpg'),
(48, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786499/productos/esquineroMetalico.webp'),
(49, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786500/productos/abrazaderaMetalica.webp'),
(50, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786501/productos/tuboPvcDesague.jpg'),
(51, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786501/productos/tuboPvcDesague.jpg'),
(52, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786503/productos/TubosAguaPvc.jpg'),
(53, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786503/productos/TubosAguaPvc.jpg'),
(54, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786505/productos/valvulaDeBronce.webp'),
(55, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786505/productos/valvulaDeBronce.webp'),
(56, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786507/productos/codoPvcAgua.jpg'),
(57, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786509/productos/TPvcAgua.jpg'),
(58, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786510/productos/trampaPvcParaLavatorio.webp'),
(59, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786511/productos/cintaTeflon.jpg'),
(60, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786513/productos/pegamentoDePvc.webp'),
(61, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786513/productos/cableIndecoNegro.jpg'),
(62, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786515/productos/cableIndeco.webp'),
(63, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786515/productos/cableIndeco.webp'),
(64, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786513/productos/cableIndecoNegro.jpg'),
(65, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786516/productos/extencionElectrica.webp'),
(66, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786517/productos/cajaOctagonal.webp'),
(67, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786517/productos/cajaRectangular.jpg'),
(68, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786518/productos/canaletaPlastica.jpg'),
(69, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786519/productos/tuboCorrugado.jpg'),
(70, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786521/productos/tomacorrienteDobleConTierra.webp'),
(71, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786522/productos/interruptorCimpleEmpotrable.jpg'),
(72, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786523/productos/soquete.webp'),
(73, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786524/productos/timbreZumbador.jpg'),
(74, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786525/productos/focoLet.webp'),
(75, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786525/productos/reflectorLet.jpg'),
(76, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786529/productos/cintaAislante.jpg'),
(77, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786532/productos/cintaVulcanizante.jpg'),
(78, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786533/productos/provadorDeVoltajeTipoLapiz.jpg'),
(79, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786534/productos/llaveDiferencial.webp'),
(80, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786535/productos/pilaAA.jpg'),
(81, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786536/productos/pilasDeLitio.webp'),
(82, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786537/productos/brocha.webp'),
(83, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786537/productos/brocha.webp'),
(84, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786538/productos/celladorParaPared.webp'),
(85, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786539/productos/siliconaTransparente.webp'),
(86, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786540/productos/pegamentoParaMadera.webp'),
(87, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786550/productos/soldaduraLiquida.jpg'),
(88, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786552/productos/thinerAcrilico.webp'),
(89, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786537/productos/brocha.webp'),
(90, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786554/productos/rodillo.webp'),
(91, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786557/productos/espatula.jpg'),
(92, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786558/productos/lijaDeAgua.webp'),
(93, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786560/productos/lijaFierroEsmeril.webp'),
(94, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786561/productos/pernoHexagonal.jpg'),
(95, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786563/productos/clavosDeMadera.webp'),
(96, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786564/productos/clavoCalamina.webp'),
(97, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786566/productos/turugoPlastico.webp'),
(98, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786567/productos/pernoAnclaje.webp'),
(99, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786569/productos/arandelaPlana.webp'),
(100, 'https://res.cloudinary.com/dwmmxzf5u/image/upload/v1782786570/productos/cintaPerforadora.jpg');


-- ==========================================================
-- 16. PROVEEDORES
-- ==========================================================
INSERT INTO proveedores (ruc, nombre, direccion, telefono, correo, web, condicion_pago, activo) VALUES
('20100234567','Distribuidora Herrafer SAC',    'Av. El Sol 432, Trujillo',        '044-291234','ventas@herrafer.com.pe',   'www.herrafer.com.pe',   'contado', 1), -- id 1
('20201345678','Aceros del Norte EIRL',         'Jr. Industria 850, Trujillo',     '044-382345','pedidos@acerosnorte.pe',   NULL,                    '30_dias', 1), -- id 2
('20302456789','Electro Suministros Trujillo',  'Calle Los Pinos 120, Trujillo',   '044-473456','electro@suministros.pe',   'www.electrosum.pe',     'contado', 1), -- id 3
('20403567890','Pinturas y Acabados Sur SAC',   'Av. Moche 567, Víctor Larco',     '044-564567','info@pintanorte.com',      NULL,                    '30_dias', 1), -- id 4
('20504678901','Importadora Tool Master SAC',   'Av. América Norte 1200, Trujillo','044-655678','ventas@toolmaster.pe',    'www.toolmaster.pe',     '60_dias', 1), -- id 5
('20605789012','Cemento Pacasmayo Distribución','Panamericana Norte km 8, Paiján', '044-746789','dist@cempacasmayo.com.pe','www.cempacasmayo.com.pe','30_dias', 1), -- id 6
('20706890123','Plásticos y Tuberías JR EIRL', 'Parque Industrial Lote 45, Truj.','044-837890','ventas@tuberiasjr.pe',    NULL,                    'contado', 1), -- id 7
('20807901234','Seguridad Total SAC',           'Av. Húsares de Junín 890, Truj.','044-928901','epp@seguridadtotal.pe',   'www.seguridadtotal.pe', '30_dias', 1); -- id 8

-- 17. CONTACTOS DE PROVEEDORES -----------------------------
INSERT INTO contactos_proveedor (id_proveedor, nombre, cargo, telefono, correo, es_principal) VALUES
(1,'José Manrique Soto',   'Gerente Comercial',  '994001122','jmanrique@herrafer.com.pe',      1),
(1,'Rosa Chávez Vilela',   'Asistente de ventas','994003344','rchavez@herrafer.com.pe',        0),
(2,'Carlos Izquierdo Ríos','Jefe de ventas',     '994005566','cizquierdo@acerosnorte.pe',      1),
(3,'Alicia Pereda García', 'Ejecutiva de cuenta','994007788','apereda@suministros.pe',         1),
(4,'Víctor Loyola Cruz',   'Vendedor',           '994009900','vloyola@pintanorte.com',         1),
(5,'Sandra Ortega Paz',    'Gerente de ventas',  '994112233','sortega@toolmaster.pe',          1),
(5,'Felipe Torres Nima',   'Soporte técnico',    '994114455','ftorres@toolmaster.pe',          0),
(6,'Mario Gutiérrez Reyes','Asesor comercial',   '994116677','mgutierrez@cempacasmayo.com.pe', 1),
(7,'Hilda Saavedra Luna',  'Ventas',             '994118899','hsaavedra@tuberiasjr.pe',        1),
(8,'Rafael Morán Silva',   'Representante',      '994220011','rmoran@seguridadtotal.pe',       1);

-- 18. PRODUCTOS × PROVEEDOR --------------------------------
-- Solo productos principales para mantener coherencia con el catálogo
INSERT INTO productos_proveedor (id_producto, id_proveedor, codigo_proveedor, precio_compra, tiempo_entrega_dias, es_preferido) VALUES
-- Herramientas manuales → Herrafer (1)
( 1,1,'STN-MAR16',  26.00, 3, 1), ( 2,1,'TRP-MAZ2L',  17.00, 3, 1),
( 3,1,'STN-MAR4L',  52.00, 3, 1), ( 4,1,'TRP-MAR20',  30.00, 3, 1),
( 5,1,'FOR-LLV12',  82.00, 3, 1), ( 6,1,'STN-ALC8',   21.00, 3, 1),
( 7,1,'TRP-LLI12',  30.00, 3, 1), ( 8,1,'BCH-ALCP6',  26.00, 3, 1),
( 9,1,'FOR-LCR17',  17.00, 3, 1), (10,1,'STN-DS6P',   33.00, 3, 1),
(11,1,'TRP-CHI34',  11.00, 3, 1), (12,1,'STN-CUT18',  14.00, 3, 1),
(13,1,'TRP-SAR12',  23.00, 3, 1), (14,1,'STN-THJ10',  30.00, 3, 1),
(15,1,'STN-CHP1',   13.00, 3, 1), (16,1,'STN-WNC5',   17.00, 3, 1),
(17,1,'STN-NIV24',  40.00, 3, 1), (18,1,'STN-ESQ12',  23.00, 3, 1),
(19,1,'STN-FRM1',   26.00, 3, 1), (20,1,'TRP-LMA10',  11.00, 3, 1),
-- Herramientas eléctricas → Tool Master (5)
(21,5,'BSC-GSB550', 200.00, 7, 1), (22,5,'MKT-DDF482', 265.00,10, 1),
(23,5,'DWT-DWD024', 230.00, 7, 1), (24,5,'BSC-GWS060', 165.00, 7, 1),
(25,5,'MKT-GA4530', 185.00,10, 1), (26,5,'TRP-ESM6',   138.00, 7, 1),
(27,5,'MKT-5007MG', 305.00,10, 1), (28,5,'BSC-GST650', 175.00, 7, 1),
(29,5,'MKT-BO4555', 148.00,10, 1), (30,5,'BSC-GBH226', 400.00, 7, 1),
(31,5,'BSC-GHG500', 160.00, 7, 1), (32,5,'TRP-GN2',    215.00, 7, 1),
(33,5,'BSC-BRO13',   40.00, 7, 1), (34,5,'BSC-SDSB5',   52.00, 7, 1),
(35,5,'BSC-BCO32',   21.00, 7, 1), (36,5,'BSC-DCM45',   62.00, 7, 1),
(37,5,'BSC-DDM45',   33.00, 7, 1), (38,5,'BSC-DSM71',   26.00, 7, 1),
(39,1,'TRP-MDR13',   17.00, 3, 1), (40,1,'TRP-CPL4',    11.00, 3, 1),
-- Materiales de construcción → Cemento Pacasmayo (6) y Aceros del Norte (2)
(41,6,'CPQ-TIP1',   26.00, 2, 1), (42,6,'SKA-MIX25',  20.00, 2, 1),
(43,2,'ANC-VAR38',  30.00, 1, 1), (44,2,'ANC-VAR12',  52.00, 1, 1),
(45,2,'ANC-ALB16',   4.00, 1, 1), (46,2,'ANC-MAL6',   80.00, 2, 1),
(47,2,'ANC-VRS38',  11.00, 1, 1), (48,2,'ANC-ESQ2',   17.00, 2, 1),
(49,2,'ANC-ABR2',    7.50, 2, 1),
-- Plomería → Tuberías JR (7)
(50,7,'NIC-PVC2',    8.00, 2, 1), (51,7,'TGR-PVC4',   17.00, 2, 1),
(52,7,'NIC-AGU12',   9.50, 2, 1), (53,7,'NIC-AGU34',  13.00, 2, 1),
(54,7,'VLV-ESF12',  11.00, 2, 1), (55,7,'VLV-CGT34',  24.00, 2, 1),
(56,7,'NIC-COD12',   1.70, 2, 1), (57,7,'NIC-TEE12',   2.30, 2, 1),
(58,7,'NIC-TRP2',    7.50, 2, 1), (59,7,'NIC-TEF12',   1.40, 2, 1),
(60,7,'NIC-PEG250', 11.00, 2, 1),
-- Electricidad → Electro Suministros (3)
(61,3,'IND-THW25',  65.00, 3, 1), (62,3,'IND-THW4',  100.00, 3, 1),
(63,3,'IND-SPT2',   50.00, 3, 1), (64,3,'IND-THW15',  46.00, 3, 1),
(65,3,'GEN-EXT10',  21.00, 3, 1), (66,3,'GEN-CAJO4',   2.30, 3, 1),
(67,3,'GEN-CAJR4',   1.90, 3, 1), (68,3,'GEN-CAN20',   4.20, 3, 1),
(69,3,'GEN-TUB34',  17.00, 3, 1), (70,3,'GEN-TOM2',    5.20, 3, 1),
(71,3,'GEN-INT1',    4.20, 3, 1), (72,3,'GEN-SOQ27',   2.30, 3, 1),
(73,3,'GEN-TIM220',  8.00, 3, 1), (74,3,'PHP-LED9',    7.50, 5, 1),
(75,3,'PHP-REF50',  40.00, 5, 1), (76,3,'3M-CTA19',    5.20, 3, 1),
(77,3,'3M-CVL19',   11.00, 3, 1), (78,3,'GEN-PRB250',  4.70, 3, 1),
(79,3,'GEN-DIF25',  52.00, 3, 1), (80,3,'DUR-PIAA12',  14.00, 3, 1),
(81,3,'MKT-BHAAE',  24.00, 5, 1),
-- Pinturas → Pinturas y Acabados Sur (4)
(82,4,'TKN-LAT4G',  68.00, 4, 1), (83,4,'TKN-ESM1G',  36.00, 4, 1),
(84,4,'SKA-MRX1L',  17.00, 4, 1), (85,4,'SKA-SIL280',  14.00, 4, 1),
(86,4,'SKA-PEG250',  7.50, 4, 1), (87,4,'SKA-EPX50',   11.00, 4, 1),
(88,4,'TKN-THN1L',   9.50, 4, 1), (89,4,'TRP-BCH2',     5.20, 4, 1),
(90,4,'TRP-ROD9',    7.50, 4, 1), (91,4,'TRP-ESP4',     4.70, 4, 1),
(92,4,'3M-LJA220',   1.70, 4, 1), (93,4,'3M-LJF80',     1.90, 4, 1),
-- Fijaciones → Herrafer (1)
(94,1,'FIJ-PER38',  17.00, 2, 1), (95,1,'FIJ-CLV3K',   4.50, 2, 1),
(96,1,'FIJ-CLVC25',  5.00, 2, 1), (97,1,'FSC-S8C100',  20.00, 2, 1),
-- Seguridad → Seguridad Total (8)
(98,8,'3M-CASBLA',  33.00, 5, 1), (99,8,'3M-GUVM',     11.00, 5, 1),
(100,8,'SIG-CNO70', 17.00, 5, 1);

-- 19. ALMACENES --------------------------------------------
INSERT INTO almacenes (nombre, direccion, responsable, activo) VALUES
('Almacén Principal',   'Av. Industrial 1245, Trujillo',  3, 1), -- id 1
('Almacén Secundario',  'Jr. Moche 340, Trujillo',        8, 1), -- id 2
('Almacén de Tránsito', 'Zona Carga, Panamericana Norte', 3, 1); -- id 3

-- 20. STOCK POR ALMACÉN ------------------------------------
-- Distribuye stock_actual entre almacén 1 y 2
INSERT INTO productos_almacen (id_producto, id_almacen, stock) VALUES
( 1,1,25.00),( 1,2,10.00), ( 2,1,14.00),( 2,2, 6.00),
( 3,1,10.00),( 3,2, 5.00), ( 4,1,12.00),( 4,2, 6.00),
( 5,1,12.00),( 5,2, 6.00), ( 6,1,20.00),( 6,2,10.00),
( 7,1,17.00),( 7,2, 8.00), ( 8,1,15.00),( 8,2, 7.00),
( 9,1,18.00),( 9,2,10.00), (10,1,15.00),(10,2, 7.00),
(11,1,20.00),(11,2,10.00), (12,1,23.00),(12,2,12.00),
(13,1,13.00),(13,2, 7.00), (14,1,10.00),(14,2, 5.00),
(15,1,17.00),(15,2, 8.00), (16,1,26.00),(16,2,14.00),
(17,1,12.00),(17,2, 6.00), (18,1,13.00),(18,2, 7.00),
(19,1,12.00),(19,2, 6.00), (20,1,16.00),(20,2, 9.00),
(21,1, 7.00),(21,2, 3.00), (22,1, 5.00),(22,2, 3.00),
(23,1, 4.00),(23,2, 2.00), (24,1, 8.00),(24,2, 4.00),
(25,1, 6.00),(25,2, 3.00), (26,1, 4.00),(26,2, 2.00),
(27,1, 3.00),(27,2, 2.00), (28,1, 4.00),(28,2, 2.00),
(29,1, 4.00),(29,2, 2.00), (30,1, 3.00),(30,2, 1.00),
(31,1, 3.00),(31,2, 2.00), (32,1, 3.00),(32,2, 1.00),
(33,1,14.00),(33,2, 6.00), (34,1,12.00),(34,2, 6.00),
(35,1,15.00),(35,2, 7.00), (36,1,10.00),(36,2, 5.00),
(37,1,12.00),(37,2, 6.00), (38,1,10.00),(38,2, 5.00),
(39,1,13.00),(39,2, 7.00), (40,1,17.00),(40,2, 8.00),
(41,1,130.00),(41,2,70.00),(42,1, 90.00),(42,2,60.00),
(43,1,200.00),(43,2,100.00),(44,1,130.00),(44,2,70.00),
(45,1,100.00),(45,2,50.00),(46,1, 40.00),(46,2,20.00),
(47,1, 52.00),(47,2,28.00),(48,1, 40.00),(48,2,20.00),
(49,1, 52.00),(49,2,28.00),
(50,1, 80.00),(50,2,40.00),(51,1, 52.00),(51,2,28.00),
(52,1, 65.00),(52,2,35.00),(53,1, 52.00),(53,2,28.00),
(54,1, 40.00),(54,2,20.00),(55,1, 26.00),(55,2,14.00),
(56,1,130.00),(56,2,70.00),(57,1,117.00),(57,2,63.00),
(58,1, 39.00),(58,2,21.00),(59,1,195.00),(59,2,105.00),
(60,1, 52.00),(60,2,28.00),
(61,1, 32.00),(61,2,18.00),(62,1, 22.00),(62,2,13.00),
(63,1, 26.00),(63,2,14.00),(64,1, 26.00),(64,2,14.00),
(65,1, 19.00),(65,2,11.00),(66,1,130.00),(66,2,70.00),
(67,1,130.00),(67,2,70.00),(68,1, 78.00),(68,2,42.00),
(69,1, 39.00),(69,2,21.00),(70,1, 97.00),(70,2,53.00),
(71,1, 97.00),(71,2,53.00),(72,1, 78.00),(72,2,42.00),
(73,1, 26.00),(73,2,14.00),(74,1, 52.00),(74,2,28.00),
(75,1, 19.00),(75,2,11.00),(76,1, 65.00),(76,2,35.00),
(77,1, 39.00),(77,2,21.00),(78,1, 39.00),(78,2,21.00),
(79,1, 13.00),(79,2, 7.00),(80,1, 39.00),(80,2,21.00),
(81,1, 19.00),(81,2,11.00),
(82,1, 19.00),(82,2,11.00),(83,1, 16.00),(83,2, 9.00),
(84,1, 26.00),(84,2,14.00),(85,1, 32.00),(85,2,18.00),
(86,1, 39.00),(86,2,21.00),(87,1, 26.00),(87,2,14.00),
(88,1, 32.00),(88,2,18.00),(89,1, 39.00),(89,2,21.00),
(90,1, 32.00),(90,2,18.00),(91,1, 32.00),(91,2,18.00),
(92,1, 97.00),(92,2,53.00),(93,1, 78.00),(93,2,42.00),
(94,1, 36.00),(94,2,19.00),(95,1, 65.00),(95,2,35.00),
(96,1, 52.00),(96,2,28.00),(97,1, 29.00),(97,2,16.00),
(98,1, 19.00),(98,2,11.00),(99,1, 39.00),(99,2,21.00),
(100,1,16.00),(100,2, 9.00);

-- 21. SERIES Y TIPOS DE PAGO -------------------------------
INSERT INTO serie_comprobantes (tipo_comprobante, serie, correlativo_actual, activo) VALUES
('boleta',     'B001', 0, 1), -- id 1
('factura',    'F001', 0, 1), -- id 2
('nota_venta', 'NV01', 0, 1); -- id 3

INSERT INTO tipos_pago (nombre, requiere_voucher, activo) VALUES
('Efectivo',          0, 1), -- id 1
('Tarjeta de débito', 1, 1), -- id 2
('Tarjeta de crédito',1, 1), -- id 3
('Transferencia',     1, 1), -- id 4
('Yape',              1, 1), -- id 5
('Plin',              1, 1); -- id 6

-- 22. ÓRDENES DE COMPRA ------------------------------------
INSERT INTO ordenes_compra (id_proveedor, id_empleado, numero_orden, fecha, fecha_esperada, estado, subtotal, igv, total, observacion) VALUES
(1, 10,'OC-2025-0001','2025-01-08 09:00:00','2025-01-11','recibida', 1104.00, 198.72, 1302.72,'Reposición herramientas manuales y fijaciones'),
(6, 10,'OC-2025-0002','2025-01-15 10:30:00','2025-01-17','recibida', 2380.00, 428.40, 2808.40,'Stock de cemento para temporada alta'),
(5, 10,'OC-2025-0003','2025-02-03 11:00:00','2025-02-10','recibida', 3485.00, 627.30, 4112.30,'Herramientas eléctricas Bosch y Makita'),
(3, 10,'OC-2025-0004','2025-02-20 09:30:00','2025-02-23','recibida',  850.00, 153.00, 1003.00,'Cables eléctricos Indeco'),
(7, 10,'OC-2025-0005','2025-03-05 10:00:00','2025-03-07','recibida',  620.00, 111.60,  731.60,'Tuberías y válvulas PVC'),
(4, 10,'OC-2025-0006','2025-03-18 11:30:00','2025-03-22','enviada',   780.00, 140.40,  920.40,'Pinturas, selladores y herramientas de pintura'),
(2, 10,'OC-2025-0007','2025-04-02 09:00:00','2025-04-04','borrador', 1600.00, 288.00, 1888.00,'Varillas de acero corrugado y alambre'),
(8, 10,'OC-2025-0008','2025-04-10 14:00:00','2025-04-15','borrador',  420.00,  75.60,  495.60,'EPP: cascos, guantes y señalización');

-- 23. DETALLE DE ÓRDENES -----------------------------------
INSERT INTO detalle_orden_compra (id_orden, id_producto, cantidad_solicitada, cantidad_recibida, precio_unitario, subtotal) VALUES
-- OC-001: herramientas manuales
( 1,  1, 20.00, 20.00, 26.00, 520.00),
( 1,  6, 15.00, 15.00, 21.00, 315.00),
( 1, 94, 15.00, 15.00, 17.00, 255.00),  -- perno hex (antes id 28)
-- OC-002: cemento
( 2, 41, 70.00, 70.00, 26.00,1820.00),
( 2, 42, 28.00, 28.00, 20.00, 560.00),
-- OC-003: herramientas eléctricas
( 3, 21,  8.00,  8.00,200.00,1600.00),
( 3, 22,  4.00,  4.00,265.00,1060.00),
( 3, 24,  5.00,  5.00,165.00, 825.00),
-- OC-004: cables
( 4, 61, 10.00, 10.00, 65.00, 650.00),
( 4, 62,  5.00,  5.00,100.00, 500.00),
-- OC-005: tuberías
( 5, 50, 30.00, 30.00,  8.00, 240.00),
( 5, 51, 15.00, 15.00, 17.00, 255.00),
( 5, 54, 20.00, 20.00, 11.00, 220.00),
-- OC-006: pinturas (enviada, sin recibir)
( 6, 82, 10.00,  0.00, 68.00, 680.00),
( 6, 83,  5.00,  0.00, 36.00, 180.00),
-- OC-007: varillas (borrador)
( 7, 43, 30.00,  0.00, 30.00, 900.00),
( 7, 44, 20.00,  0.00, 52.00,1040.00),
-- OC-008: EPP (borrador)
( 8, 98, 10.00,  0.00, 33.00, 330.00),
( 8, 99, 15.00,  0.00, 11.00, 165.00);

-- 24. RECEPCIONES ------------------------------------------
INSERT INTO recepciones (id_orden, id_almacen, id_empleado, fecha, numero_guia, observacion) VALUES
(1, 1, 3,'2025-01-11 10:00:00','GR-HERR-00123','Todo conforme, sin observaciones'),
(2, 1, 3,'2025-01-17 09:30:00','GR-CEM-00456', 'Sacos en buen estado'),
(3, 1, 3,'2025-02-10 11:00:00','GR-ELEC-00789','Taladros con embalaje original'),
(4, 1, 8,'2025-02-23 10:00:00','GR-CAB-01011', 'Rollos sin daños'),
(5, 1, 8,'2025-03-07 09:00:00','GR-TUB-01213', 'Tuberías revisadas, ok');

INSERT INTO detalle_recepcion (id_recepcion, id_producto, cantidad_recibida, precio_unitario, numero_lote, fecha_vencimiento) VALUES
(1,  1, 20.00, 26.00, NULL, NULL),
(1,  6, 15.00, 21.00, NULL, NULL),
(1, 94, 15.00, 17.00, NULL, NULL),
(2, 41, 70.00, 26.00,'LOT-CEM-2501', NULL),
(2, 42, 28.00, 20.00,'LOT-MOR-2501', NULL),
(3, 21,  8.00,200.00, NULL, NULL),
(3, 22,  4.00,265.00, NULL, NULL),
(3, 24,  5.00,165.00, NULL, NULL),
(4, 61, 10.00, 65.00,'LOT-IND-2501', NULL),
(4, 62,  5.00,100.00,'LOT-IND-2502', NULL),
(5, 50, 30.00,  8.00, NULL, NULL),
(5, 51, 15.00, 17.00, NULL, NULL),
(5, 54, 20.00, 11.00, NULL, NULL);

-- 25. VENTAS -----------------------------------------------
INSERT INTO ventas (id_cliente, id_empleado, id_serie, numero_comprobante, fecha, subtotal, igv, total, estado, observacion) VALUES
( 1, 2, 1,'B001-00001','2025-01-13 10:15:00',  76.27, 13.73,  90.00,'pagada', NULL),
( 3, 2, 2,'F001-00001','2025-01-14 11:00:00', 296.61, 53.39, 350.00,'pagada','Factura para obra Los Álamos'),
( 4, 7, 1,'B001-00002','2025-01-20 09:30:00', 113.56, 20.44, 134.00,'pagada', NULL),
( 2, 5, 1,'B001-00003','2025-02-05 14:00:00', 322.03, 57.97, 380.00,'pagada', NULL),
( 5, 2, 2,'F001-00002','2025-02-12 10:00:00', 610.17,109.83, 720.00,'pagada','Factura Inmobiliaria Los Pinos'),
( 6, 7, 1,'B001-00004','2025-02-18 16:00:00',  50.42,  9.08,  59.50,'pagada', NULL),
( 7, 5, 3,'NV01-00001','2025-03-03 10:30:00',  55.93, 10.07,  66.00,'pagada','Nota venta cliente CE'),
( 9, 2, 2,'F001-00003','2025-03-10 11:00:00', 703.39,126.61, 830.00,'pagada','Venta a Ferretería Norte'),
(10, 7, 1,'B001-00005','2025-03-15 12:00:00',  97.46, 17.54, 115.00,'pagada', NULL),
(11, 5, 1,'B001-00006','2025-03-22 15:00:00',  59.32, 10.68,  70.00,'pagada', NULL),
( 1, 7, 1,'B001-00007','2025-04-01 09:00:00', 211.86, 38.14, 250.00,'pagada', NULL),
( 4, 2, 2,'F001-00004','2025-04-08 10:00:00', 406.78, 73.22, 480.00,'pagada','Factura obra Urb. El Bosque'),
(NULL,5,3,'NV01-00002','2025-04-10 11:00:00',  21.61,  3.89,  25.50,'pagada','Venta sin cliente registrado'),
(13, 7, 1,'B001-00008','2025-04-15 14:30:00',  77.97, 14.03,  92.00,'pagada', NULL),
( 3, 2, 2,'F001-00005','2025-04-20 10:00:00',1165.25,209.75,1375.00,'pagada','Gran pedido constructora Pérez');

-- 26. DETALLE DE VENTAS ------------------------------------
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES
( 1,  1,  2.00, 45.00,  90.00), -- martillo stanley
( 2, 21,  1.00,350.00, 350.00), -- taladro bosch (id 21 ahora)
( 3,  6,  2.00, 38.00,  76.00), -- alicate corte
( 3, 10,  1.00, 58.00,  58.00), -- set destornilladores
( 4, 41, 10.00, 38.00, 380.00), -- cemento (id 41 ahora)
( 5, 43, 15.00, 48.00, 720.00), -- varilla 3/8 (id 43 ahora)
( 6, 95,  7.00,  8.50,  59.50), -- clavos madera (id 95 ahora)
( 7, 97,  1.00, 36.00,  36.00), -- tacos fischer (id 97 ahora)
( 7, 94,  1.00, 30.00,  30.00), -- pernos hex (id 94 ahora)
( 8, 61,  5.00,110.00, 550.00), -- cable thw 2.5mm (id 61)
( 8, 50, 20.00, 14.00, 280.00), -- tubería pvc 2" (id 50)
( 9, 82,  1.00,115.00, 115.00), -- pintura latex (id 82)
(10, 99,  2.00, 20.00,  40.00), -- guantes nitrilo (id 99)
(10,100,  1.00, 30.00,  30.00), -- cono seguridad (id 100)
(11,  7,  2.00, 55.00, 110.00), -- llave inglesa
(11,  5,  1.00,140.00, 140.00), -- set llaves combinadas
(12, 22,  1.00,480.00, 480.00), -- taladro inalambrico makita (id 22)
(13, 95,  3.00,  8.50,  25.50), -- clavos
(14, 83,  1.00, 62.00,  62.00), -- esmalte tekno (id 83)
(14, 84,  1.00, 30.00,  30.00), -- sellador sika (id 84)
(15, 41, 20.00, 38.00, 760.00), -- cemento
(15, 43, 10.00, 48.00, 480.00), -- varilla 3/8
(15,  1,  3.00, 45.00, 135.00); -- martillo

-- 27. PAGOS DE VENTA ---------------------------------------
INSERT INTO pagos_venta (id_venta, id_tipo_pago, monto, numero_operacion, fecha) VALUES
( 1, 1,   90.00, NULL,           '2025-01-13 10:20:00'),
( 2, 4,  350.00,'TRF-001-2025', '2025-01-14 11:30:00'),
( 3, 1,  134.00, NULL,           '2025-01-20 09:35:00'),
( 4, 5,  380.00,'YPE-002-2025', '2025-02-05 14:05:00'),
( 5, 4,  720.00,'TRF-002-2025', '2025-02-12 10:30:00'),
( 6, 1,   59.50, NULL,           '2025-02-18 16:05:00'),
( 7, 1,   66.00, NULL,           '2025-03-03 10:35:00'),
( 8, 4,  830.00,'TRF-003-2025', '2025-03-10 11:30:00'),
( 9, 2,  115.00,'TRJ-001-2025', '2025-03-15 12:10:00'),
(10, 1,   70.00, NULL,           '2025-03-22 15:05:00'),
(11, 5,  250.00,'YPE-003-2025', '2025-04-01 09:10:00'),
(12, 3,  480.00,'TRJ-002-2025', '2025-04-08 10:15:00'),
(13, 1,   25.50, NULL,           '2025-04-10 11:05:00'),
(14, 6,   92.00,'PLN-001-2025', '2025-04-15 14:35:00'),
(15, 4, 1375.00,'TRF-004-2025', '2025-04-20 10:30:00');

-- 28. CAJAS ------------------------------------------------
INSERT INTO cajas (id_empleado, id_turno, numero_turno, fecha_apertura, fecha_cierre_programada,
    fecha_cierre, monto_inicial, monto_esperado, monto_real, diferencia, estado, cerrado_por) VALUES
(4,2,1,'2025-01-13 07:00:00','2025-01-13 15:00:00','2025-01-13 15:10:00', 500.00, 590.00, 590.00,  0.00,'cerrada',4),
(6,2,2,'2025-01-14 07:00:00','2025-01-14 15:00:00','2025-01-14 15:05:00', 500.00, 780.00, 775.00, -5.00,'cerrada',6),
(4,2,3,'2025-01-20 07:00:00','2025-01-20 15:00:00','2025-01-20 15:15:00', 500.00, 580.00, 582.00,  2.00,'cerrada',4),
(6,2,4,'2025-02-05 07:00:00','2025-02-05 15:00:00','2025-02-05 15:08:00', 500.00, 700.00, 700.00,  0.00,'cerrada',6),
(4,2,5,'2025-03-22 07:00:00','2025-03-22 15:00:00','2025-03-22 15:20:00', 500.00, 550.00, 548.00, -2.00,'cerrada',9),
(6,2,6,'2025-04-10 07:00:00','2025-04-10 15:00:00','2025-04-10 15:03:00', 500.00, 530.00, 530.00,  0.00,'cerrada',6),
(4,2,7,'2025-04-20 07:00:00','2025-04-20 15:00:00', NULL,                 500.00,   0.00,   NULL,  NULL,'abierta',NULL);

-- 29. MOVIMIENTOS DE CAJA ----------------------------------
INSERT INTO movimientos_caja (id_caja, id_usuario, tipo, concepto, referencia_id, monto, registrado_en) VALUES
(1,4,'ingreso','Cobro venta B001-00001', 1,  90.00,'2025-01-13 10:20:00'),
(2,6,'ingreso','Pago cuota proveedor',  NULL, 50.00,'2025-01-14 09:00:00'),
(3,4,'ingreso','Cobro venta B001-00002', 3,  80.00,'2025-01-20 09:35:00'),
(4,6,'egreso', 'Compra útiles de oficina',NULL,35.00,'2025-02-05 08:00:00'),
(5,4,'egreso', 'Pago servicio limpieza',NULL, 80.00,'2025-03-22 08:30:00'),
(6,6,'ingreso','Cobro venta NV01-00002',13,  30.00,'2025-04-10 11:05:00'),
(7,4,'ingreso','Apertura turno',        NULL,500.00,'2025-04-20 07:00:00');

-- 30. DEVOLUCIONES -----------------------------------------
INSERT INTO devoluciones (id_venta, id_empleado, fecha, motivo, tipo, estado, monto_reembolso) VALUES
(3, 2,'2025-01-22 10:00:00','Producto defectuoso, alicate no cierra bien','reembolso','procesada',38.00),
(4, 7,'2025-02-08 11:00:00','Cliente compró de más, devuelve 2 sacos cemento','reembolso','procesada',76.00),
(10,5,'2025-03-25 09:30:00','Guante con desperfecto en costura','cambio','procesada',0.00);

INSERT INTO detalle_devolucion (id_devolucion, id_producto, cantidad, reingresa_stock, precio_devuelto) VALUES
(1,  6, 1.00, 1, 38.00), -- alicate de corte (id 6)
(2, 41, 2.00, 1, 38.00), -- cemento (id 41)
(3, 99, 1.00, 0, 20.00); -- guante defectuoso (id 99)

-- 31. TRANSFERENCIAS DE ALMACÉN ----------------------------
INSERT INTO transferencias_almacen (id_almacen_origen, id_almacen_destino, id_empleado, fecha, fecha_completada, motivo, estado) VALUES
(1,2,3,'2025-02-01 08:00:00','2025-02-01 10:00:00','Reposición almacén secundario','completada'),
(1,3,3,'2025-03-20 08:30:00','2025-03-20 11:00:00','Preparación despacho obra',    'completada'),
(2,1,8,'2025-04-05 09:00:00', NULL,                'Devolución excedente',          'pendiente');

INSERT INTO detalle_transferencia (id_transferencia, id_producto, cantidad) VALUES
(1,  1,  5.00),
(1,  6,  8.00),
(1, 41, 30.00),
(2, 21,  2.00),
(2, 43, 50.00),
(3, 41, 10.00),
(3, 50, 20.00);

-- 32. KARDEX -----------------------------------------------
INSERT INTO kardex (id_producto, id_almacen, tipo_movimiento, motivo, referencia_id, referencia_tipo,
    cantidad, stock_anterior, stock_posterior, id_usuario, registrado_en) VALUES
-- Entradas OC-001
( 1,1,'entrada','Recepción OC-2025-0001',1,'recepcion', 20.00, 15.00,  35.00,3,'2025-01-11 10:00:00'),
( 6,1,'entrada','Recepción OC-2025-0001',1,'recepcion', 15.00, 15.00,  30.00,3,'2025-01-11 10:00:00'),
(94,1,'entrada','Recepción OC-2025-0001',1,'recepcion', 15.00, 40.00,  55.00,3,'2025-01-11 10:00:00'),
-- Entradas OC-002
(41,1,'entrada','Recepción OC-2025-0002',2,'recepcion', 70.00,130.00, 200.00,3,'2025-01-17 09:30:00'),
(42,1,'entrada','Recepción OC-2025-0002',2,'recepcion', 28.00, 90.00, 118.00,3,'2025-01-17 09:30:00'),
-- Entradas OC-004
(61,1,'entrada','Recepción OC-2025-0004',4,'recepcion', 10.00, 22.00,  32.00,8,'2025-02-23 10:00:00'),
(62,1,'entrada','Recepción OC-2025-0004',4,'recepcion',  5.00, 17.00,  22.00,8,'2025-02-23 10:00:00'),
-- Salidas por ventas
( 1,1,'salida','Venta B001-00001', 1,'venta',  2.00, 35.00,  33.00,2,'2025-01-13 10:20:00'),
(21,1,'salida','Venta F001-00001', 2,'venta',  1.00, 10.00,   9.00,2,'2025-01-14 11:00:00'),
( 6,1,'salida','Venta B001-00002', 3,'venta',  2.00, 30.00,  28.00,7,'2025-01-20 09:30:00'),
(41,1,'salida','Venta B001-00003', 4,'venta', 10.00,200.00, 190.00,5,'2025-02-05 14:00:00'),
(43,1,'salida','Venta F001-00002', 5,'venta', 15.00,200.00, 185.00,2,'2025-02-12 10:00:00'),
-- Transferencia
( 1,1,'transferencia','Transf. a Alm.Secundario',1,'transferencia',5.00,33.00,28.00,3,'2025-02-01 10:00:00'),
(41,1,'transferencia','Transf. a Alm.Secundario',1,'transferencia',30.00,190.00,160.00,3,'2025-02-01 10:00:00'),
-- Ajuste inventario
(95,1,'ajuste','Ajuste por conteo físico',NULL,NULL,5.00,95.00,100.00,1,'2025-03-01 08:00:00');

-- 33. LOTES ------------------------------------------------
INSERT INTO lotes (id_producto, id_almacen, numero_lote, fecha_vencimiento, cantidad, creado_en) VALUES
-- Cemento Cppq (id 41)
(41,1,'LOT-CPQ-2025-001','2025-12-01', 70.00,'2025-01-17 09:30:00'),
(41,1,'LOT-CPQ-2025-002','2026-01-10', 80.00,'2025-01-17 09:31:00'),
(41,2,'LOT-CPQ-2025-003','2026-01-10', 50.00,'2025-01-17 09:32:00'),
(41,1,'LOT-CPQ-2024-099','2025-08-01',  0.00,'2024-08-15 08:00:00'), -- agotado
-- Mortero Sika (id 42)
(42,1,'LOT-SKA-2025-001','2026-07-05', 90.00,'2025-01-17 09:35:00'),
(42,2,'LOT-SKA-2025-002','2026-07-05', 60.00,'2025-01-17 09:36:00'),
-- Cable THW 2.5mm (id 61)
(61,1,'LOT-IND-2025-001','2027-11-20', 20.00,'2025-02-24 10:00:00'),
(61,2,'LOT-IND-2025-002','2028-02-01', 12.00,'2025-02-24 10:01:00'),
-- Cable THW 4mm (id 62)
(62,1,'LOT-IND-2025-003','2028-02-01', 22.00,'2025-02-24 10:05:00'),
(62,2,'LOT-IND-2025-004','2028-02-01', 13.00,'2025-02-24 10:06:00'),
-- Cable mellizo (id 63)
(63,1,'LOT-IND-2025-005','2028-05-10', 26.00,'2025-02-24 10:10:00'),
(63,2,'LOT-IND-2025-006','2028-05-10', 14.00,'2025-02-24 10:11:00'),
-- Cable THW 1.5mm (id 64)
(64,1,'LOT-IND-2025-007','2027-09-15', 26.00,'2025-02-24 10:15:00'),
(64,2,'LOT-IND-2025-008','2027-09-15', 14.00,'2025-02-24 10:16:00');

-- 34. AUDITORÍA (muestra representativa) -------------------
INSERT INTO auditoria (id_usuario, tabla_afectada, operacion, registro_id, datos_anteriores, datos_nuevos, ip, registrado_en) VALUES
(1,'configuracion','INSERT',0, NULL,                                    '{"clave":"igv_porcentaje","valor":"18"}',                                       '192.168.1.10','2025-01-05 08:00:00'),
(1,'configuracion','UPDATE',0,'{"clave":"stock_alerta","valor":"5"}',  '{"clave":"stock_alerta","valor":"10"}',                                          '192.168.1.10','2025-02-15 09:00:00'),
(1,'empleados',    'INSERT',12, NULL,                                   '{"nombre":"Beatriz","apellido":"Vargas Chávez","id_cargo":3,"id_turno":3}',      '192.168.1.10','2024-05-15 10:00:00'),
(1,'usuarios',     'INSERT',12, NULL,                                   '{"username":"beatriz.alm","id_rol":3,"activo":1}',                              '192.168.1.10','2024-05-15 10:05:00'),
(1,'usuarios',     'UPDATE', 6,'{"activo":0}',                         '{"activo":1}',                                                                   '192.168.1.10','2023-07-01 09:00:00'),
(10,'ordenes_compra','INSERT',1, NULL,                                  '{"numero_orden":"OC-2025-0001","id_proveedor":1,"total":1302.72,"estado":"pendiente"}','192.168.1.19','2025-01-08 09:00:00'),
(10,'ordenes_compra','UPDATE',1,'{"estado":"pendiente"}',              '{"estado":"recibida"}',                                                           '192.168.1.19','2025-01-11 10:00:00'),
(10,'ordenes_compra','INSERT',2, NULL,                                  '{"numero_orden":"OC-2025-0002","id_proveedor":6,"total":2808.40,"estado":"pendiente"}','192.168.1.19','2025-01-15 10:30:00'),
(10,'ordenes_compra','INSERT',3, NULL,                                  '{"numero_orden":"OC-2025-0003","id_proveedor":5,"total":4112.30,"estado":"pendiente"}','192.168.1.19','2025-02-03 11:00:00'),
(10,'ordenes_compra','UPDATE',3,'{"estado":"pendiente"}',              '{"estado":"recibida"}',                                                           '192.168.1.19','2025-02-10 11:00:00'),
( 2,'ventas',        'INSERT',1, NULL,                                  '{"numero_comprobante":"B001-00001","total":90.00,"estado":"pendiente"}',           '192.168.1.11','2025-01-13 10:15:00'),
( 2,'ventas',        'UPDATE',1,'{"estado":"pendiente"}',              '{"estado":"pagada"}',                                                             '192.168.1.11','2025-01-13 10:20:00'),
( 7,'ventas',        'INSERT',3, NULL,                                  '{"numero_comprobante":"B001-00002","total":80.00,"estado":"pendiente"}',           '192.168.1.16','2025-01-20 09:30:00'),
( 1,'productos',     'UPDATE',41,'{"stock_actual":190}',               '{"stock_actual":180}',                                                            '192.168.1.10','2025-02-05 14:00:00'),
( 1,'devoluciones',  'INSERT',1, NULL,                                  '{"id_venta":3,"tipo":"reembolso","monto_reembolso":38.00,"estado":"pendiente"}',  '192.168.1.10','2025-01-22 10:00:00'),
( 2,'devoluciones',  'UPDATE',1,'{"estado":"pendiente"}',              '{"estado":"procesada"}',                                                          '192.168.1.11','2025-01-22 10:30:00');