CREATE DATABASE Ferreteria;
USE Ferreteria;

-- MÓDULO: CONFIGURACIÓN Y AUDITORÍA
CREATE TABLE configuracion (
    id_config INT NOT NULL IDENTITY(1,1),
    clave VARCHAR(60)  NOT NULL,
    valor VARCHAR(200) NOT NULL,
    descripcion VARCHAR(150) NULL,
    CONSTRAINT pk_configuracion PRIMARY KEY (id_config),
    CONSTRAINT uq_configuracion_clave UNIQUE (clave)
);

CREATE TABLE auditoria (
    id_auditoria INT NOT NULL IDENTITY(1,1),
    id_usuario INT NULL,
    tabla_afectada VARCHAR(60) NOT NULL,
    operacion VARCHAR(10) NOT NULL CHECK (operacion IN ('INSERT','UPDATE','DELETE')),
    registro_id INT NOT NULL,
    datos_anteriores NVARCHAR(MAX) NULL,
    datos_nuevos NVARCHAR(MAX) NULL,
    ip VARCHAR(45) NULL,
    registrado_en DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_auditoria PRIMARY KEY (id_auditoria)
);

-- MÓDULO: EMPLEADOS Y ACCESO
CREATE TABLE cargos (
    id_cargo INT NOT NULL IDENTITY(1,1),
    nombre VARCHAR(50) NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT pk_cargos PRIMARY KEY (id_cargo),
    CONSTRAINT uq_cargos_nombre UNIQUE (nombre)
);

CREATE TABLE empleados (
    id_empleado INT NOT NULL IDENTITY(1,1),
    id_cargo INT NOT NULL,
    dni VARCHAR(8) NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    telefono VARCHAR(15) NULL,
    correo VARCHAR(100) NULL,
    fecha_ingreso DATE NOT NULL,
    fecha_cese DATE NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT pk_empleados       PRIMARY KEY (id_empleado),
    CONSTRAINT uq_empleados_dni   UNIQUE (dni),
    CONSTRAINT fk_empleados_cargo FOREIGN KEY (id_cargo)
        REFERENCES cargos (id_cargo)
);

CREATE TABLE roles (
    id_rol INT NOT NULL IDENTITY(1,1),
    nombre VARCHAR(40) NOT NULL,
    descripcion VARCHAR(150) NULL,
    CONSTRAINT pk_roles PRIMARY KEY (id_rol),
    CONSTRAINT uq_roles_nombre UNIQUE (nombre)
);

CREATE TABLE usuarios (
    id_usuario INT NOT NULL IDENTITY(1,1),
    id_empleado INT NOT NULL,
    id_rol INT NOT NULL,
    username VARCHAR(50)  NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    ultimo_acceso DATETIME2 NULL,
    creado_en DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_usuarios PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuarios_emp UNIQUE (id_empleado),
    CONSTRAINT uq_usuarios_user UNIQUE (username),
    CONSTRAINT fk_usuarios_emp FOREIGN KEY (id_empleado)
        REFERENCES empleados (id_empleado),
    CONSTRAINT fk_usuarios_rol FOREIGN KEY (id_rol)
        REFERENCES roles (id_rol)
);

ALTER TABLE auditoria
    ADD CONSTRAINT fk_auditoria_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario);

-- MÓDULO: CLIENTES
CREATE TABLE clientes (
    id_cliente INT NOT NULL IDENTITY(1,1),
    tipo_documento VARCHAR(3) NOT NULL CHECK (tipo_documento IN ('DNI','RUC','CE')),
    numero_documento VARCHAR(15) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(15) NULL,
    correo VARCHAR(100) NULL,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_clientes PRIMARY KEY (id_cliente),
    CONSTRAINT uq_clientes_doc UNIQUE (numero_documento)
);

