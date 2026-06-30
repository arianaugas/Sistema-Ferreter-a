

//  HELPER FETCH ─
async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.mensaje || `Error ${res.status}`);
    return data;
}


//  HELPERS UI 

function setTbodyLoading(tbodyId, cols) {
    const tb = document.getElementById(tbodyId);
    if (!tb) return;
    tb.innerHTML = `<tr><td colspan="${cols}" class="text-center py-4 text-muted">
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>Cargando…
    </td></tr>`;
}

function setTbodyEmpty(tbodyId, cols, msg = 'Sin resultados para los filtros seleccionados.') {
    const tb = document.getElementById(tbodyId);
    if (!tb) return;
    tb.innerHTML = `<tr><td colspan="${cols}" class="text-center py-4 text-muted">${msg}</td></tr>`;
}

function buildQuery(params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') qs.append(k, v);
    });
    const str = qs.toString();
    return str ? `?${str}` : '';
}

function badgeEstado(estado) {
    const map = {
        caducado: 'text-bg-danger',
        por_vencer: 'text-bg-warning',
        vigente: 'text-bg-success',
        pendiente: 'text-bg-warning',
        procesada: 'text-bg-success',
        anulada: 'text-bg-secondary',
        cambio: 'text-bg-info',
        reembolso: 'text-bg-primary',
        entrada: 'text-bg-success',
        salida: 'text-bg-danger',
        ajuste: 'text-bg-warning',
        transferencia: 'text-bg-info',
    };
    return `<span class="badge ${map[estado] ?? 'text-bg-secondary'}">${estado}</span>`;
}

function poblarSelect(selectId, items, idKey, nombreKey, primerOpcion = 'Todos') {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const valorActual = sel.value;
    // Limpiar dejando sólo la primera opción
    sel.innerHTML = `<option value="">${primerOpcion}</option>`;
    items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item[idKey];
        opt.textContent = item[nombreKey];
        sel.appendChild(opt);
    });
    if (valorActual) sel.value = valorActual;
}


//  CARGA INICIAL DE SELECTS DINÁMICOS 

async function cargarEmpleados() {
    try {
        const data = await apiFetch('/api/empleados');
        const empleados = data.empleados ?? data.datos ?? data ?? [];
        // rv-empleado y rcaja-cajero usan el mismo listado
        ['rv-empleado', 'rcaja-cajero'].forEach(id => {
            const sel = document.getElementById(id);
            if (!sel) return;
            sel.innerHTML = '<option value="">Todos</option>';
            empleados.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.id_empleado;
                opt.textContent = `${e.nombre} ${e.apellido}`;
                sel.appendChild(opt);
            });
        });
    } catch (err) {
        console.warn('cargarEmpleados:', err.message);
    }
}

async function cargarCategorias() {
    try {
        const data = await apiFetch('/api/categorias/cat');
        const cats = data.categorias ?? data.datos ?? data ?? [];
        // Poblar todos los selects de categoría
        ['rg-categoria', 'rsc-categoria', 'rk-categoria'].forEach(id => {
            poblarSelect(id, cats, 'id_categoria', 'nombre', 'Todas');
        });
    } catch (err) {
        console.warn('cargarCategorias:', err.message);
    }
}

async function cargarProveedores() {
    try {
        const data = await apiFetch('/api/proveedores');
        const provs = data.proveedores ?? data.datos ?? data ?? [];
        poblarSelect('rc-proveedor', provs, 'id_proveedor', 'nombre', 'Todos');
    } catch (err) {
        console.warn('cargarProveedores:', err.message);
    }
}

