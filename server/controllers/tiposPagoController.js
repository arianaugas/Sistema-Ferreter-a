const { query } = require('../db/conexion_sql');
const sql = require('mssql/msnodesqlv8');

const tiposPagoController = {
    // 1. Obtener todos los tipos de pago (filtrable por activo)
    getAll: async (req, res, next) => {
        try {
            const { activo } = req.query;
            let queryStr = "SELECT id_tipo_pago, nombre, requiere_voucher, activo FROM tipos_pago WHERE 1=1";
            const params = {};

            if (activo !== undefined && activo !== '') {
                queryStr += " AND activo = @activo";
                params.activo = { type: sql.Bit, value: parseInt(activo) };
            }

            queryStr += " ORDER BY nombre ASC";

            const result = await query(queryStr, params);
            return res.status(200).json(result.recordset);
        } catch (error) {
            next(error);
        }
    },

    // 2. Obtener un tipo de pago por ID
    getById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const queryStr = "SELECT id_tipo_pago, nombre, requiere_voucher, activo FROM tipos_pago WHERE id_tipo_pago = @id";
            const result = await query(queryStr, { id: { type: sql.Int, value: id } });

            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'El tipo de pago especificado no existe.' });
            }

            return res.status(200).json(result.recordset[0]);
        } catch (error) {
            next(error);
        }
    },

    // 3. Crear un nuevo tipo de pago
    crear: async (req, res, next) => {
        try {
            const { nombre, requiere_voucher, activo } = req.body;

            if (!nombre) {
                return res.status(400).json({ error: 'El nombre es obligatorio.' });
            }

            // Validar si el nombre ya existe
            const queryExiste = "SELECT id_tipo_pago FROM tipos_pago WHERE nombre = @nombre";
            const resExiste = await query(queryExiste, { nombre: { type: sql.VarChar(40), value: nombre } });

            if (resExiste.recordset.length > 0) {
                return res.status(400).json({ error: `El tipo de pago '${nombre}' ya se encuentra registrado.` });
            }

            const queryInsert = `
                INSERT INTO tipos_pago (nombre, requiere_voucher, activo)
                OUTPUT INSERTED.id_tipo_pago
                VALUES (@nombre, @requiere_voucher, @activo)
            `;

            const resInsert = await query(queryInsert, {
                nombre: { type: sql.VarChar(40), value: nombre },
                requiere_voucher: { type: sql.Bit, value: requiere_voucher !== undefined ? (requiere_voucher ? 1 : 0) : 0 },
                activo: { type: sql.Bit, value: activo !== undefined ? (activo ? 1 : 0) : 1 }
            });

            return res.status(201).json({
                message: 'Tipo de pago creado exitosamente.',
                id_tipo_pago: resInsert.recordset[0].id_tipo_pago
            });
        } catch (error) {
            next(error);
        }
    },

    // 4. Actualizar un tipo de pago existente
    actualizar: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { nombre, requiere_voucher, activo } = req.body;

            if (!nombre) {
                return res.status(400).json({ error: 'El nombre es obligatorio.' });
            }

            // Verificar si existe
            const queryExiste = "SELECT id_tipo_pago FROM tipos_pago WHERE id_tipo_pago = @id";
            const resExiste = await query(queryExiste, { id: { type: sql.Int, value: id } });

            if (resExiste.recordset.length === 0) {
                return res.status(404).json({ error: 'El tipo de pago a actualizar no existe.' });
            }

            // Validar que el nuevo nombre no colisione con otro
            const queryColision = "SELECT id_tipo_pago FROM tipos_pago WHERE nombre = @nombre AND id_tipo_pago <> @id";
            const resColision = await query(queryColision, {
                nombre: { type: sql.VarChar(40), value: nombre },
                id: { type: sql.Int, value: id }
            });

            if (resColision.recordset.length > 0) {
                return res.status(400).json({ error: `Ya existe otro tipo de pago registrado con el nombre '${nombre}'.` });
            }

            const queryUpdate = `
                UPDATE tipos_pago
                SET nombre = @nombre,
                    requiere_voucher = @requiere_voucher,
                    activo = @activo
                WHERE id_tipo_pago = @id
            `;

            await query(queryUpdate, {
                id: { type: sql.Int, value: id },
                nombre: { type: sql.VarChar(40), value: nombre },
                requiere_voucher: { type: sql.Bit, value: requiere_voucher !== undefined ? (requiere_voucher ? 1 : 0) : 0 },
                activo: { type: sql.Bit, value: activo !== undefined ? (activo ? 1 : 0) : 1 }
            });

            return res.status(200).json({ message: 'Tipo de pago actualizado correctamente.' });
        } catch (error) {
            next(error);
        }
    },

    // 5. Desactivar un tipo de pago
    eliminar: async (req, res, next) => {
        try {
            const { id } = req.params;

            const queryDeactivate = "UPDATE tipos_pago SET activo = 0 WHERE id_tipo_pago = @id";
            const result = await query(queryDeactivate, { id: { type: sql.Int, value: id } });

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ error: 'El tipo de pago especificado no existe.' });
            }

            return res.status(200).json({ message: 'Tipo de pago desactivado correctamente.' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = tiposPagoController;
