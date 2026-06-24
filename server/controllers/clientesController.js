
const { sql, query } = require('../db/conexion_sql');


const clientesController = {

    // 1. OBTENER TODOS LOS CLIENTES (Con filtros opcionales de Nombre o Documento)
    getAll: async (req, res, next) => {
        try {
            const { nombre, documento, tipo_documento, activo } = req.query;

            let queryStr = "SELECT id_cliente, tipo_documento, numero_documento, nombre, telefono, correo, activo, creado_en FROM clientes WHERE 1=1";
            const parametros = {};

            // Filtro dinámico por nombre
            if (nombre) {
                queryStr += " AND nombre LIKE @nombre";
                parametros.nombre = { type: sql.VarChar(150), value: `%${nombre}%` };
            }

            // Filtro dinámico por número de documento
            if (documento) {
                queryStr += " AND numero_documento LIKE @documento";
                parametros.documento = { type: sql.VarChar(15), value: `%${documento}%` };
            }

            // Filtro dinámico por tipo de documento (DNI / RUC / CE)
            if (tipo_documento) {
                queryStr += " AND tipo_documento = @tipo_documento";
                parametros.tipo_documento = { type: sql.VarChar(3), value: tipo_documento };
            }

            // Filtro dinámico por estado activo/inactivo
            if (activo !== undefined && activo !== '') {
                queryStr += " AND activo = @activo";
                parametros.activo = { type: sql.Bit, value: parseInt(activo) };
            }

            // Ordenar por los más recientes por defecto
            queryStr += " ORDER BY id_cliente DESC";

            const resultado = await query(queryStr, parametros);
            return res.status(200).json(resultado.recordset);
        } catch (error) {
            next(error); // Delega el error al manejador global de tu servidor.js
        }
    },

    // 2. OBTENER UN CLIENTE POR ID (Detalle + Historial básico de compras)
    getById: async (req, res, next) => {
        try {
            const { id } = req.params;

            //Consultar datos del cliente
            const queryCliente = "SELECT * FROM clientes WHERE id_cliente = @id";
            const resCliente = await query(queryCliente, { id: { type: sql.Int, value: id } });

            if (resCliente.recordset.length === 0) {
                return res.status(404).json({ error: "Cliente no encontrado" });
            }

            const cliente = resCliente.recordset[0];

            //Traer las últimas compras asociadas a este cliente
            const queryCompras = "SELECT top 10 id_venta, numero_comprobante, fecha, total, estado FROM ventas WHERE id_cliente = @id ORDER BY fecha DESC";
            const resCompras = await query(queryCompras, { id: { type: sql.Int, value: id } });

            //Adjuntar el historial al objeto del cliente
            cliente.historial_compras = resCompras.recordset;

            return res.status(200).json(cliente);
        } catch (error) {
            next(error);
        }
    },

    // 3. CREAR UN NUEVO CLIENTE (Evitando documentos duplicados)
    create: async (req, res, next) => {
        try {
            const { tipo_documento, numero_documento, nombre, telefono, correo } = req.body;

            // Validaciones básicas de campos obligatorios
            if (!tipo_documento || !numero_documento || !nombre) {
                return res.status(400).json({ error: "Los campos tipo_documento, numero_documento y nombre son obligatorios" });
            }

            // Validar longitud del documento según su tipo (DNI=8, RUC=11, CE=12)
            const errorDocumento = validarLongitudDocumento(tipo_documento, numero_documento);
            if (errorDocumento) {
                return res.status(400).json({ error: errorDocumento });
            }

            // Validar formato del teléfono (opcional, pero si se envía debe ser numérico)
            const errorTelefono = validarTelefono(telefono);
            if (errorTelefono) {
                return res.status(400).json({ error: errorTelefono });
            }

            // Validar si el número de documento ya existe en la base de datos
            const queryExiste = "SELECT id_cliente FROM clientes WHERE numero_documento = @numero_documento";
            const resExiste = await query(queryExiste, { numero_documento: { type: sql.VarChar(15), value: numero_documento } });

            if (resExiste.recordset.length > 0) {
                return res.status(400).json({ error: `El documento ${numero_documento} ya se encuentra registrado.` });
            }

            // Insertar el nuevo cliente
            const queryInsert = `
                INSERT INTO clientes (tipo_documento, numero_documento, nombre, telefono, correo, activo)
                OUTPUT INSERTED.id_cliente
                VALUES (@tipo_documento, @numero_documento, @nombre, @telefono, @correo, 1)
            `;

            const paramsInsert = {
                tipo_documento: { type: sql.VarChar(3), value: tipo_documento },
                numero_documento: { type: sql.VarChar(15), value: numero_documento },
                nombre: { type: sql.VarChar(150), value: nombre },
                telefono: { type: sql.VarChar(15), value: telefono || null },
                correo: { type: sql.VarChar(100), value: correo || null }
            };

            const resInsert = await query(queryInsert, paramsInsert);

            return res.status(201).json({
                message: "Cliente creado exitosamente",
                id_cliente: resInsert.recordset[0].id_cliente
            });
        } catch (error) {
            next(error);
        }
    },

    // 4. ACTUALIZAR DATOS DE UN CLIENTE
    update: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { tipo_documento, numero_documento, nombre, telefono, correo, activo } = req.body;

            // Verificar si existe el cliente
            const queryExiste = "SELECT id_cliente FROM clientes WHERE id_cliente = @id";
            const resExiste = await query(queryExiste, { id: { type: sql.Int, value: id } });

            // Validar longitud del documento según su tipo (DNI=8, RUC=11, CE=12)
            const errorDocumento = validarLongitudDocumento(tipo_documento, numero_documento);
            if (errorDocumento) {
                return res.status(400).json({ error: errorDocumento });
            }

            // Validar formato del teléfono (opcional, pero si se envía debe ser numérico)
            const errorTelefono = validarTelefono(telefono);
            if (errorTelefono) {
                return res.status(400).json({ error: errorTelefono });
            }

            if (resExiste.recordset.length === 0) {
                return res.status(404).json({ error: "Cliente no encontrado" });
            }

            // Verificar que si cambia el documento, no choque con el de otro cliente existente
            const queryDocRepetido = "SELECT id_cliente FROM clientes WHERE numero_documento = @numero_documento AND id_cliente <> @id";
            const resDocRepetido = await query(queryDocRepetido, {
                numero_documento: { type: sql.VarChar(15), value: numero_documento },
                id: { type: sql.Int, value: id }
            });

            if (resDocRepetido.recordset.length > 0) {
                return res.status(400).json({ error: "El número de documento ya está asignado a otro cliente." });
            }

            // Ejecutar la actualización
            const queryUpdate = `
                UPDATE clientes 
                SET tipo_documento = @tipo_documento, 
                    numero_documento = @numero_documento, 
                    nombre = @nombre, 
                    telefono = @telefono, 
                    correo = @correo,
                    activo = @activo
                WHERE id_cliente = @id
            `;

            await query(queryUpdate, {
                id: { type: sql.Int, value: id },
                tipo_documento: { type: sql.VarChar(3), value: tipo_documento },
                numero_documento: { type: sql.VarChar(15), value: numero_documento },
                nombre: { type: sql.VarChar(150), value: nombre },
                telefono: { type: sql.VarChar(15), value: telefono || null },
                correo: { type: sql.VarChar(100), value: correo || null },
                activo: { type: sql.Bit, value: activo !== undefined ? activo : 1 }
            });

            return res.status(200).json({ message: "Cliente actualizado correctamente" });
        } catch (error) {
            next(error);
        }
    },

    // 5. DESACTIVACIÓN LÓGICA (Baja)
    deactivate: async (req, res, next) => {
        try {
            const { id } = req.params;

            const queryDeactivate = "UPDATE clientes SET activo = 0 WHERE id_cliente = @id";
            const resultado = await query(queryDeactivate, { id: { type: sql.Int, value: id } });

            if (resultado.rowsAffected[0] === 0) {
                return res.status(404).json({ error: "Cliente no encontrado" });
            }

            return res.status(200).json({ message: "Cliente desactivado correctamente" });
        } catch (error) {
            next(error);
        }
    }
};