async function cargarProductosPorCategoria(idCategoria = '') {
    const selProd = document.getElementById('rk-producto');
    if (!selProd) return;
    selProd.innerHTML = '<option value="">Cargando…</option>';
    try {
        const qs = idCategoria ? `?id_categoria=${idCategoria}` : '';
        const data = await apiFetch(`/api/productos${qs}`);
        const prods = data.productos ?? data.datos ?? data ?? [];
        selProd.innerHTML = '<option value="">Todos los productos</option>';
        prods.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id_producto;
            opt.textContent = `${p.codigo} — ${p.nombre}`;
            selProd.appendChild(opt);
        });
    } catch (err) {
        selProd.innerHTML = '<option value="" disabled selected>Error al cargar</option>';
        console.warn('cargarProductosPorCategoria:', err.message);
    }
}

async function cargarSubcategorias(idCategoria) {
    const sel = document.getElementById('rg-subcategoria');
    if (!sel) return;
    if (!idCategoria) {
        sel.innerHTML = '<option value="">Todas</option>';
        sel.disabled = true;
        return;
    }
    sel.disabled = false;
    try {
        const data = await apiFetch(`/api/categorias/sub?id_categoria=${idCategoria}`);
        const subs = data.subcategorias ?? data.datos ?? data ?? [];
        sel.innerHTML = '<option value="">Todas</option>';
        subs.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id_subcategoria;
            opt.textContent = s.nombre;
            sel.appendChild(opt);
        });
    } catch (err) {
        console.warn('cargarSubcategorias:', err.message);
    }
}


async function generarRepVentas() {
    const desde = document.getElementById('rv-desde')?.value;
    const hasta = document.getElementById('rv-hasta')?.value;
    const agrupacion = document.getElementById('rv-agrupacion')?.value || 'dia';
    const id_empleado = document.getElementById('rv-empleado')?.value;
    const tipo_comprobante = document.getElementById('rv-tipo-comp')?.value;

    setTbodyLoading('tbody-rep-ventas', 5);
    // Resetear KPIs
    ['rv-total-ventas', 'rv-subtotal', 'rv-igv', 'rv-total'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });

    try {
        const qs = buildQuery({ desde, hasta, agrupacion, id_empleado, tipo_comprobante });
        const data = await apiFetch(`/api/reportes/ventas${qs}`);

        if (!data.ok) throw new Error(data.mensaje || 'Error en el reporte');

        const rows = data.datos ?? [];

        if (!rows.length) {
            setTbodyEmpty('tbody-rep-ventas', 5);
            return;
        }

        // Calcular totales acumulados
        let totalVentas = 0, totalSubtotal = 0, totalIgv = 0, totalGeneral = 0;
        rows.forEach(r => {
            totalVentas += Number(r.cantidad_ventas || 0);
            totalSubtotal += Number(r.subtotal || 0);
            totalIgv += Number(r.igv || 0);
            totalGeneral += Number(r.total || 0);
        });

        document.getElementById('rv-total-ventas').textContent = totalVentas;
        document.getElementById('rv-subtotal').textContent = formatMoney(totalSubtotal);
        document.getElementById('rv-igv').textContent = formatMoney(totalIgv);
        document.getElementById('rv-total').textContent = formatMoney(totalGeneral);

        // Renderizar tabla
        const tb = document.getElementById('tbody-rep-ventas');
        tb.innerHTML = '';
        rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-monospace">${r.periodo ?? 'No tiene'}</td>
                <td>${Number(r.cantidad_ventas).toLocaleString('es-PE')}</td>
                <td>${formatMoney(r.subtotal)}</td>
                <td>${formatMoney(r.igv)}</td>
                <td class="fw-semibold text-success">${formatMoney(r.total)}</td>`;
            tb.appendChild(tr);
        });

    } catch (err) {
        setTbodyEmpty('tbody-rep-ventas', 5, `Error: ${err.message}`);
        showToast(`Error al generar reporte de ventas: ${err.message}`, 'error');
    }
}


async function generarRepGanancias() {
    const desde = document.getElementById('rg-desde')?.value;
    const hasta = document.getElementById('rg-hasta')?.value;
    const id_categoria = document.getElementById('rg-categoria')?.value;
    const id_subcategoria = document.getElementById('rg-subcategoria')?.value;

    setTbodyLoading('tbody-rep-ganancias', 8);
    ['rg-ingresos', 'rg-inversion', 'rg-ganancia'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });

    try {
        const qs = buildQuery({ desde, hasta, id_categoria, id_subcategoria });
        const data = await apiFetch(`/api/reportes/ganancias${qs}`);

        if (!data.ok) throw new Error(data.mensaje || 'Error en el reporte');

        const rows = data.datos ?? [];
        const totales = data.totales ?? {};

        document.getElementById('rg-ingresos').textContent = formatMoney(totales.ingresos ?? 0);
        document.getElementById('rg-inversion').textContent = formatMoney(totales.costo_total ?? 0);
        document.getElementById('rg-ganancia').textContent = formatMoney(totales.ganancia ?? 0);

        if (!rows.length) {
            setTbodyEmpty('tbody-rep-ganancias', 8);
            return;
        }

        const tb = document.getElementById('tbody-rep-ganancias');
        tb.innerHTML = '';
        rows.forEach(r => {
            const gananciaCls = Number(r.ganancia) >= 0 ? 'text-success' : 'text-danger';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="fw-medium">${r.producto}</span><br>
                    <span class="small text-muted font-monospace">${r.codigo}</span></td>
                <td><span class="small">${r.categoria}</span><br>
                    <span class="small text-muted">${r.subcategoria}</span></td>
                <td>${Number(r.unidades_vendidas).toLocaleString('es-PE')}</td>
                <td>${formatMoney(r.precio_venta_prom)}</td>
                <td>${formatMoney(r.precio_costo_prom)}</td>
                <td>${formatMoney(r.ingresos)}</td>
                <td class="text-danger">${formatMoney(r.costo_total)}</td>
                <td class="fw-semibold ${gananciaCls}">${formatMoney(r.ganancia)}</td>`;
            tb.appendChild(tr);
        });

    } catch (err) {
        setTbodyEmpty('tbody-rep-ganancias', 8, `Error: ${err.message}`);
        showToast(`Error al generar reporte de ganancias: ${err.message}`, 'error');
    }
}


