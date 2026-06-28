const { sql, query } = require('../db/conexion_sql');

// Cada cuánto se revisa si hay cajas vencidas (en milisegundos).
const INTERVALO_REVISION_MS = 60 * 1000;//cada minutito

// Marca como 'vencida' toda caja que sigue 'abierta' pero ya pasó su
// fecha_cierre_programada. No toca el dinero ni inventa un monto_real:
// solo corta el permiso de seguir vendiendo hasta que alguien (el cajero
// o un admin) haga el cierre real con el conteo físico.
async function revisarCajasVencidas() {
    try {
        const result = await query(`
            UPDATE cajas
            SET estado = 'vencida'
            OUTPUT INSERTED.id_caja, INSERTED.id_empleado
            WHERE estado = 'abierta'
            AND fecha_cierre_programada IS NOT NULL
            AND fecha_cierre_programada <= GETDATE()
        `);

        if (result.recordset.length > 0) {
            const ids = result.recordset.map(r => r.id_caja).join(', ');
            console.log(`[vencimientoCajaJob] Cajas marcadas como vencidas: ${ids}`);
        }
    } catch (err) {
        // No queremos que un error aquí tumbe el servidor; solo lo registramos.
        console.error('[vencimientoCajaJob] Error al revisar cajas vencidas:', err);
    }
}

let _intervalo = null;

function iniciarJobVencimientoCaja() {
    if (_intervalo) return; // evita duplicados si se llama más de una vez
    revisarCajasVencidas();
    _intervalo = setInterval(revisarCajasVencidas, INTERVALO_REVISION_MS);
    console.log('[vencimientoCajaJob] Job de vencimiento de caja iniciado (revisión cada 60s).');
}

function detenerJobVencimientoCaja() {
    if (_intervalo) {
        clearInterval(_intervalo);
        _intervalo = null;
    }
}

module.exports = { 
    iniciarJobVencimientoCaja, 
    detenerJobVencimientoCaja 
};