// Valida que el número de documento tenga la longitud exacta según su tipo
function validarLongitudDocumento(tipo_documento, numero_documento) {
    const reglas = {
        DNI: { longitud: 8, etiqueta: 'DNI' },
        RUC: { longitud: 11, etiqueta: 'RUC' },
        CE: { longitud: 12, etiqueta: 'Carné de Extranjería' },
    };

    const regla = reglas[tipo_documento];
    if (!regla) {
        return `Tipo de documento "${tipo_documento}" no reconocido. Debe ser DNI, RUC o CE.`;
    }
    if (!/^\d+$/.test(numero_documento)) {
        return `El ${regla.etiqueta} debe contener solo números.`;
    }
    if (numero_documento.length !== regla.longitud) {
        return `El ${regla.etiqueta} debe tener exactamente ${regla.longitud} dígitos.`;
    }
    return null;
}

// Valida que el teléfono contenga solo 9 números
function validarTelefono(telefono) {
    if (!telefono) return null; // es opcional, NULL es válido
    if (!/^\d+$/.test(telefono)) {
        return 'El teléfono debe contener solo números.';
    }
    if (telefono.length < 6 || telefono.length > 9) {
        return 'El teléfono debe tener entre 6 y 9 dígitos.';
    }
    return null;
}


module.exports = clientesController;