async function generarRepProductos() {
    const desde = document.getElementById('rpv-desde')?.value;
    const hasta = document.getElementById('rpv-hasta')?.value;
    const orden = document.getElementById('rpv-ordenar')?.value || 'cantidad';
    const limite = document.getElementById('rpv-top')?.value || '10';

    setTbodyLoading('tbody-rep-productos', 5);

    try {
        const qs = buildQuery({ desde, hasta, orden, limite });
        const data = await apiFetch(`/api/reportes/productos-vendidos${qs}`);

        if (!data.ok) throw new Error(data.mensaje || 'Error en el reporte');

        const rows = data.datos ?? [];

        if (!rows.length) {
            setTbodyEmpty('tbody-rep-productos', 5);
            return;
        }

        const tb = document.getElementById('tbody-rep-productos');
        tb.innerHTML = '';
        rows.forEach((r, i) => {
            const tr = document.createElement('tr');
            // Destacar top 3
            const rankClass = i === 0 ? 'text-warning fw-bold' : i === 1 ? 'text-secondary fw-semibold' : i === 2 ? 'text-danger fw-semibold' : '';
            tr.innerHTML = `
                <td class="${rankClass}">${i + 1}</td>
                <td class="font-monospace small">${r.codigo}</td>
                <td>${r.producto}</td>
                <td>${Number(r.total_cantidad).toLocaleString('es-PE')}</td>
                <td class="fw-semibold">${formatMoney(r.total_monto)}</td>`;
            tb.appendChild(tr);
        });

    } catch (err) {
        setTbodyEmpty('tbody-rep-productos', 5, `Error: ${err.message}`);
        showToast(`Error al generar ranking de productos: ${err.message}`, 'error');
    }
}


