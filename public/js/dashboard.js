async function apiFetch(url, options = {}) {
  const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.mensaje || `Error ${res.status}`);
  return data;
}

document.addEventListener('DOMContentLoaded', () => {

    // Fecha actual en el encabezado 
    const elFecha = document.getElementById('page-current-date');
    if (elFecha) {
        const hoy = new Date();
        const isoDate = hoy.toISOString().split('T')[0];
        const legible = hoy.toLocaleDateString('es-PE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        elFecha.setAttribute('datetime', isoDate);
        elFecha.textContent = legible.charAt(0).toUpperCase() + legible.slice(1);
    }

    //  Arrancar carga de datos 
    cargarResumen();
    cargarAlertas();
});


async function cargarResumen() {
    try {
        const data = await apiFetch('/api/reportes/dashboard/resumen');
        if (!data.ok) throw new Error(data.mensaje || 'Error al cargar resumen');

        const { ventas_hoy, stock_bajo, sin_stock, caja_activa, ultimas_ventas } = data.resumen;

        renderKpiVentas(ventas_hoy);
        renderKpiCaja(caja_activa);
        renderKpiStock(stock_bajo, sin_stock);
        renderUltimasVentas(ultimas_ventas);
        renderUsuarioSidebar();

    } catch (err) {
        console.error('cargarResumen:', err);
        showToast('No se pudo cargar el resumen del dashboard.', 'error');
    }
}



async function cargarAlertas() {
    try {
        const data = await apiFetch('/api/reportes/dashboard/alertas');
        if (!data.ok) throw new Error(data.mensaje || 'Error al cargar alertas');

        const { stock_bajo, sin_stock, ordenes_pendientes } = data.alertas;

        renderStockCritico(stock_bajo, sin_stock);
        renderOrdenesPendientes(ordenes_pendientes);
        renderKpiOrdenes(ordenes_pendientes.length);

    } catch (err) {
        console.error('cargarAlertas:', err);
        showToast('No se pudo cargar las alertas de inventario.', 'error');
    }
}



function renderKpiVentas(ventasHoy) {
    const elValor = document.getElementById('kpi-ventas-dia-valor');
    const elSub   = document.getElementById('kpi-ventas-dia-sub');
    if (elValor) elValor.textContent = formatMoney(ventasHoy?.total_recaudado ?? 0);
    if (elSub)   elSub.textContent   = `${ventasHoy?.cantidad_ventas ?? 0} transacciones`;
}

function renderKpiCaja(cajaActiva) {
    const elValor = document.getElementById('kpi-caja-valor');
    const elSub   = document.getElementById('kpi-caja-sub');
    if (!elValor || !elSub) return;

    if (cajaActiva) {
        elValor.textContent = 'Abierta';
        elValor.classList.add('text-success');
        elValor.classList.remove('text-muted');
        elSub.textContent = `Turno #${cajaActiva.numero_turno} — ${cajaActiva.cajero}`;
    } else {
        elValor.textContent = 'Cerrada';
        elValor.classList.add('text-muted');
        elValor.classList.remove('text-success');
        elSub.textContent = 'Sin turno activo';
    }
}

function renderKpiStock(stockBajo, sinStock) {
    const elValor = document.getElementById('kpi-stock-valor');
    if (!elValor) return;

    const total = (stockBajo ?? 0) + (sinStock ?? 0);
    elValor.textContent = `${total} productos`;

    if (total > 0) {
        elValor.classList.add('text-danger');
        elValor.classList.remove('text-muted');
    } else {
        elValor.classList.remove('text-danger');
    }
}

function renderKpiOrdenes(cantidad) {
    const elValor = document.getElementById('kpi-ordenes-valor');
    if (!elValor) return;
    elValor.textContent = `${cantidad} ${cantidad === 1 ? 'orden' : 'órdenes'}`;
    if (cantidad > 0) {
        elValor.classList.add('text-warning');
        elValor.classList.remove('text-muted');
    }
}


function renderUltimasVentas(ventas) {
    const tbody    = document.getElementById('tabla-ultimas-ventas-body');
    const emptyRow = document.getElementById('ultimas-ventas-empty-row');
    if (!tbody) return;

    // Limpiar filas dinámicas previas (sin tocar el empty-row)
    tbody.querySelectorAll('tr.fila-dinamica').forEach(tr => tr.remove());

    if (!ventas || ventas.length === 0) {
        emptyRow?.classList.remove('d-none');
        return;
    }

    emptyRow?.classList.add('d-none');

    ventas.forEach(v => {
        const tr = document.createElement('tr');
        tr.className = 'fila-dinamica';
        tr.innerHTML = `
            <td><span class="fw-semibold">${v.numero_comprobante}</span></td>
            <td class="text-truncate" style="max-width:140px" title="${v.cliente}">${v.cliente}</td>
            <td>${formatMoney(v.total)}</td>
            <td>${getBadge(v.estado)}</td>
            <td class="text-end">
                <a href="/public/pages/ventas.html"
                   class="btn btn-sm"
                   aria-label="Ver detalle de venta ${v.numero_comprobante}">
                    <i class="fa-regular fa-eye" aria-hidden="true"></i>
                </a>
            </td>`;
        tbody.appendChild(tr);
    });
}



function renderStockCritico(stockBajo, sinStock) {
    const lista     = document.getElementById('lista-stock-critico');
    const emptyItem = document.getElementById('stock-empty-item');
    if (!lista) return;

    // Limpiar ítems dinámicos previos
    lista.querySelectorAll('li.fila-dinamica').forEach(li => li.remove());

    const todos = [
        ...(sinStock  || []).map(p => ({ ...p, tipo: 'sin_stock'  })),
        ...(stockBajo || []).map(p => ({ ...p, tipo: 'stock_bajo' })),
    ];

    if (todos.length === 0) {
        emptyItem?.classList.remove('d-none');
        return;
    }

    emptyItem?.classList.add('d-none');

    // Mostrar máximo 6 para no desbordar el card
    todos.slice(0, 6).forEach(p => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex align-items-center justify-content-between gap-2 fila-dinamica';

        const stockColor = p.tipo === 'sin_stock' ? 'text-danger' : 'text-warning';
        const stockLabel = p.tipo === 'sin_stock'
            ? `<strong class="text-danger">0</strong>`
            : `<strong class="${stockColor}">${Number(p.stock_actual)}</strong>`;

        li.innerHTML = `
            <div class="overflow-hidden">
                <p class="mb-0 small fw-semibold text-truncate" title="${p.nombre}">${p.nombre}</p>
                <p class="mb-0 small text-muted">Actual: ${stockLabel} / Mín: ${Number(p.stock_minimo)}</p>
            </div>
            <a href="/public/pages/compras.html"
               class="btn btn-sm flex-shrink-0"
               aria-label="Crear orden para ${p.nombre}">
                <i class="fa-solid fa-plus fa-xs me-1" aria-hidden="true"></i>Pedir
            </a>`;
        lista.appendChild(li);
    });
}


