const { query } = require('d:/Bases de datos/FERRETERIA1/server/db/conexion_sql');

async function run() {
    try {
        console.log('Verificando si existe la tabla productos_almacen...');
        
        // 1. Crear tabla si no existe
        await query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='productos_almacen' and xtype='U')
            BEGIN
                CREATE TABLE productos_almacen (
                    id_producto INT NOT NULL,
                    id_almacen INT NOT NULL,
                    stock DECIMAL(10,2) NOT NULL DEFAULT 0,
                    CONSTRAINT pk_productos_almacen PRIMARY KEY (id_producto, id_almacen),
                    CONSTRAINT fk_prod_alm_prod FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
                    CONSTRAINT fk_prod_alm_alm FOREIGN KEY (id_almacen) REFERENCES almacenes(id_almacen)
                );
                PRINT 'Tabla productos_almacen creada.';
            END
            ELSE
            BEGIN
                PRINT 'La tabla productos_almacen ya existe.';
            END
        `);

        // 2. Poblar con datos iniciales si está vacía
        const countRes = await query('SELECT COUNT(*) AS total FROM productos_almacen');
        if (countRes.recordset[0].total === 0) {
            console.log('Poblando productos_almacen con el stock actual...');
            
            // Insertar para Almacén Principal (id=1) con el stock_actual de la tabla productos
            await query(`
                INSERT INTO productos_almacen (id_producto, id_almacen, stock)
                SELECT id_producto, 1, stock_actual FROM productos;
            `);

            // Insertar para Depósito Secundario (id=2) con stock 0
            await query(`
                INSERT INTO productos_almacen (id_producto, id_almacen, stock)
                SELECT id_producto, 2, 0 FROM productos;
            `);

            // Si hay transferencias completadas históricas, ajustar el stock de origen/destino
            // En inserts.sql la transferencia 1 movió stock a Depósito Secundario (id=2)
            // Producto 1: 50, Producto 8: 100, Producto 25: 20, Producto 27: 20
            await query(`
                UPDATE productos_almacen SET stock = 50 WHERE id_producto = 1 AND id_almacen = 2;
                UPDATE productos_almacen SET stock = stock - 50 WHERE id_producto = 1 AND id_almacen = 1;

                UPDATE productos_almacen SET stock = 100 WHERE id_producto = 8 AND id_almacen = 2;
                UPDATE productos_almacen SET stock = stock - 100 WHERE id_producto = 8 AND id_almacen = 1;

                UPDATE productos_almacen SET stock = 20 WHERE id_producto = 25 AND id_almacen = 2;
                UPDATE productos_almacen SET stock = stock - 20 WHERE id_producto = 25 AND id_almacen = 1;

                UPDATE productos_almacen SET stock = 20 WHERE id_producto = 27 AND id_almacen = 2;
                UPDATE productos_almacen SET stock = stock - 20 WHERE id_producto = 27 AND id_almacen = 1;
            `);

            console.log('Productos_almacen poblada con éxito.');
        } else {
            console.log('productos_almacen ya tiene datos, no es necesario poblar.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error al ejecutar el script de DDL:', err);
        process.exit(1);
    }
}

run();