-- MÓDULO: PRODUCTOS
CREATE TABLE categorias (
    id_categoria INT NOT NULL IDENTITY(1,1),
    nombre VARCHAR(80)  NOT NULL,
    descripcion VARCHAR(200) NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT pk_categorias PRIMARY KEY (id_categoria),
    CONSTRAINT uq_categorias_nombre UNIQUE (nombre)
);

CREATE TABLE subcategorias (
    id_subcategoria INT NOT NULL IDENTITY(1,1),
    id_categoria INT NOT NULL,
    nombre VARCHAR(80)  NOT NULL,
    descripcion VARCHAR(200) NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT pk_subcategorias PRIMARY KEY (id_subcategoria),
    CONSTRAINT fk_subcategorias_cat FOREIGN KEY (id_categoria)
        REFERENCES categorias (id_categoria)
);

CREATE TABLE marcas (
    id_marca INT NOT NULL IDENTITY(1,1),
    nombre VARCHAR(80) NOT NULL,
    pais_origen VARCHAR(60) NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT pk_marcas PRIMARY KEY (id_marca),
    CONSTRAINT uq_marcas_nombre UNIQUE (nombre)
);

CREATE TABLE unidades_medida (
    id_unidad INT NOT NULL IDENTITY(1,1),
    nombre VARCHAR(40) NOT NULL,
    abreviatura VARCHAR(10) NOT NULL,
    activo BIT NOT NULL DEFAULT 1,-- CAMPO NUEVO
    CONSTRAINT pk_unidades PRIMARY KEY (id_unidad),
    CONSTRAINT uq_unidades_nombre UNIQUE (nombre),
    CONSTRAINT uq_unidades_abrev UNIQUE (abreviatura)
);