async function generarRepStock() {
    const id_categoria = document.getElementById('rsc-categoria')?.value;

    setTbodyLoading('tbody-rep-stock', 8);

    try {
        const qs = buildQuery({ id_categoria });
        const data = await apiFetch(`/api/reportes/stock-bajo${qs}`);

        if (!data.ok) throw new Error(data.mensaje || 'Error en el reporte');

        const rows = data.datos ?? [];

        if (!rows.length) {
            setTbodyEmpty('tbody-rep-stock', 8, 'No hay productos con stock crítico. ✓');
            return;
        }

        const tb = document.getElementById('tbody-rep-stock');
        tb.innerHTML = '';
        rows.forEach(r => {
            // Color según qué tan crítico: sin stock = rojo oscuro, bajo = naranja
            const sinStock = Number(r.stock_actual) <= 0;
            const rowClass = sinStock ? 'table-danger' : 'table-warning';
            const tr = document.createElement('tr');
            tr.className = rowClass;
            tr.innerHTML = `
                <td class="font-monospace small">${r.codigo}</td>
                <td class="fw-medium">${r.nombre}</td>
                <td><span class="small">${r.categoria}</span><br>
                    <span class="small text-muted">${r.subcategoria}</span></td>
                <td class="small text-muted">${r.ubicacion ?? 'No tiene'}</td>
                <td class="fw-bold ${sinStock ? 'text-danger' : ''}">${Number(r.stock_actual).toLocaleString('es-PE')}</td>
                <td>${Number(r.stock_minimo).toLocaleString('es-PE')}</td>
                <td class="fw-semibold text-danger">-${Number(r.diferencia).toLocaleString('es-PE')}</td>
                <td class="small">${r.proveedor_preferido ?? 'No tiene'}</td>`;
            tb.appendChild(tr);
        });

    } catch (err) {
        setTbodyEmpty('tbody-rep-stock', 8, `Error: ${err.message}`);
        showToast(`Error al cargar stock crítico: ${err.message}`, 'error');
    }
}



async function generarRepLotes() {
    const vence_antes = document.getElementById('rl-vence-antes')?.value;
    const estado = document.getElementById('rl-estado-lote')?.value;

    setTbodyLoading('tbody-rep-lotes', 7);

    try {
        const qs = buildQuery({ estado, vence_antes });
        const data = await apiFetch(`/api/reportes/lotes${qs}`);

        if (!data.ok) throw new Error(data.mensaje || 'Error en el reporte');

        const rows = data.datos ?? [];

        if (!rows.length) {
            setTbodyEmpty('tbody-rep-lotes', 7);
            return;
        }

        const tb = document.getElementById('tbody-rep-lotes');
        tb.innerHTML = '';
        rows.forEach(r => {
            const tr = document.createElement('tr');
            const rowClass = r.estado_lote === 'caducado' ? 'table-danger'
                : r.estado_lote === 'por_vencer' ? 'table-warning' : '';
            tr.className = rowClass;
            tr.innerHTML = `
                <td class="font-monospace small">${r.codigo_producto}</td>
                <td class="fw-medium">${r.producto}</td>
                <td class="font-monospace small">${r.numero_lote ?? 'No tiene'}</td>
                <td class="small">${r.almacen}</td>
                <td>${Number(r.cantidad).toLocaleString('es-PE')}</td>
                <td>${r.fecha_vencimiento ? formatDate(r.fecha_vencimiento) : '<span class="text-muted fst-italic">Sin fecha</span>'}</td>
                <td>${badgeEstado(r.estado_lote)}</td>`;
            tb.appendChild(tr);
        });

    } catch (err) {
        setTbodyEmpty('tbody-rep-lotes', 7, `Error: ${err.message}`);
        showToast(`Error al cargar lotes: ${err.message}`, 'error');
    }
}



