const sql = require('mssql/msnodesqlv8');
const dotenv = require('dotenv');
dotenv.config();

const config = {
    connectionString: `
        Driver={ODBC Driver 17 for SQL Server};
        Server=${process.env.DB_SERVER};
        Database=${process.env.DB_NAME};
        Trusted_Connection=Yes;
    `
};

let pool = null;

async function getPool() {
    try {
        if (!pool) {
            pool = await new sql.ConnectionPool(config).connect();

            pool.on('error', err => {
                console.error('Error en el pool:', err);
                pool = null;
            });

            console.log('Conectado a SQL Server (Windows Auth)');
        }
        return pool;
    } catch (err) {
        console.error('Error conectando:', err);
        throw err;
    }
}

// Tipos SQL que msnodesqlv8 (driver ODBC) devuelve como string en vez de
// number/boolean nativos de JS. 
const TIPOS_NUMERICOS = new Set([
    sql.Int.id, sql.BigInt.id, sql.TinyInt.id, sql.SmallInt.id,
    sql.Float.id, sql.Real.id, sql.Decimal.id, sql.Numeric.id
]);
const TIPO_BIT = sql.Bit.id;

// Recorre las columnas de un recordset y convierte cada celda al tipo JS
// correcto según el tipo SQL real de esa columna (metadata del driver),
// sin alterar columnas de texto (VARCHAR, NVARCHAR, etc.) aunque contengan
// solo dígitos (dni, ruc, numero_documento siguen siendo string).
function normalizarTipos(recordset) {
    if (!recordset || !recordset.columns) return recordset;

    const columnasNumericas = [];
    const columnasBit = [];

    for (const [nombre, meta] of Object.entries(recordset.columns)) {
        const tipoId = meta.type?.id;
        if (TIPOS_NUMERICOS.has(tipoId)) columnasNumericas.push(nombre);
        else if (tipoId === TIPO_BIT) columnasBit.push(nombre);
    }

    if (!columnasNumericas.length && !columnasBit.length) return recordset;

    for (const fila of recordset) {
        for (const col of columnasNumericas) {
            if (fila[col] !== null && fila[col] !== undefined && fila[col] !== '') {
                const n = Number(fila[col]);
                if (!Number.isNaN(n)) fila[col] = n;
            }
        }
        for (const col of columnasBit) {
            if (fila[col] !== null && fila[col] !== undefined) {
                fila[col] = fila[col] === true || fila[col] === 1 || fila[col] === '1' || fila[col] === 'true';
            }
        }
    }

    return recordset;
}

async function query(queryStr, params = {}) {
    const p = await getPool();
    const req = p.request();

    for (const [key, { type, value }] of Object.entries(params)) {
        req.input(key, type, value);
    }

    const result = await req.query(queryStr);

    // Normaliza tipos en el recordset principal y en posibles recordsets
    // múltiples (cuando una query tiene varios SELECT)
    if (Array.isArray(result.recordsets)) {
        result.recordsets.forEach(normalizarTipos);
    } else if (result.recordset) {
        normalizarTipos(result.recordset);
    }

    return result;
}

// ejecuta múltiples operaciones dentro de una transacción
async function withTransaction(callback) {
    const p = await getPool();
    const transaction = new sql.Transaction(p);

    try {
        await transaction.begin();
        const result = await callback(transaction);
        await transaction.commit();
        return result;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

module.exports = { sql, getPool, query, withTransaction };