CREATE TABLE productos (
    id_producto INT NOT NULL IDENTITY(1,1),
    id_subcategoria INT NOT NULL,
    id_marca INT NULL,
    id_unidad INT NOT NULL,
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,
    precio_compra DECIMAL(10,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    stock_actual DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_minimo DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_maximo DECIMAL(10,2) NOT NULL DEFAULT 0,--CAMBIO ACA
    ubicacion VARCHAR(50)   NOT NULL,
    tiene_lote BIT NOT NULL DEFAULT 0,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_productos PRIMARY KEY (id_producto),
    CONSTRAINT uq_productos_cod UNIQUE (codigo),
    CONSTRAINT fk_productos_sub FOREIGN KEY (id_subcategoria)
        REFERENCES subcategorias (id_subcategoria),
    CONSTRAINT fk_productos_marca FOREIGN KEY (id_marca)
        REFERENCES marcas (id_marca),
    CONSTRAINT fk_productos_und FOREIGN KEY (id_unidad)
        REFERENCES unidades_medida (id_unidad),
    CONSTRAINT chk_precio_venta CHECK (precio_venta >= 0),
    CONSTRAINT chk_stock_minimo CHECK (stock_minimo >= 0)
);

CREATE TABLE imagenes_producto (
    id_imagen INT NOT NULL IDENTITY(1,1),
    id_producto INT NOT NULL,
    url_img VARCHAR(300) NOT NULL,
    CONSTRAINT pk_imagenes PRIMARY KEY (id_imagen),
    CONSTRAINT fk_imagenes_prod FOREIGN KEY (id_producto)
        REFERENCES productos (id_producto)
);

-- MÓDULO: LOGÍSTICA E INVENTARIO
CREATE TABLE almacenes (
    id_almacen INT NOT NULL IDENTITY(1,1),
    nombre VARCHAR(80) NOT NULL,
    direccion VARCHAR(200) NULL,
    responsable INT NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT pk_almacenes PRIMARY KEY (id_almacen),
    CONSTRAINT uq_almacenes_nom UNIQUE (nombre),
    CONSTRAINT fk_almacenes_resp FOREIGN KEY (responsable)
        REFERENCES empleados (id_empleado)
);

CREATE TABLE lotes (
    id_lote INT NOT NULL IDENTITY(1,1),
    id_producto INT NOT NULL,
    id_almacen INT NOT NULL,
    numero_lote VARCHAR(50) NOT NULL,
    fecha_vencimiento DATE NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    creado_en DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_lotes PRIMARY KEY (id_lote),
    CONSTRAINT fk_lotes_prod FOREIGN KEY (id_producto)
        REFERENCES productos (id_producto),
    CONSTRAINT fk_lotes_alm FOREIGN KEY (id_almacen)
        REFERENCES almacenes (id_almacen)
);

CREATE TABLE transferencias_almacen (
    id_transferencia INT NOT NULL IDENTITY(1,1),
    id_almacen_origen INT NOT NULL,
    id_almacen_destino INT NOT NULL,
    id_empleado INT NOT NULL,
    fecha DATETIME2 NOT NULL DEFAULT GETDATE(),
    fecha_completada DATETIME2 NULL,
    motivo VARCHAR(200) NULL,
    estado VARCHAR(10) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente','completada','anulada')),
    CONSTRAINT pk_transferencias PRIMARY KEY (id_transferencia),
    CONSTRAINT fk_transf_origen FOREIGN KEY (id_almacen_origen)
        REFERENCES almacenes (id_almacen), 
    CONSTRAINT fk_transf_destino FOREIGN KEY (id_almacen_destino)
        REFERENCES almacenes (id_almacen),
    CONSTRAINT fk_transf_empleado FOREIGN KEY (id_empleado)
        REFERENCES empleados (id_empleado),
    CONSTRAINT chk_transf_almacenes CHECK (id_almacen_origen <> id_almacen_destino)
);

CREATE TABLE detalle_transferencia (
    id_detalle INT NOT NULL IDENTITY(1,1),
    id_transferencia INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_det_transf PRIMARY KEY (id_detalle),
    CONSTRAINT fk_det_transf_tr FOREIGN KEY (id_transferencia)
        REFERENCES transferencias_almacen (id_transferencia),
    CONSTRAINT fk_det_transf_prod  FOREIGN KEY (id_producto)
        REFERENCES productos (id_producto),
    CONSTRAINT chk_det_transf_cant CHECK (cantidad > 0)
);


CREATE TABLE kardex (
    id_kardex INT NOT NULL IDENTITY(1,1),
    id_producto INT NOT NULL,
    id_almacen INT NOT NULL,
    tipo_movimiento VARCHAR(15)   NOT NULL
        CHECK (tipo_movimiento IN ('entrada','salida','ajuste','transferencia')),
    motivo VARCHAR(100) NOT NULL,
    referencia_id INT NULL,
    referencia_tipo VARCHAR(30)   NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    stock_anterior DECIMAL(10,2) NOT NULL,
    stock_posterior DECIMAL(10,2) NOT NULL,
    id_usuario INT NOT NULL,
    registrado_en DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_kardex PRIMARY KEY (id_kardex),
    CONSTRAINT fk_kardex_prod FOREIGN KEY (id_producto)
        REFERENCES productos (id_producto),
    CONSTRAINT fk_kardex_alm FOREIGN KEY (id_almacen)
        REFERENCES almacenes (id_almacen),
    CONSTRAINT fk_kardex_usr FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario)
);


-- MÓDULO: PROVEEDORES
CREATE TABLE proveedores (
    id_proveedor   INT          NOT NULL IDENTITY(1,1),
    ruc            VARCHAR(11)  NOT NULL,
    nombre         VARCHAR(150) NOT NULL,
    direccion      VARCHAR(200) NULL,
    telefono       VARCHAR(15)  NULL,
    correo         VARCHAR(100) NULL,
    web            VARCHAR(150) NULL,
    condicion_pago VARCHAR(10)  NOT NULL DEFAULT 'contado'
        CHECK (condicion_pago IN ('contado','30_dias','60_dias','90_dias')),
    activo         BIT          NOT NULL DEFAULT 1,
    creado_en      DATETIME2    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_proveedores     PRIMARY KEY (id_proveedor),
    CONSTRAINT uq_proveedores_ruc UNIQUE (ruc)
);