async function generarRepKardex() {
    const id_producto = document.getElementById('rk-producto')?.value;
    const desde = document.getElementById('rk-desde')?.value;
    const hasta = document.getElementById('rk-hasta')?.value;
    const id_categoria = document.getElementById('rk-categoria')?.value;

    setTbodyLoading('tbody-rep-kardex', 9);

    try {
        let data;
        const esGeneral = !id_producto;
        if (!esGeneral) {
            const qs = buildQuery({ desde, hasta });
            data = await apiFetch(`/api/reportes/kardex/${id_producto}${qs}`);
        } else {
            const qs = buildQuery({ desde, hasta, id_categoria });
            data = await apiFetch(`/api/reportes/kardex${qs}`);
        }

        if (!data.ok) throw new Error(data.mensaje || 'Error en el reporte');

        const movimientos = data.movimientos ?? [];

        // Ajustar encabezado dinámicamente
        const theadRow = document.getElementById('thead-kardex-row');
        const colCount = esGeneral ? 10 : 9;
        if (theadRow) {
            const prodTh = theadRow.querySelector('th[data-col="producto"]');
            if (esGeneral && !prodTh) {
                const th = document.createElement('th');
                th.dataset.col = 'producto';
                th.textContent = 'Producto';
                theadRow.insertBefore(th, theadRow.firstChild);
            } else if (!esGeneral && prodTh) {
                prodTh.remove();
            }
        }

        if (!movimientos.length) {
            setTbodyEmpty('tbody-rep-kardex', colCount, 'No hay movimientos en el período seleccionado.');
            return;
        }

        const tb = document.getElementById('tbody-rep-kardex');
        tb.innerHTML = '';
        movimientos.forEach(m => {
            const esEntrada = ['entrada', 'ajuste'].includes(m.tipo_movimiento);
            const cantidadCls = m.tipo_movimiento === 'salida' ? 'text-danger' : 'text-success';
            const ref = m.referencia_tipo && m.referencia_id
                ? `<span class="small text-muted">${m.referencia_tipo} #${m.referencia_id}</span>`
                : '—';
            const productoCol = esGeneral && m.producto
                ? `<td class="small fw-medium">${m.producto}<br><span class="text-muted font-monospace">${m.codigo ?? ''}</span></td>`
                : '';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                ${productoCol}
                <td class="small text-nowrap">${formatDate(m.registrado_en, true)}</td>
                <td>${badgeEstado(m.tipo_movimiento)}</td>
                <td class="small">${m.motivo ?? 'No tiene'}</td>
                <td>${ref}</td>
                <td class="small">${m.almacen}</td>
                <td class="fw-semibold ${cantidadCls}">${esEntrada ? '+' : '-'}${Number(m.cantidad).toLocaleString('es-PE')}</td>
                <td class="font-monospace small">${Number(m.stock_anterior).toLocaleString('es-PE')}</td>
                <td class="font-monospace small fw-semibold">${Number(m.stock_posterior).toLocaleString('es-PE')}</td>
                <td class="small text-muted">${m.usuario ?? '—'}</td>`;
            tb.appendChild(tr);
        });

    } catch (err) {
        setTbodyEmpty('tbody-rep-kardex', 9, `Error: ${err.message}`);
        showToast(`Error al generar kardex: ${err.message}`, 'error');
    }
}



async function generarRepCompras() {
    const id_proveedor = document.getElementById('rc-proveedor')?.value;
    const agrupacion = document.getElementById('rc-agrupacion')?.value || 'dia';
    const desde = document.getElementById('rc-desde')?.value;
    const hasta = document.getElementById('rc-hasta')?.value;

    setTbodyLoading('tbody-rep-compras', 6);

    try {
        const qs = buildQuery({ desde, hasta, agrupacion, id_proveedor });
        const data = await apiFetch(`/api/reportes/compras${qs}`);

        if (!data.ok) throw new Error(data.mensaje || 'Error en el reporte');

        const rows = data.datos ?? [];

        if (!rows.length) {
            setTbodyEmpty('tbody-rep-compras', 6);
            return;
        }

        const tb = document.getElementById('tbody-rep-compras');
        tb.innerHTML = '';
        rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-monospace">${r.periodo ?? '—'}</td>
                <td class="fw-medium">${r.proveedor}</td>
                <td>${Number(r.cantidad_ordenes).toLocaleString('es-PE')}</td>
                <td>${formatMoney(r.subtotal)}</td>
                <td>${formatMoney(r.igv)}</td>
                <td class="fw-semibold">${formatMoney(r.total)}</td>`;
            tb.appendChild(tr);
        });

    } catch (err) {
        setTbodyEmpty('tbody-rep-compras', 6, `Error: ${err.message}`);
        showToast(`Error al generar reporte de compras: ${err.message}`, 'error');
    }
}