function renderOrdenesPendientes(ordenes) {
    const tbody    = document.getElementById('tabla-ordenes-pendientes-body');
    const emptyRow = document.getElementById('ordenes-empty-row');
    if (!tbody) return;

    tbody.querySelectorAll('tr.fila-dinamica').forEach(tr => tr.remove());

    if (!ordenes || ordenes.length === 0) {
        emptyRow?.classList.remove('d-none');
        return;
    }

    emptyRow?.classList.add('d-none');

    ordenes.forEach(o => {
        const fechaEsperada  = o.fecha_esperada ? formatDate(o.fecha_esperada) : '—';
        const fechaEsperadaISO = o.fecha_esperada
            ? new Date(o.fecha_esperada).toISOString().split('T')[0]
            : '';

        const estaVencida = o.fecha_esperada && new Date(o.fecha_esperada) < new Date();
        const claseVencida = estaVencida ? 'text-danger fw-semibold' : '';

        const tr = document.createElement('tr');
        tr.className = 'fila-dinamica';
        tr.innerHTML = `
            <td><span class="fw-semibold">${o.numero_orden}</span></td>
            <td>${o.proveedor}</td>
            <td><time datetime="${new Date(o.fecha).toISOString().split('T')[0]}">${formatDate(o.fecha)}</time></td>
            <td><time datetime="${fechaEsperadaISO}" class="${claseVencida}">${fechaEsperada}</time></td>
            <td>${formatMoney(o.total)}</td>
            <td>${getBadge('enviada')}</td>
            <td class="text-end">
                <a href="/public/pages/compras.html"
                   class="btn btn-sm"
                   aria-label="Ver detalle de orden ${o.numero_orden}">
                    <i class="fa-regular fa-eye" aria-hidden="true"></i>
                </a>
            </td>`;
        tbody.appendChild(tr);
    });
}