CREATE TABLE contactos_proveedor (
    id_contacto INT NOT NULL IDENTITY(1,1),
    id_proveedor INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    cargo VARCHAR(60) NULL,
    telefono VARCHAR(15) NULL,
    correo VARCHAR(100) NULL,
    es_principal BIT NOT NULL DEFAULT 0,
    CONSTRAINT pk_contactos PRIMARY KEY (id_contacto),
    CONSTRAINT fk_contactos_prov FOREIGN KEY (id_proveedor)
        REFERENCES proveedores (id_proveedor)
);

CREATE TABLE productos_proveedor (
    id INT NOT NULL IDENTITY(1,1),
    id_producto INT NOT NULL,
    id_proveedor INT NOT NULL,
    codigo_proveedor VARCHAR(50)   NULL,
    precio_compra DECIMAL(10,2) NOT NULL,
    tiempo_entrega_dias INT NULL,
    es_preferido BIT NOT NULL DEFAULT 0,
    CONSTRAINT pk_prod_prov PRIMARY KEY (id),
    CONSTRAINT uq_prod_prov UNIQUE (id_producto, id_proveedor),
    CONSTRAINT fk_prod_prov_prod FOREIGN KEY (id_producto)
        REFERENCES productos (id_producto),
    CONSTRAINT fk_prod_prov_prov FOREIGN KEY (id_proveedor)
        REFERENCES proveedores (id_proveedor),
    CONSTRAINT chk_prod_prov_precio CHECK (precio_compra >= 0)
);

-- MÓDULO: COMPRAS
CREATE TABLE ordenes_compra (
    id_orden INT NOT NULL IDENTITY(1,1),
    id_proveedor INT NOT NULL,
    id_empleado INT NOT NULL,
    numero_orden VARCHAR(20) NOT NULL,
    fecha DATETIME2 NOT NULL DEFAULT GETDATE(),
    fecha_esperada DATE NULL,
    estado VARCHAR(10) NOT NULL DEFAULT 'borrador'
        CHECK (estado IN ('borrador','enviada','recibida','anulada')),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    igv DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    observacion NVARCHAR(MAX) NULL,
    CONSTRAINT pk_ordenes_compra PRIMARY KEY (id_orden),
    CONSTRAINT uq_ordenes_numero UNIQUE (numero_orden),
    CONSTRAINT fk_ordenes_prov FOREIGN KEY (id_proveedor)
        REFERENCES proveedores (id_proveedor),
    CONSTRAINT fk_ordenes_emp FOREIGN KEY (id_empleado)
        REFERENCES empleados (id_empleado)
);

CREATE TABLE detalle_orden_compra (
    id_detalle INT NOT NULL IDENTITY(1,1),
    id_orden INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad_solicitada DECIMAL(10,2) NOT NULL,
    cantidad_recibida DECIMAL(10,2) NOT NULL DEFAULT 0,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_det_orden PRIMARY KEY (id_detalle),
    CONSTRAINT fk_det_orden_orden FOREIGN KEY (id_orden)
        REFERENCES ordenes_compra (id_orden),
    CONSTRAINT fk_det_orden_prod FOREIGN KEY (id_producto)
        REFERENCES productos (id_producto),
    CONSTRAINT chk_det_orden_cant CHECK (cantidad_solicitada > 0)
);

CREATE TABLE recepciones (
    id_recepcion INT NOT NULL IDENTITY(1,1),
    id_orden INT NOT NULL,
    id_almacen INT NOT NULL,
    id_empleado INT NOT NULL,
    fecha DATETIME2 NOT NULL DEFAULT GETDATE(),
    numero_guia VARCHAR(30) NULL,
    observacion NVARCHAR(MAX) NULL,
    CONSTRAINT pk_recepciones PRIMARY KEY (id_recepcion),
    CONSTRAINT fk_recepciones_orden FOREIGN KEY (id_orden)
        REFERENCES ordenes_compra (id_orden),
    CONSTRAINT fk_recepciones_alm FOREIGN KEY (id_almacen)
        REFERENCES almacenes (id_almacen),
    CONSTRAINT fk_recepciones_emp FOREIGN KEY (id_empleado)
        REFERENCES empleados (id_empleado)
);

