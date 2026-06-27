const { sql, query } = require('../db/conexion_sql');

// Mapa URL -> tabla afectada + clave primaria (para poder leer el estado anterior y el registro_id real)
const TABLA_MAP = [
    { patron: '/clientes', tabla: 'clientes', pk: 'id_cliente' },
    { patron: '/ventas', tabla: 'ventas', pk: 'id_venta' },
    { patron: '/caja', tabla: 'cajas', pk: 'id_caja' },
    { patron: '/productos', tabla: 'productos', pk: 'id_producto' },
    { patron: '/empleados', tabla: 'empleados', pk: 'id_empleado' },
    { patron: '/auth/users', tabla: 'usuarios', pk: 'id_usuario' },
    { patron: '/compras', tabla: 'ordenes_compra', pk: 'id_orden' },
    { patron: '/devoluciones', tabla: 'devoluciones', pk: 'id_devolucion' },
    { patron: '/inventario', tabla: 'inventario', pk: null }, // ver al trabajar el módulo INVENTARIO
    { patron: '/proveedores', tabla: 'proveedores', pk: 'id_proveedor' },
    { patron: '/subcategorias', tabla: 'subcategorias', pk: 'id_subcategoria' },  // antes que /categorias
    { patron: '/categorias', tabla: 'categorias', pk: 'id_categoria' },
    { patron: '/catalogo/marcas', tabla: 'marcas', pk: 'id_marca' },
    { patron: '/catalogo/unidades', tabla: 'unidades_medida', pk: 'id_unidad' },
    { patron: '/configuracion', tabla: 'configuracion', pk: 'id_config', matchCol: 'clave', matchParam: 'clave' },
];

// Quita contraseñas de cualquier objeto antes de guardarlo en la auditoría
function redactar(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const clone = Array.isArray(obj) ? obj.map(redactar) : { ...obj };
    if (!Array.isArray(clone)) {
        for (const key of Object.keys(clone)) {
            if (/contrasena/i.test(key)) {
                clone[key] = '[oculto]';
            } else if (clone[key] && typeof clone[key] === 'object') {
                clone[key] = redactar(clone[key]);
            }
        }
    }
    return clone;
}

// Busca, dentro de la respuesta del controller, el objeto que representa la fila
// (el que tiene la columna pk como propia), hasta 2 niveles de profundidad
function buscarFila(obj, pk, depth = 2) {
    if (!obj || typeof obj !== 'object' || depth < 0) return null;
    if (Object.prototype.hasOwnProperty.call(obj, pk)) return obj;
    for (const val of Object.values(obj)) {
        if (val && typeof val === 'object') {
            const candidato = Array.isArray(val) ? val[0] : val;
            const encontrado = buscarFila(candidato, pk, depth - 1);
            if (encontrado) return encontrado;
        }
    }
    return null;
}

// Express aún no ha hecho el routing cuando corre este middleware
//  Extraemos el valor directamente de la URL en su lugar.
function extraerValorRuta(originalUrl, patron, matchParam) {
    const path = originalUrl.split('?')[0];
    const idx = path.indexOf(patron);
    if (idx === -1) return undefined;

    const resto = path.slice(idx + patron.length); // ej: "/5/anular", "/5", "/igv"
    const segmentos = resto.split('/').filter(Boolean);
    if (segmentos.length === 0) return undefined;

    if (matchParam === 'clave') {
        return segmentos[0]; // la clave es alfanumérica, va siempre primero
    }
    // para ids numéricos, tomamos el primer segmento que sea solo dígitos
    // (cubre rutas como /:id/anular, donde el id no es el último segmento)
    return segmentos.find(s => /^\d+$/.test(s));
}

const auditMiddleware = async (req, res, next) => {
    const metodosAuditables = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!metodosAuditables.includes(req.method)) {
        return next();
    }

    const entrada = TABLA_MAP.find(m => req.originalUrl.includes(m.patron));
    const tablaAfectada = entrada ? entrada.tabla : 'desconocida';

    req._auditAnterior = null;
    req._auditRegistroId = 0;

    // Para UPDATE/DELETE leemos el estado ANTES de que el controller lo modifique
    if (entrada && entrada.pk && req.method !== 'POST') {
        const matchCol = entrada.matchCol || entrada.pk;
        const matchParam = entrada.matchParam || 'id';
        const valorParam = extraerValorRuta(req.originalUrl, entrada.patron, matchParam);

        if (valorParam !== undefined) {
            try {
                const esTexto = matchParam === 'clave';
                const valorTipado = esTexto ? String(valorParam) : parseInt(valorParam, 10);

                if (esTexto || !Number.isNaN(valorTipado)) {
                    const prev = await query(
                        `SELECT * FROM ${tablaAfectada} WHERE ${matchCol} = @valor`,
                        { valor: { type: esTexto ? sql.VarChar : sql.Int, value: valorTipado } }
                    );
                    if (prev.recordset[0]) {
                        req._auditAnterior = prev.recordset[0];
                        req._auditRegistroId = Number(prev.recordset[0][entrada.pk]) || 0;
                    }
                }
            } catch (e) {
                console.error('Auditoría: no se pudo leer el estado anterior:', e.message);
            }
        }
    }

    const originalSend = res.send;

    res.send = function (data) {
        res.send = originalSend;

        if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
                let operacion = 'UPDATE';
                if (req.method === 'POST')   operacion = 'INSERT';
                if (req.method === 'DELETE') operacion = 'DELETE';

                const id_usuario = req.user?.id || null;
                const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';

                let parsedResp = null;
                try { parsedResp = typeof data === 'string' ? JSON.parse(data) : data; } catch (_) { /* no era JSON */ }

                let registroId = req._auditRegistroId;
                let datosNuevos = null;

                if (entrada && entrada.pk && operacion !== 'DELETE') {
                    const fila = buscarFila(parsedResp, entrada.pk);
                    if (fila) {
                        if (!registroId) registroId = Number(fila[entrada.pk]) || 0;
                        datosNuevos = redactar(fila);
                    }
                }

                // Respaldo si el controller solo devolvió un "message" sin la fila (ej. clientes.update)
                if (!registroId) {
                    const idParam = parseInt(req.params.id, 10);
                    if (!Number.isNaN(idParam)) registroId = idParam;
                }
                if (!datosNuevos && operacion !== 'DELETE') {
                    datosNuevos = redactar(req.body);
                }

                query(
                    `INSERT INTO auditoria (id_usuario, tabla_afectada, operacion, registro_id, datos_anteriores, datos_nuevos, ip, registrado_en)
                    VALUES (@id_usuario, @tabla, @operacion, @registro_id, @datos_anteriores, @datos_nuevos, @ip, GETDATE())`,
                    {
                        id_usuario: { type: sql.Int, value: id_usuario },
                        tabla: { type: sql.VarChar(60), value: tablaAfectada },
                        operacion: { type: sql.VarChar(10), value: operacion },
                        registro_id: { type: sql.Int, value: registroId || 0 },
                        datos_anteriores: { type: sql.NVarChar(sql.MAX), value: req._auditAnterior ? JSON.stringify(redactar(req._auditAnterior)) : null },
                        datos_nuevos: { type: sql.NVarChar(sql.MAX), value: datosNuevos ? JSON.stringify(datosNuevos) : null },
                        ip: { type: sql.VarChar(45), value: ip }
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