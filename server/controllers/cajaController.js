
const { sql, query } = require('../db/conexion_sql');

const cajaController = {

    //pa obtener la caja activa del empleado
    getCajaActiva: async (req, res, next) => {
        try {
            // id_empleado viene del token, no del query param 
            const id_empleado = req.user.id_empleado;

            if (!id_empleado) {
                return res.status(400).json({ error: 'No se pudo obtener el empleado desde la sesión.' });
            }

            const queryStr = `
            SELECT c.id_caja, c.id_empleado, c.numero_turno, c.fecha_apertura, c.monto_inicial, c.monto_esperado, c.estado,
                e.nombre + ' ' + e.apellido AS cajero_nombre
            FROM cajas c
            INNER JOIN empleados e ON e.id_empleado = c.id_empleado
            WHERE c.id_empleado = @id_empleado AND c.estado = 'abierta'
        `;

            const resultado = await query(queryStr, { id_empleado: { type: sql.Int, value: id_empleado } });

            if (resultado.recordset.length === 0) {
                return res.status(200).json({ tieneCajaActiva: false, caja: null });
            }

            return res.status(200).json({ tieneCajaActiva: true, caja: resultado.recordset[0] });
        } catch (error) {
            next(error);
        }
    },

    // se abre la caja
    abrirCaja: async (req, res, next) => {
        try {
            const { monto_inicial } = req.body;
            const id_empleado = req.user.id_empleado; // siempre del token, nunca del body, ojito

            if (!id_empleado) {
                return res.status(400).json({ error: 'No se pudo obtener el empleado desde la sesión.' });
            }
            if (monto_inicial === undefined || monto_inicial < 0) {
                return res.status(400).json({ error: "El monto_inicial es obligatorio y no puede ser negativo." });
            }

            const queryVerificar = "SELECT id_caja FROM cajas WHERE id_empleado = @id_empleado AND estado = 'abierta'";
            const resVerificar = await query(queryVerificar, { id_empleado: { type: sql.Int, value: id_empleado } });

            if (resVerificar.recordset.length > 0) {
                return res.status(400).json({ error: "No puedes abrir una nueva caja porque ya tienes una caja abierta actualmente." });
            }

            const queryTurno = "SELECT ISNULL(MAX(numero_turno), 0) + 1 AS siguiente_turno FROM cajas WHERE id_empleado = @id_empleado";
            const resTurno = await query(queryTurno, { id_empleado: { type: sql.Int, value: id_empleado } });
            const siguienteTurno = resTurno.recordset[0].siguiente_turno;

            const queryInsert = `
                INSERT INTO cajas (id_empleado, numero_turno, fecha_apertura, monto_inicial, monto_esperado, estado)
                OUTPUT INSERTED.id_caja
                VALUES (@id_empleado, @numero_turno, GETDATE(), @monto_inicial, @monto_inicial, 'abierta')
            `;

            const resInsert = await query(queryInsert, {
                id_empleado: { type: sql.Int, value: id_empleado },
                numero_turno: { type: sql.Int, value: siguienteTurno },
                monto_inicial: { type: sql.Decimal(10, 2), value: monto_inicial }
            });

            return res.status(201).json({
                message: "Caja abierta de forma exitosa",
                id_caja: resInsert.recordset[0].id_caja,
                turno: siguienteTurno
            });
        } catch (error) {
            next(error);
        }
    },

    // movimiento de caja registro
    addMovimiento: async (req, res, next) => {
        try {
            const { tipo, concepto, monto } = req.body;
            const id_usuario = req.user.id;
            const { id } = req.params;

            if (!tipo || !concepto || !monto) {
                return res.status(400).json({ error: "Faltan datos requeridos (tipo, concepto, monto)." });
            }

            if (tipo !== 'ingreso' && tipo !== 'egreso') {
                return res.status(400).json({ error: "El tipo de movimiento debe ser 'ingreso' o 'egreso'." });
            }

            const queryCaja = "SELECT estado, monto_esperado FROM cajas WHERE id_caja = @id_caja";
            const resCaja = await query(queryCaja, { id_caja: { type: sql.Int, value: id } });

            if (resCaja.recordset.length === 0) {
                return res.status(404).json({ error: "La caja especificada no existe." });
            }

            if (resCaja.recordset[0].estado !== 'abierta') {
                return res.status(400).json({ error: "No se pueden añadir movimientos a una caja que ya está cerrada." });
            }

            const queryMov = `
                INSERT INTO movimientos_caja (id_caja, id_usuario, tipo, concepto, monto, registrado_en)
                VALUES (@id_caja, @id_usuario, @tipo, @concepto, @monto, GETDATE())
            `;

            await query(queryMov, {
                id_caja: { type: sql.Int, value: id },
                id_usuario: { type: sql.Int, value: id_usuario },
                tipo: { type: sql.VarChar(8), value: tipo },
                concepto: { type: sql.VarChar(150), value: concepto },
                monto: { type: sql.Decimal(10, 2), value: monto }
            });

            const factor = (tipo === 'ingreso') ? 1 : -1;
            const queryUpdateCaja = "UPDATE cajas SET monto_esperado = monto_esperado + @alteracion WHERE id_caja = @id_caja";

            await query(queryUpdateCaja, {
                id_caja: { type: sql.Int, value: id },
                alteracion: { type: sql.Decimal(10, 2), value: monto * factor }
            });

            return res.status(201).json({ message: "Movimiento registrado y saldo de caja actualizado." });
        } catch (error) {
            next(error);
        }
    },

    // se cierra la caja
    cerrarCaja: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { monto_real, observacion } = req.body;

            if (monto_real === undefined) {
                return res.status(400).json({ error: "Es obligatorio enviar el monto_real para el arqueo de caja." });
            }

            const queryCaja = "SELECT estado, monto_esperado FROM cajas WHERE id_caja = @id_caja";
            const resCaja = await query(queryCaja, { id_caja: { type: sql.Int, value: id } });

            if (resCaja.recordset.length === 0) {
                return res.status(404).json({ error: "La caja no existe." });
            }

            if (resCaja.recordset[0].estado === 'cerrada') {
                return res.status(400).json({ error: "Esta caja ya se encuentra cerrada." });
            }

            const montoEsperado = resCaja.recordset[0].monto_esperado;
            const diferencia = monto_real - montoEsperado; // Negativo = faltante, Positivo = sobrante

            // actualiza el estado
            const queryCierre = `
                UPDATE cajas 
                SET fecha_cierre = GETDATE(),
                    monto_real = @monto_real,
                    diferencia = @diferencia,
                    observacion = @observacion,
                    estado = 'cerrada'
                WHERE id_caja = @id_caja
            `;

            await query(queryCierre, {
                id_caja: { type: sql.Int, value: id },
                monto_real: { type: sql.Decimal(10, 2), value: monto_real },
                diferencia: { type: sql.Decimal(10, 2), value: diferencia },
                observacion: { type: sql.NVarChar(200), value: observacion || null }
            });

            return res.status(200).json({
                message: "Caja cerrada de forma correcta.",
                resumen: {
                    monto_esperado: montoEsperado,
                    monto_real: monto_real,
                    diferencia: diferencia,
                    resultado: diferencia === 0 ? "Cuadrado" : (diferencia > 0 ? "Sobrante" : "Faltante")
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // aqui obtengo movimientos de caja
    getMovimientos: async (req, res, next) => {
        try {
            const { id } = req.params;

            const queryStr = "SELECT * FROM movimientos_caja WHERE id_caja = @id_caja ORDER BY registrado_en DESC";
            const resultado = await query(queryStr, { id_caja: { type: sql.Int, value: id } });

            return res.status(200).json(resultado.recordset);
        } catch (error) {
            next(error);
        }
    },

    // resumen caja
    getResumen: async (req, res, next) => {
        try {
            const { id } = req.params;

            const queryIngresos = "SELECT ISNULL(SUM(monto), 0) AS total FROM movimientos_caja WHERE id_caja = @id_caja AND tipo = 'ingreso'";
            const queryEgresos = "SELECT ISNULL(SUM(monto), 0) AS total FROM movimientos_caja WHERE id_caja = @id_caja AND tipo = 'egreso'";
            const queryInfo = "SELECT monto_inicial, monto_esperado FROM cajas WHERE id_caja = @id_caja";

            const [resIng, resEgr, resInf] = await Promise.all([
                query(queryIngresos, { id_caja: { type: sql.Int, value: id } }),
                query(queryEgresos, { id_caja: { type: sql.Int, value: id } }),
                query(queryInfo, { id_caja: { type: sql.Int, value: id } })
            ]);

            if (resInf.recordset.length === 0) {
                return res.status(404).json({ error: "Caja no encontrada." });
            }

            return res.status(200).json({
                monto_inicial: resInf.recordset[0].monto_inicial,
                total_ingresos: resIng.recordset[0].total,
                total_egresos: resEgr.recordset[0].total,
                monto_esperado_final: resInf.recordset[0].monto_esperado
            });
        } catch (error) {
            next(error);
        }
    }
};

//FALTA
//Registrar egreso manual - Para gastos operativos que no vienen de una venta.


module.exports = cajaController;