CREATE TABLE detalle_recepcion (
    id_detalle INT NOT NULL IDENTITY(1,1),
    id_recepcion INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad_recibida DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    numero_lote VARCHAR(50) NULL,
    fecha_vencimiento DATE NULL,
    CONSTRAINT pk_det_recepcion PRIMARY KEY (id_detalle),
    CONSTRAINT fk_det_recepcion_rec FOREIGN KEY (id_recepcion)
        REFERENCES recepciones (id_recepcion),
    CONSTRAINT fk_det_recepcion_prod FOREIGN KEY (id_producto)
        REFERENCES productos (id_producto),
    CONSTRAINT chk_det_recep_cant CHECK (cantidad_recibida > 0)
);

-- MÓDULO: VENTAS
CREATE TABLE serie_comprobantes (
    id_serie INT NOT NULL IDENTITY(1,1),
    tipo_comprobante VARCHAR(10) NOT NULL
        CHECK (tipo_comprobante IN ('boleta','factura','nota_venta')),
    serie VARCHAR(4) NOT NULL,
    correlativo_actual INT NOT NULL DEFAULT 0,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT pk_serie_comp PRIMARY KEY (id_serie),
    CONSTRAINT uq_serie_comp UNIQUE (tipo_comprobante, serie)
);

CREATE TABLE tipos_pago (
    id_tipo_pago INT NOT NULL IDENTITY(1,1),
    nombre VARCHAR(40) NOT NULL,
    requiere_voucher BIT NOT NULL DEFAULT 0,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT pk_tipos_pago        PRIMARY KEY (id_tipo_pago),
    CONSTRAINT uq_tipos_pago_nombre UNIQUE (nombre)
);

CREATE TABLE ventas (
    id_venta INT NOT NULL IDENTITY(1,1),
    id_cliente INT NULL,
    id_empleado INT NOT NULL,
    id_serie INT NOT NULL,
    numero_comprobante VARCHAR(20)   NOT NULL,
    fecha DATETIME2 NOT NULL DEFAULT GETDATE(),
    subtotal DECIMAL(10,2) NOT NULL,
    igv DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(10) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente','pagada','anulada')),
    observacion NVARCHAR(MAX) NULL,
    CONSTRAINT pk_ventas PRIMARY KEY (id_venta),
    CONSTRAINT uq_ventas_comp UNIQUE (numero_comprobante),
    CONSTRAINT fk_ventas_cliente FOREIGN KEY (id_cliente)
        REFERENCES clientes (id_cliente),
    CONSTRAINT fk_ventas_emp FOREIGN KEY (id_empleado)
        REFERENCES empleados (id_empleado),
    CONSTRAINT fk_ventas_serie FOREIGN KEY (id_serie)
        REFERENCES serie_comprobantes (id_serie)
);

CREATE TABLE detalle_venta (
    id_detalle INT NOT NULL IDENTITY(1,1),
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_det_venta PRIMARY KEY (id_detalle),
    CONSTRAINT fk_det_venta_venta FOREIGN KEY (id_venta)
        REFERENCES ventas (id_venta),
    CONSTRAINT fk_det_venta_prod  FOREIGN KEY (id_producto)
        REFERENCES productos (id_producto),
    CONSTRAINT chk_det_venta_cant CHECK (cantidad > 0)
);