async function generarRepGastos() {
    const desde = document.getElementById('rg2-desde')?.value;
    const hasta = document.getElementById('rg2-hasta')?.value;

    setTbodyLoading('tbody-rep-gastos', 5);
    const elTotal = document.getElementById('rg2-total');
    if (elTotal) elTotal.textContent = '—';

    try {
        const qs = buildQuery({ desde, hasta });
        const data = await apiFetch(`/api/reportes/gastos${qs}`);

        if (!data.ok) throw new Error(data.mensaje || 'Error en el reporte');

        const rows = data.datos ?? [];

        if (elTotal) elTotal.textContent = formatMoney(data.total_gastos ?? 0);

        if (!rows.length) {
            setTbodyEmpty('tbody-rep-gastos', 5, 'No hay gastos registrados en este período.');
            return;
        }

        const tb = document.getElementById('tbody-rep-gastos');
        tb.innerHTML = '';
        rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="small text-nowrap">${formatDate(r.registrado_en, true)}</td>
                <td>${r.concepto ?? '—'}</td>
                <td class="small">Turno #${r.numero_turno ?? r.id_caja}</td>
                <td class="small">${r.cajero}</td>
                <td class="text-end fw-semibold text-danger">${formatMoney(r.monto)}</td>`;
            tb.appendChild(tr);
        });

    } catch (err) {
        setTbodyEmpty('tbody-rep-gastos', 5, `Error: ${err.message}`);
        showToast(`Error al generar reporte de gastos: ${err.message}`, 'error');
    }
}

async function generarRepCaja() {
    const desde = document.getElementById('rcaja-desde')?.value;
    const hasta = document.getElementById('rcaja-hasta')?.value;
    const id_empleado = document.getElementById('rcaja-cajero')?.value;

    setTbodyLoading('tbody-rep-caja', 9);
    ['rcaja-turnos', 'rcaja-esperado', 'rcaja-real', 'rcaja-diferencia'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });

    try {
        const qs = buildQuery({ desde, hasta, id_empleado });
        const data = await apiFetch(`/api/reportes/cierres-caja${qs}`);

        if (!data.ok) throw new Error(data.mensaje || 'Error en el reporte');

        const rows = data.datos ?? [];
        const totales = data.totales ?? {};

        document.getElementById('rcaja-turnos').textContent = data.total_cierres ?? 0;
        document.getElementById('rcaja-esperado').textContent = formatMoney(totales.total_esperado ?? 0);
        document.getElementById('rcaja-real').textContent = formatMoney(totales.total_real ?? 0);

        // Diferencia con color según si es positiva (sobrante) o negativa (faltante)
        const elDif = document.getElementById('rcaja-diferencia');
        if (elDif) {
            const dif = Number(totales.total_diferencia ?? 0);
            elDif.textContent = formatMoney(dif);
            elDif.className = `fw-semibold h5 mb-0 ${dif >= 0 ? 'text-success' : 'text-danger'}`;
        }

        if (!rows.length) {
            setTbodyEmpty('tbody-rep-caja', 9, 'No hay turnos cerrados en este período.');
            return;
        }

        const tb = document.getElementById('tbody-rep-caja');
        tb.innerHTML = '';
        rows.forEach(r => {
            const dif = Number(r.diferencia ?? 0);
            const difCls = dif >= 0 ? 'text-success' : 'text-danger';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-semibold">#${r.numero_turno}</td>
                <td>${r.cajero}</td>
                <td class="small text-nowrap">${formatDate(r.fecha_apertura, true)}</td>
                <td class="small text-nowrap">${formatDate(r.fecha_cierre, true)}</td>
                <td>${formatMoney(r.monto_inicial)}</td>
                <td>${formatMoney(r.monto_esperado)}</td>
                <td>${formatMoney(r.monto_real)}</td>
                <td class="fw-semibold ${difCls}">${formatMoney(dif)}</td>
                <td class="small text-muted">${r.observacion ?? 'Sin observación'}</td>`;
            tb.appendChild(tr);
        });

    } catch (err) {
        setTbodyEmpty('tbody-rep-caja', 9, `Error: ${err.message}`);
        showToast(`Error al generar reporte de caja: ${err.message}`, 'error');
    }
}

