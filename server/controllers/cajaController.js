
const { sql, query } = require('../db/conexion_sql');

const cajaController = {

    //pa obtener MI caja personal (la que abrí yo, para gestionarla: ver
    //movimientos, hacer el arqueo, cerrarla)
    getCajaActiva: async (req, res, next) => {
        try {
            // id_empleado viene del token, no del query param 
            const id_empleado = req.user.id_empleado;

            if (!id_empleado) {
                return res.status(400).json({ error: 'No se pudo obtener el empleado desde la sesión.' });
            }

            const queryStr = `
            SELECT c.id_caja, c.id_empleado, c.numero_turno, c.fecha_apertura, c.fecha_cierre_programada,
                c.monto_inicial, c.monto_esperado, c.estado,
                t.nombre AS turno_nombre,
                e.nombre + ' ' + e.apellido AS cajero_nombre
            FROM cajas c
            INNER JOIN empleados e ON e.id_empleado = c.id_empleado
            LEFT JOIN turnos t ON t.id_turno = c.id_turno
            WHERE c.id_empleado = @id_empleado AND c.estado IN ('abierta', 'vencida')
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

    // Lista todas las cajas actualmente abiertas en el sistema (para que el
    // vendedor elija con cuál va a trabajar su turno de ventas)
    getCajasAbiertas: async (req, res, next) => {
        try {
            const queryStr = `
                SELECT
                    c.id_caja, c.numero_turno, c.fecha_apertura,
                    t.nombre AS turno_nombre,
                    e.nombre + ' ' + e.apellido AS cajero_nombre
                FROM cajas c
                INNER JOIN empleados e ON e.id_empleado = c.id_empleado
                LEFT JOIN turnos t ON t.id_turno = c.id_turno
                WHERE c.estado = 'abierta'
                ORDER BY c.fecha_apertura DESC
            `;
            const resultado = await query(queryStr);
            return res.status(200).json({ ok: true, cajas: resultado.recordset });
        } catch (error) {
            next(error);
        }
    },
    
    // se abre la caja (solo Cajero o Administrador, cada uno con su propia caja individual)
    abrirCaja: async (req, res, next) => {
        try {
            const { monto_inicial } = req.body;
            const id_empleado = req.user.id_empleado; // siempre del token, nunca del body, ojito
            const rolesPermitidos = ['Cajero', 'Administrador'];

            if (!id_empleado) {
                return res.status(400).json({ error: 'No se pudo obtener el empleado desde la sesión.' });
            }
            if (!rolesPermitidos.includes(req.user.rol)) {
                return res.status(403).json({ error: 'Solo el Cajero o el Administrador pueden abrir caja.' });
            }
            if (monto_inicial === undefined || monto_inicial < 0) {
                return res.status(400).json({ error: "El monto_inicial es obligatorio y no puede ser negativo." });
            }

            // Cada cajero/admin valida solo contra SU PROPIA caja, no contra las de los demás
            const queryVerificar = "SELECT id_caja FROM cajas WHERE id_empleado = @id_empleado AND estado IN ('abierta', 'vencida')";
            const resVerificar = await query(queryVerificar, { id_empleado: { type: sql.Int, value: id_empleado } });

            if (resVerificar.recordset.length > 0) {
                return res.status(400).json({ error: "No puedes abrir una nueva caja porque ya tienes una caja abierta o pendiente de cierre." });
            }

            // El empleado DEBE tener un turno asignado para poder abrir caja:
            // sin turno no hay forma de saber cuándo debe cerrarse automáticamente.
            const queryEmpleado = "SELECT id_turno FROM empleados WHERE id_empleado = @id_empleado";
            const resEmpleado = await query(queryEmpleado, { id_empleado: { type: sql.Int, value: id_empleado } });
            const id_turno = resEmpleado.recordset[0]?.id_turno || null;

            if (!id_turno) {
                return res.status(400).json({ error: "No tienes un turno asignado. Pide a un administrador que te asigne un turno antes de abrir caja." });
            }

            const queryTurnoInfo = "SELECT hora_fin FROM turnos WHERE id_turno = @id_turno AND activo = 1";
            const resTurnoInfo = await query(queryTurnoInfo, { id_turno: { type: sql.Int, value: id_turno } });

            if (resTurnoInfo.recordset.length === 0) {
                return res.status(400).json({ error: "El turno asignado ya no está activo. Pide a un administrador que te asigne un turno vigente." });
            }

            const horaFin = resTurnoInfo.recordset[0].hora_fin;
            // Construimos la fecha de cierre programada combinando HOY + hora_fin del turno.
            // Se calcula en SQL (no en JS)
            const queryFechaCierre = `
                SELECT CAST(CAST(GETDATE() AS DATE) AS DATETIME2) + CAST(@hora_fin AS DATETIME2) AS fecha_cierre
            `;
            const resFechaCierre = await query(queryFechaCierre, {
                hora_fin: { type: sql.VarChar, value: horaFin }
            });
            const fechaCierreProgramada = resFechaCierre.recordset[0].fecha_cierre;

            const queryTurno = "SELECT ISNULL(MAX(numero_turno), 0) + 1 AS siguiente_turno FROM cajas WHERE id_empleado = @id_empleado";
            const resTurno = await query(queryTurno, { id_empleado: { type: sql.Int, value: id_empleado } });
            const siguienteTurno = resTurno.recordset[0].siguiente_turno;

            const queryInsert = `
                INSERT INTO cajas (id_empleado, id_turno, numero_turno, fecha_apertura, fecha_cierre_programada, monto_inicial, monto_esperado, estado)
                OUTPUT INSERTED.id_caja
                VALUES (@id_empleado, @id_turno, @numero_turno, GETDATE(), @fecha_cierre_programada, @monto_inicial, @monto_inicial, 'abierta')
            `;

            const resInsert = await query(queryInsert, {
                id_empleado: { type: sql.Int, value: id_empleado },
                id_turno: { type: sql.Int, value: id_turno },
                numero_turno: { type: sql.Int, value: siguienteTurno },
                fecha_cierre_programada: { type: sql.DateTime2, value: fechaCierreProgramada },
                monto_inicial: { type: sql.Decimal(10, 2), value: monto_inicial }
            });

            return res.status(201).json({
                message: "Caja abierta de forma exitosa",
                id_caja: resInsert.recordset[0].id_caja,
                turno: siguienteTurno,
                fecha_cierre_programada: fechaCierreProgramada
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

            if (resCaja.recordset[0].estado === 'cerrada') {
                return res.status(400).json({ error: "No se pueden añadir movimientos a una caja que ya está cerrada." });
            }
            if (resCaja.recordset[0].estado === 'vencida') {
                return res.status(400).json({ error: "Tu turno ha vencido. Debes cerrar la caja con el conteo real antes de registrar más movimientos." });
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

    // se cierra la caja (manual siempre: la hace el cajero o un admin en su nombre)
    cerrarCaja: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { monto_real, observacion } = req.body;
            const id_empleado_que_cierra = req.user.id_empleado; // quién está cerrando realmente
            const rolesPermitidos = ['Cajero', 'Administrador'];

            if (!rolesPermitidos.includes(req.user.rol)) {
                return res.status(403).json({ error: 'Solo el Cajero o el Administrador pueden cerrar caja.' });
            }
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

            // actualiza el estado (funciona tanto si estaba 'abierta' como 'vencida')
            const queryCierre = `
                UPDATE cajas 
                SET fecha_cierre = GETDATE(),
                    monto_real = @monto_real,
                    diferencia = @diferencia,
                    observacion = @observacion,
                    estado = 'cerrada',
                    cerrado_por = @cerrado_por
                WHERE id_caja = @id_caja
            `;

            await query(queryCierre, {
                id_caja: { type: sql.Int, value: id },
                monto_real: { type: sql.Decimal(10, 2), value: monto_real },
                diferencia: { type: sql.Decimal(10, 2), value: diferencia },
                observacion: { type: sql.NVarChar(200), value: observacion || null },
                cerrado_por: { type: sql.Int, value: id_empleado_que_cierra }
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


module.exports = cajaController;

