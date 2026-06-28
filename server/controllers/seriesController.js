const { sql , query } = require('../db/conexion_sql');

const seriesController = {
    // 1. Obtener todas las series (con filtros opcionales)
    getAll: async (req, res, next) => {
        try {
            const { tipo_comprobante, activo } = req.query;
            let queryStr = "SELECT id_serie, tipo_comprobante, serie, correlativo_actual, activo FROM serie_comprobantes WHERE 1=1";
            const params = {};

            if (tipo_comprobante) {
                queryStr += " AND tipo_comprobante = @tipo_comprobante";
                params.tipo_comprobante = { type: sql.VarChar(10), value: tipo_comprobante };
            }

            if (activo !== undefined && activo !== '') {
                queryStr += " AND activo = @activo";
                params.activo = { type: sql.Bit, value: parseInt(activo) };
            }

            queryStr += " ORDER BY tipo_comprobante ASC, serie ASC";

            const result = await query(queryStr, params);
            return res.status(200).json(result.recordset);
        } catch (error) {
            next(error);
        }
    },

    // 2. Obtener una serie por ID
    getById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const queryStr = "SELECT id_serie, tipo_comprobante, serie, correlativo_actual, activo FROM serie_comprobantes WHERE id_serie = @id";
            const result = await query(queryStr, { id: { type: sql.Int, value: id } });

            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'La serie de comprobante especificada no existe.' });
            }

            return res.status(200).json(result.recordset[0]);
        } catch (error) {
            next(error);
        }
    },

    // 3. Crear una nueva serie
    crear: async (req, res, next) => {
        try {
            const { tipo_comprobante, serie, correlativo_actual, activo } = req.body;

            if (!tipo_comprobante || !serie) {
                return res.status(400).json({ error: 'tipo_comprobante y serie son obligatorios.' });
            }

            if (!['boleta', 'factura', 'nota_venta'].includes(tipo_comprobante)) {
                return res.status(400).json({ error: "El tipo de comprobante debe ser: 'boleta', 'factura' o 'nota_venta'." });
            }

            // Validar que la serie sea única para ese tipo de comprobante
            const queryExiste = "SELECT id_serie FROM serie_comprobantes WHERE tipo_comprobante = @tipo AND serie = @serie";
            const resExiste = await query(queryExiste, {
                tipo: { type: sql.VarChar(10), value: tipo_comprobante },
                serie: { type: sql.VarChar(4), value: serie }
            });

            if (resExiste.recordset.length > 0) {
                return res.status(400).json({ error: `La serie '${serie}' ya se encuentra registrada para el tipo de comprobante '${tipo_comprobante}'.` });
            }

            const queryInsert = `
                INSERT INTO serie_comprobantes (tipo_comprobante, serie, correlativo_actual, activo)
                OUTPUT INSERTED.id_serie
                VALUES (@tipo_comprobante, @serie, @correlativo_actual, @activo)
            `;

            const resInsert = await query(queryInsert, {
                tipo_comprobante: { type: sql.VarChar(10), value: tipo_comprobante },
                serie: { type: sql.VarChar(4), value: serie },
                correlativo_actual: { type: sql.Int, value: parseInt(correlativo_actual) || 0 },
                activo: { type: sql.Bit, value: activo !== undefined ? (activo ? 1 : 0) : 1 }
            });

            return res.status(201).json({
                message: 'Serie creada exitosamente.',
                id_serie: resInsert.recordset[0].id_serie
            });
        } catch (error) {
            next(error);
        }
    },

    // 4. Actualizar una serie existente
    actualizar: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { tipo_comprobante, serie, correlativo_actual, activo } = req.body;

            if (!tipo_comprobante || !serie) {
                return res.status(400).json({ error: 'tipo_comprobante y serie son obligatorios.' });
            }

            if (!['boleta', 'factura', 'nota_venta'].includes(tipo_comprobante)) {
                return res.status(400).json({ error: "El tipo de comprobante debe ser: 'boleta', 'factura' o 'nota_venta'." });
            }

            // Verificar si la serie existe
            const queryExiste = "SELECT id_serie FROM serie_comprobantes WHERE id_serie = @id";
            const resExiste = await query(queryExiste, { id: { type: sql.Int, value: id } });

            if (resExiste.recordset.length === 0) {
                return res.status(404).json({ error: 'La serie a actualizar no existe.' });
            }

            // Validar si cambia la serie/tipo y colisiona con otra
            const queryColision = "SELECT id_serie FROM serie_comprobantes WHERE tipo_comprobante = @tipo AND serie = @serie AND id_serie <> @id";
            const resColision = await query(queryColision, {
                tipo: { type: sql.VarChar(10), value: tipo_comprobante },
                serie: { type: sql.VarChar(4), value: serie },
                id: { type: sql.Int, value: id }
            });

            if (resColision.recordset.length > 0) {
                return res.status(400).json({ error: `Ya existe otra serie '${serie}' registrada para el tipo de comprobante '${tipo_comprobante}'.` });
            }

            const queryUpdate = `
                UPDATE serie_comprobantes
                SET tipo_comprobante = @tipo_comprobante,
                    serie = @serie,
                    correlativo_actual = @correlativo_actual,
                    activo = @activo
                WHERE id_serie = @id
            `;

            await query(queryUpdate, {
                id: { type: sql.Int, value: id },
                tipo_comprobante: { type: sql.VarChar(10), value: tipo_comprobante },
                serie: { type: sql.VarChar(4), value: serie },
                correlativo_actual: { type: sql.Int, value: parseInt(correlativo_actual) || 0 },
                activo: { type: sql.Bit, value: activo !== undefined ? (activo ? 1 : 0) : 1 }
            });

            return res.status(200).json({ message: 'Serie actualizada correctamente.' });
        } catch (error) {
            next(error);
        }
    },

    // 5. Desactivar una serie
    eliminar: async (req, res, next) => {
        try {
            const { id } = req.params;

            const queryDeactivate = "UPDATE serie_comprobantes SET activo = 0 WHERE id_serie = @id";
            const result = await query(queryDeactivate, { id: { type: sql.Int, value: id } });

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ error: 'La serie especificada no existe.' });
            }

            return res.status(200).json({ message: 'Serie desactivada correctamente.' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = seriesController;