async function generarRepDevoluciones() {
    const desde = document.getElementById('rd-desde')?.value;
    const hasta = document.getElementById('rd-hasta')?.value;
    const tipo = document.getElementById('rd-tipo')?.value;
    const estado = document.getElementById('rd-estado')?.value;

    setTbodyLoading('tbody-rep-devoluciones', 9);
    ['rd-total-dev', 'rd-total-reembolsos'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });

    try {
        const qs = buildQuery({ desde, hasta, tipo, estado });
        const data = await apiFetch(`/api/reportes/devoluciones${qs}`);

        if (!data.ok) throw new Error(data.mensaje || 'Error en el reporte');

        const rows = data.datos ?? [];

        document.getElementById('rd-total-dev').textContent = data.total ?? 0;
        document.getElementById('rd-total-reembolsos').textContent = formatMoney(data.total_reembolsado ?? 0);

        if (!rows.length) {
            setTbodyEmpty('tbody-rep-devoluciones', 9);
            return;
        }

        const tb = document.getElementById('tbody-rep-devoluciones');
        tb.innerHTML = '';
        rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-monospace small">#${r.id_devolucion}</td>
                <td class="font-monospace small">${r.numero_comprobante ?? '—'}</td>
                <td class="small">${r.cliente_nombre}</td>
                <td class="small">${r.empleado_nombre}</td>
                <td>${badgeEstado(r.tipo)}</td>
                <td class="small">${r.motivo ?? '—'}</td>
                <td class="small text-nowrap">${formatDate(r.fecha, true)}</td>
                <td class="fw-semibold ${r.tipo === 'reembolso' ? 'text-danger' : 'text-muted'}">${r.monto_reembolso ? formatMoney(r.monto_reembolso) : '—'}</td>
                <td>${badgeEstado(r.estado)}</td>`;
            tb.appendChild(tr);
        });

    } catch (err) {
        setTbodyEmpty('tbody-rep-devoluciones', 9, `Error: ${err.message}`);
        showToast(`Error al generar reporte de devoluciones: ${err.message}`, 'error');
    }
}



//  INICIALIZACIÓN

document.addEventListener('DOMContentLoaded', () => {

    //  Cargar selects dinámicos en paralelo 
    Promise.all([
        cargarEmpleados(),
        cargarCategorias(),
        cargarProveedores(),
        cargarProductosPorCategoria(), // carga todos los productos inicialmente
    ]);

    //  Subcategorías en ganancias: carga en cascada 
    document.getElementById('rg-categoria')?.addEventListener('change', function () {
        cargarSubcategorias(this.value);
    });

    //  Productos en kardex: filtro por categoría en cascada 
    document.getElementById('rk-categoria')?.addEventListener('change', function () {
        cargarProductosPorCategoria(this.value);
    });

    //  Botones de generar reporte 
    document.getElementById('btn-generar-rep-ventas')?.addEventListener('click', generarRepVentas);
    document.getElementById('btn-generar-rep-ganancias')?.addEventListener('click', generarRepGanancias);
    document.getElementById('btn-generar-rep-productos')?.addEventListener('click', generarRepProductos);
    document.getElementById('btn-generar-rep-stock')?.addEventListener('click', generarRepStock);
    document.getElementById('btn-generar-rep-lotes')?.addEventListener('click', generarRepLotes);
    document.getElementById('btn-generar-rep-kardex')?.addEventListener('click', generarRepKardex);
    document.getElementById('btn-generar-rep-compras')?.addEventListener('click', generarRepCompras);
    document.getElementById('btn-generar-rep-gastos')?.addEventListener('click', generarRepGastos);
    document.getElementById('btn-generar-rep-caja')?.addEventListener('click', generarRepCaja);
    document.getElementById('btn-generar-rep-devoluciones')?.addEventListener('click', generarRepDevoluciones);

    //  Cargar automáticamente al cambiar de pestaña (todos los reportes)
    const tabReportes = {
        'rep-ventas-btn': generarRepVentas,
        'rep-ganancias-btn': generarRepGanancias,
        'rep-productos-btn': generarRepProductos,
        'rep-stock-btn': generarRepStock,
        'rep-lotes-btn': generarRepLotes,
        'rep-compras-btn': generarRepCompras,
        'rep-gastos-btn': generarRepGastos,
        'rep-caja-btn': generarRepCaja,
        'rep-devoluciones-btn': generarRepDevoluciones,
    };
    Object.entries(tabReportes).forEach(([id, fn]) => {
        document.getElementById(id)?.addEventListener('shown.bs.tab', fn);
    });

    // Cargar el reporte de la pestaña activa al iniciar la página
    const tabActivoInicial = document.querySelector('.nav-link.active[data-bs-toggle="tab"], .nav-link.active[data-bs-toggle="pill"]');
    if (tabActivoInicial) {
        const fnInicial = tabReportes[tabActivoInicial.id];
        if (fnInicial) fnInicial();
    } else {
        // Si no hay pestaña activa identificada, cargar ventas por defecto
        generarRepVentas();
    }



    //EXPORTAR REPORTES  
    // Botón exportar ventas
    document.getElementById('btn-exportar-rep-ventas')?.addEventListener('click', () => {
        exportarReporteVentas();
    });

    // Botón exportar ganancias
    document.getElementById('btn-exportar-rep-ganancias')?.addEventListener('click', () => {
        exportarReporteGanancias();
    });

    // Botón exportar productos más vendidos
    document.getElementById('btn-exportar-rep-productos')?.addEventListener('click', () => {
        exportarReporteProductosVendidos();
    });

    // Botón exportar stock crítico
    document.getElementById('btn-exportar-rep-stock')?.addEventListener('click', () => {
        exportarReporteStockCritico();
    });

    // Botón exportar lotes
    document.getElementById('btn-exportar-rep-lotes')?.addEventListener('click', () => {
        exportarReporteLotes();
    });

    // Botón exportar kardex
    document.getElementById('btn-exportar-rep-kardex')?.addEventListener('click', () => {
        exportarReporteKardex();
    });

    // Botón exportar compras
    document.getElementById('btn-exportar-rep-compras')?.addEventListener('click', () => {
        exportarReporteCompras();
    });

    // Botón exportar gastos
    document.getElementById('btn-exportar-rep-gastos')?.addEventListener('click', () => {
        exportarReporteGastos();
    });

    // Botón exportar caja
    document.getElementById('btn-exportar-rep-caja')?.addEventListener('click', () => {
        exportarReporteCaja();
    });

    // Botón exportar devoluciones
    document.getElementById('btn-exportar-rep-devoluciones')?.addEventListener('click', () => {
        exportarReporteDevoluciones();
    });

});