CREATE TABLE pagos_venta (
    id_pago INT NOT NULL IDENTITY(1,1),
    id_venta INT NOT NULL,
    id_tipo_pago INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    numero_operacion VARCHAR(50)   NULL,
    fecha DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_pagos_venta PRIMARY KEY (id_pago),
    CONSTRAINT fk_pagos_venta_v FOREIGN KEY (id_venta)
        REFERENCES ventas (id_venta),
    CONSTRAINT fk_pagos_venta_tp FOREIGN KEY (id_tipo_pago)
        REFERENCES tipos_pago (id_tipo_pago),
    CONSTRAINT chk_pagos_monto   CHECK (monto > 0)
);

-- MÓDULO: DEVOLUCIONES
CREATE TABLE devoluciones (
    id_devolucion INT NOT NULL IDENTITY(1,1),
    id_venta INT NOT NULL,
    id_empleado INT NOT NULL,
    fecha DATETIME2 NOT NULL DEFAULT GETDATE(),
    motivo VARCHAR(200)  NOT NULL,
    tipo VARCHAR(10) NOT NULL
        CHECK (tipo IN ('cambio','reembolso')),
    estado VARCHAR(10) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente','procesada','anulada')),
    monto_reembolso DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT pk_devoluciones PRIMARY KEY (id_devolucion),
    CONSTRAINT fk_devoluciones_v FOREIGN KEY (id_venta)
        REFERENCES ventas (id_venta),
    CONSTRAINT fk_devoluciones_emp FOREIGN KEY (id_empleado)
        REFERENCES empleados (id_empleado)
);

CREATE TABLE detalle_devolucion (
    id_detalle INT NOT NULL IDENTITY(1,1),
    id_devolucion INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    reingresa_stock BIT NOT NULL DEFAULT 1,
    precio_devuelto DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_det_devolucion PRIMARY KEY (id_detalle),
    CONSTRAINT fk_det_dev_dev FOREIGN KEY (id_devolucion)
        REFERENCES devoluciones (id_devolucion),
    CONSTRAINT fk_det_dev_prod FOREIGN KEY (id_producto)
        REFERENCES productos (id_producto),
    CONSTRAINT chk_det_dev_cant CHECK (cantidad > 0)
);

-- MÓDULO: CAJA
CREATE TABLE cajas (
    id_caja INT NOT NULL IDENTITY(1,1),
    id_empleado INT NOT NULL,
    numero_turno INT NOT NULL,
    fecha_apertura DATETIME2 NOT NULL,
    fecha_cierre DATETIME2 NULL,
    monto_inicial DECIMAL(10,2) NOT NULL,
    monto_esperado DECIMAL(10,2) NOT NULL DEFAULT 0,
    monto_real DECIMAL(10,2) NULL,
    diferencia DECIMAL(10,2) NULL,
    observacion NVARCHAR(200) NULL,
    estado VARCHAR(10) NOT NULL DEFAULT 'abierta'
        CHECK (estado IN ('abierta','cerrada')),
    CONSTRAINT pk_cajas PRIMARY KEY (id_caja),
    CONSTRAINT fk_cajas_emp FOREIGN KEY (id_empleado)
        REFERENCES empleados (id_empleado),
    CONSTRAINT chk_cajas_monto CHECK (monto_inicial >= 0),
    CONSTRAINT chk_cajas_turno CHECK (numero_turno > 0)
);


CREATE TABLE movimientos_caja (
    id_movimiento INT NOT NULL IDENTITY(1,1),
    id_caja INT NOT NULL,
    id_usuario INT NOT NULL,
    tipo VARCHAR(8) NOT NULL
        CHECK (tipo IN ('ingreso','egreso')),
    concepto VARCHAR(150) NOT NULL,
    referencia_id INT NULL,
    monto DECIMAL(10,2) NOT NULL,
    registrado_en DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_mov_caja PRIMARY KEY (id_movimiento),
    CONSTRAINT fk_mov_caja_caja FOREIGN KEY (id_caja)
        REFERENCES cajas (id_caja),
    CONSTRAINT fk_mov_caja_usr  FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario),
    CONSTRAINT chk_mov_monto CHECK (monto > 0)
);
