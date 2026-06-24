const { sql, query } = require('../db/conexion_sql');

// Mapa URL de la tabla afectada
const TABLA_MAP = [
    { patron: '/clientes',          tabla: 'clientes' },
    { patron: '/ventas',            tabla: 'ventas' },
    { patron: '/caja',              tabla: 'cajas' },
    { patron: '/productos',         tabla: 'productos' },
    { patron: '/empleados',         tabla: 'empleados' },
    { patron: '/auth/users',        tabla: 'usuarios' },
    { patron: '/compras',           tabla: 'ordenes_compra' },
    { patron: '/devoluciones',      tabla: 'devoluciones' },
    { patron: '/inventario',        tabla: 'inventario' },
    { patron: '/proveedores',       tabla: 'proveedores' },
    { patron: '/subcategorias',     tabla: 'subcategorias' },  // antes que /categorias
    { patron: '/categorias',        tabla: 'categorias' },
    { patron: '/catalogo/marcas',   tabla: 'marcas' },
    { patron: '/catalogo/unidades', tabla: 'unidades_medida' },
    { patron: '/configuracion',     tabla: 'configuracion' },
];

const auditMiddleware = async (req, res, next) => {
    const metodosAuditables = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (!metodosAuditables.includes(req.method)) {
        return next();
    }

    const originalSend = res.send;

    res.send = function (data) {
        res.send = originalSend;

        if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
                // Tabla: primer patrón que coincida, o 'desconocida'
                const entrada = TABLA_MAP.find(m => req.originalUrl.includes(m.patron));
                const tablaAfectada = entrada ? entrada.tabla : 'desconocida';

                // Operación según método HTTP
                let operacion = 'UPDATE';
                if (req.method === 'POST')   operacion = 'INSERT';
                if (req.method === 'DELETE') operacion = 'DELETE';

                // id_usuario siempre del token, nunca del body
                const id_usuario = req.user?.id || null;
                const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
                const datosNuevos = JSON.stringify(req.body);

                query(
                    `INSERT INTO auditoria (id_usuario, tabla_afectada, operacion, registro_id, datos_anteriores, datos_nuevos, ip, registrado_en)
                     VALUES (@id_usuario, @tabla, @operacion, 0, null, @datos_nuevos, @ip, GETDATE())`,
                    {
                        id_usuario:   { type: sql.Int,              value: id_usuario },
                        tabla:        { type: sql.VarChar(60),      value: tablaAfectada },
                        operacion:    { type: sql.VarChar(10),      value: operacion },
                        datos_nuevos: { type: sql.NVarChar(sql.MAX), value: datosNuevos },
                        ip:           { type: sql.VarChar(45),      value: ip }
                    }
                ).catch(err => console.error('Error al escribir auditoría:', err));

            } catch (auditError) {
                console.error('Fallo en middleware de auditoría:', auditError);
            }
        }

        return originalSend.apply(res, arguments);
    };

    next();
};

module.exports = auditMiddleware;